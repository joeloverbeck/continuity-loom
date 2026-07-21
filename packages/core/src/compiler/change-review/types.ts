import type { ReconciliationReferenceStub } from "../reconciliation/types.js";

export const ACCEPTED_SEGMENT_CHANGE_REVIEW_SOURCE_PROFILE = "accepted-segment-change-review";
export const ACCEPTED_SEGMENT_CHANGE_REVIEW_OUTPUT_CONTRACT = "accepted_segment_change_review.v2";
export const acceptedSegmentChangeReviewVersionInfo = Object.freeze({
  template: "2.0.0",
  compiler: "2.0.0",
  contract: "2.0.0"
});

export const ACCEPTED_SEGMENT_CHANGE_REVIEW_BRIEF_FIELD_PATHS = Object.freeze([
  "current_authoritative_state.current_time",
  "current_authoritative_state.current_location",
  "current_authoritative_state.onstage_entities",
  "current_authoritative_state.immediate_situation_summary",
  "current_authoritative_state.offstage_pressuring_entities",
  "current_authoritative_state.positions",
  "current_authoritative_state.possessions",
  "current_authoritative_state.visible_conditions",
  "current_authoritative_state.environmental_conditions",
  "current_authoritative_state.entity_statuses",
  "current_authoritative_state.line_of_sight_and_visibility",
  "current_authoritative_state.pov_cannot_perceive_now",
  "current_authoritative_state.routes_and_exits",
  "current_authoritative_state.available_time",
  "current_authoritative_state.consent_or_force_conditions",
  "current_authoritative_state.current_locks",
  "immediate_handoff.recent_causal_context",
  "immediate_handoff.last_visible_moment",
  "immediate_handoff.begin_after"
] as const);

export const ACCEPTED_SEGMENT_CHANGE_REVIEW_COVERAGE_DIMENSIONS = Object.freeze([
  "spatial/material/bodily state",
  "time/clocks/ongoing processes",
  "facts/knowledge/beliefs/secrets",
  "intentions/plans/commitments/promises/open pressures",
  "emotions/relationships",
  "immediate next-segment handoff"
] as const);

export const ACCEPTED_SEGMENT_CHANGE_REVIEW_COVERAGE_STATUSES = Object.freeze([
  "changes found",
  "checked - no relevant change",
  "uncertain"
] as const);

export const ACCEPTED_SEGMENT_CHANGE_REVIEW_EPISTEMIC_STATUSES = Object.freeze([
  "established change",
  "interpretation requiring author judgment"
] as const);

export const ACCEPTED_SEGMENT_CHANGE_REVIEW_RETENTION_HORIZONS = Object.freeze([
  "durable record candidate",
  "next-brief-only",
  "no storage",
  "author decision required"
] as const);

export type AcceptedSegmentChangeReviewBriefFieldPath =
  (typeof ACCEPTED_SEGMENT_CHANGE_REVIEW_BRIEF_FIELD_PATHS)[number];
export type AcceptedSegmentChangeReviewRecordScope = "active_working_set" | "whole_project";
export type AcceptedSegmentChangeReviewCoverageDimension =
  (typeof ACCEPTED_SEGMENT_CHANGE_REVIEW_COVERAGE_DIMENSIONS)[number];
export type AcceptedSegmentChangeReviewCoverageStatus =
  (typeof ACCEPTED_SEGMENT_CHANGE_REVIEW_COVERAGE_STATUSES)[number];
export type AcceptedSegmentChangeReviewEpistemicStatus =
  (typeof ACCEPTED_SEGMENT_CHANGE_REVIEW_EPISTEMIC_STATUSES)[number];
export type AcceptedSegmentChangeReviewRetentionHorizon =
  (typeof ACCEPTED_SEGMENT_CHANGE_REVIEW_RETENTION_HORIZONS)[number];

export interface AcceptedSegmentChangeReviewRequest {
  segmentSelection: "latest";
  recordScope: AcceptedSegmentChangeReviewRecordScope;
}

export interface AcceptedSegmentChangeReviewAcceptedSegment {
  id: string;
  sequence: number;
  acceptedAt: string;
  text: string;
}

export interface AcceptedSegmentChangeReviewSpan {
  key: string;
  sequence: number;
  index: number;
  startOffset: number;
  endOffset: number;
  text: string;
}

export interface AcceptedSegmentChangeReviewRecord {
  id: string;
  type: string;
  displayLabel: string;
  archived?: boolean;
  payload: unknown;
  lifecycleStatus?: string | null;
}

export interface AcceptedSegmentChangeReviewVersions {
  template: string;
  compiler: string;
  contract: string;
}

export interface AcceptedSegmentChangeReviewSnapshot {
  request: AcceptedSegmentChangeReviewRequest;
  acceptedSegment: AcceptedSegmentChangeReviewAcceptedSegment;
  acceptedSegmentSpans: readonly AcceptedSegmentChangeReviewSpan[];
  generationBriefProjection: Readonly<Record<string, unknown>>;
  records: readonly AcceptedSegmentChangeReviewRecord[];
  referenceStubs: readonly ReconciliationReferenceStub[];
  versions: AcceptedSegmentChangeReviewVersions;
}

export interface AcceptedSegmentChangeReviewDisclosure {
  acceptedSegmentId: string;
  acceptedSegmentSequence: number;
  acceptedSegmentAcceptedAt: string;
  sourceProfile: typeof ACCEPTED_SEGMENT_CHANGE_REVIEW_SOURCE_PROFILE;
  recordScope: AcceptedSegmentChangeReviewRecordScope;
  fullRecordCount: number;
  countsByType: Readonly<Record<string, number>>;
  includesSecrets: boolean;
  promptLength: number;
  tokenEstimate: number;
  versions: AcceptedSegmentChangeReviewVersions;
  fingerprint: string;
  citationMap: Readonly<Record<string, string>>;
}

export interface AcceptedSegmentChangeReviewCompileResult {
  prompt: string;
  disclosure: AcceptedSegmentChangeReviewDisclosure;
}

export interface AcceptedSegmentChangeReviewItem {
  id: string;
  changeStatement: string;
  evidenceExcerpt: string;
  evidence: readonly string[];
  contrast: readonly string[];
  epistemicStatus: AcceptedSegmentChangeReviewEpistemicStatus;
  retentionHorizon: AcceptedSegmentChangeReviewRetentionHorizon;
  affectedTargetHints: readonly string[];
  uncertaintyOrRivalReading: string;
}

export interface AcceptedSegmentChangeReviewCoverageRow {
  dimension: AcceptedSegmentChangeReviewCoverageDimension;
  status: AcceptedSegmentChangeReviewCoverageStatus;
  reason: string;
}

export interface AcceptedSegmentChangeReviewParsedOutput {
  contract: typeof ACCEPTED_SEGMENT_CHANGE_REVIEW_OUTPUT_CONTRACT;
  items: readonly AcceptedSegmentChangeReviewItem[];
  coverage: readonly AcceptedSegmentChangeReviewCoverageRow[];
}
