import fc from "fast-check";

import { citationKeysFor } from "../../../src/compiler/ideation/citation-keys.js";
import { assignSlots } from "../../../src/compiler/ideation/slot-assignment.js";
import type { IdeationAssignment, IdeationRequest } from "../../../src/compiler/ideation/types.js";
import type { ValidationRecord } from "../../../src/validation/snapshot.js";
import { ideationPresenceVectorArbitrary, recordsForPresence } from "./ideation-records.js";
import { ideationRequestArbitrary } from "./ideation-requests.js";

export type IdeationSlateFixture = {
  readonly records: readonly ValidationRecord[];
  readonly request: IdeationRequest;
  readonly assignment: IdeationAssignment;
  readonly citationKeys: ReadonlyMap<string, string>;
};

export const ideationRecordSetArbitrary: fc.Arbitrary<readonly ValidationRecord[]> =
  ideationPresenceVectorArbitrary.map(recordsForPresence);

export const ideationSlateArbitrary: fc.Arbitrary<IdeationSlateFixture> = fc
  .record({
    records: ideationRecordSetArbitrary,
    request: ideationRequestArbitrary
  })
  .map(({ records, request }) => ({
    records,
    request,
    assignment: assignSlots(records, request),
    citationKeys: citationKeysFor(records)
  }));
