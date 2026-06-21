import fc from "fast-check";

import type { ValidationRecord } from "../../../src/validation/snapshot.js";
import { displayLabelArbitrary, recordIdArbitrary } from "./ids.js";

export const compilerOrderingRecordTypes = [
  "SECRET",
  "CAST MEMBER",
  "PLAN",
  "CLOCK",
  "OBLIGATION",
  "FACT",
  "BELIEF",
  "EVENT",
  "LOCATION",
  "OBJECT",
  "VISIBLE AFFORDANCE",
  "CUSTOM"
] as const;

const priorityArbitrary = fc.option(fc.constantFrom("critical", "high", "medium", "low", "none"), { nil: undefined });
const userOrderArbitrary = fc.option(fc.integer({ min: -2, max: 4 }), { nil: undefined });

export const orderingRecordArbitrary: fc.Arbitrary<ValidationRecord> = fc
  .record({
    id: recordIdArbitrary,
    type: fc.constantFrom(...compilerOrderingRecordTypes),
    label: displayLabelArbitrary,
    userOrder: userOrderArbitrary,
    salience: priorityArbitrary,
    urgency: priorityArbitrary
  })
  .map(({ id, type, label, userOrder, salience, urgency }) => ({
    id,
    type,
    payload: { id },
    metadata: metadata(id, type, label, {
      ...(userOrder === undefined ? {} : { userOrder }),
      ...(salience === undefined ? {} : { salience }),
      ...(urgency === undefined ? {} : { urgency })
    })
  }));

export const orderingRecordsArbitrary = fc.uniqueArray(orderingRecordArbitrary, {
  minLength: 1,
  maxLength: 12,
  selector: (record) => record.id
});

function metadata(
  id: string,
  type: string,
  displayLabel: string,
  values: { userOrder?: number; salience?: string | null; urgency?: string | null } = {}
): NonNullable<ValidationRecord["metadata"]> {
  return {
    id,
    type,
    displayLabel,
    createdAt: "2026-06-20T00:00:00.000Z",
    updatedAt: "2026-06-20T00:00:00.000Z",
    archived: false,
    ...(values.userOrder === undefined ? {} : { userOrder: values.userOrder }),
    ...(values.salience === undefined ? {} : { salience: values.salience }),
    ...(values.urgency === undefined ? {} : { urgency: values.urgency })
  };
}
