import fc from "fast-check";

import type { IdeationRequest } from "../../../src/compiler/ideation/types.js";

export const ideationRequestArbitrary: fc.Arbitrary<IdeationRequest> = fc.record({
  mode: fc.constantFrom("ideas", "questions"),
  count: fc.integer({ min: 3, max: 6 }),
  dormantSlot: fc.boolean(),
  avoidList: fc.array(fc.constantFrom("repeat the last beat", "resolve cleanly", "add a new POV"), {
    maxLength: 3
  })
});
