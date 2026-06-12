import {
  buildValidationSnapshot,
  compilePrompt,
  demoGenerationSession,
  demoRecordIds,
  demoRecords,
  demoStoryConfig,
  IDEATION_SECTION_ORDER
} from "../src/index.js";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function ideationSnapshot() {
  const records = structuredClone(demoRecords);
  const longBelief = records.find((record) => record.id === demoRecordIds.elinBelief);

  if (longBelief) {
    const fullClaim =
      "Niko will be safer if he knows a letter exists but not what it says, because knowing the contents before Orin arrives would make his next question dangerous";
    const truncatedBrowseLabel = `${fullClaim.slice(0, 77)}...`;

    Object.assign(longBelief, {
      displayLabel: truncatedBrowseLabel,
      metadata: {
        id: longBelief.id,
        type: longBelief.type,
        displayLabel: truncatedBrowseLabel,
        createdAt: "2026-06-01T00:00:00.000Z",
        updatedAt: "2026-06-05T00:00:00.000Z",
        archived: false
      },
      payload: { ...longBelief.payload, claim: fullClaim }
    });
  }

  return buildValidationSnapshot({
    records,
    generationSession: demoGenerationSession,
    storyConfig: demoStoryConfig,
    versions: { template: "1.1.0", compiler: "1.3.0", contract: "1.4.0" }
  });
}

function promptSectionOrder(prompt: string): string[] {
  return Array.from(prompt.matchAll(/^<([a-z_]+)(?:\s[^>]*)?>$/gm), (match) => match[1] ?? "");
}

function expectedIdeationTagOrder(): string[] {
  return IDEATION_SECTION_ORDER.filter((section) => section !== "hard_canon" && section !== "present_minor_cast").map(
    (section) => (section === "ideation_contradiction_prohibitions" ? "contradiction_prohibitions" : section)
  );
}

describe("compiler ideation golden prompt", () => {
  it("matches the frozen ideation prompt baseline byte-for-byte", () => {
    const result = compilePrompt(ideationSnapshot(), {
      promptKind: "ideation",
      ideationRequest: { mode: "ideas", count: 5, dormantSlot: true }
    });
    const frozenGolden = readFileSync(new URL("./golden-ideation.prompt.txt", import.meta.url), "utf8");

    expect(`${result.prompt}\n`).toBe(frozenGolden);
  });

  it("renders deterministically with ideation sections, citations, and no prose-only tail", () => {
    const snapshot = ideationSnapshot();
    const first = compilePrompt(snapshot, {
      promptKind: "ideation",
      ideationRequest: { mode: "questions", count: 4, dormantSlot: true }
    });
    const second = compilePrompt(snapshot, {
      promptKind: "ideation",
      ideationRequest: { mode: "questions", count: 4, dormantSlot: true }
    });

    expect(second.prompt).toBe(first.prompt);
    expect(second.metadata.fingerprint).toBe(first.metadata.fingerprint);
    expect(promptSectionOrder(first.prompt)).toEqual(expectedIdeationTagOrder());
    expect(first.prompt).toContain("<ideation_role>");
    expect(first.prompt).toContain("<ideation_slots>");
    expect(first.prompt).toContain("<ideation_quality>");
    expect(first.prompt).toContain("<ideation_output_format>");
    expect(first.prompt).not.toContain("exposition-dialogue");
    expect(first.prompt).not.toContain("catchphrases");
    expect(first.prompt).not.toContain("flatten active cast into generic speech");
    expect(first.prompt).not.toContain("<prose_craft>");
    expect(first.prompt).not.toContain("<stop_rule>");
    expect(first.prompt).not.toContain("<final_output_instruction>");
    expect(first.prompt).toContain("Mode: questions.");
    expect(first.prompt).toContain("[SECRET: The sealed letter says a market ledger page was replaced before Orin's audit.]");
    expect(first.prompt).toContain("Grounds:");
    expect(first.metadata.versions).toEqual({ template: "1.1.0", compiler: "1.3.0", contract: "1.4.0" });
  });
});
