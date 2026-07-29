export interface ParsedRecordHygieneFinding {
  number: number;
  cluster: string;
  relation: HygieneRelation;
  action: HygieneAction;
  citations: readonly string[];
  sharedCore: string;
  materialDifferences: string;
  whyItMatters: string;
  manualRecommendation: string;
  survivor: string | null;
  referenceCaution: string;
  confidence: HygieneConfidence;
}

export type RecordHygieneParseFailureCode =
  | "missing-review-start"
  | "missing-review-end"
  | "trailing-content"
  | "malformed-findings-count"
  | "malformed-finding-header"
  | "unexpected-content"
  | "findings-count-mismatch"
  | "duplicate-finding-number"
  | "duplicate-cluster"
  | "malformed-field"
  | "duplicate-field"
  | "unexpected-field"
  | "missing-required-field"
  | "invalid-relation"
  | "invalid-action"
  | "invalid-confidence"
  | "insufficient-citations"
  | "unknown-citation"
  | "invalid-survivor"
  | "cross-type-destructive-action";

export interface RecordHygieneParseFailure {
  code: RecordHygieneParseFailureCode;
  message: string;
  findingNumber?: number;
}

export type ParseRecordHygieneResult =
  | { ok: true; findings: readonly ParsedRecordHygieneFinding[] }
  | { ok: false; reason: RecordHygieneParseFailure };

const relations = new Set([
  "EXACT_DUPLICATE",
  "NEAR_DUPLICATE",
  "COMPLEMENTARY_FRAGMENT",
  "BROAD_NARROW",
  "PARTIAL_OVERLAP",
  "STALE_SHADOW",
  "CROSS_TYPE_RESTATEMENT",
  "LEGITIMATE_NEAR_MATCH",
  "CONFLICT_OR_UNCERTAIN"
] as const);

const actions = new Set(["KEEP_DISTINCT", "REWORD", "MAKE_SPECIFIC", "MERGE", "DEACTIVATE", "REMOVE", "HUMAN_REVIEW"] as const);
const confidences = new Set(["high", "medium", "low"] as const);
const citationPattern = /\[[A-Z ]+-\d+\]/g;
const citationTypePattern = /^\[([A-Z ]+)-\d+\]$/;
const findingHeaderPattern = /^FINDING\s+(\d+)\s*:?\s*$/;
const findingHeaderCandidatePattern = /^FINDING\b/;
const codeFencePattern = /^`{3,}[A-Za-z0-9_-]*$/;
const listMarkerPattern = /^[-*+>]\s+/;
const headingMarkerPattern = /^#{1,6}\s+/;
const leadingEmphasisPattern = /^(?:[*_]+\s*)+/;
const trailingEmphasisPattern = /(?:\s*[*_]+)+$/;
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

type HygieneRelation = typeof relations extends Set<infer T> ? T : never;
type HygieneAction = typeof actions extends Set<infer T> ? T : never;
type HygieneConfidence = typeof confidences extends Set<infer T> ? T : never;

export function parseRecordHygieneResponse(responseText: string, validCitationKeys: ReadonlySet<string>): ParseRecordHygieneResult {
  const normalized = normalizeContractLines(responseText);
  const openingIndex = normalized.indexOf("HYGIENE REVIEW");
  if (openingIndex === -1) {
    return failure("missing-review-start");
  }
  const lines = normalized.slice(openingIndex);
  const closingIndex = lines.indexOf("END HYGIENE REVIEW");
  if (closingIndex === -1) {
    return failure("missing-review-end");
  }
  if (closingIndex !== lines.length - 1) {
    return failure("trailing-content");
  }

  const count = parseCount(lines[1]);
  if (count === null) {
    return failure("malformed-findings-count");
  }

  const split = splitFindingBlocks(lines.slice(2, -1));
  if (!split.ok) {
    return split;
  }
  if (split.blocks.length !== count) {
    return failure("findings-count-mismatch");
  }

  const seenNumbers = new Set<number>();
  const seenClusters = new Set<string>();
  const findings: ParsedRecordHygieneFinding[] = [];

  for (const block of split.blocks) {
    const parsed = parseFindingBlock(block, validCitationKeys);
    if (!parsed.ok) {
      return parsed;
    }
    const finding = parsed.finding;
    if (seenNumbers.has(finding.number)) {
      return failure("duplicate-finding-number", finding.number);
    }
    if (seenClusters.has(finding.cluster)) {
      return failure("duplicate-cluster", finding.number);
    }

    seenNumbers.add(finding.number);
    seenClusters.add(finding.cluster);
    findings.push(finding);
  }

  return { ok: true, findings };
}

function normalizeContractLines(responseText: string): string[] {
  return responseText.split(/\r?\n/).flatMap((line) => {
    const trimmed = line.trim();
    if (!trimmed || codeFencePattern.test(trimmed)) {
      return [];
    }

    const undecorated = stripBlockDecoration(trimmed);
    const structural = stripEmphasis(undecorated);
    if (
      structural === "HYGIENE REVIEW"
      || structural === "END HYGIENE REVIEW"
      || findingHeaderCandidatePattern.test(structural)
    ) {
      return [structural];
    }

    const separator = undecorated.indexOf(":");
    if (separator > 0) {
      const key = stripEmphasis(undecorated.slice(0, separator));
      const value = stripEmphasis(undecorated.slice(separator + 1));
      return [`${key}: ${value}`];
    }

    return [undecorated];
  });
}

function stripBlockDecoration(line: string): string {
  return line.replace(listMarkerPattern, "").replace(headingMarkerPattern, "").trim();
}

function stripEmphasis(value: string): string {
  return value.replace(leadingEmphasisPattern, "").replace(trailingEmphasisPattern, "").trim();
}

function parseCount(line: string | undefined): number | null {
  const match = line?.match(/^findings_reported:\s*(\d+)$/);
  if (!match) {
    return null;
  }
  const count = Number(match[1]);
  return Number.isSafeInteger(count) ? count : null;
}

function parseFindingNumber(line: string): number | null {
  const match = line.match(findingHeaderPattern);
  if (!match) {
    return null;
  }
  const number = Number(match[1]);
  return Number.isSafeInteger(number) && number > 0 ? number : null;
}

function splitFindingBlocks(lines: readonly string[]):
  | { ok: true; blocks: readonly (readonly string[])[] }
  | { ok: false; reason: RecordHygieneParseFailure } {
  const blocks: string[][] = [];
  let current: string[] | undefined;

  for (const line of lines) {
    if (findingHeaderCandidatePattern.test(line)) {
      if (parseFindingNumber(line) === null) {
        return failure("malformed-finding-header");
      }
      current = [line];
      blocks.push(current);
      continue;
    }

    if (current === undefined) {
      return failure("unexpected-content");
    }
    current.push(line);
  }

  return { ok: true, blocks };
}

function parseFindingBlock(
  block: readonly string[],
  validCitationKeys: ReadonlySet<string>
): { ok: true; finding: ParsedRecordHygieneFinding } | { ok: false; reason: RecordHygieneParseFailure } {
  const findingNumber = parseFindingNumber(block[0] ?? "");
  if (findingNumber === null) {
    return failure("malformed-finding-header");
  }

  const fields = new Map<string, string>();
  const permittedFields = new Set([
    "cluster",
    "relation",
    "action",
    "citations",
    "shared_core",
    "material_differences",
    "why_it_matters",
    "manual_recommendation",
    "survivor",
    "reference_caution",
    "confidence"
  ]);
  for (const line of block.slice(1)) {
    const separator = line.indexOf(":");
    if (separator <= 0) {
      return failure("malformed-field", findingNumber);
    }
    const key = line.slice(0, separator).trim();
    if (!permittedFields.has(key)) {
      return failure("unexpected-field", findingNumber);
    }
    if (fields.has(key)) {
      return failure("duplicate-field", findingNumber);
    }
    fields.set(key, line.slice(separator + 1).trim());
  }

  if ([...permittedFields].some((field) => !fields.get(field))) {
    return failure("missing-required-field", findingNumber);
  }
  const relation = fields.get("relation");
  const action = fields.get("action");
  const confidence = fields.get("confidence");
  const citations = unique(Array.from((fields.get("citations") ?? "").matchAll(citationPattern), (match) => match[0] ?? ""));
  const survivor = fields.get("survivor") ?? "";

  if (!relations.has(relation as HygieneRelation)) {
    return failure("invalid-relation", findingNumber);
  }
  if (!actions.has(action as HygieneAction)) {
    return failure("invalid-action", findingNumber);
  }
  if (!confidences.has(confidence as HygieneConfidence)) {
    return failure("invalid-confidence", findingNumber);
  }
  if (citations.length < 2) {
    return failure("insufficient-citations", findingNumber);
  }
  if (citations.some((citation) => !validCitationKeys.has(citation))) {
    return failure("unknown-citation", findingNumber);
  }

  if (!validSurvivor(action as HygieneAction, survivor, citations, validCitationKeys)) {
    return failure("invalid-survivor", findingNumber);
  }

  if ((action === "MERGE" || action === "REMOVE") && !sameCitationType(citations)) {
    return failure("cross-type-destructive-action", findingNumber);
  }

  return {
    ok: true,
    finding: {
      number: findingNumber,
      cluster: fields.get("cluster") ?? "",
      relation: relation as HygieneRelation,
      action: action as HygieneAction,
      citations,
      sharedCore: fields.get("shared_core") ?? "",
      materialDifferences: fields.get("material_differences") ?? "",
      whyItMatters: fields.get("why_it_matters") ?? "",
      manualRecommendation: fields.get("manual_recommendation") ?? "",
      survivor: survivor === "none" ? null : survivor,
      referenceCaution: fields.get("reference_caution") ?? "",
      confidence: confidence as HygieneConfidence
    }
  };
}

function validSurvivor(
  action: HygieneAction,
  survivor: string,
  citations: readonly string[],
  validCitationKeys: ReadonlySet<string>
): boolean {
  if (action === "MERGE" || action === "REMOVE") {
    return citations.includes(survivor) && validCitationKeys.has(survivor);
  }

  return survivor === "none";
}

function sameCitationType(citations: readonly string[]): boolean {
  const types = new Set(citations.map((citation) => citation.match(citationTypePattern)?.[1] ?? ""));
  return types.size === 1 && !types.has("");
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values)];
}

function failure(
  code: RecordHygieneParseFailureCode,
  findingNumber?: number
): { ok: false; reason: RecordHygieneParseFailure } {
  return {
    ok: false,
    reason: {
      code,
      message: failureMessages[code],
      ...(findingNumber === undefined ? {} : { findingNumber })
    }
  };
}
