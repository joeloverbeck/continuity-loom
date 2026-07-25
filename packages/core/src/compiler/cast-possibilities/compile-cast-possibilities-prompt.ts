import type { ValidationRecord, ValidationSnapshot } from "../../validation/snapshot.js";
import { escapeDataText } from "../escaping.js";
import { estimatePromptTokens, fingerprintPrompt } from "../fingerprint.js";
import { displayLabel, resolveRecordLabelStrict } from "../labels.js";
import { renderActiveDossier, renderActiveVoicePressurePin } from "../sections/cast.js";
import {
  castPossibilitiesOutputJsonSchema,
  type CastPossibilitiesOutputGuidance
} from "./output-schema.js";
import {
  CAST_POSSIBILITIES_OUTPUT_CONTRACT,
  CAST_POSSIBILITIES_SOURCE_PROFILE,
  castPossibilitiesVersionInfo,
  type CastPossibilitiesCharacterDisclosure,
  type CastPossibilitiesCompileRequest,
  type CastPossibilitiesCompileResult,
  type CastPossibilitiesReadinessBlocker
} from "./types.js";

type JsonRecord = Record<string, unknown>;

const requiredMomentFields = [
  ["current_time", "cast-possibilities-current-time-required", "Saved current time is required."],
  ["current_location", "cast-possibilities-current-location-required", "Saved current location is required."],
  ["immediate_situation_summary", "cast-possibilities-immediate-situation-required", "A saved immediate situation is required."]
] as const;

export function compileCastPossibilitiesPrompt(
  snapshot: ValidationSnapshot,
  request: CastPossibilitiesCompileRequest
): CastPossibilitiesCompileResult {
  const blockers = readinessBlockers(snapshot);
  const allCharacters = eligibleCharacters(snapshot);
  if (allCharacters.length === 0) {
    blockers.push({
      code: "cast-possibilities-no-eligible-character",
      message: "Select at least one non-POV active/full character with a valid linked dossier."
    });
  }
  if (blockers.length > 0) {
    return { ok: false, kind: "cast-possibilities-not-ready", blockers, warnings: [] };
  }

  const targetCharacters = request.targetCharacterId
    ? allCharacters.filter((character) => character.castMemberId === request.targetCharacterId)
    : allCharacters;
  if (request.targetCharacterId && targetCharacters.length !== 1) {
    return {
      ok: false,
      kind: "cast-possibilities-not-ready",
      blockers: [{
        code: "cast-possibilities-target-invalid",
        message: "The regeneration target is not an eligible character."
      }],
      warnings: []
    };
  }

  const citationMap = buildCitationMap(snapshot, targetCharacters);
  const contextKeys = Object.keys(citationMap).filter((key) => !key.startsWith("[DOSSIER-"));
  const parseContext = {
    expectedCharacters: targetCharacters.map((character) => ({
      characterKey: character.characterKey,
      dossierKeys: character.dossierKeys
    })),
    contextKeys
  };
  const outputGuidance = buildOutputGuidance(snapshot);
  const outputSchema = castPossibilitiesOutputJsonSchema(parseContext, outputGuidance);
  const prompt = renderPrompt(
    snapshot,
    request,
    targetCharacters,
    citationMap,
    outputSchema,
    outputGuidance
  );
  const fingerprint = fingerprintPrompt(prompt);
  const recordCountsByType = countRecords(snapshot.records);
  const disclosure = {
    sourceProfile: CAST_POSSIBILITIES_SOURCE_PROFILE,
    savedDraftIdentity: request.savedDraftIdentity,
    selectedPov: resolveSelectedPov(snapshot),
    eligibleCharacters: targetCharacters,
    recordCountsByType,
    includesSecrets: (recordCountsByType.SECRET ?? 0) > 0,
    promptLength: prompt.length,
    tokenEstimate: estimatePromptTokens(prompt),
    versions: castPossibilitiesVersionInfo,
    fingerprint,
    citationMap
  } as const;
  return {
    ok: true,
    prompt,
    disclosure,
    outputSchema,
    parseContext,
    snapshot
  };
}

function readinessBlockers(snapshot: ValidationSnapshot): CastPossibilitiesReadinessBlocker[] {
  const blockers: CastPossibilitiesReadinessBlocker[] = [];
  const workingSet = snapshot.generationSession.active_working_set;
  blockers.push(...selectedRecordIntegrityBlockers(snapshot));
  blockers.push(...activeCastIntegrityBlockers(snapshot));
  if (!workingSet?.selected_pov || workingSet.selected_pov === "omniscient") {
    blockers.push({
      code: "cast-possibilities-pov-required",
      message: "Cast Possibilities requires a resolved character POV.",
      field: "active_working_set.selected_pov"
    });
  } else {
    const selected = snapshot.records.find((record) => record.id === workingSet.selected_pov);
    const linkedEntityId = selected?.type === "CAST MEMBER"
      ? objectOf(selected.payload).entity_id
      : undefined;
    const resolvedEntity = selected?.type === "ENTITY"
      ? selected
      : typeof linkedEntityId === "string"
        ? snapshot.records.find((record) => record.id === linkedEntityId && record.type === "ENTITY")
        : undefined;
    if (!resolvedEntity) {
      blockers.push({
        code: "cast-possibilities-pov-required",
        message: "The saved POV must resolve to a selected character record.",
        field: "active_working_set.selected_pov"
      });
    }
  }

  const state = objectOf(snapshot.generationSession.current_authoritative_state);
  for (const [field, code, message] of requiredMomentFields) {
    if (!hasValue(state[field])) {
      blockers.push({ code, message, field: `current_authoritative_state.${field}` });
    }
  }
  if (!Array.isArray(state.onstage_entities) || state.onstage_entities.length === 0) {
    blockers.push({
      code: "cast-possibilities-onstage-entities-required",
      message: "Saved onstage entities are required.",
      field: "current_authoritative_state.onstage_entities"
    });
  }
  return blockers;
}

function selectedRecordIntegrityBlockers(
  snapshot: ValidationSnapshot
): CastPossibilitiesReadinessBlocker[] {
  const selectedIds = snapshot.generationSession.active_working_set?.selected_records ?? [];
  const selectedCounts = occurrenceCounts(selectedIds);
  const recordCounts = occurrenceCounts(snapshot.records.map((record) => record.id));
  const invalidIds = new Set<string>();

  for (const [id, count] of selectedCounts) {
    if (count !== 1 || recordCounts.get(id) !== 1) {
      invalidIds.add(id);
    }
  }
  for (const record of snapshot.records) {
    if (
      selectedCounts.get(record.id) !== 1 ||
      recordCounts.get(record.id) !== 1
    ) {
      invalidIds.add(record.id);
    }
  }

  return invalidIds.size === 0
    ? []
    : [{
        code: "cast-possibilities-selected-record-integrity",
        message: `Every selected record must resolve exactly once, with no unselected records in the compiled snapshot. Invalid id(s): ${[...invalidIds].sort().join(", ")}.`,
        field: "active_working_set.selected_records"
      }];
}

function activeCastIntegrityBlockers(
  snapshot: ValidationSnapshot
): CastPossibilitiesReadinessBlocker[] {
  const entries = snapshot.generationSession.active_working_set?.active_onstage_cast_full ?? [];
  const counts = occurrenceCounts(entries.map((entry) => entry.cast_member_id));
  const byId = new Map(snapshot.records.map((record) => [record.id, record]));
  const selectedIds = new Set(snapshot.generationSession.active_working_set?.selected_records ?? []);
  const blockers: CastPossibilitiesReadinessBlocker[] = [];

  const duplicateIds = [...counts]
    .filter(([, count]) => count !== 1)
    .map(([id]) => id)
    .sort();
  if (duplicateIds.length > 0) {
    blockers.push({
      code: "cast-possibilities-active-cast-duplicate",
      message: `Active/full cast entries must be unique. Duplicate id(s): ${duplicateIds.join(", ")}.`,
      field: "active_working_set.active_onstage_cast_full"
    });
  }

  const invalidIds = new Set<string>();
  for (const entry of entries) {
    const record = byId.get(entry.cast_member_id);
    const entityId = record?.type === "CAST MEMBER"
      ? objectOf(record.payload).entity_id
      : undefined;
    const entity = typeof entityId === "string" ? byId.get(entityId) : undefined;
    if (
      !selectedIds.has(entry.cast_member_id) ||
      !record ||
      record.type !== "CAST MEMBER" ||
      typeof entityId !== "string" ||
      !entityId.trim() ||
      !selectedIds.has(entityId) ||
      entity?.type !== "ENTITY"
    ) {
      invalidIds.add(entry.cast_member_id);
    }
  }
  if (invalidIds.size > 0) {
    blockers.push({
      code: "cast-possibilities-active-cast-invalid",
      message: `Every active/full cast entry must resolve to one selected CAST MEMBER and selected linked ENTITY. Invalid id(s): ${[...invalidIds].sort().join(", ")}.`,
      field: "active_working_set.active_onstage_cast_full"
    });
  }

  return blockers;
}

function occurrenceCounts(values: readonly string[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return counts;
}

function eligibleCharacters(snapshot: ValidationSnapshot): CastPossibilitiesCharacterDisclosure[] {
  const workingSet = snapshot.generationSession.active_working_set;
  const selectedPov = workingSet?.selected_pov;
  const byId = new Map(snapshot.records.map((record) => [record.id, record]));

  return (workingSet?.active_onstage_cast_full ?? []).flatMap((entry) => {
    const record = byId.get(entry.cast_member_id);
    if (!record || record.type !== "CAST MEMBER") {
      return [];
    }
    const payload = objectOf(record.payload);
    const entityId = typeof payload.entity_id === "string" ? payload.entity_id : "";
    const entity = byId.get(entityId);
    if (!entityId || entityId === selectedPov || record.id === selectedPov || entity?.type !== "ENTITY") {
      return [];
    }
    return [{
      castMemberId: record.id,
      entityId,
      label: resolveRecordLabelStrict(snapshot, entityId)
    }];
  }).map((character, index) => ({
    ...character,
    characterKey: `[CHARACTER-${index + 1}]`,
    dossierKeys: [`[DOSSIER-${index + 1}]`]
  }));
}

function resolveSelectedPov(snapshot: ValidationSnapshot): { entityId: string; label: string } {
  const selectedPov = snapshot.generationSession.active_working_set?.selected_pov;
  if (!selectedPov || selectedPov === "omniscient") {
    throw new Error("Cast Possibilities requires a resolved POV.");
  }
  const selected = snapshot.records.find((record) => record.id === selectedPov);
  const linkedEntityId = selected?.type === "CAST MEMBER"
    ? objectOf(selected.payload).entity_id
    : undefined;
  const entityId = typeof linkedEntityId === "string" ? linkedEntityId : selectedPov;
  return { entityId, label: resolveRecordLabelStrict(snapshot, entityId) };
}

function buildCitationMap(
  snapshot: ValidationSnapshot,
  characters: readonly CastPossibilitiesCharacterDisclosure[]
): Record<string, string> {
  const map: Record<string, string> = {};
  for (const [field] of requiredMomentFields) {
    map[`[BRIEF-${field}]`] = `Generation Brief ${field}`;
  }
  map["[BRIEF-onstage_entities]"] = "Generation Brief onstage entities";

  const ordinals = new Map<string, number>();
  for (const record of snapshot.records) {
    const ordinal = (ordinals.get(record.type) ?? 0) + 1;
    ordinals.set(record.type, ordinal);
    map[`[${citationType(record.type)}-${ordinal}]`] = `${record.type}: ${displayLabel(record)}`;
  }
  for (const character of characters) {
    map[character.dossierKeys[0]!] = `Complete dossier for ${character.label}`;
  }
  return map;
}

function renderPrompt(
  snapshot: ValidationSnapshot,
  request: CastPossibilitiesCompileRequest,
  characters: readonly CastPossibilitiesCharacterDisclosure[],
  citationMap: Readonly<Record<string, string>>,
  outputSchema: Readonly<Record<string, unknown>>,
  outputGuidance: CastPossibilitiesOutputGuidance
): string {
  const session = snapshot.generationSession;
  const state = objectOf(session.current_authoritative_state);
  const dossierBlocks = characters.map((character) => {
    const record = snapshot.records.find((candidate) => candidate.id === character.castMemberId);
    if (!record) {
      throw new Error("Eligible dossier disappeared during compilation.");
    }
    return [
      `<cast_dossier character_key="${character.characterKey}" evidence_key="${character.dossierKeys[0]}">`,
      `Voice pressure pin: ${renderActiveVoicePressurePin(snapshot, record)}`,
      renderActiveDossier(snapshot, record),
      "</cast_dossier>"
    ].join("\n");
  });
  const recordBlocks = renderSelectedRecords(snapshot.records);
  const avoidList = (request.avoidList ?? []).map((value) => escapeDataText(value.trim())).filter(Boolean);

  return [
    "# Cast Possibilities Prompt",
    "",
    "<cast_possibilities_role>",
    "Explore how every listed non-POV active character might observably act in this saved local moment.",
    "Return premise-level possibilities only. Do not write scene prose, drafted dialogue, branches, plans, or future sequences.",
    "The cards are disposable non-canonical scratch and never update records, the Generation Brief, or prose.",
    "</cast_possibilities_role>",
    "",
    "<source_contract>",
    `Source profile: ${CAST_POSSIBILITIES_SOURCE_PROFILE}`,
    `Output contract: ${CAST_POSSIBILITIES_OUTPUT_CONTRACT}`,
    `Saved draft identity: ${escapeDataText(request.savedDraftIdentity)}`,
    "Use every rendered selected record completely. Do not rank, summarize, trim, batch, or omit source.",
    "</source_contract>",
    "",
    "<story_configuration>",
    canonicalData(snapshot.storyConfig),
    "</story_configuration>",
    "",
    "<saved_local_moment>",
    `Current time: ${escapeDataText(textOf(state.current_time))} [BRIEF-current_time]`,
    `Current location: ${escapeDataText(textOf(state.current_location))} [BRIEF-current_location]`,
    `Onstage entities: ${canonicalData(state.onstage_entities)} [BRIEF-onstage_entities]`,
    `Immediate situation: ${escapeDataText(textOf(state.immediate_situation_summary))} [BRIEF-immediate_situation_summary]`,
    `Immediate handoff: ${canonicalData(session.immediate_handoff)}`,
    `Manual directive: ${canonicalData(session.manual_moment_directive)}`,
    `Current cast voice pressure: ${canonicalData(session.current_cast_voice_pressure)}`,
    `Cast voice overrides: ${canonicalData(session.cast_voice_overrides)}`,
    `Stop guidance: ${canonicalData(session.stop_guidance)}`,
    "</saved_local_moment>",
    "",
    "<selected_record_context>",
    recordBlocks,
    "</selected_record_context>",
    "",
    "<eligible_cast_dossiers>",
    dossierBlocks.join("\n\n"),
    "</eligible_cast_dossiers>",
    "",
    "<expected_character_order>",
    ...characters.map((character, index) =>
      `${index + 1}. character_key=${canonicalData(character.characterKey)} label=${canonicalData(character.label)} dossier_keys=${canonicalData(character.dossierKeys)}`
    ),
    "</expected_character_order>",
    ...(avoidList.length > 0 ? [
      "",
      "<target_character_avoid_list>",
      ...avoidList.map((value) => `- ${value}`),
      "</target_character_avoid_list>"
    ] : []),
    "",
    "<citation_legend>",
    ...Object.entries(citationMap).map(([key, label]) => `${key} ${escapeDataText(label)}`),
    "</citation_legend>",
    "",
    "<card_constraints>",
    `Saved immediate situation: ${canonicalData(outputGuidance.immediateSituation)}`,
    `Every card must render: ${canonicalData(outputGuidance.mustRender)}`,
    `May render only if naturally caused: ${canonicalData(outputGuidance.mayRenderIfNaturallyCaused)}`,
    `Every card must not force: ${canonicalData(outputGuidance.doNotForce)}`,
    "</card_constraints>",
    "",
    "<output_instructions>",
    "Return every eligible character exactly once in the listed order and exactly three cards per character.",
    "Copy each listed character_key exactly, including brackets, into the corresponding output object. Do not substitute a character name, record ID, dossier key, or other label.",
    "For each character, copy dossier_keys only from that character's listed dossier_keys. Copy context_keys only from non-dossier keys in the citation legend. Do not substitute labels, record IDs, or keys from another character.",
    "Each card needs one character-owned dossier key, one saved-brief or selected-record context key, and nonblank observable_move, character_fit, moment_fit, local_effect, and distinction.",
    "Treat the saved local moment as binding source constraints for every card, not optional inspiration.",
    "Every card must satisfy the saved immediate situation and every nonblank manual_moment_directive.must_render item.",
    "Never violate a manual_moment_directive.do_not_force item. Use a manual_moment_directive.may_render_if_naturally_caused item only when the saved source naturally causes it.",
    "Summarize any speech act without quoting or drafting the character's exact words.",
    "Diversify observable channels when evidence permits. Cards are independent and are not guaranteed to be mutually compatible.",
    canonicalData(outputSchema),
    "</output_instructions>"
  ].join("\n");
}

function buildOutputGuidance(snapshot: ValidationSnapshot): CastPossibilitiesOutputGuidance {
  const session = snapshot.generationSession;
  const state = objectOf(session.current_authoritative_state);
  const directive = session.manual_moment_directive;
  return {
    immediateSituation: textOf(state.immediate_situation_summary),
    mustRender: directive?.must_render ?? [],
    mayRenderIfNaturallyCaused: directive?.may_render_if_naturally_caused ?? [],
    doNotForce: directive?.do_not_force ?? []
  };
}

function renderSelectedRecords(records: readonly ValidationRecord[]): string {
  const ordinals = new Map<string, number>();
  return records.map((record) => {
    const ordinal = (ordinals.get(record.type) ?? 0) + 1;
    ordinals.set(record.type, ordinal);
    const key = `[${citationType(record.type)}-${ordinal}]`;
    return [
      `<selected_record key="${key}" type="${escapeDataText(record.type)}">`,
      canonicalData(record.payload),
      "</selected_record>"
    ].join("\n");
  }).join("\n\n");
}

function canonicalData(value: unknown): string {
  return escapeDataText(JSON.stringify(value ?? null));
}

function countRecords(records: readonly ValidationRecord[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const record of records) {
    counts[record.type] = (counts[record.type] ?? 0) + 1;
  }
  return Object.fromEntries(Object.entries(counts).sort(([left], [right]) => left.localeCompare(right)));
}

function citationType(type: string): string {
  return type.replace(/[^A-Z0-9]+/gi, "_").toUpperCase();
}

function objectOf(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as JsonRecord
    : {};
}

function hasValue(value: unknown): boolean {
  if (typeof value === "string") {
    return value.trim().length > 0;
  }
  return value !== undefined && value !== null;
}

function textOf(value: unknown): string {
  return typeof value === "string" ? value : "";
}
