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

export type ParseRecordHygieneResult =
  | { ok: true; findings: readonly ParsedRecordHygieneFinding[] }
  | { ok: false; raw: string };

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

type HygieneRelation = typeof relations extends Set<infer T> ? T : never;
type HygieneAction = typeof actions extends Set<infer T> ? T : never;
type HygieneConfidence = typeof confidences extends Set<infer T> ? T : never;

export function parseRecordHygieneResponse(responseText: string, validCitationKeys: ReadonlySet<string>): ParseRecordHygieneResult {
  const lines = responseText.trim().split(/\r?\n/).map((line) => line.trim()).filter(Boolean);

  if (lines[0] !== "HYGIENE REVIEW" || lines.at(-1) !== "END HYGIENE REVIEW") {
    return malformed(responseText);
  }

  const count = parseCount(lines[1]);
  if (count === null) {
    return malformed(responseText);
  }

  const blocks = splitFindingBlocks(lines.slice(2, -1));
  if (blocks.length !== count) {
    return malformed(responseText);
  }

  const seenNumbers = new Set<number>();
  const seenClusters = new Set<string>();
  const findings: ParsedRecordHygieneFinding[] = [];

  for (const block of blocks) {
    const finding = parseFindingBlock(block, validCitationKeys);
    if (!finding || seenNumbers.has(finding.number) || seenClusters.has(finding.cluster)) {
      return malformed(responseText);
    }

    seenNumbers.add(finding.number);
    seenClusters.add(finding.cluster);
    findings.push(finding);
  }

  return { ok: true, findings };
}

function parseCount(line: string | undefined): number | null {
  const match = line?.match(/^findings_reported:\s*(\d+)$/);
  return match ? Number(match[1]) : null;
}

function splitFindingBlocks(lines: readonly string[]): string[][] {
  const blocks: string[][] = [];
  let current: string[] | undefined;

  for (const line of lines) {
    if (/^FINDING\s+\d+$/.test(line)) {
      current = [line];
      blocks.push(current);
      continue;
    }

    current?.push(line);
  }

  return blocks;
}

function parseFindingBlock(block: readonly string[], validCitationKeys: ReadonlySet<string>): ParsedRecordHygieneFinding | null {
  const header = block[0]?.match(/^FINDING\s+(\d+)$/);
  if (!header) {
    return null;
  }

  const fields = new Map<string, string>();
  for (const line of block.slice(1)) {
    const separator = line.indexOf(":");
    if (separator === -1) {
      return null;
    }
    fields.set(line.slice(0, separator).trim(), line.slice(separator + 1).trim());
  }

  const relation = fields.get("relation");
  const action = fields.get("action");
  const confidence = fields.get("confidence");
  const citations = unique(Array.from((fields.get("citations") ?? "").matchAll(citationPattern), (match) => match[0] ?? ""));
  const survivor = fields.get("survivor") ?? "";

  if (
    !relation
    || !relations.has(relation as HygieneRelation)
    || !action
    || !actions.has(action as HygieneAction)
    || !confidence
    || !confidences.has(confidence as HygieneConfidence)
    || citations.length < 2
    || citations.some((citation) => !validCitationKeys.has(citation))
  ) {
    return null;
  }

  if (!validSurvivor(action as HygieneAction, survivor, citations, validCitationKeys)) {
    return null;
  }

  if ((action === "MERGE" || action === "REMOVE") && !sameCitationType(citations)) {
    return null;
  }

  const requiredText = [
    "cluster",
    "shared_core",
    "material_differences",
    "why_it_matters",
    "manual_recommendation",
    "reference_caution"
  ];
  if (requiredText.some((field) => !fields.get(field))) {
    return null;
  }

  return {
    number: Number(header[1]),
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

function malformed(raw: string): ParseRecordHygieneResult {
  return { ok: false, raw };
}
