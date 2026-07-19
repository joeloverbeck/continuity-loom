import assert from "node:assert/strict";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync
} from "node:fs";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import test from "node:test";

import { prepareRun, slugify, timestampForId } from "./prepare-run.mjs";

test("normalizes story slugs and timestamps", () => {
  assert.equal(slugify("  Red / Blue: Again! "), "red-blue-again");
  assert.equal(timestampForId(new Date("2026-07-17T12:34:56.789Z")), "2026-07-17T123456Z");
});

test("prepares a new-story run without creating the project folder", () => {
  const repoRoot = mkdtempSync(join(tmpdir(), "loom-playtest-prepare-new-"));
  const uniqueTitle = `New Story ${basename(repoRoot)}`;
  try {
    const result = prepareRun({
      storyTitle: uniqueTitle,
      repoRoot,
      now: new Date("2026-07-17T12:34:56.000Z")
    });

    assert.equal(result.mode, "new_story");
    assert.equal(result.priorReport, null);
    assert.equal(result.continuationBlocker, null);
    assert.ok(result.projectPath.startsWith("/tmp/continuity-loom-playtest-projects/"));
    assert.equal(existsSync(result.projectPath), false);
    assert.equal(existsSync(result.scratchpad), true);
    assert.equal(existsSync(result.evidenceDir), true);
    const scratchpad = readFileSync(result.scratchpad, "utf8");
    assert.match(scratchpad, /## Quantitative journey ledger/);
    assert.match(
      scratchpad,
      /- Status: inactive - activate only when the invocation requests counts or cost comparisons/
    );
    assert.match(
      scratchpad,
      /\| ID \| Timestamp \| Phase \| Visible action \| Kind \| Field label \/ instance \| Distinct field\? \| Successful write \/ selection\? \| Counted\? \| Exclusion reason \|/
    );
    assert.match(scratchpad, /### Quantitative boundary snapshots/);
  } finally {
    rmSync(repoRoot, { recursive: true, force: true });
    rmSync(
      join(
        "/tmp",
        "continuity-loom-playtest",
        `playtest-${slugify(uniqueTitle)}-2026-07-17T123456Z`
      ),
      { recursive: true, force: true }
    );
  }
});

test("reads an existing continuation project from a supplied report", () => {
  const repoRoot = mkdtempSync(join(tmpdir(), "loom-playtest-prepare-cont-"));
  const projectPath = join(repoRoot, "existing-project");
  const reportPath = join(repoRoot, "reports", "prior.md");
  const uniqueTitle = `Continued Story ${basename(repoRoot)}`;
  mkdirSync(projectPath, { recursive: true });
  mkdirSync(join(repoRoot, "reports"), { recursive: true });
  writeFileSync(
    reportPath,
    `---\nrun_id: prior-run\nproject_path: ${projectPath}\n---\n# Prior\n`,
    "utf8"
  );

  try {
    const result = prepareRun({
      storyTitle: uniqueTitle,
      priorReport: "reports/prior.md",
      repoRoot,
      now: new Date("2026-07-17T13:00:00.000Z")
    });

    assert.equal(result.mode, "continuation");
    assert.equal(result.projectPath, projectPath);
    assert.equal(result.priorRunId, "prior-run");
    assert.equal(result.continuationBlocker, null);
  } finally {
    rmSync(repoRoot, { recursive: true, force: true });
    rmSync(
      join(
        "/tmp",
        "continuity-loom-playtest",
        `playtest-${slugify(uniqueTitle)}-2026-07-17T130000Z`
      ),
      { recursive: true, force: true }
    );
  }
});

test("marks a missing continuation project instead of inventing one", () => {
  const repoRoot = mkdtempSync(join(tmpdir(), "loom-playtest-prepare-missing-"));
  const reportPath = join(repoRoot, "reports", "prior.md");
  const missingPath = join(repoRoot, "missing-project");
  const uniqueTitle = `Missing Story ${basename(repoRoot)}`;
  mkdirSync(join(repoRoot, "reports"), { recursive: true });
  writeFileSync(
    reportPath,
    `---\nrun_id: prior-run\nproject_path: ${missingPath}\n---\n# Prior\n`,
    "utf8"
  );

  try {
    const result = prepareRun({
      storyTitle: uniqueTitle,
      priorReport: "reports/prior.md",
      repoRoot,
      now: new Date("2026-07-17T14:00:00.000Z")
    });
    assert.equal(result.continuationBlocker, "continuation-project-missing");
    assert.equal(result.projectPath, missingPath);
  } finally {
    rmSync(repoRoot, { recursive: true, force: true });
    rmSync(
      join(
        "/tmp",
        "continuity-loom-playtest",
        `playtest-${slugify(uniqueTitle)}-2026-07-17T140000Z`
      ),
      { recursive: true, force: true }
    );
  }
});

test("keeps a missing project_path null and marks the continuation blocked", () => {
  const repoRoot = mkdtempSync(join(tmpdir(), "loom-playtest-prepare-no-path-"));
  const reportPath = join(repoRoot, "reports", "prior.md");
  const uniqueTitle = `No Path Story ${basename(repoRoot)}`;
  mkdirSync(join(repoRoot, "reports"), { recursive: true });
  writeFileSync(reportPath, "---\nrun_id: prior-run\nproject_path: null\n---\n# Prior\n", "utf8");

  try {
    const result = prepareRun({
      storyTitle: uniqueTitle,
      priorReport: "reports/prior.md",
      repoRoot,
      now: new Date("2026-07-17T15:00:00.000Z")
    });
    assert.equal(result.continuationBlocker, "prior-report-missing-project-path");
    assert.equal(result.projectPath, null);
  } finally {
    rmSync(repoRoot, { recursive: true, force: true });
    rmSync(
      join(
        "/tmp",
        "continuity-loom-playtest",
        `playtest-${slugify(uniqueTitle)}-2026-07-17T150000Z`
      ),
      { recursive: true, force: true }
    );
  }
});

test("does not create run artifacts when the prior report is invalid", () => {
  const repoRoot = mkdtempSync(join(tmpdir(), "loom-playtest-prepare-invalid-"));
  const uniqueTitle = `Invalid Prior ${basename(repoRoot)}`;
  const runRoot = join(
    "/tmp",
    "continuity-loom-playtest",
    `playtest-${slugify(uniqueTitle)}-2026-07-17T160000Z`
  );
  const evidenceDir = join(
    repoRoot,
    "reports",
    "assets",
    `playtest-${slugify(uniqueTitle)}-2026-07-17T160000Z`
  );

  try {
    assert.throws(
      () =>
        prepareRun({
          storyTitle: uniqueTitle,
          priorReport: "reports/missing.md",
          repoRoot,
          now: new Date("2026-07-17T16:00:00.000Z")
        }),
      /Prior report does not exist/
    );
    assert.equal(existsSync(runRoot), false);
    assert.equal(existsSync(evidenceDir), false);
  } finally {
    rmSync(repoRoot, { recursive: true, force: true });
    rmSync(runRoot, { recursive: true, force: true });
  }
});
