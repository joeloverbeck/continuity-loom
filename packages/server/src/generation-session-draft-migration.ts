import {
  deriveGenerationContextDefault,
  EMPTY_STATE_CONSTANTS,
  generationSessionDraftSchema,
  type GenerationSessionDraft
} from "@loom/core";
import type { DatabaseSync } from "node:sqlite";

const FABRICATED_DIRECTIVE = "Continue the immediate moment.";
const REMOVED_ACTIVE_WORKING_SET_MANUAL_DIRECTIVE_KEY = "manual" + "_directive_id";
const REMOVED_CURRENT_CAST_PRESSURE_LOCAL_FUNCTION_KEY = "local" + "_function";
const REMOVED_CAST_VOICE_OVERRIDE_SCOPE_KEY = "scope";
const REMOVED_PRIOR_ACCEPTED_PROSE_HANDOFF_KEY = "prior" + "_accepted_prose_status_or_handoff_note";

function nowIso(): string {
  return new Date().toISOString();
}

function canonicalJson(value: unknown): string {
  return JSON.stringify(value);
}

function stripLegacyManualDirectiveId(value: unknown): unknown {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return value;
  }

  const session = value as Record<string, unknown>;
  const activeWorkingSet = session.active_working_set;
  if (activeWorkingSet === null || typeof activeWorkingSet !== "object" || Array.isArray(activeWorkingSet)) {
    return value;
  }

  const activeWorkingSetRecord = activeWorkingSet as Record<string, unknown>;
  if (!(REMOVED_ACTIVE_WORKING_SET_MANUAL_DIRECTIVE_KEY in activeWorkingSetRecord)) {
    return value;
  }

  const nextActiveWorkingSet = { ...activeWorkingSetRecord };
  delete nextActiveWorkingSet[REMOVED_ACTIVE_WORKING_SET_MANUAL_DIRECTIVE_KEY];
  return {
    ...session,
    active_working_set: nextActiveWorkingSet
  };
}

function stripLegacyCurrentCastPressureLocalFunction(value: unknown): unknown {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return value;
  }

  const session = value as Record<string, unknown>;
  const currentCastVoicePressureValue = session.current_cast_voice_pressure;
  if (!Array.isArray(currentCastVoicePressureValue)) {
    return value;
  }

  const currentCastVoicePressure: readonly unknown[] = currentCastVoicePressureValue;
  let changed = false;
  const nextCurrentCastVoicePressure = currentCastVoicePressure.map((entry): unknown => {
    if (entry === null || typeof entry !== "object" || Array.isArray(entry)) {
      return entry;
    }

    const entryRecord = entry as Record<string, unknown>;
    if (!(REMOVED_CURRENT_CAST_PRESSURE_LOCAL_FUNCTION_KEY in entryRecord)) {
      return entry;
    }

    const nextEntry = { ...entryRecord };
    delete nextEntry[REMOVED_CURRENT_CAST_PRESSURE_LOCAL_FUNCTION_KEY];
    changed = true;
    return nextEntry;
  });

  if (!changed) {
    return value;
  }

  return {
    ...session,
    current_cast_voice_pressure: nextCurrentCastVoicePressure
  };
}

function stripLegacyCastVoiceOverrideScope(value: unknown): unknown {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return value;
  }

  const session = value as Record<string, unknown>;
  const castVoiceOverridesValue = session.cast_voice_overrides;
  if (!Array.isArray(castVoiceOverridesValue)) {
    return value;
  }

  const castVoiceOverrides: readonly unknown[] = castVoiceOverridesValue;
  let changed = false;
  const nextCastVoiceOverrides = castVoiceOverrides.map((entry): unknown => {
    if (entry === null || typeof entry !== "object" || Array.isArray(entry)) {
      return entry;
    }

    const entryRecord = entry as Record<string, unknown>;
    if (!(REMOVED_CAST_VOICE_OVERRIDE_SCOPE_KEY in entryRecord)) {
      return entry;
    }

    const nextEntry = { ...entryRecord };
    delete nextEntry[REMOVED_CAST_VOICE_OVERRIDE_SCOPE_KEY];
    changed = true;
    return nextEntry;
  });

  if (!changed) {
    return value;
  }

  return {
    ...session,
    cast_voice_overrides: nextCastVoiceOverrides
  };
}

function stripLegacyPriorAcceptedProseHandoff(value: unknown): unknown {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return value;
  }

  const session = value as Record<string, unknown>;
  const immediateHandoff = session.immediate_handoff;
  if (immediateHandoff === null || typeof immediateHandoff !== "object" || Array.isArray(immediateHandoff)) {
    return value;
  }

  const handoffRecord = immediateHandoff as Record<string, unknown>;
  if (!(REMOVED_PRIOR_ACCEPTED_PROSE_HANDOFF_KEY in handoffRecord)) {
    return value;
  }

  const nextHandoff = { ...handoffRecord };
  delete nextHandoff[REMOVED_PRIOR_ACCEPTED_PROSE_HANDOFF_KEY];
  return {
    ...session,
    immediate_handoff: nextHandoff
  };
}

function acceptedSegmentCount(database: DatabaseSync): number {
  const row = database.prepare("SELECT count(*) AS count FROM accepted_segments").get() as { count: number };
  return row.count;
}

function stripFabricatedDirective(session: GenerationSessionDraft): GenerationSessionDraft {
  const directive = session.manual_moment_directive;
  const mustRender = directive?.must_render;
  if (!directive || mustRender?.length !== 1 || mustRender[0] !== FABRICATED_DIRECTIVE) {
    return session;
  }

  const nextDirective = { ...directive };
  delete nextDirective.must_render;
  const sessionWithoutDirective: GenerationSessionDraft = { ...session };
  delete sessionWithoutDirective.manual_moment_directive;

  return {
    ...sessionWithoutDirective,
    ...(Object.keys(nextDirective).length > 0 ? { manual_moment_directive: nextDirective } : {})
  };
}

function backfillGenerationContext(
  session: GenerationSessionDraft,
  count: number
): GenerationSessionDraft {
  const context = session.generation_validation_focus?.validation_focus_tags?.generation_context;
  if (context?.length) {
    return session;
  }

  return {
    ...session,
    generation_validation_focus: {
      ...session.generation_validation_focus,
      validation_focus_tags: {
        ...session.generation_validation_focus?.validation_focus_tags,
        generation_context: [deriveGenerationContextDefault(count)]
      }
    }
  };
}

function backfillImmediateSituationSummary(session: GenerationSessionDraft): GenerationSessionDraft {
  const currentState = session.current_authoritative_state;
  if (!currentState || currentState.immediate_situation_summary?.trim()) {
    return session;
  }

  return {
    ...session,
    current_authoritative_state: {
      ...currentState,
      immediate_situation_summary: EMPTY_STATE_CONSTANTS.immediate_situation_summary
    }
  };
}

function hasSemanticCastPressure(entry: NonNullable<GenerationSessionDraft["current_cast_voice_pressure"]>[number]) {
  return Object.entries(entry).some(([key, value]) => {
    if (key === "cast_member_id") {
      return false;
    }
    if (Array.isArray(value)) {
      return value.some((item) => typeof item === "string" && item.trim().length > 0);
    }
    return typeof value === "string" && value.trim().length > 0;
  });
}

function removeEmptyCastPressureRows(session: GenerationSessionDraft): GenerationSessionDraft {
  if (!session.current_cast_voice_pressure) {
    return session;
  }

  const current_cast_voice_pressure = session.current_cast_voice_pressure.filter(hasSemanticCastPressure);
  if (current_cast_voice_pressure.length === session.current_cast_voice_pressure.length) {
    return session;
  }

  const sessionWithoutCastPressure: GenerationSessionDraft = { ...session };
  delete sessionWithoutCastPressure.current_cast_voice_pressure;
  return {
    ...sessionWithoutCastPressure,
    ...(current_cast_voice_pressure.length > 0 ? { current_cast_voice_pressure } : {})
  };
}

export function migrateGenerationSessionDraft(database: DatabaseSync): void {
  const row = database.prepare("SELECT payload_json FROM generation_session WHERE id = 1").get() as
    | { payload_json: string }
    | undefined;

  if (!row) {
    return;
  }

  const rawPayload = JSON.parse(row.payload_json) as unknown;
  const strippedPayload = stripLegacyPriorAcceptedProseHandoff(
    stripLegacyCastVoiceOverrideScope(
      stripLegacyCurrentCastPressureLocalFunction(stripLegacyManualDirectiveId(rawPayload))
    )
  );
  const strippedLegacyPayload = strippedPayload !== rawPayload;
  const original = generationSessionDraftSchema.parse(strippedPayload);
  const migrated = removeEmptyCastPressureRows(
    backfillImmediateSituationSummary(
      backfillGenerationContext(
        stripFabricatedDirective(original),
        acceptedSegmentCount(database)
      )
    )
  );

  const nextJson = canonicalJson(migrated);
  if (!strippedLegacyPayload && nextJson === canonicalJson(original)) {
    return;
  }

  database.exec("BEGIN IMMEDIATE");
  try {
    database
      .prepare(
        `INSERT INTO generation_session (id, payload_json, updated_at)
         VALUES (1, ?, ?)
         ON CONFLICT(id) DO UPDATE SET payload_json = excluded.payload_json, updated_at = excluded.updated_at`
      )
      .run(nextJson, nowIso());
    database.exec("COMMIT");
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
}
