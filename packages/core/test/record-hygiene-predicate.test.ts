import { describe, expect, it } from "vitest";

import {
  getRecordTypeDefinition,
  HYGIENE_LIVE_STATUSES,
  HYGIENE_TYPE_ORDER,
  isHygieneActive,
  recordTypes,
  type HygieneRecordType
} from "../src/index.js";

const uuid = "019b0298-5c00-7000-8000-000000000001";

const expectedStatuses = {
  FACT: ["active"],
  EVENT: ["active", "resolved", "background", "abandoned"],
  BELIEF: ["active", "resolved", "abandoned"],
  SECRET: ["hidden", "partially_revealed", "revealed", "disproven", "abandoned"],
  EMOTION: ["active", "suppressed", "settled", "transformed", "dissociated"],
  RELATIONSHIP: ["active", "resolved", "abandoned"],
  INTENTION: ["active", "satisfied", "abandoned", "blocked"],
  PLAN: ["active", "blocked", "suspended", "fulfilled", "failed", "abandoned", "revised"],
  CLOCK: ["active", "paused", "resolved", "abandoned"],
  OBLIGATION: ["open", "closed", "escalated", "abandoned", "transferred"],
  CONSEQUENCE: ["pending", "active", "resolved", "escalated", "abandoned"],
  "OPEN THREAD": ["active", "answered", "resolved", "escalated", "abandoned", "superseded"],
  LOCATION: ["active", "inactive", "destroyed", "inaccessible"],
  OBJECT: ["active", "lost", "destroyed", "transferred", "inactive"],
  "VISIBLE AFFORDANCE": ["available", "blocked", "unavailable"],
  "ENTITY STATUS": []
} as const satisfies Readonly<Record<HygieneRecordType, readonly string[]>>;

describe("record hygiene active predicate", () => {
  it("keeps the in-scope type order to the 16 atomic hygiene record types", () => {
    expect(HYGIENE_TYPE_ORDER).toEqual([
      "FACT",
      "EVENT",
      "BELIEF",
      "SECRET",
      "EMOTION",
      "RELATIONSHIP",
      "INTENTION",
      "PLAN",
      "CLOCK",
      "OBLIGATION",
      "CONSEQUENCE",
      "OPEN THREAD",
      "LOCATION",
      "OBJECT",
      "VISIBLE AFFORDANCE",
      "ENTITY STATUS"
    ]);
  });

  it("classifies every current registry status value according to the source predicate", () => {
    for (const recordType of HYGIENE_TYPE_ORDER) {
      const definition = getRecordTypeDefinition(recordType);
      expect(definition?.statusValues ?? []).toEqual(expectedStatuses[recordType]);

      if (recordType === "ENTITY STATUS") {
        expect(isHygieneActive(record(recordType, {}, false))).toBe(true);
        expect(isHygieneActive(record(recordType, {}, true))).toBe(false);
        continue;
      }

      for (const status of expectedStatuses[recordType]) {
        const candidate = record(recordType, payloadFor(recordType, status), false);
        const liveStatuses: readonly string[] = HYGIENE_LIVE_STATUSES[recordType];
        expect(isHygieneActive(candidate), `${recordType} ${status}`).toBe(
          liveStatuses.includes(status)
        );
      }
    }
  });

  it("excludes archived rows and out-of-scope record types", () => {
    for (const recordType of HYGIENE_TYPE_ORDER) {
      expect(isHygieneActive(record(recordType, payloadFor(recordType, liveStatusFor(recordType)), true))).toBe(false);
    }

    expect(isHygieneActive(record("CAST MEMBER", {}, false))).toBe(false);
    expect(isHygieneActive(record("ENTITY", {}, false))).toBe(false);
    expect(recordTypes).toContain("CAST MEMBER");
    expect(recordTypes).toContain("ENTITY");
  });

  it("is stable under input permutation because it depends only on the candidate row", () => {
    const candidates = [
      record("PLAN", payloadFor("PLAN", "active"), false),
      record("PLAN", payloadFor("PLAN", "fulfilled"), false),
      record("OBJECT", payloadFor("OBJECT", "active"), false),
      record("OBJECT", payloadFor("OBJECT", "lost"), false)
    ];

    expect(candidates.map(isHygieneActive)).toEqual([...candidates].reverse().reverse().map(isHygieneActive));
  });
});

function liveStatusFor(recordType: HygieneRecordType): string {
  if (recordType === "ENTITY STATUS") {
    return "";
  }

  return HYGIENE_LIVE_STATUSES[recordType][0] ?? expectedStatuses[recordType][0];
}

function record(type: string, payload: unknown, archived: boolean) {
  return { type, payload, archived };
}

function payloadFor(recordType: HygieneRecordType, status: string): Record<string, unknown> {
  if (recordType === "PLAN") {
    return { plan_status: status };
  }

  if (recordType === "FACT" || recordType === "ENTITY STATUS") {
    return {};
  }

  return { id: uuid, status };
}
