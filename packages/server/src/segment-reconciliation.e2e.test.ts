import { mkdtempSync, rmSync } from "node:fs";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./openrouter/client.js", () => ({
  sendChatCompletion: vi.fn()
}));

import { sendChatCompletion } from "./openrouter/client.js";
import { createServer } from "./server.js";

type FastifyApp = ReturnType<typeof createServer>;

const apps: FastifyApp[] = [];
const sendChatCompletionMock = vi.mocked(sendChatCompletion);
const apiKey = "sk-or-segment-reconciliation-e2e";
const acceptedSentinel = "SEGMENT_RECONCILIATION_ACCEPTED_SENTINEL";
const modelOutputSentinel = "SEGMENT_RECONCILIATION_OUTPUT_SENTINEL";

describe("segment reconciliation end-to-end conformance", () => {
  let configDir: string;
  let originalConfigDir: string | undefined;
  let originalApiKey: string | undefined;

  beforeEach(() => {
    originalConfigDir = process.env.CONTINUITY_LOOM_CONFIG_DIR;
    originalApiKey = process.env.OPENROUTER_API_KEY;
    configDir = mkdtempSync(join(tmpdir(), "loom-segment-reconciliation-e2e-settings-"));
    process.env.CONTINUITY_LOOM_CONFIG_DIR = configDir;
    process.env.OPENROUTER_API_KEY = apiKey;
    sendChatCompletionMock.mockReset();
  });

  afterEach(async () => {
    await Promise.all(apps.splice(0).map((fastify) => fastify.close()));
    restoreEnv("CONTINUITY_LOOM_CONFIG_DIR", originalConfigDir);
    restoreEnv("OPENROUTER_API_KEY", originalApiKey);
    rmSync(configDir, { recursive: true, force: true });
  });

  it("returns typed suggestions without mutating project storage", async () => {
    const fastify = app();
    const folderPath = await createProject(fastify);
    const databasePath = join(folderPath, "loom.sqlite");
    const factId = await createFact(fastify);
    await putWorkingSet(fastify, [factId]);
    await addAcceptedSegment(fastify);
    await putSettings(fastify);
    const compile = await compileReconciliation(fastify);
    const beforeRows = stableRows(databasePath);
    sendChatCompletionMock.mockResolvedValue({
      ok: true,
      candidate: { text: validReconciliationOutput(compile) }
    });

    const analyze = await fastify.inject({
      method: "POST",
      url: "/api/segment-reconciliation/analyze",
      payload: { expectedPromptFingerprint: compile.metadata.fingerprint }
    });
    const body = analyze.json() as {
      ok: true;
      proposals: {
        briefProposals: unknown[];
        recordChangeProposals: unknown[];
        recordCreationProposals: unknown[];
      };
      metadata: { fingerprint: string };
    };

    expect(analyze.statusCode).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.proposals.briefProposals).toHaveLength(1);
    expect(body.proposals.recordChangeProposals).toHaveLength(1);
    expect(body.proposals.recordCreationProposals).toHaveLength(0);
    expect(body.metadata.fingerprint).toBe(compile.metadata.fingerprint);
    expect(sendChatCompletionMock).toHaveBeenCalledTimes(1);
    expect(sendChatCompletionMock.mock.calls[0]?.[0]?.prompt).toBe(compile.prompt);
    expect(stableRows(databasePath)).toEqual(beforeRows);
    expect(JSON.stringify(stableRows(databasePath))).not.toContain(modelOutputSentinel);
  });
});

function app(): FastifyApp {
  const fastify = createServer();
  apps.push(fastify);
  return fastify;
}

async function createProject(fastify: FastifyApp): Promise<string> {
  const parentPath = await mkdtemp(join(tmpdir(), "loom-segment-reconciliation-e2e-project-"));
  const response = await fastify.inject({
    method: "POST",
    url: "/api/project/create",
    payload: {
      parentPath,
      folderName: "reconciliation-e2e",
      title: "Segment Reconciliation E2E"
    }
  });
  const body = response.json() as { folderPath: string };

  expect(response.statusCode).toBe(201);
  return body.folderPath;
}

async function createFact(fastify: FastifyApp): Promise<string> {
  const response = await fastify.inject({
    method: "POST",
    url: "/api/records",
    payload: {
      type: "FACT",
      displayLabel: "Mara lacks a key",
      payload: {
        fact_kind: "current_state",
        statement: "Mara does not have a key.",
        scope: "current_segment",
        known_by: "public",
        audience_visibility: "explicit",
        salience: "high"
      }
    }
  });
  const body = response.json() as { record: { id: string } };

  expect(response.statusCode).toBe(201);
  return body.record.id;
}

async function putWorkingSet(fastify: FastifyApp, selectedRecordIds: string[]): Promise<void> {
  const response = await fastify.inject({
    method: "PUT",
    url: "/api/working-set",
    payload: { selectedRecordIds }
  });

  expect(response.statusCode).toBe(200);
}

async function addAcceptedSegment(fastify: FastifyApp): Promise<void> {
  const response = await fastify.inject({
    method: "POST",
    url: "/api/accepted-segments",
    payload: {
      text: `Mara found the brass key ${acceptedSentinel} and hid it in her coat.`,
      generationMetadata: {
        model: "test/model",
        provider: "openrouter",
        temperature: 0.1,
        maxOutputTokens: 500,
        versions: { template: "test", compiler: "test", contract: "test" }
      }
    }
  });

  expect(response.statusCode).toBe(201);
}

async function putSettings(fastify: FastifyApp): Promise<void> {
  const response = await fastify.inject({
    method: "PUT",
    url: "/api/settings/openrouter",
    payload: {
      model: "anthropic/claude-sonnet-4",
      temperature: 0.4,
      maxOutputTokens: 1800
    }
  });

  expect(response.statusCode).toBe(200);
}

async function compileReconciliation(fastify: FastifyApp): Promise<{
  prompt: string;
  metadata: { fingerprint: string };
  source: { acceptedSegmentId: string; acceptedSegmentSequence: number };
}> {
  const response = await fastify.inject({
    method: "POST",
    url: "/api/segment-reconciliation/compile",
    payload: { segmentSelection: "latest", recordScope: "active_working_set" }
  });

  expect(response.statusCode).toBe(200);
  return response.json();
}

function validReconciliationOutput(compile: {
  metadata: { fingerprint: string };
  source: { acceptedSegmentId: string; acceptedSegmentSequence: number };
}): string {
  return JSON.stringify({
    contract: "segment_reconciliation.v1",
    source: {
      profile: "segment-reconciliation",
      accepted_segment_id: compile.source.acceptedSegmentId,
      accepted_segment_sequence: compile.source.acceptedSegmentSequence,
      record_scope: "active_working_set",
      prompt_fingerprint: compile.metadata.fingerprint
    },
    brief_proposals: [
      {
        id: "BRIEF-001",
        action: "FILL",
        field_path: "immediate_handoff.last_visible_moment",
        proposed_value: `Mara hid the brass key in her coat. ${modelOutputSentinel}`,
        evidence: ["[SEG-1-S001]"],
        contrast: ["[BRIEF:immediate_handoff.last_visible_moment]"],
        rationale: "The accepted segment establishes the immediate visible handoff."
      }
    ],
    record_change_proposals: [
      {
        id: "RECORD-001",
        action: "UPDATE_FIELDS",
        record_key: "[FACT-1]",
        patches: [
          {
            op: "replace",
            path: "/statement",
            value: "Mara has the brass key hidden in her coat."
          }
        ],
        lifecycle_destination: null,
        evidence: ["[SEG-1-S001]"],
        contrast: ["[FACT-1]"],
        rationale: "The stored fact conflicts with the accepted segment."
      }
    ],
    record_creation_proposals: []
  });
}

function stableRows(databasePath: string): Record<string, unknown[]> {
  const database = new DatabaseSync(databasePath);
  try {
    const tables = [
      "accepted_segments",
      "generation_session",
      "record_references",
      "records",
      "reminder_state",
      "story_config",
      "story_notes"
    ];

    return Object.fromEntries(
      tables.map((tableName) => [
        tableName,
        database.prepare(`SELECT * FROM ${quoteIdentifier(tableName)}`).all()
      ])
    );
  } finally {
    database.close();
  }
}

function quoteIdentifier(value: string): string {
  return `"${value.replace(/"/g, "\"\"")}"`;
}

function restoreEnv(name: string, value: string | undefined): void {
  if (value === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = value;
  }
}
