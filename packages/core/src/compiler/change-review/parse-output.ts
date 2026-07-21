import { containsMaterialAcceptedSegmentEcho } from "../accepted-segment-echo.js";
import {
  expectExactKeys,
  isOutputReasonError,
  isPlainObject,
  outputReason,
  parseCitationKeys,
  parsePureJsonObject,
  type OutputReasonError
} from "../strict-output-primitives.js";
import {
  ACCEPTED_SEGMENT_CHANGE_REVIEW_COVERAGE_DIMENSIONS,
  ACCEPTED_SEGMENT_CHANGE_REVIEW_COVERAGE_STATUSES,
  ACCEPTED_SEGMENT_CHANGE_REVIEW_EPISTEMIC_STATUSES,
  ACCEPTED_SEGMENT_CHANGE_REVIEW_OUTPUT_CONTRACT,
  ACCEPTED_SEGMENT_CHANGE_REVIEW_RETENTION_HORIZONS,
  type AcceptedSegmentChangeReviewCoverageRow,
  type AcceptedSegmentChangeReviewCoverageStatus,
  type AcceptedSegmentChangeReviewCoverageDimension,
  type AcceptedSegmentChangeReviewEpistemicStatus,
  type AcceptedSegmentChangeReviewItem,
  type AcceptedSegmentChangeReviewParsedOutput,
  type AcceptedSegmentChangeReviewRetentionHorizon
} from "./types.js";

export type AcceptedSegmentChangeReviewQuarantineReason =
  | "not-pure-json"
  | "schema-mismatch"
  | "coverage-incomplete"
  | "unknown-citation"
  | "verbatim-source-echo"
  | "invalid-established-claim"
  | "invalid-evidence-excerpt"
  | "future-possibility"
  | "invalid-enum";

export interface AcceptedSegmentChangeReviewParseContext {
  acceptedSegmentText: string;
  evidenceKeys: readonly string[];
  evidenceTextByKey: Readonly<Record<string, string>>;
  contrastKeys: readonly string[];
}

export type AcceptedSegmentChangeReviewParseResult =
  | { status: "valid"; output: AcceptedSegmentChangeReviewParsedOutput }
  | {
      status: "quarantined";
      reasonCode: AcceptedSegmentChangeReviewQuarantineReason;
      summary: string;
      recovery: "inspect-source-and-response";
    };

export function parseAcceptedSegmentChangeReviewOutput(
  rawOutput: string,
  context: AcceptedSegmentChangeReviewParseContext
): AcceptedSegmentChangeReviewParseResult {
  try {
    const parsed = parsePureJsonObject(rawOutput, "not-pure-json", {
      surroundingText: "The provider response must be one JSON object without surrounding text.",
      nonObject: "The provider response must be a JSON object.",
      malformed: "The provider response is not parseable JSON."
    });
    expectKeys(parsed, ["contract", "items", "coverage"]);

    if (parsed.contract !== ACCEPTED_SEGMENT_CHANGE_REVIEW_OUTPUT_CONTRACT) {
      throw reason("schema-mismatch", "The response contract is not accepted_segment_change_review.v2.");
    }

    if (!Array.isArray(parsed.items) || !Array.isArray(parsed.coverage)) {
      throw reason("schema-mismatch", "The response requires items and coverage arrays.");
    }

    const items = parseItems(parsed.items, context);
    const coverage = parseCoverage(parsed.coverage);

    // The bounded three-to-seven-word `evidence_excerpt` witness is a sanctioned
    // verbatim excerpt, so it is blanked before the material-echo scan; the echo
    // guard still protects `change_statement`, `uncertainty_or_rival_reading`,
    // target hints, and coverage reasons.
    const echoScannedItems = items.map((item) => ({ ...item, evidenceExcerpt: "" }));
    if (containsMaterialAcceptedSegmentEcho({ items: echoScannedItems, coverage }, context.acceptedSegmentText)) {
      throw reason("verbatim-source-echo", "The response materially echoes accepted prose.");
    }

    return {
      status: "valid",
      output: {
        contract: ACCEPTED_SEGMENT_CHANGE_REVIEW_OUTPUT_CONTRACT,
        items,
        coverage
      }
    };
  } catch (error) {
    const failure = reasonFrom(error);
    return {
      status: "quarantined",
      reasonCode: failure.reasonCode,
      summary: failure.message,
      recovery: "inspect-source-and-response"
    };
  }
}

function parseItems(
  value: readonly unknown[],
  context: AcceptedSegmentChangeReviewParseContext
): AcceptedSegmentChangeReviewItem[] {
  const evidenceKeys = new Set(context.evidenceKeys);
  const contrastKeys = new Set(context.contrastKeys);

  return value.map((unknownItem, index) => {
    if (!isPlainObject(unknownItem)) {
      throw reason("schema-mismatch", "Every change-review item must be an object.");
    }

    expectKeys(unknownItem, [
      "id",
      "change_statement",
      "evidence_excerpt",
      "evidence",
      "contrast",
      "epistemic_status",
      "retention_horizon",
      "affected_target_hints",
      "uncertainty_or_rival_reading"
    ]);

    const expectedId = `ITEM-${String(index + 1).padStart(3, "0")}`;
    if (unknownItem.id !== expectedId) {
      throw reason("schema-mismatch", "Change-review item ids must be sequential from ITEM-001.");
    }

    const changeStatement = parseNonblankString(unknownItem.change_statement, "change_statement");
    if (typeof unknownItem.evidence_excerpt !== "string") {
      throw reason("schema-mismatch", "evidence_excerpt must be a string.");
    }
    const evidenceExcerpt = unknownItem.evidence_excerpt;
    const evidence = parseCitationList(unknownItem.evidence, evidenceKeys);
    const contrast = parseCitationList(unknownItem.contrast, contrastKeys);
    const targetHints = parseNonblankStringList(unknownItem.affected_target_hints, "affected_target_hints");
    const uncertainty = parseNonblankString(
      unknownItem.uncertainty_or_rival_reading,
      "uncertainty_or_rival_reading"
    );

    if (!ACCEPTED_SEGMENT_CHANGE_REVIEW_EPISTEMIC_STATUSES.includes(unknownItem.epistemic_status as never)) {
      throw reason("invalid-enum", "A change-review item has an unknown epistemic status.");
    }

    if (!ACCEPTED_SEGMENT_CHANGE_REVIEW_RETENTION_HORIZONS.includes(unknownItem.retention_horizon as never)) {
      throw reason("invalid-enum", "A change-review item has an unknown retention horizon.");
    }

    const epistemicStatus = unknownItem.epistemic_status as AcceptedSegmentChangeReviewEpistemicStatus;
    const retentionHorizon = unknownItem.retention_horizon as AcceptedSegmentChangeReviewRetentionHorizon;

    if (futurePossibilityPattern.test(changeStatement)) {
      throw reason("future-possibility", "Future actions, opportunities, and predictions are not change-review items.");
    }

    if (epistemicStatus === "established change") {
      if (inventedOrUnstatedPattern.test(`${changeStatement} ${uncertainty}`)) {
        throw reason(
          "invalid-established-claim",
          "An invented or explicitly unstated implication cannot be labeled established change."
        );
      }
      validateEstablishedEvidenceExcerpt(evidenceExcerpt, evidence, context.evidenceTextByKey);
    } else if (evidenceExcerpt !== "") {
      throw reason(
        "invalid-evidence-excerpt",
        "An interpretation requiring author judgment item must carry an empty evidence_excerpt."
      );
    }

    return {
      id: expectedId,
      changeStatement,
      evidenceExcerpt,
      evidence,
      contrast,
      epistemicStatus,
      retentionHorizon,
      affectedTargetHints: targetHints,
      uncertaintyOrRivalReading: uncertainty
    };
  });
}

function validateEstablishedEvidenceExcerpt(
  evidenceExcerpt: string,
  evidence: readonly string[],
  evidenceTextByKey: Readonly<Record<string, string>>
): void {
  const normalizedExcerpt = normalizeWitnessText(evidenceExcerpt);
  const wordCount = normalizedExcerpt ? normalizedExcerpt.split(/\s+/).length : 0;
  if (wordCount < 3 || wordCount > 7) {
    throw reason(
      "invalid-evidence-excerpt",
      "An established change evidence_excerpt must be an exact three-to-seven-word excerpt."
    );
  }

  const occursInCitedSpan = evidence.some((key) => {
    const source = evidenceTextByKey[key];
    return source !== undefined && normalizeWitnessText(source).includes(normalizedExcerpt);
  });
  if (!occursInCitedSpan) {
    throw reason(
      "invalid-evidence-excerpt",
      "An established change evidence_excerpt must occur verbatim in one cited evidence span."
    );
  }
}

function normalizeWitnessText(value: string): string {
  return value.normalize("NFKC").toLocaleLowerCase().replace(/\s+/g, " ").trim();
}

function parseCoverage(value: readonly unknown[]): AcceptedSegmentChangeReviewCoverageRow[] {
  if (value.length !== ACCEPTED_SEGMENT_CHANGE_REVIEW_COVERAGE_DIMENSIONS.length) {
    throw reason("coverage-incomplete", "Exactly six coverage rows are required.");
  }

  const byDimension = new Map<string, AcceptedSegmentChangeReviewCoverageRow>();

  for (const unknownRow of value) {
    if (!isPlainObject(unknownRow)) {
      throw reason("schema-mismatch", "Every coverage row must be an object.");
    }

    expectKeys(unknownRow, ["dimension", "status", "reason"]);

    if (!ACCEPTED_SEGMENT_CHANGE_REVIEW_COVERAGE_DIMENSIONS.includes(unknownRow.dimension as never)) {
      throw reason("coverage-incomplete", "A coverage row names an unknown dimension.");
    }

    if (byDimension.has(unknownRow.dimension as string)) {
      throw reason("coverage-incomplete", "Coverage dimensions must be unique.");
    }

    if (!ACCEPTED_SEGMENT_CHANGE_REVIEW_COVERAGE_STATUSES.includes(unknownRow.status as never)) {
      throw reason("invalid-enum", "A coverage row has an unknown status.");
    }

    const dimension = unknownRow.dimension as AcceptedSegmentChangeReviewCoverageDimension;
    const status = unknownRow.status as AcceptedSegmentChangeReviewCoverageStatus;
    byDimension.set(dimension, {
      dimension,
      status,
      reason: parseNonblankString(unknownRow.reason, "coverage reason")
    });
  }

  return ACCEPTED_SEGMENT_CHANGE_REVIEW_COVERAGE_DIMENSIONS.map((dimension) => {
    const row = byDimension.get(dimension);
    if (!row) {
      throw reason("coverage-incomplete", "Every declared coverage dimension is required.");
    }
    return row;
  });
}

function parseCitationList(value: unknown, allowed: ReadonlySet<string>): string[] {
  return parseCitationKeys(value, allowed, {
    invalidList: () => reason("schema-mismatch", "citation list must contain unique nonblank string values."),
    unknown: () => reason("unknown-citation", "The response contains a citation outside the inspected source.")
  });
}

function parseNonblankStringList(value: unknown, label: string): string[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw reason("schema-mismatch", `${label} must contain at least one value.`);
  }
  const values = value.map((entry) => parseNonblankString(entry, label));
  if (new Set(values).size !== values.length) {
    throw reason("schema-mismatch", `${label} must not contain duplicate values.`);
  }
  return values;
}

function parseNonblankString(value: unknown, label: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw reason("schema-mismatch", `${label} must be a nonblank string.`);
  }
  return value;
}

function expectKeys(value: Record<string, unknown>, expectedKeys: readonly string[]): void {
  expectExactKeys(
    value,
    expectedKeys,
    () => reason("schema-mismatch", "The response contains missing or undeclared fields.")
  );
}

const futurePossibilityPattern = /\b(?:will|would|may|might|could|likely to|expected to|opportunity to|chance to)\b/i;
const inventedOrUnstatedPattern = /\b(?:invented|fabricated|not stated|not shown|unstated|inferred|implied)\b/i;

type ReasonError = OutputReasonError<AcceptedSegmentChangeReviewQuarantineReason>;

function reason(reasonCode: AcceptedSegmentChangeReviewQuarantineReason, message: string): ReasonError {
  return outputReason(reasonCode, message);
}

function reasonFrom(error: unknown): ReasonError {
  return isReasonError(error)
    ? error
    : reason("schema-mismatch", "The complete response is malformed and has been quarantined.");
}

function isReasonError(error: unknown): error is ReasonError {
  return isOutputReasonError<AcceptedSegmentChangeReviewQuarantineReason>(error);
}
