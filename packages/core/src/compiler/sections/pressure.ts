import { orderCompilerRecords } from "../ordering.js";
import { EMPTY_STATE_CONSTANTS } from "../empty-states.js";
import { displayLabel, resolveRecordLabel } from "../labels.js";
import type { PlaceholderName } from "../placeholder-map.js";
import type { PlaceholderResolver } from "../types.js";
import type { ValidationRecord, ValidationSnapshot } from "../../validation/snapshot.js";

type JsonRecord = Record<string, unknown>;
type ResolverMap = Partial<Record<PlaceholderName, (snapshot: ValidationSnapshot) => string>>;

const pressureResolvers: ResolverMap = {
  active_action_pressure: (snapshot) =>
    renderRecords(
      snapshot,
      ["INTENTION", "PLAN", "OPEN THREAD", "VISIBLE AFFORDANCE"],
      () => true,
      (payload, record) => actionPressureLine(snapshot, record, payload)
    ) || EMPTY_STATE_CONSTANTS.active_action_pressure,
  active_knowledge_pressure: (snapshot) =>
    pressureFromRecords(
      snapshot,
      ["SECRET", "BELIEF", "FACT", "EVENT"],
      (record, payload) => firstText(payload, ["secret_claim", "claim", "statement", "description"]),
      "active_knowledge_pressure"
    ),
  relationship_emotion_pressure: (snapshot) =>
    pressureFromRecords(
      snapshot,
      ["RELATIONSHIP", "EMOTION"],
      (record, payload) => firstText(payload, ["pressure_text", "surface_expression", "description"]),
      "relationship_emotion_pressure"
    ),
  material_pressure: (snapshot) =>
    pressureFromRecords(
      snapshot,
      ["LOCATION", "OBJECT", "VISIBLE AFFORDANCE", "ENTITY STATUS"],
      (record, payload) =>
        firstText(payload, ["layout_relevant_now", "description", "prompt_text", "constraints", "visible_conditions"]),
      "material_pressure"
    ),
  voice_pressure: (snapshot) => {
    const lines = snapshot.generationSession.current_cast_voice_pressure
      .map((entry) => entry.current_voice_pressure.trim())
      .filter(Boolean)
      .map((line) => `- ${line}`);

    return lines.join("\n") || EMPTY_STATE_CONSTANTS.voice_pressure;
  },
  active_intentions: (snapshot) =>
    renderRecords(snapshot, "INTENTION", isActiveIntention, (payload) =>
      compactParts([
        asString(payload.intent),
        labelValue("holder", labelReference(snapshot, payload.holder)),
        labelValue("urgency", payload.urgency),
        asString(payload.behavioral_pressure)
      ])
    ) || EMPTY_STATE_CONSTANTS.active_intentions,
  active_plans: (snapshot) =>
    renderRecords(snapshot, "PLAN", isActivePlan, (payload) =>
      compactParts([
        asString(payload.objective),
        labelValue("holder", labelReference(snapshot, payload.holder)),
        labelValue("current step", payload.current_step),
        labelValue("resources", payload.resources),
        labelValue("blockers", payload.blockers),
        labelValue("visibility", payload.visibility_to_pov)
      ])
    ) || EMPTY_STATE_CONSTANTS.active_plans,
  active_clocks: (snapshot) =>
    renderRecords(snapshot, "CLOCK", isActiveStatus, (payload) =>
      compactParts([
        asString(payload.title),
        labelValue("pressure", payload.current_pressure),
        labelValue("tick trigger", payload.tick_trigger),
        labelValue("next threshold", payload.next_threshold),
        labelValue("possible effects", payload.possible_effects)
      ])
    ) || EMPTY_STATE_CONSTANTS.active_clocks,
  active_obligations: (snapshot) =>
    renderRecords(snapshot, "OBLIGATION", isOpenObligation, (payload) =>
      compactParts([
        asString(payload.terms),
        labelValue("owed by", labelReference(snapshot, payload.owed_by)),
        labelValue("owed to", labelReference(snapshot, payload.owed_to)),
        labelValue("urgency", payload.urgency),
        labelValue("if broken", payload.consequence_if_broken)
      ])
    ) || EMPTY_STATE_CONSTANTS.active_obligations,
  active_consequences: (snapshot) =>
    renderRecords(snapshot, "CONSEQUENCE", isActiveConsequence, (payload) =>
      compactParts([
        asString(payload.current_effect),
        labelValue("target", labelReference(snapshot, payload.holder_or_target)),
        labelValue("cause", labelReference(snapshot, payload.cause)),
        labelValue("urgency", payload.urgency),
        labelValue("possible next effect", payload.possible_next_effect)
      ])
    ) || EMPTY_STATE_CONSTANTS.active_consequences,
  active_open_threads: (snapshot) =>
    renderRecords(snapshot, "OPEN THREAD", isActiveStatus, (payload) =>
      compactParts([
        asString(payload.title),
        asString(payload.summary),
        labelValue("urgency", payload.urgency),
        labelValue("pressure now", payload.possible_pressure_now)
      ])
    ) || EMPTY_STATE_CONSTANTS.active_open_threads
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
    (payload, record) => compactSummaryLine(displayLabel(record), project(record, payload))
  ) || EMPTY_STATE_CONSTANTS[placeholder];
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
    displayLabel(record),
    firstText(payload, ["behavioral_pressure", "current_step", "possible_pressure_now", "prompt_text"])
  );

  if (record.type !== "INTENTION" && record.type !== "PLAN") {
    return line;
  }

  const holder = labelReference(snapshot, payload.holder);
  return holder ? `${holder}: ${line}` : line;
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
