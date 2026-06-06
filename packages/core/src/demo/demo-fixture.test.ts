import { describe, expect, it } from "vitest";

import {
  generationSessionSchema,
  parseRecordPayload,
  proseModeSchema,
  storyContractSchema,
  universalContentPolicySchema
} from "../index.js";
import {
  demoGenerationSession,
  demoRecordIds,
  demoRecords,
  demoStoryConfig
} from "./index.js";

describe("letter under the flour bin demo fixture", () => {
  it("validates story configuration and the generation session", () => {
    expect(storyContractSchema.parse(demoStoryConfig.storyContract)).toEqual(demoStoryConfig.storyContract);
    expect(universalContentPolicySchema.parse(demoStoryConfig.universalContentPolicy)).toEqual(
      demoStoryConfig.universalContentPolicy
    );
    expect(proseModeSchema.parse(demoStoryConfig.proseMode)).toEqual(demoStoryConfig.proseMode);
    expect(generationSessionSchema.parse(demoGenerationSession)).toEqual(demoGenerationSession);
  });

  it("validates every demo record payload through the registry", () => {
    for (const record of demoRecords) {
      expect(parseRecordPayload(record.type, record.payload)).toEqual(record.payload);
    }
  });

  it("contains the complete required SPEC-013 record inventory", () => {
    expect(countByType()).toMatchObject({
      "CAST MEMBER": 2,
      ENTITY: 4,
      SECRET: 1,
      OBJECT: 4,
      LOCATION: 1,
      "VISIBLE AFFORDANCE": 1,
      EVENT: 2,
      BELIEF: 2,
      EMOTION: 2,
      RELATIONSHIP: 1,
      INTENTION: 2,
      "OPEN THREAD": 1,
      CLOCK: 1,
      CONSEQUENCE: 1
    });
  });

  it("keeps first-segment handoff clean of accepted-prose continuation markers", () => {
    const handoff = demoGenerationSession.immediate_handoff;
    const handoffText = Object.values(handoff).join(" ").toLowerCase();

    expect(handoff.prior_accepted_prose_status_or_handoff_note).toBe("None. No accepted prose is included.");
    expect(handoffText).not.toContain("as above");
    expect(handoffText).not.toContain("as before");
    expect(handoffText).not.toContain("from the previous segment");
    expect(handoffText).not.toContain("continue from last time");
    expect(handoffText).not.toContain("rejected candidate");
  });

  it("models the secret firewall for Elin and Niko without exposing content to Niko", () => {
    const secret = demoRecords.find((record) => record.id === demoRecordIds.hiddenLetterSecret);

    expect(secret?.payload).toMatchObject({
      holders: [demoRecordIds.elinEntity],
      non_holders_to_protect: [demoRecordIds.nikoEntity],
      pov_access: "knows",
      reveal_permission: "clue_only"
    });
  });
});

function countByType(): Record<string, number> {
  return demoRecords.reduce<Record<string, number>>((counts, record) => {
    counts[record.type] = (counts[record.type] ?? 0) + 1;
    return counts;
  }, {});
}

