#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { validateTddCloseoutBody } from "../../tdd/scripts/validate-tdd-closeout-body.mjs";
import { validateAcceptedResiduals } from "./validate-review-normal-body.mjs";
import {
  validateReviewClosingBodySize,
  validateReviewEvidenceIdentities,
  validateReviewFindingLedger,
  validateReviewFixtureSnapshotCurrentness,
  validateReviewSpecCoverage
} from "./review-evidence-contract.mjs";

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
const flags = new Set(args.filter((arg) => arg.startsWith("--")));

const usage = `Usage: node .claude/skills/code-review/scripts/validate-review-fallback-body.mjs <body.md> [--implement] [--child-family] [--issue-set] [--acceptance-manifest <path>] [--immediate-fix] [--browser] [--tdd] [--tdd-parent-rollup] [--closing --expected-final-sha <sha>] [--max-bytes <positive integer>]`;

if (flags.has("--help")) {
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

const body = readFileSync(file, "utf8");
const errors = [];
validateReviewClosingBodySize(body, errors, {
  closing: flags.has("--closing"),
  maxBytes
});
let acceptanceManifest;
if (manifestIndex >= 0 && (!manifestPath || manifestPath.startsWith("--"))) {
  errors.push("--acceptance-manifest requires a path");
} else if (manifestPath) {
  try {
    acceptanceManifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  } catch (error) {
    errors.push(`acceptance manifest read failed: ${error.message}`);
  }
}

const requireText = (needle, label = needle) => {
  if (!body.includes(needle)) errors.push(`missing ${label}`);
};

const requireMatch = (regex, label) => {
  if (!regex.test(body)) errors.push(`missing ${label}`);
};

const forbidMatch = (regex, label) => {
  if (regex.test(body)) errors.push(`forbidden ${label}`);
};

const gateLabels = [
  "frame",
  "delegation policy source",
  "Standards",
  "Spec",
  "child table",
  "smell baseline",
  "evidence identities",
  "found-vs-residual",
  "closeout line",
  "immediate-fix block",
  "tdd fielded closeout gate",
  "verification/browser freshness"
];

const normalizeGateLabel = (label) => label.toLowerCase();

const parseGateFields = (line) => {
  const fields = new Map();
  const body = line.replace(/^Review fallback gate passed:\s*/i, "");

  for (const segment of body.split(";")) {
    const trimmed = segment.trim().replace(/\.$/, "");

    for (const label of gateLabels) {
      const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const match = trimmed.match(new RegExp(`^${escapedLabel}\\s+(.+)$`, "i"));
      if (match) {
        fields.set(normalizeGateLabel(label), match[1].trim());
        break;
      }
    }
  }

  return fields;
};

const requireGateLine = () => {
  const line = body
    .split(/\r?\n/)
    .map((candidate) => candidate.trim())
    .find((candidate) => candidate.startsWith("Review fallback gate passed:"));

  if (!line) {
    errors.push("missing Review fallback gate passed line");
    return "";
  }

  for (const label of gateLabels) {
    if (!line.includes(label)) errors.push(`gate line missing ${label}`);
  }

  return line;
};

const requireGateValue = (fields, label, allowedValues, allowedDescription) => {
  const value = fields.get(normalizeGateLabel(label));

  if (!value) {
    errors.push(`gate line missing value for ${label}`);
    return;
  }

  if (!allowedValues.some((regex) => regex.test(value))) {
    errors.push(`gate line ${label} must be ${allowedDescription}; got ${value}`);
  }
};

const extractFieldValue = (label) => {
  const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = body.match(new RegExp(`^\\s*-?\\s*(?:\\*\\*)?${escapedLabel}(?:\\*\\*)?:\\s*(.+)$`, "im"));
  return match?.[1]?.trim() || "";
};

const extractLooseValue = (label) => {
  const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = body.match(new RegExp(`\\b${escapedLabel}\\b\\s*:?\\s*([^\\n;]+)`, "i"));
  return match?.[1]?.trim().replace(/[.`]+$/g, "") || "";
};

const validateFreshnessValue = (value) => {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized) return "is empty";
  if (/^<.*>$/.test(normalized)) return "is unresolved placeholder";

  if (/^N\/A\b.+\bbecause\b/i.test(normalized)) return "";
  if (/\b(blocked|stale)\b.+\b(because|reason|unable|cannot)\b/i.test(normalized)) return "";
  if (
    /\b(passed on final tree|passed after|smoke rerun .*passed|browser smoke .*passed)\b/i.test(normalized) ||
    /\b(re-?ran|rerun|re-run)\b.+\b(passed|result|artifact|screenshot|observed|command)\b/i.test(normalized)
  ) {
    return "";
  }

  const namesChangedPath =
    /\bchanged (path|file|surface)s?\b/i.test(normalized) ||
    /`[^`]+`/.test(normalized) ||
    /(?:^|[\s(])(?:\.{0,2}\/)?[\w@.-]+(?:\/[\w@.-]+)+(?:[:),;.]|$)/.test(normalized) ||
    /\b[\w@.-]+\.(?:ts|tsx|js|mjs|md|json|sqlite|png)\b/.test(normalized);
  const namesUnaffectedEvidence = /\b(route|action|API|fixture|browser-consumed|UI)\b/i.test(normalized);
  const hasTargetedProof = /\btargeted proof\b|\btargeted .*passed\b|\bfocused .*passed\b|\breran targeted\b/i.test(normalized);
  const isCommitMetadataOnly = /\b(?:git )?commit metadata only\b/i.test(normalized);
  const hasNoTrackedContentChange =
    /\bno tracked (?:file )?content changed\b/i.test(normalized) ||
    /\bno tracked files? changed\b/i.test(normalized) ||
    /\bno file content changed\b/i.test(normalized) ||
    /\bno content changes?\b/i.test(normalized) ||
    /\bsame\b.+\bcontent\b/i.test(normalized);
  const hasCommitMetadataProof = hasTargetedProof || /\bgit diff HEAD\b/i.test(normalized);
  const isNonSemantic =
    /\b(non-semantic|formatting|formatting-only|indentation|indentation-only|comment wording|docs?-only|documentation-only|closeout-text-only)\b/i.test(
      normalized
    );
  const hasNonSemanticProof =
    /\bdiff inspected\b|\btargeted proof\b|\btargeted .*passed\b|\bgit diff --check\b|\broot gates? (?:re)?ran\b|\bpnpm (test|typecheck|build)\b/i.test(
      normalized
    );

  if (isCommitMetadataOnly) {
    if (hasNoTrackedContentChange && namesUnaffectedEvidence && hasCommitMetadataProof) return "";
    return "uses commit-metadata-only freshness without no-tracked-content-change statement, unaffected evidence route/action/API/fixture, and git diff proof";
  }

  if (/\bnot affected\b/i.test(normalized)) {
    if (namesChangedPath && namesUnaffectedEvidence && hasTargetedProof) return "";
    if (isNonSemantic && namesChangedPath && namesUnaffectedEvidence && hasNonSemanticProof) return "";
    return "uses not affected without changed path, unaffected evidence route/action/API/fixture, and targeted proof";
  }

  if (isNonSemantic) {
    if (namesChangedPath && namesUnaffectedEvidence && hasNonSemanticProof) return "";
    return "uses non-semantic freshness without changed path, unaffected evidence route/action/API/fixture, and proof";
  }

  return "must state rerun proof, justified not affected, blocked/stale reason, non-semantic proof, commit-metadata-only proof, or N/A because no browser/manual evidence was used";
};

const validateConsoleStateValue = (value) => {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized) return "is empty";
  if (/^<.*>$/.test(normalized)) return "is unresolved placeholder";
  if (/^N\/A\b.+\bbecause\b/i.test(normalized)) return "";
  if (/\b0 errors?\b.+\b0 warnings?\b/i.test(normalized)) return "";
  if (/\bno console (errors?|warnings?)\b/i.test(normalized)) return "";
  if (/\bclassified unrelated\b.+\b(evidence|because|source|reason)\b/i.test(normalized)) return "";
  if (/\brerun clean session\b.+\b(HMR|hot reload|reused session|agent-induced setup\/request error|tainted proof)\b/i.test(normalized)) {
    return "";
  }
  if (/\bclean browser session\b.+\b(passed|0 errors?|0 warnings?|observed)\b/i.test(normalized)) return "";
  if (/\b(blocked|unavailable|not available)\b.+\b(because|reason|unable|cannot)\b/i.test(normalized)) return "";
  return "must state clean console, classified unrelated output, clean-session rerun, blocked/unavailable reason, or N/A because no browser/manual evidence was used";
};

const validateBackendCurrentnessValue = (value) => {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized) return "is empty";
  if (/^<.*>$/.test(normalized)) return "is unresolved placeholder";
  if (/^N\/A\b.+\bbecause\b.+\b(?:no browser\/manual evidence was used|browser proof has no backend\/API dependency)\b/i.test(normalized)) {
    return "";
  }
  if (/\bblocked\b.+\b(?:because|reason|unable|cannot)\b/i.test(normalized)) return "";

  const hasServerCommand = /\bserver command\b/i.test(normalized);
  const hasWatchMode = /\bwatch(?:\/reload)? mode\b/i.test(normalized);
  const hasOwnership = /\b(?:process|port)(?:(?:\s+or\s+|\s*\/\s*)(?:process|port))? ownership\b/i.test(normalized);
  const hasRestartOrReloadProof = /\b(?:restart|reload)(?:\/(?:restart|reload))? proof\b/i.test(normalized);
  const hasExpectedApiProbe =
    /\bexpected(?: [\w-]+){0,3} API (?:field|behavior)(?: probe)?\b|\bAPI probe\b/i.test(normalized);
  if (hasServerCommand && hasWatchMode && hasOwnership && hasRestartOrReloadProof && hasExpectedApiProbe) return "";

  return "must state server command, watch/reload mode, process or port ownership, restart/reload proof, and expected API field/behavior probe, or a justified N/A/blocked reason";
};

requireText("Review frame:");
requireText("fixed point resolved SHA");
requireText("reviewed HEAD SHA");
requireText("diff command");
requireText("commits");
requireText("worktree scope");
requireText("spec source");
requireText("## Standards");
requireText("Fallback used:");
requireText("Delegation policy source:");
requireText("Sources reviewed:");
requireText("Smell baseline applied:");
requireText("## Spec");
requireText("Findings:");
requireMatch(/Axis summary:\s*Standards\s+.+?,\s*Spec\s+.+/i, "axis summary");
validateAcceptedResiduals(body, errors);
validateReviewEvidenceIdentities(body, errors);

const fixedPointSha = extractLooseValue("fixed point resolved SHA").match(/\b[0-9a-f]{7,40}\b/i)?.[0] || "";
const diffCommandValue = extractLooseValue("diff command");
if (fixedPointSha && diffCommandValue && !diffCommandValue.includes(fixedPointSha)) {
  errors.push(
    `diff command must use resolved fixed-point SHA ${fixedPointSha}; relative refs such as HEAD~1 are fixed-point input only`
  );
}

const gateLine = requireGateLine();
const gateFields = parseGateFields(gateLine);
const gateSaysChildFamily = /\bchild table\s+yes\b/i.test(gateLine);
const gateSaysImmediateFix = /\bimmediate-fix block\s+yes\b/i.test(gateLine);
const gateSaysCloseoutLine = /\bcloseout line\s+yes\b/i.test(gateLine);
const gateSaysTddYes = /\btdd fielded closeout gate\s+yes\b/i.test(gateLine);
const shouldRequireImplementLine = flags.has("--implement") || gateSaysCloseoutLine;
const shouldRequireIssueSet = flags.has("--issue-set");
const shouldRequireChildFamily = flags.has("--child-family") || (gateSaysChildFamily && !shouldRequireIssueSet);
const shouldRequireImmediateFix = flags.has("--immediate-fix") || gateSaysImmediateFix;
const shouldRunTddValidator = flags.has("--tdd") || flags.has("--tdd-parent-rollup") || gateSaysTddYes;

const yesOnly = [/^yes$/i];
const yesOrNA = [/^yes$/i, /^N\/A$/i];
const tddYesAfterStructuralCheck = [/^yes after structural check$/i];
const tddYesAfterStructuralCheckOrNA = [/^yes after structural check$/i, /^N\/A$/i];

requireGateValue(gateFields, "frame", yesOnly, "yes");
requireGateValue(gateFields, "delegation policy source", yesOnly, "yes");
requireGateValue(gateFields, "Standards", yesOnly, "yes");
requireGateValue(gateFields, "Spec", yesOnly, "yes");
requireGateValue(
  gateFields,
  "child table",
  flags.has("--child-family") || flags.has("--issue-set") ? yesOnly : yesOrNA,
  flags.has("--child-family") || flags.has("--issue-set")
    ? "yes when --child-family or --issue-set is used"
    : "yes or N/A"
);
requireGateValue(gateFields, "smell baseline", yesOnly, "yes");
requireGateValue(gateFields, "evidence identities", yesOnly, "yes");
requireGateValue(gateFields, "found-vs-residual", yesOrNA, "yes or N/A");
requireGateValue(
  gateFields,
  "closeout line",
  flags.has("--implement") ? yesOnly : yesOrNA,
  flags.has("--implement") ? "yes when --implement is used" : "yes or N/A"
);
requireGateValue(
  gateFields,
  "immediate-fix block",
  flags.has("--immediate-fix") ? yesOnly : yesOrNA,
  flags.has("--immediate-fix") ? "yes when --immediate-fix is used" : "yes or N/A"
);
requireGateValue(
  gateFields,
  "tdd fielded closeout gate",
  flags.has("--tdd") || flags.has("--tdd-parent-rollup") ? tddYesAfterStructuralCheck : tddYesAfterStructuralCheckOrNA,
  flags.has("--tdd") || flags.has("--tdd-parent-rollup")
    ? "yes after structural check when TDD validation is requested"
    : "yes after structural check or N/A"
);
requireGateValue(
  gateFields,
  "verification/browser freshness",
  flags.has("--browser") ? yesOnly : yesOrNA,
  flags.has("--browser") ? "yes when --browser is used" : "yes or N/A"
);

for (const token of ["Browser/manual evidence freshness", "Browser/manual console state", "Backend process currentness"]) {
  requireText(token);
}

const freshnessValue = extractFieldValue("Browser/manual evidence freshness");
const freshnessError = validateFreshnessValue(freshnessValue);
if (freshnessError) {
  errors.push(`Browser/manual evidence freshness ${freshnessError}`);
}

const consoleStateValue = extractFieldValue("Browser/manual console state");
const consoleStateError = validateConsoleStateValue(consoleStateValue);
if (consoleStateError) {
  errors.push(`Browser/manual console state ${consoleStateError}`);
}

const backendCurrentnessValue = extractFieldValue("Backend process currentness");
const backendCurrentnessError = validateBackendCurrentnessValue(backendCurrentnessValue);
if (backendCurrentnessError) {
  errors.push(`Backend process currentness ${backendCurrentnessError}`);
}

if (flags.has("--browser")) {
  if (/^N\/A\b/i.test(freshnessValue) || /^N\/A\b/i.test(consoleStateValue)) {
    errors.push("--browser requires current browser/manual freshness and console evidence, not N/A");
  }
  if (/^N\/A\b.+\bno browser\/manual evidence was used\b/i.test(backendCurrentnessValue)) {
    errors.push("--browser requires backend currentness or N/A because the browser proof has no backend/API dependency");
  }
}
validateReviewFixtureSnapshotCurrentness(body, errors, { requireBrowser: flags.has("--browser") });

if (shouldRequireImplementLine) {
  requireMatch(/^Review fallback:\s+\S.+$/m, "exact Review fallback closeout-ready line");
  forbidMatch(/^\s*-?\s*Review:\s+.*\bfallback\b/im, "fallback review evidence labeled Review: instead of Review fallback:");
}

validateReviewSpecCoverage(body, errors, {
  requireChildFamily: shouldRequireChildFamily,
  requireIssueSet: shouldRequireIssueSet,
  acceptanceManifest
});

if (shouldRequireImmediateFix) {
  for (const token of [
    "Findings found",
    "Fixes made",
    "TDD/review-fix evidence",
    "TDD closeout gate",
    "Verification rerun",
    "Commit handling",
    "Residual findings"
  ]) {
    requireText(token);
  }
  validateReviewFindingLedger(body, errors);
}

if (shouldRunTddValidator) {
  requireText("TDD closeout gate");
  requireText("TDD evidence gate passed:");

  const tddFlags = [];
  if (flags.has("--tdd-parent-rollup")) tddFlags.push("--parent-rollup");
  for (const scopeFlag of ["--child-family", "--issue-set"]) {
    if (flags.has(scopeFlag)) tddFlags.push(scopeFlag);
  }
  if (flags.has("--closing")) tddFlags.push("--closing");
  const tddErrors = validateTddCloseoutBody(body, {
    flags: tddFlags,
    maxBytes,
    expectedFinalSha,
    acceptanceManifest
  });
  if (tddErrors.length) {
    errors.push(`TDD validator failed:\n${tddErrors.map((error) => `- ${error}`).join("\n")}`);
  }
}

forbidMatch(/<ref>|<sha>|<issues\/spec paths>|<yes\/no>|<commands>|<count and short titles>/, "unresolved fallback placeholder");

if (errors.length) {
  console.error(`Review fallback body validation failed for ${file}:`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Review fallback body validation passed: ${file}`);
