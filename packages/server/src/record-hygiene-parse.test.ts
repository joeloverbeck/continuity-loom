import { describe, expect, it } from "vitest";

import { parseRecordHygieneResponse } from "./record-hygiene-parse.js";

const validKeys = new Set(["[FACT-1]", "[FACT-2]", "[BELIEF-1]"]);

describe("record hygiene response parser", () => {
  it("parses valid advisory findings without producing record-write payloads", () => {
    const result = parseRecordHygieneResponse(validResponse(), validKeys);

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.findings).toHaveLength(1);
    expect(result.findings[0]).toMatchObject({
      relation: "NEAR_DUPLICATE",
      action: "MERGE",
      citations: ["[FACT-1]", "[FACT-2]"],
      survivor: "[FACT-1]"
    });
    expect(JSON.stringify(result)).not.toContain("payload");
  });

  it.each([
    ["unknown citation", validResponse().replace("[FACT-2]", "[FACT-99]")],
    ["cross-type merge", validResponse().replace("[FACT-2]", "[BELIEF-1]")],
    ["missing survivor", validResponse().replace("survivor: [FACT-1]", "survivor: none")],
    ["duplicate finding number", `${validResponse().replace("findings_reported: 1", "findings_reported: 2")}\n${findingBlock(1)}`],
    ["duplicate cluster", `${validResponse().replace("findings_reported: 1", "findings_reported: 2").replace("END HYGIENE REVIEW", "")}\n${findingBlock(2)}\nEND HYGIENE REVIEW`],
    ["missing marker", validResponse().replace("\nEND HYGIENE REVIEW", "")],
    ["count mismatch", validResponse().replace("findings_reported: 1", "findings_reported: 2")],
    ["unknown action", validResponse().replace("action: MERGE", "action: FIX_ALL")]
  ])("quarantines malformed output: %s", (_name, text) => {
    expect(parseRecordHygieneResponse(text, validKeys)).toEqual({ ok: false, raw: text });
  });
});

function validResponse(): string {
  return ["HYGIENE REVIEW", "findings_reported: 1", "", findingBlock(1), "", "END HYGIENE REVIEW"].join("\n");
}

function findingBlock(number: number): string {
  return [
    `FINDING ${number}`,
    "cluster: locked-door-facts",
    "relation: NEAR_DUPLICATE",
    "action: MERGE",
    "citations: [FACT-1], [FACT-2]",
    "shared_core: Both facts say the same door is locked.",
    "material_differences: Different wording only.",
    "why_it_matters: Duplicate authority can double-weight the lock.",
    "manual_recommendation: Keep one fact and preserve the wording.",
    "survivor: [FACT-1]",
    "reference_caution: Retarget inbound references before removing anything.",
    "confidence: high"
  ].join("\n");
}
