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

function v2Frontmatter(overrides = {}) {
  return frontmatter({
    schema_version: "2",
    cold_first_view_witnesses: "1",
    independent_claim_challenges: "1",
    paired_draw_checks: "1",
    ...overrides
  });
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

const PAIRED_PROMPT_FINGERPRINT = "c".repeat(64);
const WITNESS_PACKET_FINGERPRINT = "d".repeat(64);
const V2_METHOD_HEADERS = [
  "| ID | Severity | Classification | Category | Summary | Confidence | Status | Evidence basis |",
  "| Packet fingerprint | Timestamp | Executor host | Executor model | Model identity exposed | First-action summary | Expectation mismatch | Unclear terms count | Clarity | Main-operator comparison | Privacy check |",
  "| Claim ID | Eligibility reason | Timestamp | Executor host | Executor model | Model identity exposed | Packet fingerprint | Status | Rival explanation | Observable discriminator | Operator resolution | Evidence basis |",
  "| Draw | Timestamp | Executor host | Executor model | Model identity exposed | Prompt fingerprint | Structural class | Usefulness verdict | Author adoption | Burden |"
];

function padHeader(header) {
  const cells = header
    .slice(1, -1)
    .split("|")
    .map((cell) => cell.trim());
  return `| ${cells.map((cell) => `${cell}  `).join("| ")}|`;
}

function v2Body({
  drawBFingerprint = PAIRED_PROMPT_FINGERPRINT,
  challengeModel = "gpt-5",
  challengeModelExposed = "true",
  secondChallengeFingerprint = null,
  findingEvidenceBasis = "direct-visible, independent-narrowed, paired-discordant"
} = {}) {
  return BODY.replace(
    `| ID | Severity | Classification | Category | Summary | Confidence | Status |\n|---|---|---|---|---|---|---|\n| F001 | moderate | friction | brief | Optional field cost | medium | new |`,
    `| ID | Severity | Classification | Category | Summary | Confidence | Status | Evidence basis |\n|---|---|---|---|---|---|---|---|\n| F001 | moderate | friction | brief | Optional field cost | medium | new | ${findingEvidenceBasis} |`
  )
    .replace(
      "Recorded before use.\n\n## Run Configuration and Continuation Contract",
      `Recorded before use.

### Cold First-View Witness

| Packet fingerprint | Timestamp | Executor host | Executor model | Model identity exposed | First-action summary | Expectation mismatch | Unclear terms count | Clarity | Main-operator comparison | Privacy check |
|---|---|---|---|---|---|---|---:|---|---|---|
| ${WITNESS_PACKET_FINGERPRINT} | 2026-07-17T12:05:00Z | codex | gpt-5 | true | Create a project | Status rail looked primary | 1 | partly-clear | Witness noticed more technical framing | passed |

## Run Configuration and Continuation Contract`
    )
    .replace(
      "## Surface-by-Surface Experience",
      `### Independent Claim Challenges

| Claim ID | Eligibility reason | Timestamp | Executor host | Executor model | Model identity exposed | Packet fingerprint | Status | Rival explanation | Observable discriminator | Operator resolution | Evidence basis |
|---|---|---|---|---|---|---|---|---|---|---|---|
| F001 | executive recommendation | 2026-07-17T12:50:00Z | codex | ${challengeModel} | ${challengeModelExposed} | ${WITNESS_PACKET_FINGERPRINT} | narrowed | The control may be optional | Repeat through visible UI | Narrowed the claim | direct-visible, independent-narrowed |${
        secondChallengeFingerprint
          ? `
| F002 | preserved strength | 2026-07-17T12:50:00Z | codex | ${challengeModel} | ${challengeModelExposed} | ${secondChallengeFingerprint} | supported | The strength may be incidental | Repeat the visible path | Kept the bounded claim | direct-visible, independent-supported |`
          : ""
      }

## Surface-by-Surface Experience`
    )
    .replace(
      "## Generation Brief Field Influence",
      `### Paired-Draw Check

- Prompt kind: segment-reconciliation
- Prompt fingerprint: ${PAIRED_PROMPT_FINGERPRINT}
- Eligibility reason: A legal no-change result could affect durable continuity work.
- Informative output classes: substantive-change, reasoned-no-change, empty-no-change, malformed, blocked
- Pair class: discordant
- What the pair supports: The exact prompt instance produced materially different output classes.
- What the pair cannot establish: A reliability rate or the cause of discordance.
- Effect on likely-layer attribution: Model execution remains plausible; prompt-contract attribution is provisional.
- Counterfactual used: no

| Draw | Timestamp | Executor host | Executor model | Model identity exposed | Prompt fingerprint | Structural class | Usefulness verdict | Author adoption | Burden |
|---|---|---|---|---|---|---|---|---|---|
| A | 2026-07-17T12:30:00Z | codex | gpt-5 | true | ${PAIRED_PROMPT_FINGERPRINT} | empty-no-change | low-value | rejected | none |
| B | 2026-07-17T12:31:00Z | codex | gpt-5 | true | ${drawBFingerprint} | substantive-change | useful | partial | light |

## Generation Brief Field Influence`
    );
}

function withCounterfactualDisclosure(
  body = BODY,
  { baseFingerprint = "a".repeat(64), counterfactualFingerprint = "b".repeat(64) } = {}
) {
  const disclosure = `### Targeted Counterfactual

- Base prompt fingerprint: ${baseFingerprint}
- Counterfactual prompt fingerprint: ${counterfactualFingerprint}
- Changed field: manual_moment_directive.must_render
- One-variable change: Removed the directive while preserving every other prompt byte.
- Result: The comparison changed directive adherence, with stochastic variation still a confound.
- App use: diagnostic only; response not used in app`;
  return body.replace(
    "\n## Generation Brief Field Influence",
    `\n${disclosure}\n\n## Generation Brief Field Influence`
  );
}

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

test("accepts one F-prefixed stable-ID namespace across the cumulative ledger", () => {
  const body = BODY.replace(
    "| F001 | current | friction | Optional field cost | new | Current run |",
    `| F001 | current | friction | Optional field cost | new | Current run |
| F002 | current | strength | Exact custody readback | preserve-strength | Current run |
| F003 | current | friction | Browser permission retry | resolved | Current run |`
  );
  const { errors, warnings } = validateReport(fixture(frontmatter(), body));
  assert.deepEqual(errors, []);
  assert.deepEqual(warnings, []);
});

test("rejects non-F stable IDs in prioritized and cumulative finding tables", () => {
  const body = BODY.replace(
    "| F001 | moderate | friction | brief | Optional field cost | medium | new |",
    "| H001 | moderate | friction | brief | Optional field cost | medium | new |"
  ).replace(
    "| F001 | current | friction | Optional field cost | new | Current run |",
    "| S001 | current | strength | Exact custody readback | preserve-strength | Current run |"
  );
  const { errors } = validateReport(fixture(frontmatter(), body));
  assert.ok(errors.includes("Prioritized Findings has invalid stable ID: H001"));
  assert.ok(errors.includes("Cumulative Finding Ledger has invalid stable ID: S001"));
});

test("rejects duplicate stable IDs in both finding tables", () => {
  const body = BODY.replace(
    "| F001 | moderate | friction | brief | Optional field cost | medium | new |",
    `| F001 | moderate | friction | brief | Optional field cost | medium | new |
| F001 | minor | confusion | records | Duplicate identity | high | new |`
  ).replace(
    "| F001 | current | friction | Optional field cost | new | Current run |",
    `| F001 | current | friction | Optional field cost | new | Current run |
| F001 | current | strength | Exact custody readback | preserve-strength | Current run |`
  );
  const { errors } = validateReport(fixture(frontmatter(), body));
  assert.ok(errors.includes("Prioritized Findings contains duplicate stable ID: F001"));
  assert.ok(errors.includes("Cumulative Finding Ledger contains duplicate stable ID: F001"));
});

test("requires every prioritized finding in the cumulative ledger", () => {
  const body = BODY.replace(
    "| F001 | current | friction | Optional field cost | new | Current run |",
    "| F002 | current | friction | Different cumulative item | new | Current run |"
  );
  const { errors } = validateReport(fixture(frontmatter(), body));
  assert.ok(errors.includes("Prioritized finding F001 is absent from the Cumulative Finding Ledger."));
});

test("accepts a complete schema v2 report with bounded method evidence", () => {
  const { errors, warnings } = validateReport(fixture(v2Frontmatter(), v2Body()));
  assert.deepEqual(errors, []);
  assert.deepEqual(warnings, []);
});

test("accepts formatter-aligned schema v2 method table headers", () => {
  const formattedBody = V2_METHOD_HEADERS.reduce(
    (body, header) => body.replace(header, padHeader(header)),
    v2Body()
  );
  const { errors, warnings } = validateReport(fixture(v2Frontmatter(), formattedBody));
  assert.deepEqual(errors, []);
  assert.deepEqual(warnings, []);
});

test("accepts a historical schema v1 counterfactual without the later disclosure as a warning", () => {
  const { errors, warnings } = validateReport(fixture(frontmatter({ counterfactual_probes: "1" })));
  assert.deepEqual(errors, []);
  assert.ok(warnings.some((warning) => warning.includes("Historical schema v1")));
});

test("rejects a schema v2 report missing a method-evidence counter", () => {
  const report = fixture(v2Frontmatter({ paired_draw_checks: undefined }), v2Body());
  const { errors } = validateReport(report);
  assert.ok(errors.some((error) => error.includes("paired_draw_checks")));
});

test("rejects schema v2 paired draws with different prompt fingerprints", () => {
  const report = fixture(v2Frontmatter(), v2Body({ drawBFingerprint: "e".repeat(64) }));
  const { errors } = validateReport(report);
  assert.ok(errors.some((error) => error.includes("byte-identical prompt fingerprint")));
});

test("rejects a schema v2 challenge count that does not match its table", () => {
  const report = fixture(v2Frontmatter({ independent_claim_challenges: "2" }), v2Body());
  const { errors } = validateReport(report);
  assert.ok(errors.some((error) => error.includes("independent_claim_challenges")));
});

test("rejects schema v2 challenge rows that do not share one sealed packet", () => {
  const report = fixture(
    v2Frontmatter({ independent_claim_challenges: "2" }),
    v2Body({ secondChallengeFingerprint: "f".repeat(64) })
  );
  const { errors } = validateReport(report);
  assert.ok(errors.some((error) => error.includes("one witness provenance and packet")));
});

test("rejects an unsupported schema v2 evidence-basis tag", () => {
  const report = fixture(
    v2Frontmatter(),
    v2Body({ findingEvidenceBasis: "direct-visible, invented-certainty" })
  );
  const { errors } = validateReport(report);
  assert.ok(errors.some((error) => error.includes("invented-certainty")));
});

test("rejects a known model when schema v2 says identity was not exposed", () => {
  const report = fixture(v2Frontmatter(), v2Body({ challengeModelExposed: "false" }));
  const { errors } = validateReport(report);
  assert.ok(errors.some((error) => error.includes('requires model "unknown"')));
});

test("rejects a schema v2 challenge without its required rival explanation", () => {
  const body = v2Body().replace(
    "| narrowed | The control may be optional | Repeat through visible UI |",
    "| narrowed |  | Repeat through visible UI |"
  );
  const { errors } = validateReport(fixture(v2Frontmatter(), body));
  assert.ok(errors.some((error) => error.includes("Rival explanation")));
});

test("rejects a schema v2 witness that did not pass its privacy check", () => {
  const body = v2Body().replace(
    "Witness noticed more technical framing | passed |",
    "Witness noticed more technical framing | failed |"
  );
  const { errors } = validateReport(fixture(v2Frontmatter(), body));
  assert.ok(errors.some((error) => error.includes("privacy check must be passed")));
});

test("rejects a schema v2 paired draw with a blank adoption decision", () => {
  const body = v2Body().replace(
    "| substantive-change | useful | partial | light |",
    "| substantive-change | useful |  | light |"
  );
  const { errors } = validateReport(fixture(v2Frontmatter(), body));
  assert.ok(errors.some((error) => error.includes("Author adoption")));
});

test("accepts one disclosed targeted counterfactual with different fingerprints", () => {
  const report = fixture(
    frontmatter({ counterfactual_probes: "1" }),
    withCounterfactualDisclosure()
  );
  const { errors } = validateReport(report);
  assert.deepEqual(errors, []);
});

test("accepts a disclosed targeted counterfactual in a CRLF report", () => {
  const report = fixture(
    frontmatter({ counterfactual_probes: "1" }).replace(/\n/g, "\r\n"),
    withCounterfactualDisclosure().replace(/\n/g, "\r\n")
  );
  const { errors } = validateReport(report);
  assert.deepEqual(errors, []);
});

test("rejects a counterfactual count without the required disclosure", () => {
  const report = fixture(v2Frontmatter({ counterfactual_probes: "1" }), v2Body());
  const { errors } = validateReport(report);
  assert.ok(errors.some((error) => error.includes("requires a ### Targeted Counterfactual")));
});

test("rejects an unchanged prompt mislabeled as a counterfactual", () => {
  const fingerprint = "a".repeat(64);
  const report = fixture(
    frontmatter({ counterfactual_probes: "1" }),
    withCounterfactualDisclosure(BODY, {
      baseFingerprint: fingerprint,
      counterfactualFingerprint: fingerprint
    })
  );
  const { errors } = validateReport(report);
  assert.ok(errors.some((error) => error.includes("unchanged prompt is a retry")));
});

test("rejects a counterfactual disclosure when the count is zero", () => {
  const report = fixture(frontmatter(), withCounterfactualDisclosure());
  const { errors } = validateReport(report);
  assert.ok(errors.some((error) => error.includes("must be 1")));
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
