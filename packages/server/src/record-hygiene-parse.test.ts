import { describe, expect, it } from "vitest";

import {
  parseRecordHygieneResponse,
  type RecordHygieneParseFailureCode
} from "./record-hygiene-parse.js";
import { decorateRecordHygieneContract } from "../../../test/record-hygiene-response.js";

const validKeys = new Set(["[FACT-1]", "[FACT-2]", "[BELIEF-1]"]);
const failureMessages = {
  "missing-review-start": "The response did not contain the HYGIENE REVIEW start marker.",
  "missing-review-end": "The response did not contain the END HYGIENE REVIEW marker.",
  "trailing-content": "The response contained text after the END HYGIENE REVIEW marker.",
  "malformed-findings-count": "The response did not contain a valid findings_reported count.",
  "malformed-finding-header": "A FINDING header did not contain a valid positive finding number.",
  "unexpected-content": "The review contained content outside a numbered FINDING block.",
  "findings-count-mismatch": "The findings_reported count did not match the number of FINDING blocks.",
  "duplicate-finding-number": "A finding number appeared more than once.",
  "duplicate-cluster": "A finding cluster appeared more than once.",
  "malformed-field": "A finding line did not use the required tagged field structure.",
  "duplicate-field": "A finding field appeared more than once.",
  "unexpected-field": "A finding contained a field outside the Record Hygiene output contract.",
  "missing-required-field": "A finding was missing a required non-empty field.",
  "invalid-relation": "A finding relation was not recognized.",
  "invalid-action": "A finding action was not recognized.",
  "invalid-confidence": "A finding confidence was not recognized.",
  "insufficient-citations": "A finding did not contain at least two distinct citations.",
  "unknown-citation": "A finding cited a record outside the compiled Record Hygiene source.",
  "invalid-survivor": "A finding survivor did not match the action and cited records.",
  "cross-type-destructive-action": "A MERGE or REMOVE finding cited more than one record type."
} satisfies Record<RecordHygieneParseFailureCode, string>;

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
    ["lead-in sentence", `Here is the requested review.\n${validResponse()}`],
    ["surrounding code fences", `\`\`\`text\n${validResponse()}\n\`\`\``],
    ["decorated contract lines", decorateRecordHygieneContract(validResponse())]
  ])("accepts the bounded response envelope variant: %s", (_name, text) => {
    const result = parseRecordHygieneResponse(text, validKeys);

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.findings).toHaveLength(1);
    expect(result.findings[0]?.number).toBe(1);
  });

  it.each([
    ["missing review start", validResponse().replace("HYGIENE REVIEW\n", ""), { code: "missing-review-start" }],
    ["missing review end", validResponse().replace("\nEND HYGIENE REVIEW", ""), { code: "missing-review-end" }],
    ["trailing content", `${validResponse()}\nThanks for reading.`, { code: "trailing-content" }],
    ["malformed findings count", validResponse().replace("findings_reported: 1", "findings_reported: one"), { code: "malformed-findings-count" }],
    ["unsafe findings count", validResponse().replace("findings_reported: 1", "findings_reported: 9007199254740992"), { code: "malformed-findings-count" }],
    ["malformed finding header", validResponse().replace("FINDING 1", "FINDING one"), { code: "malformed-finding-header" }],
    ["zero finding number", validResponse().replace("FINDING 1", "FINDING 0"), { code: "malformed-finding-header" }],
    ["unsafe finding number", validResponse().replace("FINDING 1", "FINDING 9007199254740992"), { code: "malformed-finding-header" }],
    ["unexpected content before first finding", validResponse().replace("FINDING 1", "unexpected prose\nFINDING 1"), { code: "unexpected-content" }],
    ["wrong findings count", validResponse().replace("findings_reported: 1", "findings_reported: 2"), { code: "findings-count-mismatch" }],
    ["duplicate finding number", twoFindingResponse(1, "second-cluster"), { code: "duplicate-finding-number", findingNumber: 1 }],
    ["duplicate cluster", twoFindingResponse(2, "locked-door-facts"), { code: "duplicate-cluster", findingNumber: 2 }],
    ["malformed field line", validResponse().replace("relation: NEAR_DUPLICATE", "not-a-field"), { code: "malformed-field", findingNumber: 1 }],
    ["duplicate field", validResponse().replace("action: MERGE", "action: MERGE\naction: KEEP_DISTINCT"), { code: "duplicate-field", findingNumber: 1 }],
    ["unexpected field", validResponse().replace("action: MERGE", "action: MERGE\nreplacement_payload: forbidden"), { code: "unexpected-field", findingNumber: 1 }],
    ["missing required field", validResponse().replace("shared_core: Both facts say the same door is locked.\n", ""), { code: "missing-required-field", findingNumber: 1 }],
    ["unknown relation", validResponse().replace("relation: NEAR_DUPLICATE", "relation: SAME_ENOUGH"), { code: "invalid-relation", findingNumber: 1 }],
    ["unknown action", validResponse().replace("action: MERGE", "action: FIX_ALL"), { code: "invalid-action", findingNumber: 1 }],
    ["unknown confidence", validResponse().replace("confidence: high", "confidence: certain"), { code: "invalid-confidence", findingNumber: 1 }],
    ["fewer than two distinct citations", validResponse().replace("[FACT-1], [FACT-2]", "[FACT-1], [FACT-1]"), { code: "insufficient-citations", findingNumber: 1 }],
    ["unknown citation type or key", validResponse().replace("[FACT-2]", "[LOCATION-1]"), { code: "unknown-citation", findingNumber: 1 }],
    ["invalid survivor", validResponse().replace("survivor: [FACT-1]", "survivor: none"), { code: "invalid-survivor", findingNumber: 1 }],
    ["cross-type merge", validResponse().replace("[FACT-2]", "[BELIEF-1]"), { code: "cross-type-destructive-action", findingNumber: 1 }]
  ])("quarantines malformed output with a typed content-free reason: %s", (_name, text, reason) => {
    const result = parseRecordHygieneResponse(text, validKeys);

    expect(result).toMatchObject({ ok: false, reason });
    if (result.ok) {
      return;
    }
    expect(result.reason).toHaveProperty(
      "message",
      failureMessages[reason.code as RecordHygieneParseFailureCode]
    );
    expect(JSON.stringify(result)).not.toContain("Both facts say the same door is locked");
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

function twoFindingResponse(secondNumber: number, secondCluster: string): string {
  return [
    "HYGIENE REVIEW",
    "findings_reported: 2",
    findingBlock(1),
    findingBlock(secondNumber).replace("cluster: locked-door-facts", `cluster: ${secondCluster}`),
    "END HYGIENE REVIEW"
  ].join("\n");
}
