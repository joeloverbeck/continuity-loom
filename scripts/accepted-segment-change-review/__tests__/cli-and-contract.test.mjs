import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import test from "node:test";

import { loadGoldCorpus } from "../corpus.mjs";

const cliPath = fileURLToPath(new URL("../cli.mjs", import.meta.url));

test("dry-run CLI validates and emits the offline 16-entry plan without provider execution", () => {
  const result = spawnSync(process.execPath, [cliPath, "dry-run"], {
    cwd: fileURLToPath(new URL("../../..", import.meta.url)),
    encoding: "utf8",
    env: { ...process.env, OPENROUTER_API_KEY: "sk-or-synthetic-must-remain-unused" }
  });

  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stderr, "");
  const plan = JSON.parse(result.stdout);
  assert.equal(plan.requests.length, 16);
  assert.equal(plan.executionAuthorized, false);
  assert.equal(plan.providerCallsExecuted, 0);
  assert.match(plan.notice, /No provider request was or can be executed/);
});

test("CLI exposes no execute command", () => {
  const result = spawnSync(process.execPath, [cliPath, "execute"], {
    cwd: fileURLToPath(new URL("../../..", import.meta.url)),
    encoding: "utf8"
  });

  assert.notEqual(result.status, 0);
  assert.equal(result.stdout, "");
  assert.match(result.stderr, /dry-run|evaluate/);
});

test("evaluate CLI reads a captured comparison and emits the durable scored result", async (t) => {
  const temporaryDirectory = await mkdtemp(join(tmpdir(), "change-review-cli-"));
  t.after(() => rm(temporaryDirectory, { recursive: true, force: true }));
  const resultPath = join(temporaryDirectory, "comparison-run.json");
  const [death] = await loadGoldCorpus();
  await writeFile(resultPath, JSON.stringify(comparisonRun(death)), "utf8");

  const result = spawnSync(process.execPath, [cliPath, "evaluate", "--results", resultPath], {
    cwd: fileURLToPath(new URL("../../..", import.meta.url)),
    encoding: "utf8"
  });

  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stderr, "");
  const evaluation = JSON.parse(result.stdout);
  assert.equal(evaluation.requests.length, 1);
  assert.equal(evaluation.requests[0].metrics.recall, 1);
  assert.equal(evaluation.aggregate.actualRequestCount, 1);
  assert.equal(evaluation.aggregate.actualCostUsd, 0.01);
  assert.equal(evaluation.aggregate.protocolPlanComplete, false);
  assert.equal(evaluation.deterministicFloorsPassed, false);
  assert.equal(evaluation.issueClosureIsGo, false);
});

test("production tooling imports no network, product route, browser, store, or write surface", async () => {
  for (const fileName of ["cli.mjs", "corpus.mjs", "evaluator.mjs", "protocol.mjs"]) {
    const source = await readFile(new URL(`../${fileName}`, import.meta.url), "utf8");
    assert.doesNotMatch(
      source,
      /\bfetch\s*\(|node:https?|openrouter-client|packages\/(?:server|web)|\/api\/|writeFile|\.(?:save|insert|updateProject)\s*\(/
    );
  }
});

test("result contract records per-request evidence, aggregates, and a separate steward receipt", async () => {
  const schema = JSON.parse(await readFile(new URL("../result-format.schema.json", import.meta.url), "utf8"));
  const protocol = JSON.parse(await readFile(new URL("../protocol.json", import.meta.url), "utf8"));
  const protocolText = await readFile(new URL("../OPERATOR-PROTOCOL.md", import.meta.url), "utf8");

  assert.equal(schema.type, "object");
  assert.equal(schema.additionalProperties, false);
  assert.deepEqual(schema.required, [
    "schemaVersion",
    "protocolId",
    "issueClosureIsGo",
    "requests",
    "aggregate",
    "deterministicFloorsPassed",
    "stewardReceipt"
  ]);
  assert.equal(schema.properties.issueClosureIsGo.const, false);
  assert.equal(schema.properties.requests.maxItems, 16);
  assert.deepEqual(schema.$defs.requestResult.required, [
    "schemaVersion",
    "requestId",
    "requestOrdinal",
    "caseId",
    "workflow",
    "provenance",
    "status",
    "failure",
    "sourceAccounting",
    "findings",
    "coverage",
    "requestPolicy",
    "writes",
    "measurements",
    "metrics",
    "floors"
  ]);
  assert.deepEqual(schema.$defs.provenance.required, [
    "contract",
    "model",
    "settings",
    "segmentSelection",
    "recordScope",
    "startedAt",
    "completedAt",
    "sourceFingerprint",
    "promptSha256"
  ]);
  assert.deepEqual(protocol.workflowContracts, {
    old: "segment_reconciliation.v1",
    new: "accepted_segment_change_review.v1"
  });
  assert.deepEqual(schema.$defs.coverageRow.properties.status.enum, [
    "changes found",
    "checked - no relevant change",
    "uncertain"
  ]);
  assert.deepEqual(schema.$defs.stewardReceipt.properties.decision.enum, ["GO", "NO-GO", null]);
  assert.match(protocolText, /node scripts\/accepted-segment-change-review\/cli\.mjs dry-run/);
  assert.match(protocolText, /at most 16 provider requests/i);
  assert.match(protocolText, /no automatic retries, fallback requests, repair calls, or unapproved substitutions/i);
  assert.match(protocolText, /issue closure is not GO/i);
  assert.match(protocolText, /named steward/i);
});

function comparisonRun(fixture) {
  return {
    schemaVersion: 1,
    protocolId: "accepted-segment-change-review-comparison.v1",
    issueClosureIsGo: false,
    requests: [
      {
        schemaVersion: 1,
        requestId: `request-01-old-${fixture.caseId}`,
        requestOrdinal: 1,
        caseId: fixture.caseId,
        workflow: "old",
        provenance: {
          contract: "segment_reconciliation.v1",
          model: "anthropic/claude-sonnet-4",
          settings: { temperature: 0, maxOutputTokens: 4_096, topP: 1 },
          segmentSelection: "latest",
          recordScope: "active_working_set",
          startedAt: "2026-07-21T10:00:00.000Z",
          completedAt: "2026-07-21T10:00:01.000Z",
          sourceFingerprint: "a".repeat(64),
          promptSha256: "b".repeat(64)
        },
        status: "completed",
        failure: null,
        sourceAccounting: globalThis.structuredClone(fixture.expectedSourceAccounting),
        findings: fixture.adjudication.findings.map((finding) => ({
          findingId: finding.findingId,
          disposition: "found",
          evidenceKeys: finding.evidenceKeys,
          contrastKeys: finding.contrastKeys,
          epistemicStatus: finding.epistemicStatus,
          retentionHorizon: finding.retentionHorizon,
          invented: false
        })),
        coverage: globalThis.structuredClone(fixture.adjudication.coverage),
        requestPolicy: {
          retryCount: 0,
          fallbackUsed: false,
          repairCallUsed: false,
          substitutionUsed: false
        },
        writes: { automatic: 0, projectStore: 0 },
        measurements: {
          reviewTimeMs: 10_000,
          promptCharacters: 4_000,
          promptTokensEstimate: 1_000,
          latencyMs: 1_000,
          inputTokens: 1_000,
          outputTokens: 200,
          costUsd: 0.01
        }
      }
    ],
    stewardReceipt: {
      status: "not-recorded",
      steward: null,
      decision: null,
      recordedAt: null,
      rationale: null
    }
  };
}
