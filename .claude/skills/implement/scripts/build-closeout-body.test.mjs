import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import test from "node:test";

import { buildAcceptanceManifest, buildAuditScaffold } from "./build-acceptance-manifest.mjs";
import {
  DEFAULT_CLOSEOUT_BODY_MAX_BYTES,
  DEFAULT_CLOSEOUT_EVIDENCE_HEADROOM_BYTES,
  assertCloseoutBodySize,
  buildCloseoutBodyPlan,
  buildCloseoutBodyScaffold,
  buildCloseoutBodySizePlan,
  validateAuditInput
} from "./build-closeout-body.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const builder = resolve(here, "build-closeout-body.mjs");
const normalReviewValidator = resolve(here, "../../code-review/scripts/validate-review-normal-body.mjs");

const manifest = buildAcceptanceManifest([
  {
    number: 364,
    title: "Parent PRD",
    body: `## Acceptance criteria

- [ ] Parent behavior

## Principles
`
  },
  {
    number: 368,
    title: "Replay child",
    body: `## Acceptance criteria

- [ ] Replay the production route
`
  }
]);

test("buildCloseoutBodyScaffold emits selected normal-review closeout fields", () => {
  const body = buildCloseoutBodyScaffold(manifest, {
    parentIssue: 364,
    reviewMode: "normal",
    immediateFix: true,
    tddParentRollup: true,
    browser: true,
    principles: true,
    localOnly: true,
    fixedChildMode: "pending"
  });

  assert.match(body, /^Implementation closeout for #364/m);
  assert.match(body, /Scaffold status: incomplete/);
  assert.match(body, /Local-only SHA: <final SHA> is not remote-reachable/);
  assert.match(body, /TDD closeout preflight:/);
  assert.match(body, /Evidence-only proof server preflight:/);
  assert.match(body, /proof server preflight <present or N\/A>/);
  assert.match(body, /Review: code-review against <resolved fixed point>/);
  assert.match(body, /outcome findings fixed/);
  for (const label of [
    "Initial Standards outcome:",
    "Initial Spec outcome:",
    "Final Standards outcome:",
    "Final Spec outcome:",
    "Findings found:",
    "Fixes made:",
    "TDD\/review-fix evidence:",
    "TDD closeout gate:",
    "Verification rerun:",
    "Browser\/manual evidence freshness:",
    "Browser\/manual console state:",
    "Commit handling:"
  ]) {
    assert.match(body, new RegExp(label));
  }
  assert.match(body, /## Standards[\s\S]+## Spec/);
  assert.match(body, /Browser evidence:\n- Route\/action\/outcome:/);
  assert.match(body, /no hits outside classified identity\/history lines and no active-proof hits/);
  assert.match(body, /fixture paths <path 1 \| path 2 \| none/);
  assert.match(body, /every normalized exact superseded value individually/);
  assert.match(body, /Fixed child inline close comment: Completed by <final SHA>\. Evidence: this parent rollup comment URL/);
  assert.match(body, /\| #364 \| AC1 - Parent behavior \|/);
  assert.match(body, /\| #368 \| AC1 - Replay the production route \|/);
  assert.doesNotMatch(body, /\| satisfied \|/);
  assert.doesNotMatch(body, /Review fallback:/);
});

test("normal immediate-fix scaffold satisfies the normal-review validator after filling generated fields", () => {
  const generated = buildCloseoutBodyScaffold(manifest, {
    parentIssue: 364,
    reviewMode: "normal",
    immediateFix: true
  });
  const body = generated
    .replace(
      /^Review:.*$/m,
      "Review: code-review against abcdef0; outcome findings fixed; verification rerun node --test."
    )
    .replace(
      /^Review subagents:.*$/m,
      "Review subagents: Standards final reviewer standards-final completed; Spec final reviewer spec-final completed"
    )
    .replace(
      /^Review subagent cleanup:.*$/m,
      "Review subagent cleanup: Standards closed; Spec closed"
    )
    .replace(/^Findings:.*$/gm, "Findings: none")
    .replace(/^Axis summary:.*$/m, "Axis summary: Standards 0/none, Spec 0/none")
    .replace(/^Residual findings:.*$/m, "Residual findings: none")
    .replace(
      /^Spec sequence coverage:.*$/m,
      "Spec sequence coverage: sequence: N/A because the reviewed criteria are not sequence-sensitive"
    )
    .replace(/^Initial Standards outcome:.*$/m, "Initial Standards outcome: 1/medium before fixes")
    .replace(/^Initial Spec outcome:.*$/m, "Initial Spec outcome: 0/none before fixes")
    .replace(/^Final Standards outcome:.*$/m, "Final Standards outcome: 0/none after final re-review")
    .replace(/^Final Spec outcome:.*$/m, "Final Spec outcome: 0/none after final re-review")
    .replace(/^Findings found:.*$/m, "Findings found: 1 Standards finding")
    .replace(/^Fixes made:.*$/m, "Fixes made: scaffold field corrected")
    .replace(
      /^TDD\/review-fix evidence:.*$/m,
      "TDD/review-fix evidence: red-first skipped because Standards-only fix did not change behavior"
    )
    .replace(/^TDD closeout gate:.*$/m, "TDD closeout gate: N/A because no tdd skill was invoked")
    .replace(/^Verification rerun:.*$/m, "Verification rerun: node --test passed")
    .replace(
      /^Browser\/manual evidence freshness:.*$/m,
      "Browser/manual evidence freshness: N/A because no browser/manual evidence was used"
    )
    .replace(
      /^Browser\/manual console state:.*$/m,
      "Browser/manual console state: N/A because no browser/manual evidence was used"
    )
    .replace(
      /^Backend process currentness:.*$/m,
      "Backend process currentness: N/A because no browser/manual evidence was used"
    )
    .replace(/^Commit handling:.*$/m, "Commit handling: follow-up commit abcdef0")
    .replace(
      /^- Current evidence identities:.*$/m,
      "- Current evidence identities: fixture paths none; browser sessions none; packet paths/hashes none; active revisions none; artifacts none"
    )
    .replace(/^- Historical red identities retained:.*$/m, "- Historical red identities retained: none")
    .replace(
      /^- Superseded evidence identities:.*$/m,
      "- Superseded evidence identities: fixture paths none; browser sessions none; packet paths/hashes none; active revisions none; artifacts none"
    )
    .replace(/^- Superseded-token sweep:.*$/m, "- Superseded-token sweep: N/A because every superseded category is none");

  const directory = mkdtempSync(join(tmpdir(), "implement-normal-review-scaffold-test-"));
  const bodyPath = join(directory, "body.md");
  writeFileSync(bodyPath, body);
  const result = spawnSync(process.execPath, [normalReviewValidator, bodyPath, "--immediate-fix"], {
    encoding: "utf8"
  });
  rmSync(directory, { recursive: true, force: true });

  assert.equal(result.status, 0, result.stderr);
});

test("buildCloseoutBodyScaffold emits immediate-fix fallback fields", () => {
  const body = buildCloseoutBodyScaffold(manifest, {
    parentIssue: 364,
    reviewMode: "fallback",
    immediateFix: true
  });

  assert.match(body, /Review fallback:/);
  for (const label of [
    "Browser/manual evidence freshness:",
    "Browser/manual console state:",
    "Backend process currentness:",
    "Findings found:",
    "Fixes made:",
    "TDD\/review-fix evidence:",
    "Verification rerun:",
    "Commit handling:",
    "Residual findings:"
  ]) {
    assert.match(body, new RegExp(label));
  }
});

test("buildCloseoutBodyScaffold preserves a completed exact audit input", () => {
  const audit = buildAuditScaffold(manifest)
    .replaceAll("atoms: TODO", "atoms: exact")
    .replaceAll("proof surfaces: TODO", "proof surfaces: focused test")
    .replaceAll(
      "sequence: TODO or N/A because criterion is not sequence-sensitive",
      "sequence: N/A because criterion is not sequence-sensitive"
    )
    .replaceAll("| not done |", "| satisfied |");
  const body = buildCloseoutBodyScaffold(manifest, {
    parentIssue: 364,
    audit,
    reviewMode: "normal"
  });

  assert.equal(body.split(audit.trim()).length - 1, 1);
  assert.equal(validateAuditInput(manifest, audit), audit.trim());
});

test("validateAuditInput rejects missing exact manifest coverage", () => {
  const audit = buildAuditScaffold(manifest).replace(
    /^\| #368 \| AC1 - Replay the production route .*\n/m,
    ""
  );

  assert.throws(
    () => validateAuditInput(manifest, audit),
    /#368 AC1 requires exactly one exact audit row; found 0/
  );
});

test("closeout scaffold enforces the configured UTF-8 byte ceiling", () => {
  assert.equal(assertCloseoutBodySize("é", 2), "é");
  assert.throws(() => assertCloseoutBodySize("é", 1), /closeout body is 2 bytes; maximum is 1 bytes/);
  assert.throws(
    () => buildCloseoutBodyScaffold(manifest, {
      parentIssue: 364,
      reviewMode: "normal",
      maxBytes: 100
    }),
    /Shorten concrete evidence or split it into separately validated durable tracker sinks/
  );
  assert.equal(DEFAULT_CLOSEOUT_BODY_MAX_BYTES, 65_536);
});

test("closeout size plan reports scaffold, audit, and evidence headroom", () => {
  const audit = buildAuditScaffold(manifest);
  const { body, sizePlan } = buildCloseoutBodyPlan(manifest, {
    parentIssue: 364,
    audit,
    reviewMode: "normal"
  });

  assert.equal(sizePlan.scaffoldBytes, Buffer.byteLength(body, "utf8"));
  assert.equal(sizePlan.auditBytes, Buffer.byteLength(audit.trim(), "utf8"));
  assert.equal(
    sizePlan.remainingBytes,
    DEFAULT_CLOSEOUT_BODY_MAX_BYTES - sizePlan.scaffoldBytes
  );
  assert.equal(
    sizePlan.recommendedEvidenceHeadroomBytes,
    DEFAULT_CLOSEOUT_EVIDENCE_HEADROOM_BYTES
  );
  assert.equal(sizePlan.status, "ok");

  const lowHeadroom = buildCloseoutBodySizePlan("x".repeat(90), "audit", 100);
  assert.deepEqual(lowHeadroom, {
    maxBytes: 100,
    scaffoldBytes: 90,
    auditBytes: 5,
    nonAuditScaffoldBytes: 85,
    remainingBytes: 10,
    recommendedEvidenceHeadroomBytes: 25,
    status: "low-headroom"
  });
  assert.equal(buildCloseoutBodySizePlan("x".repeat(101), "audit", 100).status, "exceeds-limit");
});

test("buildCloseoutBodyScaffold emits fallback and explicit N/A branches", () => {
  const body = buildCloseoutBodyScaffold(manifest, {
    parentIssue: 364,
    reviewMode: "fallback",
    fixedChildMode: "none"
  });

  assert.match(body, /Review fallback gate passed:/);
  assert.match(body, /Review fallback: <why code-review could not run>/);
  assert.match(body, /Browser\/manual evidence freshness:/);
  assert.match(body, /Browser\/manual console state:/);
  assert.match(body, /Backend process currentness:/);
  assert.match(body, /TDD evidence: N\/A because no tdd skill was invoked/);
  assert.match(body, /Browser evidence: N\/A because <reason no browser\/manual evidence applies>/);
  assert.match(body, /Principles\/ADR conformance: N\/A because no in-scope issue has a Principles section/);
  assert.match(body, /Fixed child inline close comment: N\/A because no fixed-template child closeout applies/);
});

test("closeout scaffold CLI writes a deterministic body", () => {
  const directory = mkdtempSync(join(tmpdir(), "implement-closeout-scaffold-test-"));
  const manifestPath = join(directory, "manifest.json");
  const auditPath = join(directory, "audit.md");
  const outputPath = join(directory, "closeout.md");
  writeFileSync(manifestPath, JSON.stringify(manifest));
  writeFileSync(auditPath, buildAuditScaffold(manifest));

  const args = [
    builder,
    manifestPath,
    "--audit-input",
    auditPath,
    "--output",
    outputPath,
    "--parent",
    "364",
    "--review",
    "normal",
    "--immediate-fix",
    "--tdd-parent-rollup",
    "--browser",
    "--principles",
    "--local-only",
    "--fixed-child",
    "pending"
  ];
  const first = spawnSync(process.execPath, args, { encoding: "utf8" });
  const firstBody = readFileSync(outputPath, "utf8");
  const second = spawnSync(process.execPath, args, { encoding: "utf8" });
  const secondBody = readFileSync(outputPath, "utf8");
  rmSync(directory, { recursive: true, force: true });

  assert.equal(first.status, 0, first.stderr);
  assert.equal(second.status, 0, second.stderr);
  assert.equal(secondBody, firstBody);
});

test("closeout scaffold CLI refuses an oversized output", () => {
  const directory = mkdtempSync(join(tmpdir(), "implement-closeout-size-test-"));
  const manifestPath = join(directory, "manifest.json");
  const outputPath = join(directory, "closeout.md");
  writeFileSync(manifestPath, JSON.stringify(manifest));

  const result = spawnSync(
    process.execPath,
    [
      builder,
      manifestPath,
      "--output",
      outputPath,
      "--parent",
      "364",
      "--review",
      "normal",
      "--max-bytes",
      "100"
    ],
    { encoding: "utf8" }
  );

  assert.equal(result.status, 1);
  assert.match(result.stderr, /maximum is 100 bytes/);
  assert.equal(existsSync(outputPath), false);
  rmSync(directory, { recursive: true, force: true });
});

test("closeout scaffold CLI emits a size plan and can require fill headroom", () => {
  const directory = mkdtempSync(join(tmpdir(), "implement-closeout-plan-test-"));
  const manifestPath = join(directory, "manifest.json");
  const outputPath = join(directory, "closeout.md");
  writeFileSync(manifestPath, JSON.stringify(manifest));
  const basePlan = buildCloseoutBodyPlan(manifest, {
    parentIssue: 364,
    reviewMode: "normal"
  }).sizePlan;
  const maxBytes = basePlan.scaffoldBytes + 10;

  const result = spawnSync(
    process.execPath,
    [
      builder,
      manifestPath,
      "--output",
      outputPath,
      "--parent",
      "364",
      "--review",
      "normal",
      "--max-bytes",
      String(maxBytes),
      "--size-plan",
      "--require-headroom"
    ],
    { encoding: "utf8" }
  );

  assert.equal(result.status, 1);
  assert.equal(JSON.parse(result.stdout).status, "low-headroom");
  assert.match(result.stderr, /recommended minimum headroom/);
  assert.equal(existsSync(outputPath), false);
  rmSync(directory, { recursive: true, force: true });
});
