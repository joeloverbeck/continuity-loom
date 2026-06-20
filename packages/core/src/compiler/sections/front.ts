import type { ValidationRecord, ValidationSnapshot } from "../../validation/snapshot.js";
import { EMPTY_STATE_CONSTANTS } from "../empty-states.js";
import { displayLabel, resolveRecordLabel } from "../labels.js";
import type { PlaceholderName } from "../placeholder-map.js";
import type { PlaceholderResolver } from "../types.js";

type JsonRecord = Record<string, unknown>;

type ResolverMap = Partial<Record<PlaceholderName, (snapshot: ValidationSnapshot) => string>>;
export interface FrontRenderOptions {
  citationKeys?: ReadonlyMap<string, string> | undefined;
}

const frontResolvers: ResolverMap = {
  rating_label: (snapshot) => valueOrEmpty(snapshot.storyConfig.universalContentPolicy?.rating_label, "rating_label"),
  allowed_content_scope: (snapshot) =>
    valueOrEmpty(snapshot.storyConfig.universalContentPolicy?.allowed_content_scope, "allowed_content_scope"),
  tonal_handling: (snapshot) => valueOrEmpty(snapshot.storyConfig.universalContentPolicy?.tonal_handling, "tonal_handling"),
  governing_policy_note: (snapshot) =>
    valueOrEmpty(snapshot.storyConfig.universalContentPolicy?.governing_policy_note, "governing_policy_note"),
  character_bias_handling: (snapshot) =>
    valueOrEmpty(snapshot.storyConfig.universalContentPolicy?.character_bias_handling, "character_bias_handling"),

  title: (snapshot) => valueOrEmpty(snapshot.storyConfig.storyContract?.title, "title"),
  premise: (snapshot) => valueOrEmpty(snapshot.storyConfig.storyContract?.premise, "premise"),
  genre_mode: (snapshot) => valueOrEmpty(snapshot.storyConfig.storyContract?.genre_mode, "genre_mode"),
  tone: (snapshot) => valueOrEmpty(snapshot.storyConfig.storyContract?.tone, "tone"),
  content_intensity: (snapshot) =>
    valueOrEmpty(snapshot.storyConfig.storyContract?.content_intensity, "content_intensity"),
  explicitness: (snapshot) => valueOrEmpty(snapshot.storyConfig.storyContract?.explicitness, "explicitness"),
  language_register: (snapshot) =>
    valueOrEmpty(snapshot.storyConfig.storyContract?.language_register, "language_register"),
  setting_baseline: (snapshot) =>
    valueOrEmpty(snapshot.storyConfig.storyContract?.setting_baseline, "setting_baseline"),

  pov_character: (snapshot) => renderPovCharacter(snapshot),
  person: (snapshot) => valueOrEmpty(snapshot.storyConfig.proseMode?.person, "person"),
  tense: (snapshot) => valueOrEmpty(snapshot.storyConfig.proseMode?.tense, "tense"),
  psychic_distance: (snapshot) => valueOrEmpty(snapshot.storyConfig.proseMode?.psychic_distance, "psychic_distance"),
  interiority_mode: (snapshot) => valueOrEmpty(snapshot.storyConfig.proseMode?.interiority_mode, "interiority_mode"),
  dialogue_density: (snapshot) => valueOrEmpty(snapshot.storyConfig.proseMode?.dialogue_density, "dialogue_density"),
  paragraphing: (snapshot) => valueOrEmpty(snapshot.storyConfig.proseMode?.paragraphing, "paragraphing"),
  language_output: (snapshot) => valueOrEmpty(snapshot.storyConfig.proseMode?.language_output, "language_output"),
  special_style_constraints: (snapshot) =>
    valueOrEmpty(snapshot.storyConfig.proseMode?.special_style_constraints, "special_style_constraints"),

  hard_canon_bullets: (snapshot) =>
    bulletRecords(snapshot, "FACT", (payload) => payload.fact_kind === "hard_canon", (payload) =>
      asString(payload.statement)
    ).join("\n") || EMPTY_STATE_CONSTANTS.hard_canon_bullets,

  current_time: (snapshot) =>
    valueOrEmpty(snapshot.generationSession.current_authoritative_state?.current_time, "current_time"),
  current_location: (snapshot) =>
    valueOrEmpty(
      resolveRecordLabel(snapshot, snapshot.generationSession.current_authoritative_state?.current_location),
      "current_location"
    ),
  onstage_entities: (snapshot) =>
    valueOrEmpty(
      renderEntityReferenceList(snapshot, snapshot.generationSession.current_authoritative_state?.onstage_entities),
      "onstage_entities"
    ),
  immediate_situation_summary: (snapshot) =>
    valueOrEmpty(
      snapshot.generationSession.current_authoritative_state?.immediate_situation_summary,
      "immediate_situation_summary"
    ),
  offstage_pressuring_entities: (snapshot) =>
    valueOrEmpty(
      renderEntityReferenceList(
        snapshot,
        snapshot.generationSession.current_authoritative_state?.offstage_pressuring_entities
      ),
      "offstage_pressuring_entities"
    ),
  positions: (snapshot) => valueOrEmpty(snapshot.generationSession.current_authoritative_state?.positions, "positions"),
  entity_statuses: (snapshot) =>
    valueOrEmpty(
      renderEntityStatuses(snapshot, snapshot.generationSession.current_authoritative_state?.entity_statuses),
      "entity_statuses"
    ),
  possessions: (snapshot) =>
    valueOrEmpty(snapshot.generationSession.current_authoritative_state?.possessions, "possessions"),
  visible_conditions: (snapshot) =>
    valueOrEmpty(snapshot.generationSession.current_authoritative_state?.visible_conditions, "visible_conditions"),
  environmental_conditions: (snapshot) =>
    valueOrEmpty(
      snapshot.generationSession.current_authoritative_state?.environmental_conditions,
      "environmental_conditions"
    ),
  line_of_sight_and_visibility: (snapshot) =>
    valueOrEmpty(
      snapshot.generationSession.current_authoritative_state?.line_of_sight_and_visibility,
      "line_of_sight_and_visibility"
    ),
  routes_and_exits: (snapshot) =>
    valueOrEmpty(snapshot.generationSession.current_authoritative_state?.routes_and_exits, "routes_and_exits"),
  available_time: (snapshot) =>
    valueOrEmpty(snapshot.generationSession.current_authoritative_state?.available_time, "available_time"),
  consent_or_force_conditions: (snapshot) =>
    valueOrEmpty(
      snapshot.generationSession.current_authoritative_state?.consent_or_force_conditions,
      "consent_or_force_conditions"
    ),
  current_locks: (snapshot) =>
    valueOrEmpty(snapshot.generationSession.current_authoritative_state?.current_locks, "current_locks"),

  recent_causal_context: (snapshot) =>
    valueOrEmpty(snapshot.generationSession.immediate_handoff?.recent_causal_context, "recent_causal_context"),
  last_visible_moment: (snapshot) =>
    valueOrEmpty(snapshot.generationSession.immediate_handoff?.last_visible_moment, "last_visible_moment"),
  begin_after: (snapshot) => valueOrEmpty(snapshot.generationSession.immediate_handoff?.begin_after, "begin_after"),

  manual_must_render: (snapshot) =>
    valueOrEmpty(snapshot.generationSession.manual_moment_directive?.must_render, "manual_must_render"),
  manual_may_render_if_naturally_caused: (snapshot) =>
    valueOrEmpty(
      snapshot.generationSession.manual_moment_directive?.may_render_if_naturally_caused,
      "manual_may_render_if_naturally_caused"
    ),
  manual_do_not_force: (snapshot) =>
    valueOrEmpty(snapshot.generationSession.manual_moment_directive?.do_not_force, "manual_do_not_force"),
  soft_unit_guidance: (snapshot) => snapshot.generationSession.stop_guidance?.soft_unit_guidance?.trim() ?? "",

  pov_knows: (snapshot) => renderPovKnows(snapshot),
  pov_believes_suspects_misreads: (snapshot) => renderPovBeliefs(snapshot),
  pov_does_not_know: (snapshot) => renderPovDoesNotKnow(snapshot),
  pov_cannot_perceive_now: (snapshot) =>
    valueOrEmpty(
      snapshot.generationSession.current_authoritative_state?.pov_cannot_perceive_now,
      "pov_cannot_perceive_now"
    ),
  audience_knows: (snapshot) => renderAudienceKnows(snapshot),
  audience_does_not_know: (snapshot) => renderAudienceDoesNotKnow(snapshot),
  dramatic_irony_permissions: (snapshot) => renderDramaticIrony(snapshot),
  audience_perception_ambiguous: (snapshot) => renderAudiencePerceptionAmbiguous(snapshot),

  writer_visible_hidden_truths: (snapshot) => renderWriterVisibleHiddenTruths(snapshot),
  secret_holders: (snapshot) =>
    bulletRecords(snapshot, "SECRET", isActiveSecret, (payload) => resolveEntityLabels(snapshot, payload.holders)).join("\n") ||
    EMPTY_STATE_CONSTANTS.secret_holders,
  secret_non_holders_to_protect: (snapshot) =>
    bulletRecords(snapshot, "SECRET", isActiveSecret, (payload) =>
      resolveEntityLabels(snapshot, payload.non_holders_to_protect)
    ).join("\n") || EMPTY_STATE_CONSTANTS.secret_non_holders_to_protect,
  allowed_clues_and_surface_cues: (snapshot) =>
    bulletRecords(snapshot, "SECRET", isActiveSecret, (payload) => listLine(allowedClueLines(payload))).join("\n") ||
    EMPTY_STATE_CONSTANTS.allowed_clues_and_surface_cues,
  forbidden_reveals: (snapshot) =>
    bulletRecords(snapshot, "SECRET", isActiveSecret, (payload) =>
      payload.forbidden_reveals === "none"
        ? "No reveals are forbidden beyond the stated reveal permission."
        : listLine(payload.forbidden_reveals)
    ).join("\n") ||
    EMPTY_STATE_CONSTANTS.forbidden_reveals,
  reveal_permissions: (snapshot) =>
    bulletRecords(snapshot, "SECRET", isActiveSecret, (payload) =>
      [asString(payload.reveal_permission), listLine(payload.reveal_triggers)].filter(Boolean).join("; triggers: ")
    ).join("\n") || EMPTY_STATE_CONSTANTS.reveal_permissions
};

export const FRONT_PLACEHOLDER_RESOLVERS: Readonly<Partial<Record<PlaceholderName, PlaceholderResolver>>> =
  Object.freeze(
    Object.fromEntries(
      Object.entries(frontResolvers).map(([placeholder, resolve]) => [
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

export function renderFrontPlaceholder(
  placeholder: PlaceholderName,
  snapshot: ValidationSnapshot,
  options: FrontRenderOptions = {}
): string | undefined {
  switch (placeholder) {
    case "writer_visible_hidden_truths":
      return renderWriterVisibleHiddenTruths(snapshot, options);
    default:
      return undefined;
  }
}

function valueOrEmpty(value: unknown, placeholder: PlaceholderName): string {
  const rendered = renderValue(value);
  return rendered || EMPTY_STATE_CONSTANTS[placeholder];
}

function renderValue(value: unknown): string {
  if (Array.isArray(value)) {
    return value.map((item) => renderValue(item)).filter(Boolean).join("\n");
  }

  if (typeof value === "string") {
    return value.trim();
  }

  return "";
}

function renderEntityReferenceList(snapshot: ValidationSnapshot, value: unknown): string {
  if (!Array.isArray(value)) {
    return "";
  }

  return value.map((item) => resolveRecordLabel(snapshot, item)).filter(Boolean).join(", ");
}

function renderEntityStatuses(snapshot: ValidationSnapshot, value: unknown): string {
  if (Array.isArray(value)) {
    return renderEntityReferenceList(snapshot, value);
  }

  return renderValue(value);
}

function renderPovCharacter(snapshot: ValidationSnapshot): string {
  const povCharacter = renderValue(snapshot.storyConfig.proseMode?.pov_character);

  if (!povCharacter) {
    return EMPTY_STATE_CONSTANTS.pov_character;
  }

  if (povCharacter === "omniscient" || povCharacter === "variable") {
    return povCharacter;
  }

  const record = snapshot.records.find((item) => item.id === povCharacter);
  return record ? displayLabel(record) : povCharacter;
}

function bulletRecords(
  snapshot: ValidationSnapshot,
  type: string,
  predicate: (payload: JsonRecord, record: ValidationRecord) => boolean,
  project: (payload: JsonRecord, record: ValidationRecord) => string
): string[] {
  return snapshot.records
    .filter((record) => record.type === type)
    .map((record) => ({ record, payload: payloadOf(record) }))
    .filter(({ record, payload }) => predicate(payload, record))
    .map(({ record, payload }) => project(payload, record))
    .filter(Boolean)
    .map((line) => `- ${line}`);
}

function payloadOf(record: ValidationRecord): JsonRecord {
  return record.payload && typeof record.payload === "object" ? (record.payload as JsonRecord) : {};
}

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function listLine(value: unknown): string {
  if (Array.isArray(value)) {
    return value.map(asString).filter(Boolean).join(", ");
  }

  return asString(value);
}

function resolveEntityLabels(snapshot: ValidationSnapshot, value: unknown): string {
  if (value === "all_except_holders") {
    return "Everyone except the secret holders";
  }

  if (value === "none") {
    return "No protected non-holders";
  }

  if (Array.isArray(value)) {
    return value
      .map((id) => resolveEntityLabel(snapshot, id))
      .filter(Boolean)
      .join(", ");
  }

  return asString(value);
}

function resolveEntityLabel(snapshot: ValidationSnapshot, value: unknown): string {
  return resolveRecordLabel(snapshot, value);
}

function allowedClueLines(payload: JsonRecord): string[] {
  const surfaceCues = Array.isArray(payload.allowed_surface_cues)
    ? payload.allowed_surface_cues.map(asString).filter(Boolean)
    : [];
  const carriers = Array.isArray(payload.clue_carriers) ? payload.clue_carriers : [];
  const availableCarrierTexts = carriers
    .map((carrier) => (carrier && typeof carrier === "object" ? (carrier as JsonRecord) : {}))
    .filter((carrier) => carrier.status === "available")
    .map((carrier) => asString(carrier.clue_text))
    .filter(Boolean);

  return [...surfaceCues, ...availableCarrierTexts];
}

function renderWriterVisibleHiddenTruth(payload: JsonRecord): string {
  const secretClaim = asString(payload.secret_claim);
  const secretKind = asString(payload.secret_kind);

  if (!secretClaim) {
    return "";
  }

  return secretKind ? `[${secretKind}] ${secretClaim}` : secretClaim;
}

function renderWriterVisibleHiddenTruths(snapshot: ValidationSnapshot, options: FrontRenderOptions = {}): string {
  return (
    bulletRecords(snapshot, "SECRET", isActiveSecret, (payload, record) =>
      keyedText(renderWriterVisibleHiddenTruth(payload), record, options)
    ).join("\n") || EMPTY_STATE_CONSTANTS.writer_visible_hidden_truths
  );
}

function keyedText(text: string, record: ValidationRecord, options: FrontRenderOptions): string {
  const key = options.citationKeys?.get(record.id);
  return key ? `${key} ${text}` : text;
}

function selectedPov(snapshot: ValidationSnapshot): string | undefined {
  const pov = snapshot.generationSession.active_working_set?.selected_pov;
  return pov && pov !== "omniscient" ? pov : undefined;
}

function isActiveSecret(payload: JsonRecord): boolean {
  return payload.status === "hidden" || payload.status === "partially_revealed";
}

function renderPovKnows(snapshot: ValidationSnapshot): string {
  const pov = selectedPov(snapshot);
  const lines = [
    ...bulletRecords(
      snapshot,
      "FACT",
      (payload) => knownBy(payload.known_by, pov),
      (payload) => asString(payload.statement)
    ),
    ...bulletRecords(
      snapshot,
      "BELIEF",
      (payload) => payload.holder === pov && payload.belief_mode === "knows",
      (payload) => asString(payload.claim)
    ),
    ...bulletRecords(
      snapshot,
      "SECRET",
      (payload) => isActiveSecret(payload) && payload.pov_access === "knows",
      (payload) => asString(payload.secret_claim)
    )
  ];

  return lines.join("\n") || EMPTY_STATE_CONSTANTS.pov_knows;
}

function renderPovBeliefs(snapshot: ValidationSnapshot): string {
  const pov = selectedPov(snapshot);
  const lines = bulletRecords(
    snapshot,
    "BELIEF",
    (payload) => payload.holder === pov && payload.belief_mode !== "knows",
    (payload) => asString(payload.claim)
  );

  return lines.join("\n") || EMPTY_STATE_CONSTANTS.pov_believes_suspects_misreads;
}

function renderPovDoesNotKnow(snapshot: ValidationSnapshot): string {
  const pov = selectedPov(snapshot);
  const lines = bulletRecords(
    snapshot,
    "SECRET",
    (payload) =>
      isActiveSecret(payload) &&
      payload.pov_access !== "knows" &&
      (!pov || protectedFrom(payload.non_holders_to_protect, pov)),
    (payload) => asString(payload.secret_claim)
  );

  return lines.join("\n") || EMPTY_STATE_CONSTANTS.pov_does_not_know;
}

function renderAudienceKnows(snapshot: ValidationSnapshot): string {
  const lines = bulletRecords(
    snapshot,
    "SECRET",
    (payload) => isActiveSecret(payload) && ["explicit", "implied"].includes(asString(payload.audience_visibility)),
    (payload) => asString(payload.secret_claim)
  );

  return lines.join("\n") || EMPTY_STATE_CONSTANTS.audience_knows;
}

function renderAudienceDoesNotKnow(snapshot: ValidationSnapshot): string {
  const lines = bulletRecords(
    snapshot,
    "SECRET",
    (payload) => isActiveSecret(payload) && payload.audience_visibility === "hidden",
    (payload) => asString(payload.secret_claim)
  );

  return lines.join("\n") || EMPTY_STATE_CONSTANTS.audience_does_not_know;
}

function renderDramaticIrony(snapshot: ValidationSnapshot): string {
  const lines = bulletRecords(
    snapshot,
    "SECRET",
    (payload) => isActiveSecret(payload) && payload.audience_visibility === "explicit" && payload.pov_access !== "knows",
    (payload) => asString(payload.secret_claim)
  );

  return lines.join("\n") || EMPTY_STATE_CONSTANTS.dramatic_irony_permissions;
}

function renderAudiencePerceptionAmbiguous(snapshot: ValidationSnapshot): string {
  const lines = bulletRecords(
    snapshot,
    "SECRET",
    (payload) => isActiveSecret(payload) && payload.audience_visibility === "ambiguous",
    (payload) => asString(payload.secret_claim)
  );

  return lines.join("\n") || EMPTY_STATE_CONSTANTS.audience_perception_ambiguous;
}

function knownBy(knownByValue: unknown, pov: string | undefined): boolean {
  if (knownByValue === "public") {
    return true;
  }

  return Boolean(pov && Array.isArray(knownByValue) && knownByValue.includes(pov));
}

function protectedFrom(nonHolders: unknown, pov: string): boolean {
  if (nonHolders === "all_except_holders") {
    return true;
  }

  return Array.isArray(nonHolders) && nonHolders.includes(pov);
}
