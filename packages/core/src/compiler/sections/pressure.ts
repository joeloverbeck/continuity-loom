import { orderCompilerRecords } from "../ordering.js";
import { EMPTY_STATE_CONSTANTS } from "../empty-states.js";
import { displayLabel, resolveRecordLabel } from "../labels.js";
import type { PlaceholderName } from "../placeholder-map.js";
import type { PlaceholderResolver } from "../types.js";
import type { ValidationRecord, ValidationSnapshot } from "../../validation/snapshot.js";

type JsonRecord = Record<string, unknown>;
type ResolverMap = Partial<Record<PlaceholderName, (snapshot: ValidationSnapshot) => string>>;
export interface PressureRenderOptions {
  citationKeys?: ReadonlyMap<string, string> | undefined;
}
type ActionPressureStatusDescriptor = {
  word: string;
  statusField: string;
  activeStatus: string;
};

const actionPressureStatusDescriptors: Readonly<Record<string, ActionPressureStatusDescriptor>> = Object.freeze({
  INTENTION: { word: "intention", statusField: "status", activeStatus: "active" },
  PLAN: { word: "plan", statusField: "plan_status", activeStatus: "active" },
  "OPEN THREAD": { word: "open thread", statusField: "status", activeStatus: "active" },
  "VISIBLE AFFORDANCE": { word: "affordance", statusField: "status", activeStatus: "available" },
  CONSEQUENCE: { word: "consequence", statusField: "status", activeStatus: "active" }
});

const pressureResolvers: ResolverMap = {
  active_action_pressure: (snapshot) =>
    renderRecords(
      snapshot,
      ["INTENTION", "PLAN", "OPEN THREAD", "VISIBLE AFFORDANCE", "CONSEQUENCE"],
      () => true,
      (payload, record) => actionPressureLine(snapshot, record, payload)
    ) || EMPTY_STATE_CONSTANTS.active_action_pressure,
  active_knowledge_pressure: (snapshot) =>
    renderRecords(
      snapshot,
      ["SECRET", "BELIEF", "FACT", "EVENT"],
      (payload, record) => isActiveKnowledgePressureRecord(record, payload),
      (payload, record) => activeKnowledgePressureLine(record, payload)
    ) || EMPTY_STATE_CONSTANTS.active_knowledge_pressure,
  relationship_emotion_pressure: (snapshot) =>
    renderRelationshipEmotionPressure(snapshot),
  material_pressure: (snapshot) =>
    pressureFromRecords(
      snapshot,
      ["LOCATION", "OBJECT", "ENTITY STATUS", "ENTITY"],
      (record, payload) =>
        record.type === "ENTITY"
          ? entityMaterialPressureLine(snapshot, record, payload)
          : firstText(payload, ["layout_relevant_now", "description", "prompt_text", "constraints", "visible_conditions"]),
      "material_pressure"
    ),
  active_intentions: (snapshot) => renderActiveIntentions(snapshot),
  active_plans: (snapshot) => renderActivePlans(snapshot),
  active_clocks: (snapshot) => renderActiveClocks(snapshot),
  active_obligations: (snapshot) => renderActiveObligations(snapshot),
  active_consequences: (snapshot) => renderActiveConsequences(snapshot),
  active_open_threads: (snapshot) => renderActiveOpenThreads(snapshot)
};

export const PRESSURE_PLACEHOLDER_RESOLVERS: Readonly<Partial<Record<PlaceholderName, PlaceholderResolver>>> =
  Object.freeze(
    Object.fromEntries(
      Object.entries(pressureResolvers).map(([placeholder, resolve]) => [
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

export function renderPressurePlaceholder(
  placeholder: PlaceholderName,
  snapshot: ValidationSnapshot,
  options: PressureRenderOptions = {}
): string | undefined {
  switch (placeholder) {
    case "relationship_emotion_pressure":
      return renderRelationshipEmotionPressure(snapshot, options);
    case "active_intentions":
      return renderActiveIntentions(snapshot, options);
    case "active_plans":
      return renderActivePlans(snapshot, options);
    case "active_clocks":
      return renderActiveClocks(snapshot, options);
    case "active_obligations":
      return renderActiveObligations(snapshot, options);
    case "active_consequences":
      return renderActiveConsequences(snapshot, options);
    case "active_open_threads":
      return renderActiveOpenThreads(snapshot, options);
    default:
      return undefined;
  }
}

function pressureFromRecords(
  snapshot: ValidationSnapshot,
  types: readonly string[],
  project: (record: ValidationRecord, payload: JsonRecord) => string,
  placeholder: PlaceholderName
): string {
  return renderRecords(
    snapshot,
    types,
    () => true,
    (payload, record) => {
      const projectedText = project(record, payload);
      return projectedText ? compactSummaryLine(displayLabel(record), projectedText) : "";
    }
  ) || EMPTY_STATE_CONSTANTS[placeholder];
}

function renderRelationshipEmotionPressure(snapshot: ValidationSnapshot, options: PressureRenderOptions = {}): string {
  return renderRecords(
    snapshot,
    ["RELATIONSHIP", "EMOTION"],
    () => true,
    (payload, record) =>
      compactSummaryLine(
        keyedLabel(displayLabel(record), record, options),
        compactParts([
          firstText(payload, ["pressure_text", "surface_expression", "description"]),
          asString(payload.current_expression)
        ])
      )
  ) || EMPTY_STATE_CONSTANTS.relationship_emotion_pressure;
}

function renderActiveIntentions(snapshot: ValidationSnapshot, options: PressureRenderOptions = {}): string {
  return renderRecords(snapshot, "INTENTION", isActiveIntention, (payload, record) =>
    compactParts([
      keyedText(asString(payload.intent), record, options),
      labelValue("holder", labelReference(snapshot, payload.holder)),
      labelValue("urgency", payload.urgency),
      asString(payload.behavioral_pressure)
    ])
  ) || EMPTY_STATE_CONSTANTS.active_intentions;
}

function renderActivePlans(snapshot: ValidationSnapshot, options: PressureRenderOptions = {}): string {
  return renderRecords(snapshot, "PLAN", isActivePlan, (payload, record) =>
    compactParts([
      keyedText(asString(payload.objective), record, options),
      labelValue("holder", labelReference(snapshot, payload.holder)),
      labelValue("current step", payload.current_step),
      labelValue("resources", payload.resources),
      labelValue("blockers", payload.blockers),
      labelValue("visibility", payload.visibility_to_pov)
    ])
  ) || EMPTY_STATE_CONSTANTS.active_plans;
}

function renderActiveClocks(snapshot: ValidationSnapshot, options: PressureRenderOptions = {}): string {
  return renderRecords(snapshot, "CLOCK", isActiveStatus, (payload, record) =>
    compactParts([
      keyedText(asString(payload.title), record, options),
      labelValue("pressure", payload.current_pressure),
      labelValue("tick trigger", payload.tick_trigger),
      labelValue("next threshold", payload.next_threshold),
      labelValue("possible effects", payload.possible_effects)
    ])
  ) || EMPTY_STATE_CONSTANTS.active_clocks;
}

function renderActiveObligations(snapshot: ValidationSnapshot, options: PressureRenderOptions = {}): string {
  return renderRecords(snapshot, "OBLIGATION", isOpenObligation, (payload, record) =>
    compactParts([
      keyedText(asString(payload.terms), record, options),
      labelValue("owed by", labelReference(snapshot, payload.owed_by)),
      labelValue("owed to", labelReference(snapshot, payload.owed_to)),
      labelValue("urgency", payload.urgency),
      labelValue("if broken", payload.consequence_if_broken)
    ])
  ) || EMPTY_STATE_CONSTANTS.active_obligations;
}

function renderActiveConsequences(snapshot: ValidationSnapshot, options: PressureRenderOptions = {}): string {
  return renderRecords(snapshot, "CONSEQUENCE", isActiveConsequence, (payload, record) =>
    compactParts([
      keyedText(asString(payload.current_effect), record, options),
      labelValue("target", labelReference(snapshot, payload.holder_or_target)),
      labelValue("cause", labelReference(snapshot, payload.cause)),
      labelValue("urgency", payload.urgency),
      labelValue("possible next effect", payload.possible_next_effect)
    ])
  ) || EMPTY_STATE_CONSTANTS.active_consequences;
}

function renderActiveOpenThreads(snapshot: ValidationSnapshot, options: PressureRenderOptions = {}): string {
  return renderRecords(snapshot, "OPEN THREAD", isActiveStatus, (payload, record) =>
    compactParts([
      keyedText(asString(payload.title), record, options),
      asString(payload.summary),
      labelValue("urgency", payload.urgency),
      labelValue("pressure now", payload.possible_pressure_now)
    ])
  ) || EMPTY_STATE_CONSTANTS.active_open_threads;
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

function actionPressureLine(snapshot: ValidationSnapshot, record: ValidationRecord, payload: JsonRecord): string {
  const line = compactSummaryLine(
    displayLabel(record) + actionPressureStatusTag(record, payload),
    firstText(payload, [
      "behavioral_pressure",
      "current_step",
      "possible_pressure_now",
      "prompt_text",
      "possible_next_effect"
    ])
  );

  if (record.type !== "INTENTION" && record.type !== "PLAN") {
    return line;
  }

  const holder = labelReference(snapshot, payload.holder);
  return holder ? `${holder}: ${line}` : line;
}

function actionPressureStatusTag(record: ValidationRecord, payload: JsonRecord): string {
  const descriptor = actionPressureStatusDescriptors[record.type];

  if (!descriptor) {
    return "";
  }

  const status = asString(payload[descriptor.statusField]);
  return status && status !== descriptor.activeStatus ? ` [${descriptor.word} ${status}]` : "";
}

function keyedLabel(label: string, record: ValidationRecord, options: PressureRenderOptions): string {
  if (record.type === "EMOTION") {
    return label;
  }

  return keyedText(label, record, options);
}

function keyedText(text: string, record: ValidationRecord, options: PressureRenderOptions): string {
  const key = options.citationKeys?.get(record.id);
  return key ? `${key} ${text}` : text;
}

function isActiveKnowledgePressureRecord(record: ValidationRecord, payload: JsonRecord): boolean {
  switch (record.type) {
    case "SECRET":
    case "BELIEF":
      return true;
    case "FACT":
      return isPressureFact(record, payload);
    case "EVENT":
      return isPressureEvent(payload);
    default:
      return false;
  }
}

function activeKnowledgePressureText(record: ValidationRecord, payload: JsonRecord): string {
  switch (record.type) {
    case "SECRET":
      return firstText(payload, ["secret_claim"]);
    case "BELIEF":
      return firstText(payload, ["behavioral_effect", "claim"]);
    case "FACT":
      return firstText(payload, ["statement"]);
    case "EVENT":
      return firstText(payload, ["description"]);
    default:
      return "";
  }
}

function activeKnowledgePressureLine(record: ValidationRecord, payload: JsonRecord): string {
  if (record.type !== "BELIEF") {
    return compactSummaryLine(displayLabel(record), activeKnowledgePressureText(record, payload));
  }

  const behavioralEffect = asString(payload.behavioral_effect);
  if (!behavioralEffect) {
    return compactSummaryLine(displayLabel(record), asString(payload.claim));
  }

  return compactParts([behavioralEffect, displayLabel(record)]);
}

function entityMaterialPressureLine(snapshot: ValidationSnapshot, record: ValidationRecord, payload: JsonRecord): string {
  if (!shouldRenderEntityMaterialPressure(snapshot, record, payload)) {
    return "";
  }

  return compactSummaryLine(
    `${displayLabel(record)} - ${humanizeEntityKind(asString(payload.entity_kind))}`,
    asString(payload.short_description)
  );
}

function shouldRenderEntityMaterialPressure(
  snapshot: ValidationSnapshot,
  record: ValidationRecord,
  payload: JsonRecord
): boolean {
  const entityKind = asString(payload.entity_kind);
  if (!entityKind || !asString(payload.short_description)) {
    return false;
  }

  return entityKind !== "person" && !snapshot.records.some(
    (candidate) =>
      candidate.type === "CAST MEMBER" &&
      candidate.castBand === "active_onstage_cast_full" &&
      payloadOf(candidate).entity_id === record.id
  );
}

function humanizeEntityKind(value: string): string {
  return value.split("_").filter(Boolean).join(" ");
}

function isPressureFact(record: ValidationRecord, payload: JsonRecord): boolean {
  const factKind = asString(payload.fact_kind);
  const scope = asString(payload.scope);
  const salience = asString(payload.salience) || asString(record.metadata?.salience);

  return (
    factKind === "hard_canon" ||
    factKind === "current_state" ||
    scope === "current_segment" ||
    salience === "high" ||
    salience === "critical"
  );
}

function isPressureEvent(payload: JsonRecord): boolean {
  const eventKind = asString(payload.event_kind);
  const currentRelevance = asString(payload.current_relevance);

  if ((eventKind === "immediate_previous" || eventKind === "recent_causal") && currentRelevance !== "none") {
    return true;
  }

  return eventKind === "offstage" && (currentRelevance === "high" || currentRelevance === "critical");
}

function firstText(payload: JsonRecord, keys: readonly string[]): string {
  for (const key of keys) {
    const rendered = renderValue(payload[key]);

    if (rendered) {
      return rendered;
    }
  }

  return "";
}

function renderValue(value: unknown): string {
  if (Array.isArray(value)) {
    return value.map(renderValue).filter(Boolean).join(", ");
  }

  return asString(value);
}

function labelReference(snapshot: ValidationSnapshot, value: unknown): string {
  if (Array.isArray(value)) {
    return value.map((item) => labelReference(snapshot, item)).filter(Boolean).join(", ");
  }

  return resolveRecordLabel(snapshot, value);
}

function compactParts(parts: readonly string[]): string {
  return parts.filter(Boolean).join("; ");
}

function compactSummaryLine(label: string, projectedText: string): string {
  return compactParts(label === projectedText ? [label] : [label, projectedText]);
}

function labelValue(label: string, value: unknown): string {
  const rendered = renderValue(value);
  return rendered ? `${label}: ${rendered}` : "";
}

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function isActiveIntention(payload: JsonRecord): boolean {
  return payload.status === "active";
}

function isActivePlan(payload: JsonRecord): boolean {
  return payload.plan_status === "active";
}

function isActiveStatus(payload: JsonRecord): boolean {
  return payload.status === "active";
}

function isOpenObligation(payload: JsonRecord): boolean {
  return payload.status === "open" || payload.status === "escalated";
}

function isActiveConsequence(payload: JsonRecord): boolean {
  return payload.status === "active" || payload.status === "pending" || payload.status === "escalated";
}
