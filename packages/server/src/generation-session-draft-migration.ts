import {
  deriveGenerationContextDefault,
  EMPTY_STATE_CONSTANTS,
  generationSessionDraftSchema,
  type GenerationSessionDraft
} from "@loom/core";
import type { DatabaseSync } from "node:sqlite";

const FABRICATED_DIRECTIVE = "Continue the immediate moment.";
const REMOVED_ACTIVE_WORKING_SET_MANUAL_DIRECTIVE_KEY = "manual" + "_directive_id";

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
    if (key === "cast_member_id" || key === "local_function") {
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

  const original = generationSessionDraftSchema.parse(
    stripLegacyManualDirectiveId(JSON.parse(row.payload_json) as unknown)
  );
  const migrated = removeEmptyCastPressureRows(
    backfillImmediateSituationSummary(
      backfillGenerationContext(
        stripFabricatedDirective(original),
        acceptedSegmentCount(database)
      )
    )
  );

  const nextJson = canonicalJson(migrated);
  if (nextJson === row.payload_json) {
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
