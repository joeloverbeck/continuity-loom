import { EMPTY_STATE_CONSTANTS } from "../empty-states.js";
import { resolveRecordLabel } from "../labels.js";
import { orderCompilerRecords } from "../ordering.js";
import type { PlaceholderName } from "../placeholder-map.js";
import type { PlaceholderResolver } from "../types.js";
import type { ValidationRecord, ValidationSnapshot } from "../../validation/snapshot.js";

type JsonRecord = Record<string, unknown>;
type ResolverMap = Partial<Record<PlaceholderName, (snapshot: ValidationSnapshot) => string>>;
export interface TailRenderOptions {
  ideation?: boolean;
}

const tailResolvers: ResolverMap = {
  pov_accessible_facts: (snapshot) =>
    renderRecords(
      snapshot,
      "FACT",
      (payload) => knownBy(payload.known_by, selectedPov(snapshot)),
      (payload) => asString(payload.statement)
    ),
  writer_visible_or_non_pov_facts: (snapshot) =>
    renderRecords(
      snapshot,
      "FACT",
      (payload) => !knownBy(payload.known_by, selectedPov(snapshot)),
      (payload) => asString(payload.statement)
    ),
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
          labelValue("behavior", payload.behavioral_effect),
          labelValue("visibility", payload.visibility)
        ])
    ),
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
          labelValue("access", payload.access_route),
          labelValue("visibility", payload.visibility)
        ])
    ),
  recent_events: (snapshot) =>
    renderRecords(
      snapshot,
      "EVENT",
      (payload) => payload.event_kind === "immediate_previous" || payload.event_kind === "recent_causal",
      (payload) => compactParts([asString(payload.description), labelValue("visibility", payload.pov_visibility)])
    ),
  relevant_backstory: (snapshot) =>
    renderRecords(
      snapshot,
      "EVENT",
      (payload) => payload.event_kind === "relevant_backstory",
      (payload) => compactParts([asString(payload.description), labelValue("current relevance", payload.current_relevance)])
    ),
  offstage_or_withheld_events: (snapshot) =>
    renderRecords(
      snapshot,
      "EVENT",
      (payload) => payload.event_kind === "offstage" || payload.event_kind === "withheld",
      (payload) => compactParts([asString(payload.description), labelValue("visibility", payload.pov_visibility)])
    ),
  locations: (snapshot) => renderLocations(snapshot),
  objects: (snapshot) => renderObjects(snapshot),
  visible_affordances: (snapshot) =>
    renderRecords(snapshot, "VISIBLE AFFORDANCE", (payload) => payload.status === "available", (payload) =>
      compactParts([
        asString(payload.label),
        asString(payload.prompt_text),
        labelValue("available to", resolveRecordLabel(snapshot, payload.available_to)),
        labelValue("actions", payload.action_families),
        labelValue("requires", payload.requires),
        labelValue("risk", payload.risk),
        labelValue("durability", payload.durability)
      ])
    ),
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

export function renderTailPlaceholder(
  placeholder: PlaceholderName,
  snapshot: ValidationSnapshot,
  options: TailRenderOptions = {}
): string | undefined {
  switch (placeholder) {
    case "locations":
      return renderLocations(snapshot, options);
    case "objects":
      return renderObjects(snapshot, options);
    case "physical_continuity":
      return renderPhysicalContinuity(snapshot, options);
    default:
      return undefined;
  }
}

function renderUnavailableActions(snapshot: ValidationSnapshot): string {
  const currentLocks = snapshot.generationSession.current_authoritative_state?.current_locks ?? [];
  const lockLines = currentLocks.map((lock) => `- Current lock: ${lock}`);
  const affordanceLines = renderRecords(snapshot, "VISIBLE AFFORDANCE", (payload) => payload.status !== "available", (payload) =>
    compactParts([asString(payload.label), labelValue("status", payload.status), asString(payload.prompt_text), labelValue("requires", payload.requires)])
  );
  const lines = [...lockLines, affordanceLines].filter(Boolean);

  return lines.join("\n");
}

function renderPhysicalContinuity(snapshot: ValidationSnapshot, options: TailRenderOptions = {}): string {
  const state = snapshot.generationSession.current_authoritative_state;
  const stateLines = state
    ? [
        labelValue("time", state.current_time),
        labelValue("location", resolveRecordLabel(snapshot, state.current_location)),
        labelValue("positions", state.positions),
        labelValue("statuses", renderEntityStatuses(snapshot, state.entity_statuses)),
        labelValue("possessions", state.possessions),
        labelValue("visibility", state.line_of_sight_and_visibility),
        labelValue("routes/exits", state.routes_and_exits),
        labelValue("available time", state.available_time),
        labelValue("consent/force", state.consent_or_force_conditions),
        labelValue("locks", state.current_locks)
      ].filter(Boolean)
    : [];
  if (options.ideation) {
    const statusLines = renderRecords(
      snapshot,
      ["ENTITY STATUS", "LOCATION", "OBJECT", "VISIBLE AFFORDANCE"],
      () => true,
      (payload, record) => physicalStatusLine(snapshot, record, payload)
    );
    const lines = [...stateLines.map((line) => `- ${line}`), statusLines].filter(Boolean);

    return lines.join("\n") || EMPTY_STATE_CONSTANTS.physical_continuity;
  }

  const recordLines = renderRecords(
    snapshot,
    ["ENTITY STATUS", "LOCATION", "OBJECT", "VISIBLE AFFORDANCE"],
    () => true,
    (payload, record) => physicalRecordText(snapshot, record, payload)
  );
  const lines = [...stateLines.map((line) => `- ${line}`), recordLines].filter(Boolean);

  return lines.join("\n") || EMPTY_STATE_CONSTANTS.physical_continuity;
}

function renderLocations(snapshot: ValidationSnapshot, options: TailRenderOptions = {}): string {
  return renderRecords(snapshot, "LOCATION", options.ideation ? () => true : activeStatus, (payload) =>
    compactParts([
      asString(payload.label),
      asString(payload.description),
      options.ideation ? labelValue("status", payload.status) : "",
      labelValue("layout", payload.layout_relevant_now),
      labelValue("routes", payload.access_routes),
      labelValue("visibility/sound", payload.visibility_and_sound)
    ])
  );
}

function renderObjects(snapshot: ValidationSnapshot, options: TailRenderOptions = {}): string {
  return renderRecords(snapshot, "OBJECT", options.ideation ? () => true : activeStatus, (payload) =>
    compactParts([
      asString(payload.label),
      asString(payload.description),
      options.ideation ? labelValue("status", payload.status) : "",
      labelValue("owner", resolveRecordLabel(snapshot, payload.owner)),
      labelValue("carried by", resolveRecordLabel(snapshot, payload.carried_by)),
      labelValue("location", resolveRecordLabel(snapshot, payload.current_location)),
      labelValue("visibility", payload.visibility_to_pov),
      labelValue("affordances", payload.usable_affordances),
      labelValue("constraints", payload.constraints)
    ])
  );
}

function physicalRecordText(snapshot: ValidationSnapshot, record: ValidationRecord, payload: JsonRecord): string {
  if (record.type === "ENTITY STATUS") {
    return compactParts([
      labelValue("entity", resolveRecordLabel(snapshot, payload.entity_id)),
      labelValue("life", payload.life),
      labelValue("agency", payload.agency),
      labelValue("location", resolveRecordLabel(snapshot, payload.location)),
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

function physicalStatusLine(snapshot: ValidationSnapshot, record: ValidationRecord, payload: JsonRecord): string {
  if (record.type === "ENTITY STATUS") {
    return compactParts([
      labelValue("entity", resolveRecordLabel(snapshot, payload.entity_id)),
      labelValue("life", payload.life),
      labelValue("agency", payload.agency),
      labelValue("location", resolveRecordLabel(snapshot, payload.location)),
      labelValue("visibility", payload.visibility_to_pov),
      labelValue("activity", payload.current_activity)
    ]);
  }

  return compactParts([
    asString(payload.label),
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

function renderEntityStatuses(snapshot: ValidationSnapshot, value: unknown): string {
  if (Array.isArray(value)) {
    return value.map((item) => resolveRecordLabel(snapshot, item)).filter(Boolean).join(", ");
  }

  return renderValue(value);
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
