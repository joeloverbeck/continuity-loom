import { deriveFullDisplayLabel, projectDisplayValues } from "@loom/core";
import type { FastifyInstance } from "fastify";
import { z, ZodError } from "zod";

import {
  type IncomingRecordReference,
  RecordIntegrityError,
  type RecordRepository,
  type RecordRepositoryRecord
} from "./record-repository.js";
import type { ProjectStoreManager } from "./project-store.js";

const recordWriteBodySchema = z
  .object({
    type: z.string().min(1).optional(),
    displayLabel: z.string().min(1).optional(),
    payload: z.unknown(),
    userOrder: z.number().int().nullable().optional()
  })
  .strict();

const createRecordBodySchema = recordWriteBodySchema.extend({
  type: z.string().min(1)
});

interface RecordMetadataResponse {
  id: string;
  type: string;
  displayLabel: string;
  fullDisplayLabel: string;
  status: string | null;
  salience: string | null;
  urgency: string | null;
  displayValues: Record<string, string | null>;
  archived: boolean;
  userOrder: number | null;
  createdAt: string;
  updatedAt: string;
  browseIdentity?: CastMemberBrowseIdentity;
}

interface CastMemberBrowseIdentity {
  primaryLabel: string | null;
  secondaryLabel: string;
  availability: "available" | "archived" | "missing";
}

function noOpenProject() {
  return { ok: false, kind: "no-open-project", message: "No project is open." };
}

function invalidRequest(message: string, error?: ZodError) {
  return { ok: false, kind: "invalid-request", message, issues: error?.issues ?? [] };
}

function malformedPayload(error: ZodError) {
  return { ok: false, kind: "malformed-payload", message: "Record payload is invalid.", issues: error.issues };
}

function referenceIntegrity(id: string, referrers: IncomingRecordReference[]) {
  return {
    ok: false,
    kind: "reference-integrity",
    message: `Record ${id} is referenced by active records.`,
    referrers
  };
}

function castMemberBrowseIdentity(
  repo: RecordRepository,
  record: RecordRepositoryRecord
): CastMemberBrowseIdentity | undefined {
  if (record.type !== "CAST MEMBER") {
    return undefined;
  }

  const secondaryLabel = deriveFullDisplayLabel(record.type, record.payload);
  const entityReference = repo.referencesForRecord(record.id).find((reference) => reference.refRole === "entity_id");
  if (!entityReference) {
    return { primaryLabel: null, secondaryLabel, availability: "missing" };
  }

  const entity = repo.getRecord(entityReference.targetId);
  if (!entity.ok || entity.record.type !== "ENTITY") {
    return { primaryLabel: null, secondaryLabel, availability: "missing" };
  }

  return {
    primaryLabel: deriveFullDisplayLabel(entity.record.type, entity.record.payload),
    secondaryLabel,
    availability: entity.record.archived ? "archived" : "available"
  };
}

function metadata(repo: RecordRepository, record: RecordRepositoryRecord): RecordMetadataResponse {
  const browseIdentity = castMemberBrowseIdentity(repo, record);

  return {
    id: record.id,
    type: record.type,
    displayLabel: record.displayLabel,
    fullDisplayLabel: deriveFullDisplayLabel(record.type, record.payload),
    status: record.status,
    salience: record.salience,
    urgency: record.urgency,
    displayValues: projectDisplayValues(record.type, record.payload),
    archived: record.archived,
    userOrder: record.userOrder,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    ...(browseIdentity ? { browseIdentity } : {})
  };
}

function recordDetail(
  repo: RecordRepository,
  record: RecordRepositoryRecord
): RecordRepositoryRecord & {
  displayValues: Record<string, string | null>;
  fullDisplayLabel: string;
  browseIdentity?: CastMemberBrowseIdentity;
} {
  const browseIdentity = castMemberBrowseIdentity(repo, record);

  return {
    ...record,
    fullDisplayLabel: deriveFullDisplayLabel(record.type, record.payload),
    displayValues: projectDisplayValues(record.type, record.payload),
    ...(browseIdentity ? { browseIdentity } : {})
  };
}

function repository(manager: ProjectStoreManager): RecordRepository | null {
  return manager.getRecordRepository();
}

function includeArchived(value: unknown): boolean {
  return value === "true" || value === "1" || value === true;
}

function textMatches(repo: RecordRepository, record: RecordRepositoryRecord, q: string | undefined): boolean {
  if (!q) {
    return true;
  }

  const needle = q.toLowerCase();
  const browseIdentity = castMemberBrowseIdentity(repo, record);
  return (
    record.displayLabel.toLowerCase().includes(needle) ||
    JSON.stringify(record.payload).toLowerCase().includes(needle) ||
    browseIdentity?.primaryLabel?.toLowerCase().includes(needle) === true ||
    browseIdentity?.secondaryLabel.toLowerCase().includes(needle) === true
  );
}

function referenceMatches(
  repo: RecordRepository,
  record: RecordRepositoryRecord,
  refRole: string | undefined,
  targetId: string | undefined
): boolean {
  if (!refRole && !targetId) {
    return true;
  }

  return repo.referencesForRecord(record.id).some((reference) => {
    const roleMatches = refRole ? reference.refRole === refRole : true;
    const targetMatches = targetId ? reference.targetId === targetId : true;
    return roleMatches && targetMatches;
  });
}

function notFound(id: string) {
  return { ok: false, kind: "not-found", message: `Record not found: ${id}`, id };
}

export function registerRecordRoutes(app: FastifyInstance, manager: ProjectStoreManager): void {
  app.get("/api/records", (request, reply) => {
    const repo = repository(manager);
    if (!repo) {
      return reply.code(409).send(noOpenProject());
    }

    const query = request.query as {
      type?: string;
      status?: string;
      includeArchived?: string;
      q?: string;
      refRole?: string;
      targetId?: string;
    };

    const listOptions: { type?: string; includeArchived?: boolean } = {
      includeArchived: includeArchived(query.includeArchived)
    };
    if (query.type) {
      listOptions.type = query.type;
    }

    const records = repo
      .listRecords(listOptions)
      .flatMap((result) => (result.ok ? [result.record] : []))
      .filter((record) => (query.status ? record.status === query.status : true))
      .filter((record) => textMatches(repo, record, query.q))
      .filter((record) => referenceMatches(repo, record, query.refRole, query.targetId))
      .map((record) => metadata(repo, record));

    return { ok: true, records };
  });

  app.get("/api/records/:id/references", (request, reply) => {
    const repo = repository(manager);
    if (!repo) {
      return reply.code(409).send(noOpenProject());
    }

    const { id } = request.params as { id: string };
    const result = repo.getRecord(id);
    if (!result.ok) {
      return reply.code(result.kind === "not-found" ? 404 : 422).send(result);
    }

    return {
      ok: true,
      outgoing: repo.referencesForRecord(id),
      incoming: repo.incomingReferencesForRecord(id)
    };
  });

  app.get("/api/records/:id", (request, reply) => {
    const repo = repository(manager);
    if (!repo) {
      return reply.code(409).send(noOpenProject());
    }

    const { id } = request.params as { id: string };
    const result = repo.getRecord(id);
    if (!result.ok) {
      return reply.code(result.kind === "not-found" ? 404 : 422).send(result);
    }

    return { ok: true, record: recordDetail(repo, result.record) };
  });

  app.post("/api/records", (request, reply) => {
    const repo = repository(manager);
    if (!repo) {
      return reply.code(409).send(noOpenProject());
    }

    let body: z.infer<typeof createRecordBodySchema>;
    try {
      body = createRecordBodySchema.parse(request.body);
    } catch (error) {
      if (error instanceof ZodError) {
        return reply.code(400).send(invalidRequest("Record create request is invalid.", error));
      }

      throw error;
    }

    try {
      const input = {
        type: body.type,
        displayLabel: body.displayLabel ?? body.type,
        payload: body.payload,
        ...(body.userOrder !== undefined ? { userOrder: body.userOrder } : {})
      };
      const record = repo.createRecord({
        ...input
      });
      return reply.code(201).send({ ok: true, record: recordDetail(repo, record) });
    } catch (error) {
      if (error instanceof ZodError) {
        return reply.code(400).send(malformedPayload(error));
      }

      if (error instanceof Error && error.message.startsWith("Unsupported record type:")) {
        return reply.code(400).send({ ok: false, kind: "unsupported-record-type", message: error.message });
      }

      throw error;
    }
  });

  app.put("/api/records/:id", (request, reply) => {
    const repo = repository(manager);
    if (!repo) {
      return reply.code(409).send(noOpenProject());
    }

    const { id } = request.params as { id: string };
    if (!repo.getRecord(id).ok) {
      return reply.code(404).send(notFound(id));
    }

    try {
      const body = recordWriteBodySchema.parse(request.body);
      const input = {
        id,
        payload: body.payload,
        ...(body.displayLabel !== undefined ? { displayLabel: body.displayLabel } : {}),
        ...(body.userOrder !== undefined ? { userOrder: body.userOrder } : {})
      };
      const record = repo.updateRecord(input);
      return { ok: true, record: recordDetail(repo, record) };
    } catch (error) {
      if (error instanceof ZodError) {
        return reply.code(400).send(malformedPayload(error));
      }

      if (error instanceof RecordIntegrityError) {
        return reply.code(409).send({ ok: false, kind: "record-integrity", message: error.message });
      }

      throw error;
    }
  });

  app.post("/api/records/:id/archive", (request, reply) => {
    const repo = repository(manager);
    if (!repo) {
      return reply.code(409).send(noOpenProject());
    }

    const { id } = request.params as { id: string };
    if (!repo.getRecord(id).ok) {
      return reply.code(404).send(notFound(id));
    }

    const incoming = repo.incomingReferencesForRecord(id);
    if (incoming.length > 0) {
      return reply.code(409).send(referenceIntegrity(id, incoming));
    }

    repo.archiveRecord(id);
    return { ok: true };
  });

  app.delete("/api/records/:id", (request, reply) => {
    const repo = repository(manager);
    if (!repo) {
      return reply.code(409).send(noOpenProject());
    }

    const { id } = request.params as { id: string };
    if (!repo.getRecord(id).ok) {
      return reply.code(404).send(notFound(id));
    }

    const incoming = repo.incomingReferencesForRecord(id);
    if (incoming.length > 0) {
      return reply.code(409).send(referenceIntegrity(id, incoming));
    }

    repo.deleteRecord(id);
    return { ok: true };
  });
}
