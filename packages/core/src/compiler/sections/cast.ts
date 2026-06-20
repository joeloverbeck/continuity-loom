import { EMPTY_STATE_CONSTANTS } from "../empty-states.js";
import { displayLabel } from "../labels.js";
import { orderCompilerRecords } from "../ordering.js";
import type { PlaceholderName } from "../placeholder-map.js";
import type { PlaceholderResolver } from "../types.js";
import type { GenerationSession } from "../../records/generation-brief.js";
import type { ValidationRecord, ValidationSnapshot } from "../../validation/snapshot.js";

type JsonRecord = Record<string, unknown>;
type ResolverMap = Partial<Record<PlaceholderName, (snapshot: ValidationSnapshot) => string>>;
interface CastRenderOptions {
  ideation?: boolean;
}

const activeDossierFieldOrder = [
  "identity",
  "voice_anchor",
  "voice_extended",
  "pressure_behavior_core",
  "body_presence_core",
  "agency_core",
  "world_pressure_core",
  "relational_charge",
  "moral_psychological_edge",
  "body_and_presence_extended",
  "perception_and_embodiment",
  "pressure_behavior_extended",
  "agency_and_planning_extended",
  "sample_utterances"
] as const;

const castResolvers: ResolverMap = {
  active_cast_voice_pressure_pins: (snapshot) => renderActiveVoicePins(snapshot),
  active_onstage_full_cast_dossiers: (snapshot) => renderActiveDossiers(snapshot),
  present_minor_cast_notes: (snapshot) => renderCompressedCastBand(snapshot, "present_minor_cast_compressed"),
  offstage_relevance_notes: (snapshot) => renderCompressedCastBand(snapshot, "offstage_relevant_cast")
};

export const CAST_PLACEHOLDER_RESOLVERS: Readonly<Partial<Record<PlaceholderName, PlaceholderResolver>>> =
  Object.freeze(
    Object.fromEntries(
      Object.entries(castResolvers).map(([placeholder, resolve]) => [
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

export function renderCastPlaceholder(
  placeholder: PlaceholderName,
  snapshot: ValidationSnapshot,
  options: CastRenderOptions = {}
): string | undefined {
  switch (placeholder) {
    case "present_minor_cast_notes":
      return renderCompressedCastBand(snapshot, "present_minor_cast_compressed", options);
    case "offstage_relevance_notes":
      return renderCompressedCastBand(snapshot, "offstage_relevant_cast", options);
    case "active_cast_voice_pressure_pins":
      return renderActiveVoicePins(snapshot);
    case "active_onstage_full_cast_dossiers":
      return renderActiveDossiers(snapshot);
    default:
      return undefined;
  }
}

function renderActiveVoicePins(snapshot: ValidationSnapshot): string {
  const lines = activeCastRecords(snapshot)
    .map((record) => {
      const payload = payloadOf(record);
      const parts = [
        displayLabel(record),
        labelValue("local function", record.localFunction),
        labelValue("voice anchor", nestedString(payload.voice_anchor, "core_voice")),
        ...currentVoicePressureLines(snapshot.generationSession, record.id),
        ...overrideLines(snapshot.generationSession, record.id, "active_onstage_cast_full")
      ];

      return compactParts(parts);
    })
    .filter(Boolean)
    .map((line) => `- ${line}`);

  return lines.join("\n") || EMPTY_STATE_CONSTANTS.active_cast_voice_pressure_pins;
}

function renderActiveDossiers(snapshot: ValidationSnapshot): string {
  const dossiers = activeCastRecords(snapshot)
    .map((record) => renderDossier(record, snapshot.generationSession))
    .filter(Boolean);

  return dossiers.join("\n\n") || EMPTY_STATE_CONSTANTS.active_onstage_full_cast_dossiers;
}

function renderCompressedCastBand(
  snapshot: ValidationSnapshot,
  castBand: "present_minor_cast_compressed" | "offstage_relevant_cast",
  options: CastRenderOptions = {}
): string {
  const records = orderCompilerRecords(snapshot.records).filter((record) => record.castBand === castBand);
  const lines = records
    .map((record) => {
      const payload = payloadOf(record);
      const currentPressure =
        castBand === "present_minor_cast_compressed" && !options.ideation
          ? currentVoicePressureLines(snapshot.generationSession, record.id)
          : [];
      return compactParts([
        nestedString(payload.identity, "one_line"),
        labelValue("voice", nestedString(payload.voice_anchor, "core_voice")),
        ...currentPressure,
        ...overrideLines(snapshot.generationSession, record.id, castBand)
      ]);
    })
    .filter(Boolean)
    .map((line) => `- ${line}`);

  const emptyState =
    castBand === "present_minor_cast_compressed"
      ? EMPTY_STATE_CONSTANTS.present_minor_cast_notes
      : EMPTY_STATE_CONSTANTS.offstage_relevance_notes;

  return lines.join("\n") || emptyState;
}

function activeCastRecords(snapshot: ValidationSnapshot): readonly ValidationRecord[] {
  return orderCompilerRecords(snapshot.records).filter((record) => record.castBand === "active_onstage_cast_full");
}

function renderDossier(record: ValidationRecord, generationSession: GenerationSession): string {
  const payload = payloadOf(record);
  const renderedFields = activeDossierFieldOrder
    .map((field) => renderDossierField(field, payload[field]))
    .filter(Boolean);
  const overrides = overrideLines(generationSession, record.id, "active_onstage_cast_full");

  if (overrides.length > 0) {
    renderedFields.push(["Current generation voice override:", ...overrides.map((line) => `  ${line}`)].join("\n"));
  }

  return [`## ${displayLabel(record)}`, ...renderedFields].join("\n");
}

function renderDossierField(field: string, value: unknown): string {
  if (field === "sample_utterances") {
    return renderSamples(value);
  }

  const rendered = renderValue(value, 1);
  return rendered ? `${field}:\n${rendered}` : "";
}

function renderSamples(value: unknown): string {
  if (!Array.isArray(value) || value.length === 0) {
    return "";
  }

  const rendered = value
    .slice(0, 3)
    .map((sample) => {
      const sampleRecord = asObject(sample);
      return compactParts([
        asString(sampleRecord.text),
        labelValue("situation", sampleRecord.situation),
        labelValue("function", sampleRecord.speech_function),
        labelValue("copy policy", sampleRecord.copy_policy),
        labelValue("pressure tags", sampleRecord.pressure_tags)
      ]);
    })
    .filter(Boolean)
    .map((line) => `  - ${line}`)
    .join("\n");

  return rendered ? `sample_utterances:\n${rendered}` : "";
}

function renderValue(value: unknown, depth: number): string {
  if (Array.isArray(value)) {
    return value.map((item) => renderValue(item, depth)).filter(Boolean).join(", ");
  }

  if (value && typeof value === "object") {
    return Object.entries(value as JsonRecord)
      .map(([key, nested]) => {
        const rendered = renderValue(nested, depth + 1);
        return rendered ? `${"  ".repeat(depth)}${key}: ${rendered}` : "";
      })
      .filter(Boolean)
      .join("\n");
  }

  return asString(value);
}

function currentVoicePressureLines(generationSession: GenerationSession, castMemberId: string): string[] {
  return generationSession.current_cast_voice_pressure
    .filter((entry) => entry.cast_member_id === castMemberId)
    .flatMap((entry) => [
      labelValue("current generation voice pressure", entry.current_voice_pressure),
      labelValue("dialogue pressure", entry.dialogue_pressure),
      labelValue("POV narration pressure", entry.pov_narration_pressure),
      labelValue("nonverbal/silence pressure", entry.nonverbal_or_silence_pressure),
      labelValue("must preserve", entry.current_must_preserve),
      labelValue("must avoid", entry.current_must_avoid)
    ])
    .filter(Boolean);
}

function overrideLines(
  generationSession: GenerationSession,
  castMemberId: string,
  castBand: "active_onstage_cast_full" | "present_minor_cast_compressed" | "offstage_relevant_cast"
): string[] {
  if (castBand === "offstage_relevant_cast") {
    return [];
  }

  return generationSession.cast_voice_overrides
    .filter((override) => override.cast_member_id === castMemberId)
    .map((override) =>
      compactParts([
        "Current generation voice override",
        labelValue("applies to", override.applies_to),
        override.override_text
      ])
    );
}

function payloadOf(record: ValidationRecord): JsonRecord {
  return record.payload && typeof record.payload === "object" ? (record.payload as JsonRecord) : {};
}

function asObject(value: unknown): JsonRecord {
  return value && typeof value === "object" ? (value as JsonRecord) : {};
}

function nestedString(value: unknown, key: string): string {
  return asString(asObject(value)[key]);
}

function compactParts(parts: readonly string[]): string {
  return parts.filter(Boolean).join("; ");
}

function labelValue(label: string, value: unknown): string {
  const rendered = renderValue(value, 0);
  return rendered && rendered !== "none" ? `${label}: ${rendered}` : "";
}

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}
