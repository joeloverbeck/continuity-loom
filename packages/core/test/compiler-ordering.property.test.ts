import fc from "fast-check";
import { describe, expect, it } from "vitest";

import { orderCompilerRecords } from "../src/compiler/ordering.js";
import type { ValidationRecord } from "../src/validation/snapshot.js";
import { orderingRecordArbitrary, orderingRecordsArbitrary } from "./support/arbitraries/records.js";

const seed = 0x26005;
const runs = 150;

const familyRank: Readonly<Record<string, number>> = Object.freeze({
  SECRET: 1,
  "CAST MEMBER": 2,
  PLAN: 3,
  CLOCK: 3,
  OBLIGATION: 3,
  FACT: 7,
  BELIEF: 7,
  EVENT: 7,
  LOCATION: 8,
  OBJECT: 8,
  "VISIBLE AFFORDANCE": 8,
  CUSTOM: 9
});

const priorityRank: Readonly<Record<string, number>> = Object.freeze({
  critical: 0,
  high: 1,
  medium: 2,
  low: 3
});

describe("compiler record ordering properties", () => {
  it.each([
    [
      "label then ID tie break",
      [
        record("019b0298-5c00-7000-8000-000000000002", "FACT", "Beta"),
        record("019b0298-5c00-7000-8000-000000000001", "FACT", "Beta"),
        record("019b0298-5c00-7000-8000-000000000003", "FACT", "Alpha")
      ],
      [
        "019b0298-5c00-7000-8000-000000000003",
        "019b0298-5c00-7000-8000-000000000001",
        "019b0298-5c00-7000-8000-000000000002"
      ]
    ],
    [
      "user order dominates family and priority",
      [
        record("019b0298-5c00-7000-8000-000000000004", "SECRET", "Secret", { userOrder: 5, salience: "critical" }),
        record("019b0298-5c00-7000-8000-000000000005", "CUSTOM", "Custom", { userOrder: 1, salience: "low" })
      ],
      [
        "019b0298-5c00-7000-8000-000000000005",
        "019b0298-5c00-7000-8000-000000000004"
      ]
    ],
    [
      "family dominates salience when user order is tied",
      [
        record("019b0298-5c00-7000-8000-000000000006", "FACT", "Fact", { salience: "critical" }),
        record("019b0298-5c00-7000-8000-000000000007", "CAST MEMBER", "Cast", { salience: "low" })
      ],
      [
        "019b0298-5c00-7000-8000-000000000007",
        "019b0298-5c00-7000-8000-000000000006"
      ]
    ]
  ])("%s", (_name, input, expectedIds) => {
    expect(orderCompilerRecords(input).map((record) => record.id)).toEqual(expectedIds);
  });

  it("matches the independent expected ordering for generated records", () => {
    assertProperty(
      fc.property(orderingRecordsArbitrary, (records) => {
        expect(orderCompilerRecords(records).map((record) => record.id)).toEqual(expectedOrder(records).map((record) => record.id));
      })
    );
  });

  it("is invariant under input permutation", () => {
    assertProperty(
      fc.property(orderingRecordsArbitrary, fc.integer(), (records, salt) => {
        const expectedIds = orderCompilerRecords(records).map((record) => record.id);
        const permuted = [...records].sort((left, right) => `${left.id}:${salt}`.localeCompare(`${right.id}:${salt}`));

        expect(orderCompilerRecords(permuted).map((record) => record.id)).toEqual(expectedIds);
      })
    );
  });

  it("is antisymmetric and transitive under the independent comparator", () => {
    assertProperty(
      fc.property(orderingRecordArbitrary, orderingRecordArbitrary, orderingRecordArbitrary, (left, middle, right) => {
        const leftMiddle = normalize(compareExpected(left, middle));
        const middleLeft = normalize(compareExpected(middle, left));

        expect(leftMiddle).toBe(-middleLeft);

        if (compareExpected(left, middle) <= 0 && compareExpected(middle, right) <= 0) {
          expect(compareExpected(left, right)).toBeLessThanOrEqual(0);
        }
      })
    );
  });

  it("does not mutate the input array or records", () => {
    assertProperty(
      fc.property(orderingRecordsArbitrary, (records) => {
        const frozen = deepFreeze(records.map((record) => record.metadata ? { ...record, metadata: { ...record.metadata } } : { ...record }));
        const before = JSON.stringify(frozen);

        orderCompilerRecords(frozen);

        expect(JSON.stringify(frozen)).toBe(before);
      })
    );
  });
});

function assertProperty(property: fc.IProperty<unknown[]>) {
  fc.assert(property, { seed, numRuns: runs, verbose: true });
}

function expectedOrder(records: readonly ValidationRecord[]): readonly ValidationRecord[] {
  return [...records].sort(compareExpected);
}

function compareExpected(left: ValidationRecord, right: ValidationRecord): number {
  return compareNullableNumbers(left.metadata?.userOrder, right.metadata?.userOrder)
    || compareNumbers(familyRank[left.type] ?? 9, familyRank[right.type] ?? 9)
    || comparePriority(left.metadata?.salience, right.metadata?.salience)
    || comparePriority(left.metadata?.urgency, right.metadata?.urgency)
    || displayLabel(left).localeCompare(displayLabel(right))
    || left.id.localeCompare(right.id);
}

function compareNullableNumbers(left: number | null | undefined, right: number | null | undefined): number {
  if (left === right) {
    return 0;
  }

  if (left === null || left === undefined) {
    return 1;
  }

  if (right === null || right === undefined) {
    return -1;
  }

  return left - right;
}

function compareNumbers(left: number, right: number): number {
  return left - right;
}

function comparePriority(left: string | null | undefined, right: string | null | undefined): number {
  return (priorityRank[left ?? ""] ?? 4) - (priorityRank[right ?? ""] ?? 4);
}

function displayLabel(record: ValidationRecord): string {
  return record.metadata?.displayLabel ?? record.id;
}

function normalize(value: number): -1 | 0 | 1 {
  return value === 0 ? 0 : value < 0 ? -1 : 1;
}

function record(
  id: string,
  type: string,
  label: string,
  metadata: Partial<NonNullable<ValidationRecord["metadata"]>> = {}
): ValidationRecord {
  return {
    id,
    type,
    payload: { id },
    metadata: recordMetadata(id, type, label, metadata)
  };
}

function recordMetadata(
  id: string,
  type: string,
  displayLabel: string,
  metadata: Partial<NonNullable<ValidationRecord["metadata"]>>
): NonNullable<ValidationRecord["metadata"]> {
  return {
    id,
    type,
    displayLabel,
    createdAt: "2026-06-20T00:00:00.000Z",
    updatedAt: "2026-06-20T00:00:00.000Z",
    archived: false,
    ...metadata
  };
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object") {
    Object.freeze(value);

    for (const child of Object.values(value)) {
      deepFreeze(child);
    }
  }

  return value;
}
