import { describe, expect, it } from "vitest";

import { recordTypes, whatWillCompile } from "../src/index.js";
import type { CompileDestinationRecord } from "../src/index.js";

const records: readonly CompileDestinationRecord[] = [
  { id: "019b0298-5c00-7000-8000-000000000003", type: "FACT", displayLabel: "Zulu fact" },
  { id: "019b0298-5c00-7000-8000-000000000001", type: "PLAN", displayLabel: "Alpha plan" },
  { id: "019b0298-5c00-7000-8000-000000000002", type: "FACT", displayLabel: "Alpha fact" }
];

describe("whatWillCompile", () => {
  it("returns deterministic prompt-family buckets with stable-sorted records", () => {
    const first = whatWillCompile(records);
    const second = whatWillCompile(records);

    expect(first).toEqual(second);
    expect(first).toEqual([
      {
        familyId: "plans_clocks_obligations",
        label: "Plans, intentions, clocks, obligations, consequences, and open threads",
        records: [{ id: "019b0298-5c00-7000-8000-000000000001", type: "PLAN", displayLabel: "Alpha plan" }]
      },
      {
        familyId: "facts_beliefs_events",
        label: "Facts, beliefs, and events",
        records: [
          { id: "019b0298-5c00-7000-8000-000000000002", type: "FACT", displayLabel: "Alpha fact" },
          { id: "019b0298-5c00-7000-8000-000000000003", type: "FACT", displayLabel: "Zulu fact" }
        ]
      }
    ]);
  });

  it("groups FACT records coarsely without discriminant-subfield routing", () => {
    const hardCanonFact = {
      id: "019b0298-5c00-7000-8000-000000000004",
      type: "FACT",
      displayLabel: "Hard canon"
    };
    const currentStateFact = {
      id: "019b0298-5c00-7000-8000-000000000005",
      type: "FACT",
      displayLabel: "Current state"
    };

    expect(whatWillCompile([hardCanonFact, currentStateFact])).toEqual([
      {
        familyId: "facts_beliefs_events",
        label: "Facts, beliefs, and events",
        records: [currentStateFact, hardCanonFact]
      }
    ]);
  });

  it("routes CAST MEMBER records by explicit inclusion band", () => {
    const activeCast = { id: "019b0298-5c00-7000-8000-000000000006", type: "CAST MEMBER", displayLabel: "Active" };
    const presentMinorCast = {
      id: "019b0298-5c00-7000-8000-000000000007",
      type: "CAST MEMBER",
      displayLabel: "Minor"
    };
    const offstageCast = { id: "019b0298-5c00-7000-8000-000000000008", type: "CAST MEMBER", displayLabel: "Away" };

    expect(
      whatWillCompile([offstageCast, presentMinorCast, activeCast], {
        active_onstage_cast_full: [
          { cast_member_id: activeCast.id, local_function: "active_speaker" }
        ],
        present_minor_cast_compressed: [presentMinorCast.id],
        offstage_relevant_cast: [offstageCast.id]
      }).map((bucket) => bucket.familyId)
    ).toEqual(["rich_active_cast_dossiers", "present_minor_cast", "offstage_relevance"]);
  });

  it("assigns every current durable record type to a destination family", () => {
    const selectedRecords = recordTypes.map((type, index) => ({
      id: `record-${index}`,
      type,
      displayLabel: type
    }));

    const familyIds = whatWillCompile(selectedRecords).map((bucket) => bucket.familyId);

    expect(familyIds).not.toContain("other_selected_records");
  });

  it("does not route story_config kinds as record-backed compile inputs", () => {
    expect(
      whatWillCompile([
        { id: "story-contract", type: "STORY CONTRACT", displayLabel: "Story contract" },
        { id: "content-policy", type: "UNIVERSAL CONTENT POLICY", displayLabel: "Policy" },
        { id: "prose-mode", type: "PROSE MODE", displayLabel: "Prose mode" }
      ])
    ).toEqual([
      {
        familyId: "other_selected_records",
        label: "Other selected records",
        records: [
          { id: "prose-mode", type: "PROSE MODE", displayLabel: "Prose mode" },
          { id: "story-contract", type: "STORY CONTRACT", displayLabel: "Story contract" },
          { id: "content-policy", type: "UNIVERSAL CONTENT POLICY", displayLabel: "Policy" }
        ]
      }
    ]);
  });
});
