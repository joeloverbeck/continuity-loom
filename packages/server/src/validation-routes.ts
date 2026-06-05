import {
  buildValidationSnapshot,
  runValidation,
  versionInfo,
  type GenerationSession,
  type ProseMode,
  type SelectedCastBand,
  type StoryContract,
  type UniversalContentPolicy,
  type ValidationRecord,
  type ValidationStoryConfig
} from "@loom/core";
import type { FastifyInstance } from "fastify";

import type { ProjectStoreManager } from "./project-store.js";
import type { RecordRepositoryRecord, StoryConfigKind } from "./record-repository.js";

const storyConfigKinds = ["STORY CONTRACT", "UNIVERSAL CONTENT POLICY", "PROSE MODE"] as const;

function noOpenProject() {
  return { ok: false, kind: "no-open-project", message: "No project is open." };
}

function malformedDependency(message: string) {
  return { ok: false, kind: "malformed-validation-source", message };
}

export function registerValidationRoutes(app: FastifyInstance, manager: ProjectStoreManager): void {
  app.post("/api/validate", (request, reply) => {
    const repository = manager.getRecordRepository();

    if (!repository) {
      return reply.code(409).send(noOpenProject());
    }

    const sessionResult = repository.getGenerationSession();
    if (!sessionResult.ok && sessionResult.kind !== "not-found") {
      return reply.code(422).send(sessionResult);
    }
    const generationSession = (sessionResult.ok ? sessionResult.payload : {}) as GenerationSession;

    const storyConfig = loadStoryConfig(repository);
    const records = resolveSelectedRecords(repository, generationSession);

    if (!records.ok) {
      return reply.code(422).send(malformedDependency(records.message));
    }

    const snapshot = buildValidationSnapshot({
      records: records.records,
      generationSession,
      storyConfig,
      versions: {
        template: versionInfo.templates.version,
        compiler: versionInfo.compiler.version,
        contract: versionInfo.contract.version
      }
    });

    return runValidation(snapshot);
  });
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
    getRecord(id: string): { ok: true; record: RecordRepositoryRecord } | { ok: false; message: string };
  },
  generationSession: GenerationSession
): { ok: true; records: readonly ValidationRecord[] } | { ok: false; message: string } {
  const selectedIds = generationSession.active_working_set?.selected_records ?? [];
  const castBands = castBandAssignments(generationSession);
  const records: ValidationRecord[] = [];

  for (const id of selectedIds) {
    const result = repository.getRecord(id);

    if (!result.ok) {
      return { ok: false, message: result.message };
    }

    records.push(toValidationRecord(result.record, castBands.get(id)));
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
