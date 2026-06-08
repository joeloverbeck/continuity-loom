import { EMPTY_STATE_CONSTANTS } from "../empty-states.js";
import { orderCompilerRecords } from "../ordering.js";
import type { PlaceholderName } from "../placeholder-map.js";
import type { PlaceholderResolver } from "../types.js";
import type { ValidationRecord, ValidationSnapshot } from "../../validation/snapshot.js";

type JsonRecord = Record<string, unknown>;
type ResolverMap = Partial<Record<PlaceholderName, (snapshot: ValidationSnapshot) => string>>;

const tailResolvers: ResolverMap = {
  pov_accessible_facts: (snapshot) =>
    renderRecords(
      snapshot,
      "FACT",
      (payload) => knownBy(payload.known_by, selectedPov(snapshot)),
      (payload) => asString(payload.statement)
    ) || EMPTY_STATE_CONSTANTS.pov_accessible_facts,
  writer_visible_or_non_pov_facts: (snapshot) =>
    renderRecords(
      snapshot,
      "FACT",
      (payload) => !knownBy(payload.known_by, selectedPov(snapshot)),
      (payload) => asString(payload.statement)
    ) || EMPTY_STATE_CONSTANTS.writer_visible_or_non_pov_facts,
  pov_relevant_beliefs: (snapshot) =>
    renderRecords(
      snapshot,
      "BELIEF",
      (payload) => payload.holder === selectedPov(snapshot),
      (payload) =>
        compactParts([
          asString(payload.claim),
          labelValue("truth", payload.truth_relation),
          labelValue("mode", payload.belief_mode),
          labelValue("confidence", payload.confidence),
          labelValue("access", payload.access_route),
          labelValue("behavior", payload.behavioral_effect)
        ])
    ) || EMPTY_STATE_CONSTANTS.pov_relevant_beliefs,
  non_pov_behavior_shaping_beliefs: (snapshot) =>
    renderRecords(
      snapshot,
      "BELIEF",
      (payload) => payload.holder !== selectedPov(snapshot),
      (payload) =>
        compactParts([
          asString(payload.claim),
          labelValue("behavior", payload.behavioral_effect),
          labelValue("mode", payload.belief_mode),
          labelValue("truth", payload.truth_relation),
          labelValue("confidence", payload.confidence),
          labelValue("access", payload.access_route)
        ])
    ) || EMPTY_STATE_CONSTANTS.non_pov_behavior_shaping_beliefs,
  recent_events: (snapshot) =>
    renderRecords(
      snapshot,
      "EVENT",
      (payload) => payload.event_kind === "immediate_previous" || payload.event_kind === "recent_causal",
      (payload) => compactParts([asString(payload.description), labelValue("visibility", payload.pov_visibility)])
    ) || EMPTY_STATE_CONSTANTS.recent_events,
  relevant_backstory: (snapshot) =>
    renderRecords(
      snapshot,
      "EVENT",
      (payload) => payload.event_kind === "relevant_backstory",
      (payload) => compactParts([asString(payload.description), labelValue("current relevance", payload.current_relevance)])
    ) || EMPTY_STATE_CONSTANTS.relevant_backstory,
  offstage_or_withheld_events: (snapshot) =>
    renderRecords(
      snapshot,
      "EVENT",
      (payload) => payload.event_kind === "offstage" || payload.event_kind === "withheld",
      (payload) => compactParts([asString(payload.description), labelValue("visibility", payload.pov_visibility)])
    ) || EMPTY_STATE_CONSTANTS.offstage_or_withheld_events,
  locations: (snapshot) =>
    renderRecords(snapshot, "LOCATION", activeStatus, (payload) =>
      compactParts([
        asString(payload.label),
        asString(payload.description),
        labelValue("layout", payload.layout_relevant_now),
        labelValue("routes", payload.access_routes),
        labelValue("visibility/sound", payload.visibility_and_sound)
      ])
    ) || EMPTY_STATE_CONSTANTS.locations,
  objects: (snapshot) =>
    renderRecords(snapshot, "OBJECT", activeStatus, (payload) =>
      compactParts([
        asString(payload.label),
        asString(payload.description),
        labelValue("owner", payload.owner),
        labelValue("carried by", payload.carried_by),
        labelValue("location", payload.current_location),
        labelValue("visibility", payload.visibility_to_pov),
        labelValue("affordances", payload.usable_affordances),
        labelValue("constraints", payload.constraints)
      ])
    ) || EMPTY_STATE_CONSTANTS.objects,
  visible_affordances: (snapshot) =>
    renderRecords(snapshot, "VISIBLE AFFORDANCE", (payload) => payload.status === "available", (payload) =>
      compactParts([
        asString(payload.label),
        asString(payload.prompt_text),
        labelValue("available to", payload.available_to),
        labelValue("actions", payload.action_families),
        labelValue("requires", payload.requires),
        labelValue("risk", payload.risk)
      ])
    ) || EMPTY_STATE_CONSTANTS.visible_affordances,
  unavailable_or_impossible_actions: (snapshot) => renderUnavailableActions(snapshot),
  physical_continuity: (snapshot) => renderPhysicalContinuity(snapshot)
};

export const TAIL_PLACEHOLDER_RESOLVERS: Readonly<Partial<Record<PlaceholderName, PlaceholderResolver>>> =
  Object.freeze(
    Object.fromEntries(
      Object.entries(tailResolvers).map(([placeholder, resolve]) => [
        placeholder,
        {
          placeholder,
          required: true,
          missingBehavior: "block",
          emptyState: EMPTY_STATE_CONSTANTS[placeholder as PlaceholderName],
          resolve
        }
      ])
    ) as Partial<Record<PlaceholderName, PlaceholderResolver>>
  );

function renderUnavailableActions(snapshot: ValidationSnapshot): string {
  const currentLocks = snapshot.generationSession.current_authoritative_state?.current_locks ?? [];
  const lockLines = currentLocks.map((lock) => `- Current lock: ${lock}`);
  const affordanceLines = renderRecords(snapshot, "VISIBLE AFFORDANCE", (payload) => payload.status !== "available", (payload) =>
    compactParts([asString(payload.label), labelValue("status", payload.status), asString(payload.prompt_text), labelValue("requires", payload.requires)])
  );
  const lines = [...lockLines, affordanceLines].filter(Boolean);

  return lines.join("\n") || EMPTY_STATE_CONSTANTS.unavailable_or_impossible_actions;
}

function renderPhysicalContinuity(snapshot: ValidationSnapshot): string {
  const state = snapshot.generationSession.current_authoritative_state;
  const stateLines = state
    ? [
        labelValue("time", state.current_time),
        labelValue("location", state.current_location),
        labelValue("positions", state.positions),
        labelValue("statuses", state.entity_statuses),
        labelValue("possessions", state.possessions),
        labelValue("visibility", state.line_of_sight_and_visibility),
        labelValue("routes/exits", state.routes_and_exits),
        labelValue("available time", state.available_time),
        labelValue("consent/force", state.consent_or_force_conditions),
        labelValue("locks", state.current_locks)
      ].filter(Boolean)
    : [];
  const recordLines = renderRecords(
    snapshot,
    ["ENTITY STATUS", "LOCATION", "OBJECT", "VISIBLE AFFORDANCE"],
    () => true,
    (payload, record) => compactParts([displayLabel(record), physicalRecordText(record, payload)])
  );
  const lines = [...stateLines.map((line) => `- ${line}`), recordLines].filter(Boolean);

  return lines.join("\n") || EMPTY_STATE_CONSTANTS.physical_continuity;
}

function physicalRecordText(record: ValidationRecord, payload: JsonRecord): string {
  if (record.type === "ENTITY STATUS") {
    return compactParts([
      labelValue("entity", payload.entity_id),
      labelValue("life", payload.life),
      labelValue("agency", payload.agency),
      labelValue("location", payload.location),
      labelValue("visibility", payload.visibility_to_pov),
      labelValue("activity", payload.current_activity)
    ]);
  }

  return compactParts([
    asString(payload.label),
    asString(payload.description),
    asString(payload.prompt_text),
    labelValue("status", payload.status)
  ]);
}

function renderRecords(
  snapshot: ValidationSnapshot,
  types: string | readonly string[],
  predicate: (payload: JsonRecord, record: ValidationRecord) => boolean,
  project: (payload: JsonRecord, record: ValidationRecord) => string
): string {
  const typeSet = new Set(Array.isArray(types) ? types : [types]);
  return orderCompilerRecords(snapshot.records)
    .filter((record) => typeSet.has(record.type))
    .map((record) => ({ record, payload: payloadOf(record) }))
    .filter(({ payload, record }) => predicate(payload, record))
    .map(({ payload, record }) => project(payload, record))
    .filter(Boolean)
    .map((line) => `- ${line}`)
    .join("\n");
}

function payloadOf(record: ValidationRecord): JsonRecord {
  return record.payload && typeof record.payload === "object" ? (record.payload as JsonRecord) : {};
}

function selectedPov(snapshot: ValidationSnapshot): string | undefined {
  const pov = snapshot.generationSession.active_working_set?.selected_pov;
  return pov && pov !== "omniscient" ? pov : undefined;
}

function knownBy(knownByValue: unknown, pov: string | undefined): boolean {
  if (knownByValue === "public") {
    return true;
  }

  return Boolean(pov && Array.isArray(knownByValue) && knownByValue.includes(pov));
}

function activeStatus(payload: JsonRecord): boolean {
  return payload.status === "active" || payload.status === "available";
}

function compactParts(parts: readonly string[]): string {
  return parts.filter(Boolean).join("; ");
}

function labelValue(label: string, value: unknown): string {
  const rendered = renderValue(value);
  return rendered && rendered !== "none" ? `${label}: ${rendered}` : "";
}

function renderValue(value: unknown): string {
  if (Array.isArray(value)) {
    return value.map(renderValue).filter(Boolean).join(", ");
  }

  return asString(value);
}

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function displayLabel(record: ValidationRecord): string {
  return record.metadata?.displayLabel ?? record.id;
}
