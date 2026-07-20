#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const usage = `Usage:
  node .claude/skills/to-issues/scripts/check-artifact-durability.mjs <publication-ref> <path> [<path>...]

Exit codes:
  0  Every path is tracked, clean, visible at the ref, and content-identical.
  1  At least one path is not durable.
  2  Usage, ref resolution, or Git execution failed.`;

const runGit = (cwd, args) => {
  const result = spawnSync("git", args, { cwd, encoding: "utf8" });
  if (result.error) throw result.error;
  return result;
};

export const classifyGitExecutionFailure = (error) => {
  const sandboxRestricted = error?.code === "EPERM" || /\bEPERM\b/.test(error?.message ?? "");
  return {
    error: error?.message ?? String(error),
    kind: sandboxRestricted ? "sandbox-restricted" : "git-execution-failed",
    recovery: sandboxRestricted
      ? "Rerun with the host's approved execution escalation when available; otherwise use the documented per-path manual fallback."
      : "Inspect the Git error and use the documented per-path manual fallback only when the helper itself cannot run.",
  };
};

const requireGitSuccess = (cwd, args, label) => {
  const result = runGit(cwd, args);
  if (result.status !== 0) {
    throw new Error(`${label}: ${(result.stderr || result.stdout || `git exited ${result.status}`).trim()}`);
  }
  return result.stdout.trim();
};

const trackedAtWorktree = (cwd, path) => {
  const result = runGit(cwd, ["ls-files", "--error-unmatch", "--", path]);
  if (result.status === 0) return true;
  if (result.status === 1) return false;
  throw new Error(`Cannot inspect tracked state for ${path}: ${(result.stderr || result.stdout).trim()}`);
};

const visibleAtRef = (cwd, publicationRef, path) =>
  runGit(cwd, ["cat-file", "-e", `${publicationRef}:${path}`]).status === 0;

const identicalToRef = (cwd, publicationRef, path) => {
  const result = runGit(cwd, ["diff", "--quiet", publicationRef, "--", path]);
  if (result.status === 0) return true;
  if (result.status === 1) return false;
  throw new Error(`Cannot compare ${path} with ${publicationRef}: ${(result.stderr || result.stdout).trim()}`);
};

export const checkArtifactDurability = ({
  cwd = process.cwd(),
  paths,
  publicationRef,
}) => {
  if (typeof publicationRef !== "string" || publicationRef.trim() === "") {
    throw new Error("publicationRef is required.");
  }
  if (!Array.isArray(paths) || paths.length === 0 || paths.some((path) => typeof path !== "string" || path.trim() === "")) {
    throw new Error("At least one non-empty path is required.");
  }

  const publicationRefSha = requireGitSuccess(
    cwd,
    ["rev-parse", "--verify", `${publicationRef}^{commit}`],
    `Cannot resolve publication ref ${publicationRef}`,
  );
  const artifacts = paths.map((path) => {
    const tracked = trackedAtWorktree(cwd, path);
    const worktreeStatus = requireGitSuccess(
      cwd,
      ["status", "--porcelain", "--", path],
      `Cannot inspect worktree state for ${path}`,
    );
    const worktreeClean = worktreeStatus === "";
    const refVisible = visibleAtRef(cwd, publicationRef, path);
    const contentIdentical = tracked && refVisible
      ? identicalToRef(cwd, publicationRef, path)
      : null;
    const reasons = [];
    if (!tracked) reasons.push("untracked");
    if (!worktreeClean) reasons.push("worktree-dirty");
    if (!refVisible) reasons.push("absent-at-ref");
    if (contentIdentical === false) reasons.push("content-differs-from-ref");
    return {
      path,
      tracked,
      worktreeClean,
      visibleAtRef: refVisible,
      identicalToRef: contentIdentical,
      durable: tracked && worktreeClean && refVisible && contentIdentical === true,
      reasons,
    };
  });

  return {
    publicationRef,
    publicationRefSha,
    allDurable: artifacts.every((artifact) => artifact.durable),
    artifacts,
  };
};

const main = () => {
  const args = process.argv.slice(2);
  if (args.includes("--help")) {
    console.log(usage);
    process.exit(0);
  }
  if (args.length < 2) {
    console.error(usage);
    process.exit(2);
  }

  try {
    const [publicationRef, ...paths] = args;
    const report = checkArtifactDurability({ publicationRef, paths });
    console.log(JSON.stringify(report, null, 2));
    process.exit(report.allDurable ? 0 : 1);
  } catch (error) {
    console.error(JSON.stringify(classifyGitExecutionFailure(error), null, 2));
    process.exit(2);
  }
};

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) main();
