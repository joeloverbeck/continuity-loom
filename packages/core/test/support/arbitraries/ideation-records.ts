import fc from "fast-check";

import type { ValidationRecord } from "../../../src/index.js";

export const ideationRecordTypes = [
  "SECRET",
  "BELIEF",
  "FACT",
  "EVENT",
  "CLOCK",
  "PLAN",
  "INTENTION",
  "OBLIGATION",
  "CONSEQUENCE",
  "RELATIONSHIP",
  "OPEN THREAD",
  "VISIBLE AFFORDANCE",
  "OBJECT",
  "LOCATION"
] as const;

export type IdeationRecordType = (typeof ideationRecordTypes)[number];
export type IdeationPresenceVector = Readonly<Record<IdeationRecordType, number>> & {
  readonly revealableSecret: boolean;
};

export const ideationPresenceVectorArbitrary: fc.Arbitrary<IdeationPresenceVector> = fc
  .record({
    SECRET: fc.integer({ min: 0, max: 2 }),
    BELIEF: fc.integer({ min: 0, max: 2 }),
    FACT: fc.integer({ min: 0, max: 2 }),
    EVENT: fc.integer({ min: 0, max: 2 }),
    CLOCK: fc.integer({ min: 0, max: 2 }),
    PLAN: fc.integer({ min: 0, max: 2 }),
    INTENTION: fc.integer({ min: 0, max: 2 }),
    OBLIGATION: fc.integer({ min: 0, max: 2 }),
    CONSEQUENCE: fc.integer({ min: 0, max: 2 }),
    RELATIONSHIP: fc.integer({ min: 0, max: 2 }),
    "OPEN THREAD": fc.integer({ min: 0, max: 2 }),
    "VISIBLE AFFORDANCE": fc.integer({ min: 0, max: 2 }),
    OBJECT: fc.integer({ min: 0, max: 2 }),
    LOCATION: fc.integer({ min: 0, max: 2 }),
    revealableSecret: fc.boolean()
  });

export function recordsForPresence(vector: IdeationPresenceVector): ValidationRecord[] {
  return ideationRecordTypes.flatMap((type) =>
    Array.from({ length: vector[type] }, (_, index) =>
      ideationRecord(type, `${type.toLowerCase().replaceAll(" ", "-")}-${index + 1}`, {
        revealable: type === "SECRET" && vector.revealableSecret && index === 0,
        updatedAt: `2026-06-${String(index + 1).padStart(2, "0")}T00:00:00.000Z`
      })
    )
  );
}

export function ideationRecord(
  type: IdeationRecordType,
  id: string,
  options: { revealable?: boolean | "directive_required"; updatedAt?: string } = {}
): ValidationRecord {
  const label = `${type} ${id}`;

  return {
    id,
    type,
    payload: {
      ...labelPayload(type, label),
      ...(type === "SECRET"
        ? {
            reveal_permission:
              options.revealable === "directive_required"
                ? "directive_required"
                : options.revealable
                  ? "natural_reveal_allowed"
                  : "locked"
          }
        : {})
    },
    metadata: {
      id,
      type: "test",
      displayLabel: label,
      createdAt: "2026-06-21T00:00:00.000Z",
      updatedAt: options.updatedAt ?? "2026-06-21T00:00:00.000Z",
      archived: false
    }
  };
}

function labelPayload(type: IdeationRecordType, label: string): Record<string, unknown> {
  switch (type) {
    case "BELIEF":
      return { claim: label };
    case "CLOCK":
    case "OPEN THREAD":
      return { title: label };
    case "CONSEQUENCE":
      return { current_effect: label };
    case "EVENT":
    case "RELATIONSHIP":
      return { description: label };
    case "FACT":
      return { statement: label };
    case "INTENTION":
      return { intent: label };
    case "OBLIGATION":
      return { terms: label };
    case "PLAN":
      return { objective: label };
    case "SECRET":
      return { secret_claim: label };
    default:
      return { label };
  }
}
