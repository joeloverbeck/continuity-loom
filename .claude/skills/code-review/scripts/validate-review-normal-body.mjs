#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { validateTddCloseoutBody } from "../../tdd/scripts/validate-tdd-closeout-body.mjs";
import {
  fieldValue,
  fieldValues,
  unresolvedValue,
  validateReviewClosingBodySize,
  validateReviewEvidenceIdentities,
  validateReviewFindingLedger,
  validateReviewFixtureSnapshotCurrentness,
  validateReviewSpecCoverage
} from "./review-evidence-contract.mjs";

const usage =
  "Usage: node .claude/skills/code-review/scripts/validate-review-normal-body.mjs <body.md> [--immediate-fix] [--parent-prd] [--child-family] [--issue-set] [--acceptance-manifest <path>] [--browser] [--tdd] [--tdd-parent-rollup] [--closing --expected-final-sha <sha>] [--max-bytes <positive integer>]";

const validateRevisitTrigger = (value) => {
  if (unresolvedValue(value)) return "is empty or unresolved";
  if (/^N\/A\b/i.test(value) && !/^N\/A because permanently accepted judgement\b/i.test(value)) {
    return "must use 'N/A because permanently accepted judgement' for a permanent decision";
  }
  if (/^(?:later|future|if needed|when needed|none)$/i.test(value)) {
    return "must name a concrete reopening condition";
  }
  return "";
};

const acceptedResidualRecords = (body) => {
  const lines = body.split(/\r?\n/);
  const starts = [];

  for (let index = 0; index < lines.length; index += 1) {
    if (/^\s*[-*]?\s*(?:\*\*)?Accepted residual(?:\*\*)?:/i.test(lines[index])) {
      starts.push(index);
    }
  }

  return starts.map((start, index) => {
    const end = starts[index + 1] ?? lines.length;
    return lines.slice(start, end).join("\n");
  });
};

export const validateAcceptedResiduals = (body, errors) => {
  const claimsAcceptedResiduals = /\baccepted residuals?\b/i.test(body);
  const records = acceptedResidualRecords(body);

  if (claimsAcceptedResiduals && records.length === 0) {
    errors.push("accepted residuals require one structured Accepted residual record per finding");
    return;
  }

  for (const [index, record] of records.entries()) {
    const number = index + 1;
    const title = fieldValue(record, "Accepted residual");
    const axis = fieldValue(record, "Axis");
    const source = fieldValue(record, "Source");
    const rationale = fieldValue(record, "Rationale");
    const revisitTrigger = fieldValue(record, "Revisit trigger");

    if (unresolvedValue(title)) errors.push(`accepted residual ${number} has no concrete title`);
    if (!/^(?:Standards|Spec)$/i.test(axis)) {
      errors.push(`accepted residual ${number} Axis must be Standards or Spec`);
    }
    if (unresolvedValue(source)) errors.push(`accepted residual ${number} has no concrete Source`);
    if (unresolvedValue(rationale)) errors.push(`accepted residual ${number} has no concrete Rationale`);

    const triggerError = validateRevisitTrigger(revisitTrigger);
    if (triggerError) errors.push(`accepted residual ${number} Revisit trigger ${triggerError}`);
  }

  if (records.length && !/unhandled findings\s+none beyond accepted residuals/i.test(body)) {
    errors.push("accepted residuals require 'unhandled findings none beyond accepted residuals'");
  }
};

const validateSubagentStatuses = (value, errors, options = {}) => {
  if (unresolvedValue(value)) {
    errors.push("Review subagents is empty or unresolved");
    return;
  }
  if (/\b(?:running|pending|active|still-running|cleanup failed)\b/i.test(value)) {
    errors.push("Review subagents includes a non-terminal or failed-cleanup status");
  }

  for (const [axis, otherAxis] of [["Standards", "Spec"], ["Spec", "Standards"]]) {
    const start = value.search(new RegExp(`\\b${axis}\\b`, "i"));
    const otherStart = start < 0 ? -1 : value.slice(start + axis.length).search(new RegExp(`\\b${otherAxis}\\b`, "i"));
    const end = otherStart < 0 ? value.length : start + axis.length + otherStart;
    const axisBlock = start < 0 ? "" : value.slice(start, end);
    if (!/\b(?:completed|complete|closed|done)\b/i.test(axisBlock)) {
      errors.push(`Review subagents must name the ${axis} reviewer and a terminal final status`);
    }
    if (options.requireFinal) {
      const terminal = "(?:completed|complete|closed|done)";
      const separateReviewers = new RegExp(
        `\\binitial reviewer\\s+\\S+\\s+${terminal}\\b[\\s\\S]*?\\bfinal reviewer\\s+\\S+\\s+${terminal}\\b`,
        "i"
      );
      const sameReviewer = new RegExp(
        `\\binitial and final reviewer\\s+\\S+\\s+${terminal}\\b`,
        "i"
      );
      if (!separateReviewers.test(axisBlock) && !sameReviewer.test(axisBlock)) {
        errors.push(
          `Review subagents must name initial and final ${axis} reviewer identities with terminal statuses after fixes`
        );
      }
    }
  }
};

const validateSubagentCleanup = (value, errors) => {
  if (unresolvedValue(value)) {
    errors.push("Review subagent cleanup is empty or unresolved");
    return;
  }
  if (/\b(?:still-running|still running|cleanup failed|failed cleanup)\b/i.test(value)) {
    errors.push("Review subagent cleanup includes a failed or still-running disposition");
  }

  for (const [axis, otherAxis] of [["Standards", "Spec"], ["Spec", "Standards"]]) {
    const start = value.search(new RegExp(`\\b${axis}\\b`, "i"));
    const otherStart = start < 0 ? -1 : value.slice(start + axis.length).search(new RegExp(`\\b${otherAxis}\\b`, "i"));
    const end = otherStart < 0 ? value.length : start + axis.length + otherStart;
    const axisBlock = start < 0 ? "" : value.slice(start, end);
    if (!/\b(?:closed|close operation unavailable after terminal completion|auto-disposed after terminal completion)\b/i.test(axisBlock)) {
      errors.push(`Review subagent cleanup must name the ${axis} reviewer cleanup disposition`);
    }
  }
};

const validateFreshnessValue = (value) => {
  if (unresolvedValue(value)) return "is empty or unresolved";
  if (/^N\/A\b.+\bbecause\b.+\bno browser\/manual evidence was used\b/i.test(value)) return "";
  if (/\b(?:reran|re-ran|rerun|smoke)\b.+\b(?:passed|observed|result|artifact|screenshot)\b/i.test(value)) {
    return "";
  }
  if (/\b(?:blocked|stale)\b.+\b(?:because|reason|unable|cannot)\b/i.test(value)) return "";
  if (
    /\bnot affected because\b/i.test(value) &&
    /(?:`[^`]+`|[\w@.-]+\.(?:ts|tsx|js|mjs|md|json))/.test(value) &&
    /\b(?:targeted proof|diff inspected|git diff HEAD)\b/i.test(value)
  ) {
    return "";
  }
  return "must state final-tree rerun proof, a justified not-affected path with proof, a blocked/stale reason, or N/A because no browser/manual evidence was used";
};

const validateConsoleStateValue = (value) => {
  if (unresolvedValue(value)) return "is empty or unresolved";
  if (/^N\/A\b.+\bbecause\b.+\bno browser\/manual evidence was used\b/i.test(value)) return "";
  if (/\b0 errors?\b.+\b0 warnings?\b/i.test(value) || /\bno console (?:errors?|warnings?)\b/i.test(value)) {
    return "";
  }
  if (/\bclassified unrelated\b.+\b(?:evidence|because|source|reason)\b/i.test(value)) return "";
  if (/\b(?:blocked|unavailable)\b.+\b(?:because|reason|unable|cannot)\b/i.test(value)) return "";
  return "must state a clean console, classified unrelated output, a blocked reason, or N/A because no browser/manual evidence was used";
};

const validateBackendCurrentnessValue = (value) => {
  if (unresolvedValue(value)) return "is empty or unresolved";
  if (/^N\/A\b.+\bbecause\b.+\b(?:no browser\/manual (?:evidence|proof) was used|browser proof has no backend\/API dependency)\b/i.test(value)) {
    return "";
  }
  if (/\bblocked\b.+\b(?:because|reason|unable|cannot)\b/i.test(value)) return "";

  const hasServerCommand = /\bserver command\b/i.test(value);
  const hasWatchMode = /\bwatch(?:\/reload)? mode\b/i.test(value);
  const hasOwnership = /\b(?:process|port)(?:(?:\s+or\s+|\s*\/\s*)(?:process|port))? ownership\b/i.test(value);
  const hasRestartOrReloadProof = /\b(?:restart|reload)(?:\/(?:restart|reload))? proof\b/i.test(value);
  const hasExpectedApiProbe =
    /\bexpected(?: [\w-]+){0,3} API (?:field|behavior)(?: probe)?\b|\bAPI probe\b/i.test(value);
  if (hasServerCommand && hasWatchMode && hasOwnership && hasRestartOrReloadProof && hasExpectedApiProbe) return "";

  return "must state server command, watch/reload mode, process or port ownership, restart/reload proof, and expected API field/behavior probe, or a justified N/A/blocked reason";
};

const compatibleSha = (left, right) => {
  const normalizedLeft = left.toLowerCase();
  const normalizedRight = right.toLowerCase();
  return normalizedLeft.startsWith(normalizedRight) || normalizedRight.startsWith(normalizedLeft);
};

const currentnessCommitShas = (value) =>
  [...value.matchAll(/\b(?:final\s+)?commit(?:ted)?(?:\s+SHA)?\s+`?([0-9a-f]{7,40})\b`?/gi)]
    .map((match) => match[1]);

const validateRegressionDurability = (body, errors) => {
  const intendedRed = fieldValue(body, "Intended red command/failure");
  if (!intendedRed || !/\b(?:browser|Playwright|waitForResponse|manual probe|page\.)\b/i.test(intendedRed)) return;

  const durability = fieldValue(body, "Regression durability");
  if (unresolvedValue(durability)) {
    errors.push("transient browser/manual intended red requires Regression durability");
    return;
  }
  if (/^N\/A\b/i.test(durability)) {
    errors.push("Regression durability cannot be N/A for a transient browser/manual intended red");
  }
};

export const validateReviewNormalBody = (body, options = {}) => {
  const flags = new Set(options.flags ?? []);
  const errors = [];
  validateReviewClosingBodySize(body, errors, {
    closing: flags.has("--closing"),
    maxBytes: options.maxBytes
  });
  const requireText = (needle, label = needle) => {
    if (!body.includes(needle)) errors.push(`missing ${label}`);
  };
  const requireMatch = (regex, label) => {
    if (!regex.test(body)) errors.push(`missing ${label}`);
  };
  const requireField = (label) => {
    const value = fieldValue(body, label);
    if (unresolvedValue(value)) errors.push(`${label} is empty or unresolved`);
    return value;
  };

  requireText("## Standards");
  requireText("## Spec");
  requireMatch(/^\s*[-*]?\s*Review:\s+code-review against\s+\S.+$/im, "normal Review: evidence line");
  if (/^\s*[-*]?\s*Review fallback:/im.test(body) || body.includes("Review fallback gate passed:")) {
    errors.push("normal review body contains fallback evidence or labeling");
  }

  const immediateFix = flags.has("--immediate-fix") || Boolean(fieldValue(body, "Findings found"));
  const reviewedHeadSha = body.match(/\breviewed HEAD SHA\s+`?([0-9a-f]{7,40})\b`?/i)?.[1] ?? "";
  validateSubagentStatuses(requireField("Review subagents"), errors, { requireFinal: immediateFix });
  validateSubagentCleanup(requireField("Review subagent cleanup"), errors);
  const axisSummary = requireField("Axis summary");
  if (!/^Standards\s+.+?,\s*Spec\s+.+/i.test(axisSummary)) {
    errors.push("Axis summary must report Standards and Spec separately");
  }

  const residualFindings = requireField("Residual findings");
  const hasAcceptedResiduals = /\baccepted residuals?\b/i.test(body);
  if (!/^none\b/i.test(residualFindings) && !hasAcceptedResiduals) {
    errors.push("Residual findings must be none or fully recorded as accepted residuals");
  }
  validateAcceptedResiduals(body, errors);
  validateReviewSpecCoverage(body, errors, {
    requireChildFamily: flags.has("--child-family"),
    requireParentPrd: flags.has("--parent-prd"),
    requireIssueSet: flags.has("--issue-set"),
    acceptanceManifest: options.acceptanceManifest
  });
  validateReviewEvidenceIdentities(body, errors);

  if (flags.has("--parent-prd")) {
    const parentCoverage = requireField("Parent PRD coverage");
    if (/^N\/A\b/i.test(parentCoverage)) {
      errors.push("Parent PRD coverage cannot be N/A when --parent-prd is used");
    }
  }

  if (immediateFix) {
    for (const label of [
      "Initial Standards outcome",
      "Initial Spec outcome",
      "Final Standards outcome",
      "Final Spec outcome",
      "Findings found",
      "Fixes made",
      "TDD/review-fix evidence",
      "TDD closeout gate",
      "Verification rerun",
      "Browser/manual evidence freshness",
      "Browser/manual console state",
      "Commit handling"
    ]) {
      requireField(label);
    }
    validateReviewFindingLedger(body, errors, { validateAxisOutcomes: true });
    const fixedReviewLines = body
      .split(/\r?\n/)
      .filter((line) => /\bReview:\s+.+\boutcome\s+findings fixed\b/i.test(line));
    if (fixedReviewLines.length === 0) {
      errors.push("missing immediate-fix Review: outcome");
    }

    const fixedReviewShas = [];
    for (const line of fixedReviewLines) {
      const fixedReviewMatch = line.match(
        /\boutcome\s+findings fixed in SHA\s+`?([0-9a-f]{7,40})\b`?/i
      );
      if (!fixedReviewMatch) {
        errors.push("immediate-fix Review: outcome must say 'findings fixed in SHA <sha>'");
        continue;
      }
      fixedReviewShas.push(fixedReviewMatch[1]);
    }

    if (fixedReviewShas.length > 0 && !reviewedHeadSha) {
      errors.push(
        "immediate-fix Review: outcome cannot verify SHA because Review frame lacks a concrete reviewed HEAD SHA"
      );
    } else {
      for (const fixedReviewSha of fixedReviewShas) {
        if (!compatibleSha(reviewedHeadSha, fixedReviewSha)) {
          errors.push(
            `immediate-fix Review: outcome SHA ${fixedReviewSha} does not match reviewed HEAD SHA ${reviewedHeadSha}`
          );
        }
      }
    }
  }

  if (flags.has("--browser") || immediateFix) {
    const freshnessValue = fieldValue(body, "Browser/manual evidence freshness");
    const freshnessError = validateFreshnessValue(freshnessValue);
    if (freshnessError) errors.push(`Browser/manual evidence freshness ${freshnessError}`);
    const consoleValue = fieldValue(body, "Browser/manual console state");
    const consoleError = validateConsoleStateValue(consoleValue);
    if (consoleError) errors.push(`Browser/manual console state ${consoleError}`);
    if (flags.has("--browser") && (/^N\/A\b/i.test(freshnessValue) || /^N\/A\b/i.test(consoleValue))) {
      errors.push("--browser requires current browser/manual freshness and console evidence, not N/A");
    }
  }

  const backendCurrentnessValues = fieldValues(body, "Backend process currentness");
  const backendCurrentnessCandidates = backendCurrentnessValues.length ? backendCurrentnessValues : [""];
  for (const [index, backendCurrentnessValue] of backendCurrentnessCandidates.entries()) {
    const occurrence = backendCurrentnessValues.length > 1 ? ` occurrence ${index + 1}` : "";
    const backendCurrentnessError = validateBackendCurrentnessValue(backendCurrentnessValue);
    if (backendCurrentnessError) {
      errors.push(`Backend process currentness${occurrence} ${backendCurrentnessError}`);
    }
    if (
      flags.has("--browser") &&
      /^N\/A\b.+\bno browser\/manual (?:evidence|proof) was used\b/i.test(backendCurrentnessValue)
    ) {
      errors.push(
        `--browser requires backend currentness${occurrence} or N/A because the browser proof has no backend/API dependency`
      );
    }
  }

  const currentnessCommitClaims = backendCurrentnessValues.flatMap(currentnessCommitShas);
  if (currentnessCommitClaims.length && !reviewedHeadSha) {
    errors.push("Backend process currentness names a commit but Review frame lacks a concrete reviewed HEAD SHA");
  } else {
    for (const candidate of currentnessCommitClaims) {
      if (!compatibleSha(reviewedHeadSha, candidate)) {
        errors.push(
          `Backend process currentness names commit ${candidate}, which does not match reviewed HEAD SHA ${reviewedHeadSha}`
        );
      }
    }
  }
  validateReviewFixtureSnapshotCurrentness(body, errors, { requireBrowser: flags.has("--browser") });

  validateRegressionDurability(body, errors);

  const shouldRunTddValidator =
    flags.has("--tdd") || flags.has("--tdd-parent-rollup") || body.includes("TDD evidence gate passed:");
  if (shouldRunTddValidator) {
    const tddFlags = [];
    if (flags.has("--tdd-parent-rollup")) tddFlags.push("--parent-rollup");
    for (const scopeFlag of ["--parent-prd", "--child-family", "--issue-set"]) {
      if (flags.has(scopeFlag)) tddFlags.push(scopeFlag);
    }
    if (flags.has("--closing")) tddFlags.push("--closing");
    const tddErrors = validateTddCloseoutBody(body, {
      flags: tddFlags,
      maxBytes: options.maxBytes,
      expectedFinalSha: options.expectedFinalSha,
      acceptanceManifest: options.acceptanceManifest
    });
    if (tddErrors.length) {
      errors.push(`TDD validator failed:\n${tddErrors.map((error) => `- ${error}`).join("\n")}`);
    }
  }

  if (/<(?:fixed point|count\/worst|commands|title|Standards \/ Spec|reviewer finding)[^>]*>/i.test(body)) {
    errors.push("body contains unresolved normal-review placeholders");
  }

  return errors;
};

const isCli = process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;

if (isCli) {
  const args = process.argv.slice(2);
  const manifestIndex = args.indexOf("--acceptance-manifest");
  const manifestPath = manifestIndex < 0 ? undefined : args[manifestIndex + 1];
  const maxBytesIndex = args.indexOf("--max-bytes");
  const maxBytesValue = maxBytesIndex < 0 ? undefined : args[maxBytesIndex + 1];
  const expectedFinalShaIndex = args.indexOf("--expected-final-sha");
  const expectedFinalSha = expectedFinalShaIndex < 0 ? undefined : args[expectedFinalShaIndex + 1];
  const valueIndexes = new Set([
    ...(manifestIndex < 0 ? [] : [manifestIndex + 1]),
    ...(maxBytesIndex < 0 ? [] : [maxBytesIndex + 1]),
    ...(expectedFinalShaIndex < 0 ? [] : [expectedFinalShaIndex + 1])
  ]);
  const file = args.find((arg, index) => !arg.startsWith("--") && !valueIndexes.has(index));
  const flags = args.filter((arg) => arg.startsWith("--"));

  if (flags.includes("--help")) {
    console.error(usage);
    process.exit(0);
  }
  if (!file) {
    console.error(usage);
    process.exit(2);
  }

  if (maxBytesIndex >= 0 && (!maxBytesValue || maxBytesValue.startsWith("--"))) {
    console.error("--max-bytes requires a value");
    process.exit(2);
  }
  const maxBytes = maxBytesValue === undefined ? undefined : Number(maxBytesValue);
  if (maxBytes !== undefined && (!Number.isInteger(maxBytes) || maxBytes <= 0)) {
    console.error("--max-bytes must be a positive integer");
    process.exit(2);
  }
  if (expectedFinalShaIndex >= 0 && (!expectedFinalSha || expectedFinalSha.startsWith("--"))) {
    console.error("--expected-final-sha requires a commit SHA");
    process.exit(2);
  }
  if (expectedFinalSha && !/^[0-9a-f]{7,40}$/i.test(expectedFinalSha)) {
    console.error("--expected-final-sha must be a 7-40 character hexadecimal commit SHA");
    process.exit(2);
  }

  let acceptanceManifest;
  if (manifestIndex >= 0 && (!manifestPath || manifestPath.startsWith("--"))) {
    console.error("--acceptance-manifest requires a path");
    process.exit(2);
  }
  if (manifestPath) {
    try {
      acceptanceManifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    } catch (error) {
      console.error(`Acceptance manifest read failed: ${error.message}`);
      process.exit(1);
    }
  }

  const errors = validateReviewNormalBody(readFileSync(file, "utf8"), {
    flags,
    acceptanceManifest,
    maxBytes,
    expectedFinalSha
  });
  if (errors.length) {
    console.error(`Normal review body validation failed for ${file}:`);
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
  }

  console.log(`Normal review body validation passed: ${file}`);
}
