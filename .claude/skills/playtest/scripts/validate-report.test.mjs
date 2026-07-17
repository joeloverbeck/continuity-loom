import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, test } from "node:test";

import { validateReport } from "./validate-report.mjs";

const fixtureRoot = mkdtempSync(join(tmpdir(), "loom-playtest-report-"));
const STEM = "playtest-glass-harbor-2026-07-17T120000Z";

after(() => rmSync(fixtureRoot, { recursive: true, force: true }));

function frontmatter(overrides = {}) {
  const values = {
    report_type: "continuity-loom-author-playtest",
    schema_version: "1",
    run_id: STEM,
    report_stem: STEM,
    story_title: "Glass Harbor",
    story_slug: "glass-harbor",
    run_mode: "new_story",
    prior_report: "null",
    project_path: "/tmp/continuity-loom-playtest-projects/glass-harbor",
    project_exists_at_close: "true",
    started_at: "2026-07-17T12:00:00Z",
    completed_at: "2026-07-17T13:00:00Z",
    status: "completed",
    completion_reason: "accepted-one-segment",
    accepted_segment_sequence: "1",
    base_url: "http://127.0.0.1:41731",
    browser: "chromium",
    viewport: "1440x900",
    openrouter_send_controls_clicked: "0",
    provider_request_attempts: "0",
    provider_requests_blocked: "0",
    cold_prose_attempts: "1",
    cold_assistance_attempts: "2",
    counterfactual_probes: "0",
    candidate_intervention: "light",
    ...overrides
  };
  return `---\n${Object.entries(values)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n")}\n---\n`;
}

const BODY = `# Continuity Loom Author Playtest Report: Glass Harbor

## Run Status

Completed.

## Executive Assessment

Useful.

## Story Intent and Expectations

Recorded before use.

## Run Configuration and Continuation Contract

One local segment.

## Condensed Author Journey

Completed through the visible UI.

## What Worked

The app preserved the project.

## Prioritized Findings

| ID | Severity | Classification | Category | Summary | Confidence | Status |
|---|---|---|---|---|---|---|
| F001 | moderate | friction | brief | Optional field cost | medium | new |

## Surface-by-Surface Experience

Recorded.

## Prompt Usefulness

| Prompt | Author need | Contract compliance | Actionable outputs | No-change / low-value outputs | Adopted | Verdict | Confidence |
|---|---|---:|---:|---:|---|---|---|
| Prose | Draft | yes | 1 | 0 | 1 | useful | medium |

## Generation Brief Field Influence

| Field | Author need | Intended observable influence | Visible prompt evidence | Response evidence | Verdict | Confidence |
|---|---|---|---|---|---|---|
| Directive | Scene | Local scope | present in directive section | Observed | used | medium |

## Assistance Evaluation

| Surface | Why invoked or skipped | Cold response result | Useful/adopted | Noise/rejected | Application path | Verdict |
|---|---|---|---|---|---|---|
| Hygiene | Needed | Sparse | 1 | 0 | Record editor | useful |

## Candidate and Accepted Segment

Accepted without reproducing prose.

## Cumulative Finding Ledger

| ID | First seen | Classification | Summary | Current status | Latest evidence |
|---|---|---|---|---|---|
| F001 | current | friction | Optional field cost | new | Current run |

## Continuation Handoff

Continue from sequence 1.

## Diagnostics and Evidence

No relevant errors.

### Evidence Index

- [Focused screenshot](assets/${STEM}/brief.png) - Demonstrates the finding.

## Coverage Limitations

One stochastic response.
`;

let caseNumber = 0;
function fixture(fm = frontmatter(), body = BODY) {
  caseNumber += 1;
  const reportsDir = join(fixtureRoot, `case-${caseNumber}`, "reports");
  const evidenceDir = join(reportsDir, "assets", STEM);
  mkdirSync(evidenceDir, { recursive: true });
  writeFileSync(join(evidenceDir, "brief.png"), "png", "utf8");
  const report = join(reportsDir, `${STEM}.md`);
  writeFileSync(report, `${fm}\n${body}\n`, "utf8");
  return report;
}

test("accepts a complete privacy-safe report", () => {
  const { errors, warnings } = validateReport(fixture());
  assert.deepEqual(errors, []);
  assert.deepEqual(warnings, []);
});

test("rejects a missing required section", () => {
  const report = fixture(
    frontmatter(),
    BODY.replace("## What Worked\n\nThe app preserved the project.\n\n", "")
  );
  const { errors } = validateReport(report);
  assert.ok(errors.some((error) => error.includes("## What Worked")));
});

test("rejects an API-key-shaped value", () => {
  const report = fixture(frontmatter(), `${BODY}\nAPI key: sk-or-v1-abcdefghijklmnopqrstuv`);
  const { errors } = validateReport(report);
  assert.ok(errors.some((error) => error.includes("key-like secret")));
});

test("completed runs cannot report provider activity", () => {
  const report = fixture(
    frontmatter({
      openrouter_send_controls_clicked: "1",
      provider_request_attempts: "1",
      provider_requests_blocked: "1"
    })
  );
  const { errors } = validateReport(report);
  assert.ok(errors.some((error) => error.includes("status: blocked")));
  assert.ok(errors.some((error) => error.includes("zero provider")));
});

test("blocked provider attempts require an equal or higher guard count", () => {
  const report = fixture(
    frontmatter({
      status: "blocked",
      completion_reason: "provider-request-attempt",
      project_exists_at_close: "false",
      accepted_segment_sequence: "null",
      openrouter_send_controls_clicked: "1",
      provider_request_attempts: "2",
      provider_requests_blocked: "1",
      cold_prose_attempts: "0",
      candidate_intervention: "not-reached"
    })
  );
  const { errors } = validateReport(report);
  assert.ok(errors.some((error) => error.includes("no greater than provider guard blocks")));
});

test("allows unreachable browser fields to be null on an early blocked run", () => {
  const report = fixture(
    frontmatter({
      status: "blocked",
      completion_reason: "launch-failed",
      project_path: "null",
      project_exists_at_close: "false",
      accepted_segment_sequence: "null",
      base_url: "null",
      browser: "null",
      viewport: "null",
      cold_prose_attempts: "0",
      cold_assistance_attempts: "0",
      candidate_intervention: "not-reached"
    })
  );
  const { errors } = validateReport(report);
  assert.deepEqual(errors, []);
});

test("rejects retained evidence that is not indexed", () => {
  const report = fixture();
  const evidenceDir = join(report.replace(`${STEM}.md`, ""), "assets", STEM);
  writeFileSync(join(evidenceDir, "extra.txt"), "diagnostic", "utf8");
  const { errors } = validateReport(report);
  assert.ok(errors.some((error) => error.includes("extra.txt")));
});

test("rejects project databases even when they are not linked", () => {
  const report = fixture();
  const evidenceDir = join(report.replace(`${STEM}.md`, ""), "assets", STEM);
  writeFileSync(join(evidenceDir, "loom.sqlite"), "sqlite", "utf8");
  const { errors } = validateReport(report);
  assert.ok(errors.some((error) => error.includes("project database")));
});

test("rejects empty diagnostic streams left after the browser closes", () => {
  const report = fixture();
  const evidenceDir = join(report.replace(`${STEM}.md`, ""), "assets", STEM);
  writeFileSync(join(evidenceDir, "console-log.jsonl"), "", "utf8");
  const { errors } = validateReport(report);
  assert.ok(errors.some((error) => error.includes("empty diagnostic stream")));
});
