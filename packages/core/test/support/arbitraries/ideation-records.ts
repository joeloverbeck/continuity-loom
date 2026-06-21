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
  "EMOTION",
  "OPEN THREAD",
  "VISIBLE AFFORDANCE",
  "OBJECT",
  "LOCATION",
  "ENTITY STATUS"
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
    EMOTION: fc.integer({ min: 0, max: 2 }),
    "OPEN THREAD": fc.integer({ min: 0, max: 2 }),
    "VISIBLE AFFORDANCE": fc.integer({ min: 0, max: 2 }),
    OBJECT: fc.integer({ min: 0, max: 2 }),
    LOCATION: fc.integer({ min: 0, max: 2 }),
    "ENTITY STATUS": fc.integer({ min: 0, max: 2 }),
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
  options: {
    label?: string;
    payload?: Record<string, unknown>;
    revealable?: boolean | "directive_required";
    updatedAt?: string;
  } = {}
): ValidationRecord {
  const label = options.label ?? `${type} ${id}`;

  return {
    id,
    type,
    payload: {
      ...labelPayload(type, label),
      ...options.payload,
      ...(type === "SECRET"
        ? {
            reveal_permission:
              typeof options.payload?.reveal_permission === "string"
                ? options.payload.reveal_permission
                : options.revealable === "directive_required"
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
      return { status: "active", claim: label };
    case "CLOCK":
      return { status: "active", title: label };
    case "OPEN THREAD":
      return { status: "active", current_relevance: "high", title: label };
    case "CONSEQUENCE":
      return { status: "active", current_effect: label };
    case "EVENT":
      return { status: "active", current_relevance: "high", description: label };
    case "RELATIONSHIP":
      return { status: "active", description: label };
    case "FACT":
      return { statement: label };
    case "INTENTION":
      return { status: "active", intent: label };
    case "OBLIGATION":
      return { status: "open", terms: label };
    case "PLAN":
      return { plan_status: "active", objective: label };
    case "SECRET":
      return { status: "hidden", secret_claim: label };
    case "EMOTION":
      return { status: "active", description: label };
    case "VISIBLE AFFORDANCE":
      return { status: "available", label };
    case "OBJECT":
    case "LOCATION":
      return { status: "active", label };
    case "ENTITY STATUS":
      return { current_activity: label };
    default:
      return { label };
  }
}
