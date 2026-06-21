import { describe, expect, it } from "vitest";

import {
  IDEATION_SECTION_ORDER,
  buildValidationSnapshot,
  compilePrompt,
  demoGenerationSession,
  demoStoryConfig,
  type GenerationSession,
  type ValidationRecord
} from "../src/index.js";
import { assignSlots } from "../src/compiler/ideation/slot-assignment.js";
import { ideationRecord } from "./support/arbitraries/ideation-records.js";

describe("ideation taxonomy capstone", () => {
  it("draws interleaved breadth from a dense default slate and uses dormancy as a real-operator modifier", () => {
    const records = denseWorkingSet();
    const assignment = assignSlots(records, { count: 5, dormantSlot: true });

    expect(assignment.slots.map((slot) => slot.operator)).toEqual([
      "reveal",
      "plan_meets_friction",
      "emotion_becomes_action",
      "shift_option_set",
      "falsify_belief"
    ]);
    expect(assignment.slots.at(-1)).toMatchObject({
      operator: "falsify_belief",
      dormantRecordKey: "[BELIEF-1]"
    });
    expect(assignment.slots.at(-1)?.recordKeys).toEqual(["[BELIEF-1]", "[FACT-1]"]);
    expect(new Set(assignment.slots.map((slot) => slot.operator)).size).toBe(assignment.slots.length);
  });

  it("keeps minimum bundles, unused-first grounds, and two-family commitment deterministic", () => {
    const records = denseWorkingSet();
    const assignment = assignSlots(records, { count: 6, dormantSlot: false });
    const expectedSizes = new Map([
      ["reveal", 1],
      ["plan_meets_friction", 1],
      ["emotion_becomes_action", 1],
      ["shift_option_set", 1],
      ["falsify_belief", 2],
      ["clock_advances", 1]
    ]);
    const usedKeys = new Set<string>();

    for (const slot of assignment.slots) {
      const expectedSize = expectedSizes.get(slot.operator);
      if (expectedSize === undefined) {
        throw new Error(`Unexpected operator in dense capstone: ${slot.operator}`);
      }
      expect(slot.recordKeys).toHaveLength(expectedSize);
      for (const key of slot.recordKeys) {
        expect(usedKeys.has(key), `${slot.operator} reused ${key} despite unused dense grounds`).toBe(false);
        usedKeys.add(key);
      }
    }

    const commitment = assignSlots([ideationRecord("PLAN", "plan"), ideationRecord("CLOCK", "clock")], {
      count: 6,
      dormantSlot: false
    }).slots.find((slot) => slot.operator === "commit_at_a_cost");

    expect(commitment?.recordKeys).toEqual(["[CLOCK-1]", "[PLAN-1]"]);
  });

  it("fails closed for reveal and stale-status edge cases", () => {
    const lockedSecret = ideationRecord("SECRET", "locked-secret", {
      payload: { reveal_permission: "locked", allowed_surface_cues: [], clue_carriers: [] }
    });
    const staleRecords = [
      ideationRecord("PLAN", "revised-plan", { payload: { plan_status: "revised" } }),
      ideationRecord("CLOCK", "paused-clock", { payload: { status: "paused" } }),
      ideationRecord("EMOTION", "settled-emotion", { payload: { status: "settled" } }),
      ideationRecord("EVENT", "irrelevant-event", { payload: { current_relevance: "none" } })
    ];

    expect(assignSlots([lockedSecret], { count: 3, dormantSlot: false }).slots).toEqual([]);
    expect(assignSlots(staleRecords, { count: 6, dormantSlot: false }).slots).toEqual([]);
  });

  it("compiles deterministically, preserves ideation section order, and does not evict selected records", () => {
    const records = denseWorkingSet();
    const first = compilePrompt(snapshotWith(records), {
      promptKind: "ideation",
      ideationRequest: { mode: "ideas", count: 5, dormantSlot: true }
    });
    const second = compilePrompt(snapshotWith(records), {
      promptKind: "ideation",
      ideationRequest: { mode: "ideas", count: 5, dormantSlot: true }
    });

    expect(second.prompt).toBe(first.prompt);
    expect(second.metadata.fingerprint).toBe(first.metadata.fingerprint);
    expect(promptSectionOrder(first.prompt)).toEqual(expectedIdeationTagOrder());

    for (const label of records.map((record) => record.metadata?.displayLabel ?? record.id)) {
      expect(first.prompt).toContain(label);
    }
    expect(first.prompt).toContain("[EMOTION-1]");
    expect(first.prompt).toContain("[ENTITY STATUS-1]");
  });
});

function denseWorkingSet(): ValidationRecord[] {
  return [
    ideationRecord("SECRET", "secret", { label: "Secret can surface through the hinge mark", revealable: true }),
    ideationRecord("PLAN", "plan", { label: "Elin blocks access to the flour bin" }),
    ideationRecord("EMOTION", "emotion", { label: "Niko turns hurt into careful pressure" }),
    ideationRecord("LOCATION", "location", { label: "The cellar narrows every route" }),
    ideationRecord("BELIEF", "belief", {
      label: "Niko thinks Elin is protecting herself",
      updatedAt: "2026-06-01T00:00:00.000Z"
    }),
    ideationRecord("FACT", "fact", { label: "The hinge scrape is fresh" }),
    ideationRecord("CLOCK", "clock", { label: "The shop bell may interrupt" }),
    ideationRecord("OBLIGATION", "obligation", { label: "Elin owes Niko honesty" }),
    ideationRecord("RELATIONSHIP", "relationship", { label: "Trust strains under protection" }),
    ideationRecord("ENTITY STATUS", "entity-status", { label: "Elin stands between Niko and the bin" })
  ];
}

function snapshotWith(records: readonly ValidationRecord[]) {
  const generationSession: GenerationSession = {
    ...demoGenerationSession,
    current_authoritative_state: {
      ...demoGenerationSession.current_authoritative_state,
      entity_statuses: records.filter((record) => record.type === "ENTITY STATUS").map((record) => record.id)
    }
  };

  return buildValidationSnapshot({
    records,
    generationSession,
    storyConfig: demoStoryConfig,
    versions: { template: "1.3.0", compiler: "1.5.0", contract: "1.6.0" }
  });
}

function promptSectionOrder(prompt: string): string[] {
  return Array.from(prompt.matchAll(/^<([a-z_]+)(?:\s[^>]*)?>$/gm), (match) => match[1] ?? "");
}

function expectedIdeationTagOrder(): string[] {
  return IDEATION_SECTION_ORDER.filter((section) => section !== "hard_canon" && section !== "present_minor_cast").map((section) => {
    if (section === "ideation_contradiction_prohibitions") {
      return "contradiction_prohibitions";
    }

    if (section === "ideation_authority_hierarchy") {
      return "authority_hierarchy";
    }

    return section;
  });
}
