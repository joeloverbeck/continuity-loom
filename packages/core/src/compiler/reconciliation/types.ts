import type { GenerationSessionDraft } from "../../records/generation-brief-draft.js";
import type { RecordMetadata } from "../../records/metadata.js";
import type { ValidationVersions } from "../../validation/snapshot.js";

export type SegmentReconciliationRecordScope = "active_working_set" | "whole_project";
export type SegmentReconciliationSegmentSelection = "latest";
export type ReconciliationBriefFieldState = "missing" | "blank" | "present";

export interface SegmentReconciliationRequest {
  segmentSelection: SegmentReconciliationSegmentSelection;
  recordScope: SegmentReconciliationRecordScope;
}

export interface SegmentReconciliationAcceptedSegment {
  id: string;
  sequence: number;
  acceptedAt: string;
  text: string;
}

export interface AcceptedSegmentSpan {
  key: string;
  sequence: number;
  index: number;
  startOffset: number;
  endOffset: number;
  text: string;
}

export interface ReconciliationBriefField {
  fieldPath: ReconciliationBriefFieldPath;
  citationKey: string;
  currentState: ReconciliationBriefFieldState;
  currentValue?: unknown;
}

export interface ReconciliationRecord {
  id: string;
  type: string;
  displayLabel: string;
  payload: unknown;
  metadata?: RecordMetadata;
  lifecycleStatus?: string | null;
}

export interface ReconciliationReferenceStub {
  id: string;
  type: string;
  displayLabel: string;
}

export interface SegmentReconciliationSourceTuple {
  request: SegmentReconciliationRequest;
  acceptedSegment: SegmentReconciliationAcceptedSegment;
  generationBriefDraft: GenerationSessionDraft;
  briefFields: readonly ReconciliationBriefField[];
  records: readonly ReconciliationRecord[];
  referenceStubs: readonly ReconciliationReferenceStub[];
  versions: ValidationVersions;
}

export interface SegmentReconciliationSnapshot extends SegmentReconciliationSourceTuple {
  normalizedAcceptedSegmentText: string;
  acceptedSegmentSpans: readonly AcceptedSegmentSpan[];
}

export const RECONCILIATION_BRIEF_FIELD_PATHS = Object.freeze([
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

export type ReconciliationBriefFieldPath = (typeof RECONCILIATION_BRIEF_FIELD_PATHS)[number];
