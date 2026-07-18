import {
  buildValidationSnapshot,
  deriveGenerationContextCoherence,
  versionInfo,
  type GenerationSession,
  type GenerationContext,
  type ProseMode,
  type SelectedCastBand,
  type StoryContract,
  type UniversalContentPolicy,
  type ValidationRecord,
  type ValidationSnapshot,
  type ValidationStoryConfig
} from "@loom/core";

import type { ProjectStoreManager } from "./project-store.js";
import type { RecordReadResult, RecordRepositoryRecord, StoryConfigKind } from "./record-repository.js";

const storyConfigKinds = ["STORY CONTRACT", "UNIVERSAL CONTENT POLICY", "PROSE MODE"] as const;

export type SnapshotBuildResult =
  | { ok: true; snapshot: ValidationSnapshot }
  | { ok: false; status: number; body: unknown };

function noOpenProject() {
  return { ok: false, kind: "no-open-project", message: "No project is open." };
}

function malformedDependency(message: string, details: { danglingSelectedRecordIds?: readonly string[] } = {}) {
  return {
    ok: false,
    kind: "malformed-validation-source",
    message,
    ...("danglingSelectedRecordIds" in details
      ? {
          danglingSelectedRecordIds: details.danglingSelectedRecordIds,
          suggestedAction: "Remove these ids from the active working set."
        }
      : {})
  };
}

export function buildSnapshotFromOpenProject(manager: ProjectStoreManager): SnapshotBuildResult {
  const repository = manager.getRecordRepository();

  if (!repository) {
    return { ok: false, status: 409, body: noOpenProject() };
  }

  const sessionResult = repository.getGenerationSession();
  if (!sessionResult.ok && sessionResult.kind !== "not-found") {
    return { ok: false, status: 422, body: sessionResult };
  }
  const acceptedSegmentCount = repository.countAcceptedSegments();
  const savedGenerationContext = savedContext(sessionResult.ok ? sessionResult.payload : {});
  const generationContext = deriveGenerationContextCoherence(savedGenerationContext, acceptedSegmentCount);
  const generationSession = withSnapshotSessionDefaults(
    sessionResult.ok ? sessionResult.payload : {},
    generationContext.requiredValue
  );

  const storyConfig = loadStoryConfig(repository);
  const records = resolveSelectedRecords(repository, generationSession);
  const projectRecordIndex = buildProjectRecordIndex(repository);

  if (!records.ok) {
    return { ok: false, status: 422, body: malformedDependency(records.message, records) };
  }

  return {
    ok: true,
    snapshot: buildValidationSnapshot({
      records: records.records,
      generationSession,
      storyConfig,
      projectRecordIndex,
      generationContext,
      versions: {
        template: versionInfo.templates.version,
        compiler: versionInfo.compiler.version,
        contract: versionInfo.contract.version
      }
    })
  };
}

function buildProjectRecordIndex(repository: { listRecords(options: { includeArchived: boolean }): RecordReadResult[] }): Record<string, string> {
  return Object.fromEntries(
    repository
      .listRecords({ includeArchived: false })
      .flatMap((result) => (result.ok ? [[result.record.id, result.record.type] as const] : []))
  );
}

function savedContext(payload: unknown): GenerationContext | undefined {
  const session = (payload && typeof payload === "object" ? payload : {}) as Partial<GenerationSession>;
  return session.generation_validation_focus?.validation_focus_tags?.generation_context?.[0];
}

function withSnapshotSessionDefaults(payload: unknown, requiredContext: GenerationContext): GenerationSession {
  const session = (payload && typeof payload === "object" ? payload : {}) as Partial<GenerationSession>;
  const focusTags = session.generation_validation_focus?.validation_focus_tags;
  const generationValidationFocus = {
    ...session.generation_validation_focus,
    validation_focus_tags: {
      ...focusTags,
      generation_context: [requiredContext],
      expected_local_modes: focusTags?.expected_local_modes ?? [],
      possible_durable_changes: focusTags?.possible_durable_changes ?? []
    }
  };

  return {
    ...session,
    current_cast_voice_pressure: session.current_cast_voice_pressure ?? [],
    cast_voice_overrides: session.cast_voice_overrides ?? [],
    generation_validation_focus: generationValidationFocus
  };
}

function loadStoryConfig(repository: {
  getStoryConfig(kind: StoryConfigKind): { ok: true; payload: unknown } | { ok: false };
}): ValidationStoryConfig {
  const config: ValidationStoryConfig = {};

  for (const kind of storyConfigKinds) {
    const result = repository.getStoryConfig(kind);

    if (!result.ok) {
      continue;
    }

    if (kind === "STORY CONTRACT") {
      config.storyContract = result.payload as StoryContract;
    } else if (kind === "UNIVERSAL CONTENT POLICY") {
      config.universalContentPolicy = result.payload as UniversalContentPolicy;
    } else {
      config.proseMode = result.payload as ProseMode;
    }
  }

  return config;
}

function resolveSelectedRecords(
  repository: {
    getRecord(id: string): RecordReadResult;
  },
  generationSession: GenerationSession
): { ok: true; records: readonly ValidationRecord[] } | { ok: false; message: string; danglingSelectedRecordIds?: readonly string[] } {
  const selectedIds = generationSession.active_working_set?.selected_records ?? [];
  const castBands = castBandAssignments(generationSession);
  const records: ValidationRecord[] = [];
  const danglingSelectedRecordIds: string[] = [];

  for (const id of selectedIds) {
    const result = repository.getRecord(id);

    if (!result.ok) {
      if (result.kind === "not-found") {
        danglingSelectedRecordIds.push(id);
        continue;
      }

      return { ok: false, message: result.message };
    }

    records.push(toValidationRecord(result.record, castBands.get(id)));
  }

  if (danglingSelectedRecordIds.length > 0) {
    return {
      ok: false,
      message: `Active working set contains stale selected record id(s): ${danglingSelectedRecordIds.join(", ")}. Remove these ids from the active working set.`,
      danglingSelectedRecordIds
    };
  }

  return { ok: true, records };
}

function toValidationRecord(
  record: RecordRepositoryRecord,
  castAssignment: { castBand: SelectedCastBand; localFunction?: string } | undefined
): ValidationRecord {
  return {
    id: record.id,
    type: record.type,
    payload: record.payload,
    metadata: {
      id: record.id,
      type: record.type,
      displayLabel: record.displayLabel,
      status: record.status,
      salience: record.salience,
      urgency: record.urgency,
      archived: record.archived,
      userOrder: record.userOrder,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt
    },
    ...(castAssignment ?? {})
  };
}

function castBandAssignments(generationSession: GenerationSession): Map<string, { castBand: SelectedCastBand; localFunction?: string }> {
  const assignments = new Map<string, { castBand: SelectedCastBand; localFunction?: string }>();
  const workingSet = generationSession.active_working_set;

  for (const entry of workingSet?.active_onstage_cast_full ?? []) {
    assignments.set(entry.cast_member_id, {
      castBand: "active_onstage_cast_full",
      localFunction: entry.local_function
    });
  }

  for (const id of workingSet?.present_minor_cast_compressed ?? []) {
    assignments.set(id, { castBand: "present_minor_cast_compressed" });
  }

  for (const id of workingSet?.offstage_relevant_cast ?? []) {
    assignments.set(id, { castBand: "offstage_relevant_cast" });
  }

  return assignments;
}
