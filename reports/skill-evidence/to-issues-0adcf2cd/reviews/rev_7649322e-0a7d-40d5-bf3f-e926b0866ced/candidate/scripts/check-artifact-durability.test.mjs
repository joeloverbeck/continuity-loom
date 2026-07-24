import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import {
  checkArtifactDurability,
  classifyGitExecutionFailure,
} from "./check-artifact-durability.mjs";

const script = fileURLToPath(new URL("./check-artifact-durability.mjs", import.meta.url));

const git = (cwd, args) => execFileSync("git", args, { cwd, encoding: "utf8" }).trim();

const createRepository = () => {
  const directory = mkdtempSync(join(tmpdir(), "to-issues-durability-"));
  git(directory, ["init", "--quiet"]);
  git(directory, ["config", "user.email", "tests@example.com"]);
  git(directory, ["config", "user.name", "To Issues Tests"]);
  writeFileSync(join(directory, "tracked.md"), "version one\n");
  git(directory, ["add", "tracked.md"]);
  git(directory, ["commit", "--quiet", "-m", "initial"]);
  return directory;
};

test("reports a tracked clean path as durable", () => {
  const directory = createRepository();
  try {
    const report = checkArtifactDurability({
      cwd: directory,
      publicationRef: "HEAD",
      paths: ["tracked.md"],
    });

    assert.equal(report.allDurable, true);
    assert.deepEqual(report.artifacts, [{
      path: "tracked.md",
      tracked: true,
      worktreeClean: true,
      visibleAtRef: true,
      identicalToRef: true,
      durable: true,
      reasons: [],
    }]);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("never reports an absent path as content-identical", () => {
  const directory = createRepository();
  try {
    const report = checkArtifactDurability({
      cwd: directory,
      publicationRef: "HEAD",
      paths: ["missing.md"],
    });

    assert.equal(report.allDurable, false);
    assert.equal(report.artifacts[0].tracked, false);
    assert.equal(report.artifacts[0].visibleAtRef, false);
    assert.equal(report.artifacts[0].identicalToRef, null);
    assert.deepEqual(report.artifacts[0].reasons, ["untracked", "absent-at-ref"]);

    const cli = spawnSync(process.execPath, [script, "HEAD", "missing.md"], {
      cwd: directory,
      encoding: "utf8",
    });
    assert.equal(cli.status, 1);
    assert.equal(JSON.parse(cli.stdout).artifacts[0].identicalToRef, null);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("reports clean local-only content as different from an older publication ref", () => {
  const directory = createRepository();
  try {
    const publicationRef = git(directory, ["rev-parse", "HEAD"]);
    writeFileSync(join(directory, "tracked.md"), "version two\n");
    git(directory, ["add", "tracked.md"]);
    git(directory, ["commit", "--quiet", "-m", "local-only"]);

    const report = checkArtifactDurability({
      cwd: directory,
      publicationRef,
      paths: ["tracked.md"],
    });

    assert.equal(report.allDurable, false);
    assert.deepEqual(report.artifacts[0], {
      path: "tracked.md",
      tracked: true,
      worktreeClean: true,
      visibleAtRef: true,
      identicalToRef: false,
      durable: false,
      reasons: ["content-differs-from-ref"],
    });
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("classifies sandbox-blocked Git execution with an actionable recovery", () => {
  const error = Object.assign(new Error("spawnSync git EPERM"), { code: "EPERM" });

  assert.deepEqual(classifyGitExecutionFailure(error), {
    error: "spawnSync git EPERM",
    kind: "sandbox-restricted",
    recovery:
      "Rerun with the host's approved execution escalation when available; otherwise use the documented per-path manual fallback.",
  });
});
