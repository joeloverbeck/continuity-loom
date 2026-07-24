#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import {
  fixtureSnapshotCurrentnessErrors,
  hasConcreteGreenEvidence,
  hasConcreteRedEvidence,
  hasExistingContractChangeExpectationEvidence,
  isExecutableCommand,
  validateBackendCurrentnessValue,
  validateFreshnessValue,
  validateRegressionDurabilityValue
} from "./tdd-evidence-contract.mjs";

export const DEFAULT_TDD_CLOSEOUT_BODY_MAX_BYTES = 65_536;

const postCommentVerificationReminder =
  'Post-comment verification next: after gh issue comment --body-file returns a URL, run node .claude/skills/implement/scripts/verify-github-comment-body.mjs "$comment_url" "$body" before any close command.';

const usage = `Usage: node .claude/skills/tdd/scripts/validate-tdd-closeout-body.mjs <body.md> [--closing --expected-final-sha <sha>] [--parent-rollup] [--parent-prd] [--child-family] [--issue-set] [--acceptance-manifest <manifest.json>] [--max-bytes <positive integer>]`;

const manifestScopeFlags = ["--parent-rollup", "--parent-prd", "--child-family", "--issue-set"];

const validateAcceptanceManifest = (manifest, errors) => {
  if (!manifest) return [];
  if (manifest.version !== 1 || !Array.isArray(manifest.issues) || manifest.issues.length === 0) {
    errors.push("acceptance manifest must have version 1 and a non-empty issues array");
    return [];
  }

  const seenIssues = new Set();
  for (const issue of manifest.issues) {
    if (!Number.isInteger(issue?.number) || seenIssues.has(issue.number) || !Array.isArray(issue.checks) || issue.checks.length === 0) {
      errors.push("acceptance manifest issues require unique integer numbers and non-empty checks arrays");
      return [];
    }
    seenIssues.add(issue.number);

    const seenChecks = new Set();
    for (const check of issue.checks) {
      const id = typeof check?.id === "string" ? check.id.trim() : "";
      if (!id || seenChecks.has(id.toLowerCase()) || typeof check?.text !== "string") {
        errors.push(`acceptance manifest issue #${issue.number} contains an invalid or duplicate check`);
        return [];
      }
      seenChecks.add(id.toLowerCase());
    }
  }

  return manifest.issues;
};

export const validateTddCloseoutBody = (body, options = {}) => {
  const flags = new Set(options.flags ?? []);
  const closing = flags.has("--closing");
  const errors = [];
  const maxBytes = options.maxBytes ?? DEFAULT_TDD_CLOSEOUT_BODY_MAX_BYTES;
  const expectedFinalSha = options.expectedFinalSha;
  const requiresAcceptanceManifest = manifestScopeFlags.some((flag) => flags.has(flag));
  if (requiresAcceptanceManifest && !options.acceptanceManifest) {
    errors.push(
      `${manifestScopeFlags.filter((flag) => flags.has(flag)).join("/")} TDD validation requires an acceptance manifest`
    );
  }
  const manifestIssues = validateAcceptanceManifest(options.acceptanceManifest, errors);

  if (expectedFinalSha !== undefined && !/^[0-9a-f]{7,40}$/i.test(expectedFinalSha)) {
    errors.push("expected final SHA must be a 7-40 character hexadecimal commit SHA");
  }
  if (closing && !expectedFinalSha) {
    errors.push("closing validation requires expected final SHA");
  }

  if (!Number.isInteger(maxBytes) || maxBytes <= 0) {
    errors.push("max bytes must be a positive integer");
  } else if (closing) {
    const bodyBytes = Buffer.byteLength(body, "utf8");
    if (bodyBytes > maxBytes) {
      errors.push(
        `TDD closeout body is ${bodyBytes} bytes; maximum is ${maxBytes} bytes. Shorten concrete evidence or split it into separately validated durable tracker sinks before publication`
      );
    }
  }

  const compactHeader =
    "| Issue | CONTEXT.md status | ADRs/principles/docs status | Seam | Red command/failure | Green command or evidence | Acceptance covered | Review fix / red-first skip reason |";
  const compactSeparator = "|---|---|---|---|---|---|---|---|";
  const reviewFixMapHeader =
    "| Finding ID | Finding/source | Intended red command/failure | Green command/evidence | Updated TDD table row | Regression durability | Browser/manual evidence freshness | Backend process currentness | Evidence identity refresh |";
  const summaryHeader = "| Issue | Seam | Red-first status | Green verification |";
  const gatePrefix = "TDD evidence gate passed:";
  const requiredGateLabels = [
    "durable sink",
    "compact table/header",
    "seams accounted for",
    "CONTEXT.md status",
    "ADRs/principles/docs status",
    "sequence evidence",
    "evidence identities",
    "partial-red / red-first skip reasons",
    "evidence-only rows",
    "proof server preflight",
    "existing-test contract-change rows"
  ];
  const equivalentFieldLabels = [
    "Issue",
    "CONTEXT.md status",
    "ADRs/principles/docs status",
    "Seam",
    "Red command/failure",
    "Green command or evidence",
    "Acceptance covered",
    "atoms:",
    "proof surfaces:",
    "sequence:"
  ];
  const requiredPreflightLabels = [
    "TDD closeout preflight:",
    "Durable sink/body inspected:",
    "Compact table/header:",
    "Rows accounted for:",
    "Pre-red recovery status:",
    "Pre-red evidence reference:",
    "CONTEXT.md status:",
    "ADRs/principles/docs status:",
    "Acceptance atom map:",
    "Acceptance sequence map:",
    "Partial-red / red-first skip reasons:",
    "Evidence-only rows freshness:",
    "Evidence-only proof server preflight:",
    "Evidence-only backend process currentness:",
    "Evidence identity refresh:",
    "Current evidence identities:",
    "Historical red identities retained:",
    "Superseded evidence identities:",
    "Superseded-token sweep:",
    "Existing-test contract-change rows:"
  ];

  const requireText = (needle, label = needle) => {
    if (!body.includes(needle)) errors.push(`missing ${label}`);
  };

  const forbidText = (needle, label = needle) => {
    if (body.includes(needle)) errors.push(`forbidden ${label}`);
  };

  const forbidMatch = (regex, label) => {
    if (regex.test(body)) errors.push(`forbidden ${label}`);
  };

  const requireGateLine = () => {
    const line = body
      .split(/\r?\n/)
      .map((candidate) => candidate.trim())
      .find((candidate) => candidate.startsWith(gatePrefix));

    if (!line) {
      errors.push("missing TDD evidence gate line");
      return "";
    }

    for (const label of requiredGateLabels) {
      if (!line.includes(label)) errors.push(`gate line missing ${label}`);
    }

    if (/TDD evidence gate passed:\s*yes\b/i.test(line)) {
      errors.push("gate line uses forbidden shorthand yes");
    }

    return line;
  };

  const splitTableRow = (line) =>
    line
      .trim()
      .replace(/^\|/, "")
      .replace(/\|$/, "")
      .split("|")
      .map((cell) => cell.trim());

  const compactRows = [];
  const lines = body.split(/\r?\n/);
  const firstLineMatching = (regex) =>
    lines.map((candidate) => candidate.trim()).find((candidate) => regex.test(candidate)) ?? "";

  const extractFieldValuesFrom = (text, label) => {
    const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(`^\\s*-?\\s*(?:\\*\\*)?${escapedLabel}(?:\\*\\*)?:\\s*(.+)$`, "gim");
    return [...text.matchAll(pattern)].map((match) => match[1].trim());
  };
  const extractFieldValues = (label) => extractFieldValuesFrom(body, label);
  const extractFieldValue = (label) => extractFieldValues(label)[0] ?? "";

  const tableRowsAfter = (header) => {
    const headerIndex = lines.findIndex((line) => line.trim() === header);
    if (headerIndex < 0) return [];

    const rows = [];
    for (let index = headerIndex + 1; index < lines.length; index += 1) {
      const line = lines[index].trim();
      if (!line.startsWith("|")) break;
      if (/^\|(?:\s*:?-+:?\s*\|)+$/.test(line)) continue;
      rows.push(splitTableRow(line));
    }
    return rows;
  };

  const concreteSha = (value) => value.match(/`?\b([0-9a-f]{7,40})\b`?/i)?.[1];
  const compatibleSha = (left, right) => {
    const normalizedLeft = left.toLowerCase();
    const normalizedRight = right.toLowerCase();
    return normalizedLeft.startsWith(normalizedRight) || normalizedRight.startsWith(normalizedLeft);
  };
  const currentnessCommitShas = (value) =>
    [...value.matchAll(/\b(?:final\s+)?commit(?:ted)?(?:\s+SHA)?\s+`?([0-9a-f]{7,40})\b`?/gi)]
      .map((match) => match[1]);

  const validateConsoleStateValue = (value) => {
    const normalized = value.replace(/\s+/g, " ").trim();
    if (!normalized) return "is empty";
    if (/^<.*>$/.test(normalized)) return "is unresolved placeholder";
    if (/^none\b/i.test(normalized)) return "";
    if (/^N\/A\b.+\bbecause\b/i.test(normalized)) return "";
    if (/\b0 errors?\b.+\b0 warnings?\b/i.test(normalized)) return "";
    if (/\bno console (errors?|warnings?)\b/i.test(normalized)) return "";
    if (/\bclassified unrelated\b.+\b(evidence|because|source|reason)\b/i.test(normalized)) return "";
    if (/\brerun clean session\b.+\b(HMR|hot reload|reused session|agent-induced setup\/request error|tainted proof)\b/i.test(normalized)) {
      return "";
    }
    if (/\bclean browser session\b.+\b(passed|0 errors?|0 warnings?|observed)\b/i.test(normalized)) return "";
    if (/\b(blocked|unavailable|not available)\b.+\b(because|reason|unable|cannot)\b/i.test(normalized)) return "";
    return "must state clean console, classified unrelated output, clean-session rerun, blocked/unavailable reason, N/A because, or none";
  };

  const validateAcceptanceAtomMapValue = (value) => {
    const normalized = value.replace(/\s+/g, " ").trim();
    if (!normalized) return "is empty";
    if (/^<.*>$/.test(normalized)) return "is unresolved placeholder";
    if (/\bblocked\b.+\b(because|reason|unable|cannot)\b/i.test(normalized)) return "";
    if (/\ball rows?\b.+\batoms?\b.+\bproof surfaces?\b/i.test(normalized)) return "";
    if (/\ball criteria (?:are )?atomic\b.+\bproof surfaces?\b/i.test(normalized)) return "";
    return "must state that all rows list authoritative atoms and proof surfaces, that all criteria are atomic with proof surfaces listed, or blocked because. Example: 'all rows in the acceptance audit below list authoritative atoms and proof surfaces'";
  };

  const validateAcceptanceSequenceMapValue = (value) => {
    const normalized = value.replace(/\s+/g, " ").trim();
    if (!normalized) return "is empty";
    if (/^<.*>$/.test(normalized)) return "is unresolved placeholder";
    if (/\bblocked\b.+\b(because|reason|unable|cannot)\b/i.test(normalized)) return "";
    if (/\ball rows?\b.+\b(sequence|ordered proof|sequence N\/A)\b/i.test(normalized)) return "";
    if (/\ball criteria\b.+\bnot sequence-sensitive\b/i.test(normalized)) return "";
    return "must state that all rows list ordered proof or justified sequence N/A, that all criteria are not sequence-sensitive, or blocked because. Example: 'all rows list ordered proof or a justified sequence N/A'";
  };

  const validateAuthorityDispositionValue = (value) => {
    const normalized = value.replace(/\s+/g, " ").trim();
    if (!normalized) return "is empty";
    if (/^<.*>$/.test(normalized)) return "is an unresolved placeholder";
    if (/\b(?:conflict|blocked|unresolved)\b/i.test(normalized)) {
      return "records an unresolved authority conflict; resolve it before the first red command";
    }
    if (/^N\/A\b.+\bbecause\b.+/i.test(normalized)) return "";
    if (/\baligned\b\s*(?:[-:]|because\b|with\b|against\b|per\b)\s*.+/i.test(normalized)) {
      return "";
    }
    if (/\bapproved\s+(?:authority\s+)?(?:amendment|exception|waiver)\b/i.test(normalized)) {
      const durableReference =
        /https?:\/\/|#\d+\b|(?:^|[\s`(])(?:docs|specs|tickets|archive)\/[A-Za-z0-9._/-]+|\bADR[- ]?\d+\b|§\s*\d+/i;
      return durableReference.test(normalized)
        ? ""
        : "must include a durable authority reference for the approved amendment, exception, or waiver";
    }
    return "must state an explicit authority disposition: aligned with a concrete basis, approved amendment/exception with a durable authority reference, or N/A because";
  };

  const validateBackendCurrentnessValues = (label, values) => {
    const candidates = values.length ? values : [""];
    for (const [index, value] of candidates.entries()) {
      const error = validateBackendCurrentnessValue(value);
      if (error) {
        const occurrence = values.length > 1 ? ` occurrence ${index + 1}` : "";
        errors.push(`${label}${occurrence} ${error}`);
      }
    }
  };

  const finalShas = extractFieldValues("Final SHA").map(concreteSha).filter(Boolean);
  let finalSha;
  if (finalShas.length) {
    finalSha = finalShas.reduce((longest, candidate) =>
      candidate.length > longest.length ? candidate : longest
    );
    for (const candidate of finalShas) {
      if (!compatibleSha(finalSha, candidate)) {
        errors.push(`Final SHA fields disagree: ${candidate} is not compatible with ${finalSha}`);
      }
    }
    for (const label of ["Backend process currentness", "Evidence-only backend process currentness"]) {
      for (const value of extractFieldValues(label)) {
        for (const candidate of currentnessCommitShas(value)) {
          if (!compatibleSha(finalSha, candidate)) {
            errors.push(`${label} names commit ${candidate}, which does not match Final SHA ${finalSha}`);
          }
        }
      }
    }
  }

  if (closing && !finalSha) {
    errors.push("closing validation requires a concrete Final SHA field");
  }
  if (closing && expectedFinalSha && /^[0-9a-f]{7,40}$/i.test(expectedFinalSha)) {
    for (const candidate of finalShas) {
      if (!compatibleSha(expectedFinalSha, candidate)) {
        errors.push(`Final SHA ${candidate} does not match expected final SHA ${expectedFinalSha}`);
      }
    }
    for (const match of body.matchAll(/\breviewed HEAD SHA\s*:?[ \t]*`?([0-9a-f]{7,40})\b`?/gi)) {
      const candidate = match[1];
      if (!compatibleSha(expectedFinalSha, candidate)) {
        errors.push(`reviewed HEAD SHA ${candidate} does not match expected final SHA ${expectedFinalSha}`);
      }
    }
  }

  if (closing) {
    const verificationHeader = "| Exact command | Observed result/counts | Run count | Represented SHA/tree |";
    if (!body.includes(verificationHeader)) {
      errors.push("missing verification command ledger header");
    }
    const verificationRows = tableRowsAfter(verificationHeader);
    if (!verificationRows.length) {
      errors.push("verification command ledger must contain at least one final-tree row");
    }
    for (const [index, cells] of verificationRows.entries()) {
      const [command, result, runCount, representedTree] = cells;
      const row = index + 1;
      if (cells.length !== 4) {
        errors.push(`verification command ledger row ${row} must contain exactly four columns`);
        continue;
      }
      const commandMatch = command.match(/^`([^`\n]+)`$/);
      if (!commandMatch || !isExecutableCommand(commandMatch[1])) {
        errors.push(`verification command ledger row ${row} must contain an exact executable command`);
      }
      const hasObservedOutcome = /\b(?:passed|failed|blocked|unavailable|not applicable)\b/i.test(result);
      const hasOutputDetail =
        /\bexit(?: code)?\s*-?\d+\b/i.test(result) ||
        /\b\d+\s+(?:tests?|files?|suites?|checks?|assertions?|errors?|warnings?|packages?|tasks?|snapshots?|rows?|bytes?)\b/i.test(result) ||
        /\b(?:blocked|unavailable|not applicable)\b.+\bbecause\b/i.test(result);
      if (!hasObservedOutcome || !hasOutputDetail) {
        errors.push(`verification command ledger row ${row} must contain an output-derived result or count`);
      }
      if (!/^[1-9]\d*$/.test(runCount)) {
        errors.push(`verification command ledger row ${row} run count must be a positive integer`);
      }
      const representedSha = concreteSha(representedTree ?? "");
      if (!representedSha) {
        errors.push(`verification command ledger row ${row} must name a concrete represented commit SHA`);
      } else if (finalSha && !compatibleSha(finalSha, representedSha)) {
        errors.push(
          `verification command ledger row ${row} represents ${representedSha}, which does not match Final SHA ${finalSha}`
        );
      }
    }
  }

  const validateProofServerPreflightValue = (value) => {
    const normalized = value.replace(/\s+/g, " ").trim();
    if (!normalized) return "is empty";
    if (/^<.*>$/.test(normalized)) return "is unresolved placeholder";
    if (/^N\/A\b.+\bbecause\b.+\b(no browser\/manual evidence-only rows|no proof server applies)\b/i.test(normalized)) {
      return "";
    }
    if (/\bblocked\b.+\b(because|reason|unable|cannot)\b/i.test(normalized)) return "";

    const hasConfiguredPorts = /\bconfigured (?:API\/UI )?ports?\b/i.test(normalized);
    const hasOwnerCheck = /\bowner(?:-check| check|ship)(?: result)?\b/i.test(normalized);
    const hasUnrelatedOwners = /\bunrelated pre-existing owners?\b/i.test(normalized);
    const hasPortDisposition =
      /\bconfigured ports? (?:verified )?free\b/i.test(normalized) ||
      (/\bisolated proof-owned ports?\b/i.test(normalized) && /\b(?:proxy|API base)\b/i.test(normalized));
    const hasCleanupOwnership = /\bcleanup ownership\b/i.test(normalized);
    if (hasConfiguredPorts && hasOwnerCheck && hasUnrelatedOwners && hasPortDisposition && hasCleanupOwnership) {
      return "";
    }

    return "must state configured API/UI ports, owner-check result, unrelated pre-existing owners, configured-ports-free or isolated proof-owned ports with aligned proxy/API base, and cleanup ownership, or a justified N/A/blocked reason";
  };

  const validatePreRedRecoveryStatusValue = (value) => {
    const normalized = value.replace(/\s+/g, " ").trim();
    if (!normalized) return "is empty";
    if (/^<.*>$/.test(normalized)) return "is unresolved placeholder";
    if (/^N\/A\b(?:\s*[-:]\s*|\s+because\s+).*pre-red preflight\/table was visible before first red/i.test(normalized)) {
      return "";
    }
    if (/^N\/A\b.+\bno red commands? (?:were )?run\b/i.test(normalized)) return "";
    if (/^N\/A\b.+\bno tdd skill was invoked\b/i.test(normalized)) return "";
    if (/\blisted with TDD recovery addendum\b/i.test(normalized)) return "";
    if (/\bblocked\b.+\b(because|reason|unable|cannot)\b/i.test(normalized)) return "";
    return "must state N/A because the pre-red preflight/table was visible before first red, listed with TDD recovery addendum, N/A because no red commands were run, or blocked because";
  };

  const validatePreRedEvidenceReference = (status, reference) => {
    const normalizedStatus = status.replace(/\s+/g, " ").trim();
    const normalizedReference = reference.replace(/\s+/g, " ").trim();
    if (!normalizedReference) return "is empty";
    if (/^<.*>$/.test(normalizedReference) || /\b(?:TODO|TBD|pending|unknown)\b/i.test(normalizedReference)) {
      return "is unresolved";
    }

    if (/\bno red commands? (?:were )?run\b/i.test(normalizedStatus)) {
      return /^N\/A\b.+\bno red commands? (?:were )?run\b/i.test(normalizedReference)
        ? ""
        : "must be N/A because no red commands were run";
    }
    if (/\bno tdd skill was invoked\b/i.test(normalizedStatus)) {
      return /^N\/A\b.+\bno tdd skill was invoked\b/i.test(normalizedReference)
        ? ""
        : "must be N/A because no tdd skill was invoked";
    }
    if (/\bblocked\b/i.test(normalizedStatus)) {
      return /^blocked\b.+\b(because|reason|unable|cannot)\b/i.test(normalizedReference)
        ? ""
        : "must state blocked because when pre-red recovery status is blocked";
    }

    const namesDurableSink =
      /https?:\/\/|#\d+\b|(?:^|[\s`(])\/?(?:[A-Za-z0-9._-]+\/)+[A-Za-z0-9._-]+\b|\b(?:conversation|comment|ledger|body|sink|artifact)\s+(?:URL|reference|message|entry|path|file|#?\d+)\b/i.test(
        normalizedReference
      );
    const namesAnchor = /\b(?:anchor|heading|row|section|line)\b/i.test(normalizedReference);
    if (/\blisted with TDD recovery addendum\b/i.test(normalizedStatus)) {
      if (/\bTDD recovery addendum\b/i.test(normalizedReference) && namesDurableSink && namesAnchor) return "";
      return "must name the TDD recovery addendum, its durable sink, and an exact heading/row/section/line anchor";
    }

    const namesChronology =
      /\bchronology\b|\bbefore (?:the )?first red\b|\bprecedes? (?:the )?first red\b|\bfirst red command (?:follows|appears after)\b|\bsame-sink line order\b|\btimestamp\b|\brevision\b/i.test(
        normalizedReference
      );
    if (namesDurableSink && namesAnchor && namesChronology) return "";
    return "must name a durable sink, an exact heading/row/section/line anchor, and chronology proof that it precedes the first red command. Example: 'durable file-backed ledger file <path> at the <heading> section; file line order proves the preflight and table precede the first red command'";
  };

  const validateRecoveryAddendum = () => {
    const headingIndex = lines.findIndex((line) => line.trim() === "TDD recovery addendum:");
    if (headingIndex < 0) {
      errors.push("Pre-red recovery status claims recovery but the body is missing literal TDD recovery addendum block");
      return;
    }

    const closeoutPreflightIndex = lines.findIndex(
      (line, index) => index > headingIndex && line.trim() === "TDD closeout preflight:"
    );
    const addendum = lines
      .slice(headingIndex + 1, closeoutPreflightIndex < 0 ? lines.length : closeoutPreflightIndex)
      .join("\n");
    const requiredFields = [
      "Missed pre-red gate inventory",
      "Authoritative acceptance manifest recovery",
      "Issue/seam red-green reconstruction",
      "Final preservation sink"
    ];
    const values = new Map();

    for (const label of requiredFields) {
      const matches = extractFieldValuesFrom(addendum, label);
      if (matches.length !== 1) {
        errors.push(`TDD recovery addendum ${label} must appear exactly once`);
        continue;
      }
      const value = matches[0];
      values.set(label, value);
      if (/^<.*>$/.test(value) || /\b(?:TODO|TBD|pending|unknown)\b/i.test(value)) {
        errors.push(`TDD recovery addendum ${label} is unresolved`);
      }
    }

    const missedGates = values.get("Missed pre-red gate inventory") ?? "";
    if (missedGates && !/\b(?:preflight|compact table|manifest)\b/i.test(missedGates)) {
      errors.push("TDD recovery addendum Missed pre-red gate inventory must name the missed preflight, compact table, or manifest coverage");
    }

    const manifestRecovery = values.get("Authoritative acceptance manifest recovery") ?? "";
    if (
      manifestRecovery &&
      !(/^N\/A\b.+\bbecause\b/i.test(manifestRecovery) ||
        (/\b(?:manifest|AC\s*\d+|US\s*\d+|issue\s*#?\d+)\b/i.test(manifestRecovery) &&
          /\b(?:coverage|row|map|reconstruct)\b/i.test(manifestRecovery)))
    ) {
      errors.push("TDD recovery addendum Authoritative acceptance manifest recovery must identify recovered manifest/check coverage or a reasoned N/A");
    }

    const redGreenRecovery = values.get("Issue/seam red-green reconstruction") ?? "";
    if (
      redGreenRecovery &&
      !(/\b(?:issue\s*)?#?\d+\b/i.test(redGreenRecovery) &&
        /\bseam\b|\s\/\s/i.test(redGreenRecovery) &&
        /\bred\b/i.test(redGreenRecovery) &&
        /\bgreen\b/i.test(redGreenRecovery))
    ) {
      errors.push("TDD recovery addendum Issue/seam red-green reconstruction must identify an issue/seam and both red and green evidence");
    }

    const preservationSink = values.get("Final preservation sink") ?? "";
    const namesDurableSink =
      /https?:\/\/|#\d+\b|(?:^|[\s`(])\/?(?:[A-Za-z0-9._-]+\/)+[A-Za-z0-9._-]+\b|\b(?:conversation|comment|ledger|body|sink|artifact)\s+(?:URL|reference|message|entry|path|file|#?\d+)\b/i.test(
        preservationSink
      );
    if (preservationSink && !(namesDurableSink && /\b(?:anchor|heading|row|section|line)\b/i.test(preservationSink))) {
      errors.push("TDD recovery addendum Final preservation sink must name a durable sink and exact heading/row/section/line anchor");
    }
  };

  for (let index = 0; index < lines.length; index += 1) {
    if (lines[index].trim() !== compactHeader) continue;
    for (let rowIndex = index + 2; rowIndex < lines.length; rowIndex += 1) {
      const line = lines[rowIndex].trim();
      if (!line.startsWith("|")) break;
      const cells = splitTableRow(line);
      if (/^#\d+/.test(cells[0] ?? "")) {
        compactRows.push({ lineNumber: rowIndex + 1, cells });
      }
    }
  }

  const evidenceField = (evidence, label, nextLabels) => {
    const next = nextLabels.map((nextLabel) => nextLabel.replace(" ", "\\s+")).join("|");
    return evidence.match(new RegExp(`${label.replace(" ", "\\s+")}:\\s*(.*?)(?=;\\s*(?:${next}):|$)`, "i"))?.[1].trim() ?? "";
  };
  const circularAcceptanceReference = /\b(?:(?:every|all)\s+exact(?:\s+named)?\b[^;]*\b(?:in|from|of)\s+(?:the\s+)?(?:issue\s+)?(?:criteria|criterion|checkbox|requirement)|exact named (?:items?|atoms?|contracts?|clauses?|surfaces?) in (?:this|the) (?:criterion|criteria|checkbox|requirement)|(?:criterion|checkbox|requirement) (?:above|as written|itself)|(?:all|every) (?:named|listed) (?:items?|atoms?|surfaces?))\b/i;
  const concreteProofAnchor = /(?:https?:\/\/\S+|#\d+\b|\b(?:pnpm|npm|npx|node|cargo|git|gh|curl|bash)\s+[^;]+|(?:^|[\s`(])\/[A-Za-z0-9._~!$&'()*+,;=:@%/-]+|\b(?:[A-Za-z0-9_.-]+\/)+[A-Za-z0-9_.-]+\b|\b[A-Za-z0-9_.-]+\.(?:test|spec)\.[cm]?[jt]sx?\b|\b[A-Za-z0-9_.-]+\.(?:md|json|html|sql|sqlite|wasm|png)\b)/i;

  const sourceNamesExactManifestCheck = (source, checkId) => {
    const sourceForExactMatch = /^US\d+$/i.test(checkId)
      ? source.replace(/\bUS\s*\d+\s*(?:-|–|—|to|through)\s*(?:US\s*)?\d+\b/gi, " ")
      : source;
    const escapedId = checkId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`(?:^|[^A-Za-z0-9])${escapedId}(?=$|[^A-Za-z0-9])`, "i").test(sourceForExactMatch);
  };
  const hasExactAcceptanceReference = (cell, refs, manifestCheckIds = []) =>
    refs.size > 0 ||
    manifestCheckIds.some((checkId) => sourceNamesExactManifestCheck(cell, checkId)) ||
    /["'`][^"'`]{3,}["'`]/.test(cell) ||
    /\b(?:criterion|checkbox)\s*(?:#?\d+|["'`:][^|]+|named\b)/i.test(cell);

  const reviewCellNeedsMap = (cell) => {
    const normalized = cell.replace(/\s+/g, " ").trim();
    if (!normalized || /^N\/A\b/i.test(normalized)) return false;
    if (/\bexisting-test contract-change expectation\b/i.test(normalized)) return false;
    if (/\bcoverage-only existing behavior\b/i.test(normalized)) return false;
    return /\bRF-[1-9]\d*\b|\b(review[- ]fix|finding fixed|coverage-only|partial-red|red-first skip)\b/i.test(
      normalized
    );
  };

  const externalProofKeywords =
    /\b(cold|external(?:[- ](?:LLM|model|probe|proof|evidence))?|LLM|subagent|packet[- ]read|probe)\b/i;
  const externalProofEvidenceKeywords =
    /\b(proof|evidence|result|artifact|report|output|recorded|passed|verified|readback|packet|citation|audit row|same durable sink|per-criterion)\b/i;
  const collectCriterionRefs = (text) => {
    const refs = new Set();
    for (const match of text.matchAll(/\b(AC|US)\s*(\d+)(?:\s*[-–]\s*(?:AC|US)?\s*(\d+))?/gi)) {
      const prefix = match[1].toUpperCase();
      const start = Number(match[2]);
      const end = Number(match[3] ?? match[2]);
      if (!Number.isFinite(start) || !Number.isFinite(end)) continue;
      const lower = Math.min(start, end);
      const upper = Math.max(start, end);
      if (upper - lower > 200) continue;
      for (let value = lower; value <= upper; value += 1) refs.add(`${prefix}${value}`);
    }
    return refs;
  };
  const sourceNamesManifestCheck = (source, checkId) => {
    if (sourceNamesExactManifestCheck(source, checkId)) return true;

    const acNumber = checkId.match(/^AC(\d+)$/i)?.[1];
    if (acNumber) {
      const number = Number(acNumber);
      const rangePattern = /\bAC\s*(\d+)\s*(?:-|–|—|to|through)\s*(?:AC\s*)?(\d+)\b/gi;
      if ([...source.matchAll(rangePattern)].some((match) => {
        const start = Number(match[1]);
        const end = Number(match[2]);
        return number >= Math.min(start, end) && number <= Math.max(start, end);
      })) {
        return true;
      }
    }

    const parentAliases = {
      "Parent-Solution": /\bSolution\b/i,
      "Parent-Implementation-Decisions": /\bImplementation(?:\s+Decisions)?\b/i,
      "Parent-Testing-Decisions": /\bTesting(?:\s+Decisions)?\b/i
    };
    return parentAliases[checkId]?.test(source) ?? false;
  };
  const intersects = (left, right) => {
    for (const value of left) {
      if (right.has(value)) return true;
    }
    return false;
  };
  const hasExternalProofEvidence = (cell) => {
    const normalized = cell.replace(/\s+/g, " ").trim();
    return externalProofKeywords.test(normalized) && externalProofEvidenceKeywords.test(normalized);
  };

  const gateLine = requireGateLine();
  const existingTestRowsField = firstLineMatching(/^-?\s*Existing-test contract-change rows:/i);
  const hasCompactHeader = body.includes(compactHeader);
  const hasCompactSeparator = body.includes(compactSeparator);
  const hasSummaryHeader = body.includes(summaryHeader);
  const claimsCompact =
    /compact table\/header\s+present(?:\s+after\s+structural\s+check)?/i.test(gateLine);
  const claimsEquivalent =
    /equivalent fields present(?:\s+after\s+structural\s+check)?/i.test(gateLine);

  for (const label of requiredPreflightLabels) {
    requireText(label, `fielded preflight label ${label}`);
  }
  requireText("Existing-test contract-change rows:", "existing-test contract-change rows field");
  forbidMatch(/\bpending tracker URL\b/i, "pending tracker URL placeholder");

  const authorityStatusValues = extractFieldValues("ADRs/principles/docs status");
  for (const [index, value] of authorityStatusValues.entries()) {
    const authorityError = validateAuthorityDispositionValue(value);
    if (authorityError) {
      const occurrence = index === 0 ? "preflight" : `field occurrence ${index + 1}`;
      errors.push(`${occurrence} ADRs/principles/docs status ${authorityError}`);
    }
  }
  const gateAuthorityStatus =
    gateLine.match(/ADRs\/principles\/docs status\s+(.+?)(?=;\s*sequence evidence\b|$)/i)?.[1]?.trim() ?? "";
  const gateAuthorityError = validateAuthorityDispositionValue(gateAuthorityStatus);
  if (gateAuthorityError) {
    errors.push(`gate ADRs/principles/docs status ${gateAuthorityError}`);
  }

  if (closing) {
    const localAbsolutePath = /(?:^|[\s\x60("'=])((?:\/(?!\/)|[A-Za-z]:\\)[^\s\x60"'),;]+)/;
    const publishableSinkValues = [
      { label: "Durable sink/body inspected", value: extractFieldValue("Durable sink/body inspected") },
      { label: "Pre-red evidence reference", value: extractFieldValue("Pre-red evidence reference") },
      { label: "Final preservation sink", value: extractFieldValue("Final preservation sink") },
      { label: "TDD evidence gate", value: gateLine }
    ];

    for (const { label, value } of publishableSinkValues) {
      const match = value.match(localAbsolutePath);
      if (match) {
        errors.push(
          `published TDD closeout field ${label} contains local staging path ${match[1]}; use a stable issue/comment reference and keep local inspection paths private`
        );
      }
    }
  }

  const evidenceFreshnessValue = extractFieldValue("Evidence-only rows freshness");
  const evidenceFreshnessError = validateFreshnessValue(evidenceFreshnessValue);
  if (evidenceFreshnessError) {
    errors.push(`Evidence-only rows freshness ${evidenceFreshnessError}`);
  }

  const acceptanceAtomMapValue = extractFieldValue("Acceptance atom map");
  const acceptanceAtomMapError = validateAcceptanceAtomMapValue(acceptanceAtomMapValue);
  if (acceptanceAtomMapError) {
    errors.push(`Acceptance atom map ${acceptanceAtomMapError}`);
  }

  const acceptanceSequenceMapValue = extractFieldValue("Acceptance sequence map");
  const acceptanceSequenceMapError = validateAcceptanceSequenceMapValue(acceptanceSequenceMapValue);
  if (acceptanceSequenceMapError) {
    errors.push(`Acceptance sequence map ${acceptanceSequenceMapError}`);
  }

  const identityRefreshValue = extractFieldValue("Evidence identity refresh");
  if (
    !identityRefreshValue ||
    /^<.*>$/.test(identityRefreshValue) ||
    /\b(?:TODO|TBD|pending|unknown)\b/i.test(identityRefreshValue)
  ) {
    errors.push("Evidence identity refresh is empty or unresolved");
  }

  const currentIdentities = extractFieldValue("Current evidence identities");
  const historicalRedIdentities = extractFieldValue("Historical red identities retained");
  const supersededIdentities = extractFieldValue("Superseded evidence identities");
  const normalizedSupersededIdentities = supersededIdentities.replace(/[.,;:!?]+$/u, "");
  const supersededSweep = extractFieldValue("Superseded-token sweep");
  const identityCategories = [
    /fixture paths\s+[^;\s][^;]*(?:;|$)/i,
    /browser sessions\s+[^;\s][^;]*(?:;|$)/i,
    /packet paths\/hashes\s+[^;\s][^;]*(?:;|$)/i,
    /active revisions\s+[^;\s][^;]*(?:;|$)/i,
    /artifacts\s+[^;\s][^;]*(?:;|$)/i
  ];
  const withheldFixtureIdentity = /fixture paths\s+withheld\b/i.test(currentIdentities);
  const completeWithheldFixtureIdentity = /fixture paths\s+withheld because\s+[^;]+;\s*logical fixture\s+[^;]+;\s*content SHA-256\s+[0-9a-f]{64};\s*provenance\s+[^;]+(?=;|$)/i;
  for (const [label, value] of [
    ["Current evidence identities", currentIdentities],
    ["Superseded evidence identities", supersededIdentities]
  ]) {
    if (identityCategories.some((pattern) => !pattern.test(value))) {
      errors.push(`${label} must list fixture paths, browser sessions, packet paths/hashes, active revisions, and artifacts`);
    }
  }
  if (
    !historicalRedIdentities ||
    !supersededSweep ||
    /\b(?:TODO|TBD|pending|unknown)\b|<[^>]+>/i.test(
      `${currentIdentities} ${historicalRedIdentities} ${supersededIdentities} ${supersededSweep}`
    )
  ) {
    errors.push("evidence identity fields are empty or unresolved");
  }
  if (/fixture paths\s+none published because/i.test(currentIdentities)) {
    errors.push("withheld fixture paths must use the structured 'fixture paths withheld because ...' identity form");
  }
  if (withheldFixtureIdentity && !completeWithheldFixtureIdentity.test(currentIdentities)) {
    errors.push(
      "withheld fixture identity must include reason, logical fixture, 64-character content SHA-256, and provenance"
    );
  }
  const allSupersededCategoriesNone = [
    /fixture paths\s+none(?:;|$)/i,
    /browser sessions\s+none(?:;|$)/i,
    /packet paths\/hashes\s+none(?:;|$)/i,
    /active revisions\s+none(?:;|$)/i,
    /artifacts\s+none(?:;|$)/i
  ].every((pattern) => pattern.test(normalizedSupersededIdentities));
  const hasClassifiedHistoryResult = /\bno hits outside classified identity\/history lines\b/i.test(supersededSweep);
  const hasActiveProofResult = /\bno active-proof hits\b/i.test(supersededSweep);
  if (!allSupersededCategoriesNone && (!hasClassifiedHistoryResult || !hasActiveProofResult)) {
    errors.push(
      "Superseded-token sweep must report 'no hits outside classified identity/history lines and no active-proof hits' for listed superseded identities"
    );
  }
  if (allSupersededCategoriesNone && /^N\/A\b/i.test(supersededSweep) && !/because/i.test(supersededSweep)) {
    errors.push("Superseded-token sweep N/A must include 'because'");
  }

  if (body.includes("Pre-red recovery status:")) {
    const preRedRecoveryStatusValue = extractFieldValue("Pre-red recovery status");
    const preRedRecoveryStatusError = validatePreRedRecoveryStatusValue(preRedRecoveryStatusValue);
    if (preRedRecoveryStatusError) {
      errors.push(`Pre-red recovery status ${preRedRecoveryStatusError}`);
    }
    const preRedEvidenceReference = extractFieldValue("Pre-red evidence reference");
    const preRedEvidenceReferenceError = validatePreRedEvidenceReference(
      preRedRecoveryStatusValue,
      preRedEvidenceReference
    );
    if (preRedEvidenceReferenceError) {
      errors.push(`Pre-red evidence reference ${preRedEvidenceReferenceError}`);
    }
    if (/\blisted with TDD recovery addendum\b/i.test(preRedRecoveryStatusValue)) {
      validateRecoveryAddendum();
    }
  }

  if (claimsCompact) {
    if (!hasCompactHeader) errors.push("claims compact table/header present but exact compact TDD header is missing");
    if (!hasCompactSeparator) errors.push("claims compact table/header present but exact compact TDD separator is missing");
  }

  if (hasSummaryHeader && claimsCompact && !hasCompactHeader) {
    errors.push("four-column summary table cannot satisfy compact table/header present");
  }

  if (flags.has("--parent-rollup")) {
    if (!hasCompactHeader) errors.push("--parent-rollup requires exact parent-rollup-ready compact TDD table header");
    if (!hasCompactSeparator) errors.push("--parent-rollup requires exact compact TDD table separator");
    if (claimsEquivalent && !hasCompactHeader) {
      errors.push("--parent-rollup cannot rely on equivalent fields without a linked compact table");
    }
  }

  if (!hasCompactHeader) {
    if (!claimsEquivalent) {
      errors.push("missing compact table header and gate line does not claim equivalent fields present");
    }
    for (const label of equivalentFieldLabels) {
      if (!body.includes(label)) errors.push(`equivalent-field body missing ${label}`);
    }
    if (hasSummaryHeader) {
      errors.push("four-column summary table is not equivalent fields; add missing per-row fields or the compact table");
    }
  }

  if (hasCompactHeader && !compactRows.length) {
    errors.push("compact TDD table has no issue rows");
  }

  if (manifestIssues.length) {
    const sourcesByIssue = new Map(manifestIssues.map((issue) => [issue.number, []]));
    const addIssueSource = (issueNumber, source) => {
      if (sourcesByIssue.has(issueNumber)) sourcesByIssue.get(issueNumber).push(source);
    };

    for (const { cells } of compactRows) {
      const issueNumber = Number(cells[0]?.match(/^#(\d+)/)?.[1]);
      if (Number.isInteger(issueNumber)) addIssueSource(issueNumber, cells[6] ?? "");
    }

    const checkOwners = new Map();
    for (const issue of manifestIssues) {
      for (const check of issue.checks) {
        const key = check.id.toLowerCase();
        const owners = checkOwners.get(key) ?? [];
        owners.push(issue.number);
        checkOwners.set(key, owners);
      }
    }

    for (const line of lines) {
      if (!line.trim().startsWith("|")) continue;
      const cells = splitTableRow(line);
      const issueNumber = Number(cells[0]?.match(/^#(\d+)/)?.[1]);
      if (Number.isInteger(issueNumber)) {
        addIssueSource(issueNumber, cells.slice(1).join(" "));
        continue;
      }

      const owners = checkOwners.get((cells[0] ?? "").toLowerCase()) ?? [];
      if (owners.length === 1) addIssueSource(owners[0], cells.join(" "));
    }

    for (const issue of manifestIssues) {
      const sources = sourcesByIssue.get(issue.number) ?? [];
      for (const check of issue.checks) {
        if (!sources.some((source) => sourceNamesManifestCheck(source, check.id))) {
          errors.push(`acceptance manifest issue #${issue.number} is missing TDD coverage for ${check.id}`);
        }
      }
    }
  }

  const reviewFixRows = [];
  const existingTestRows = [];
  const browserManualEvidenceRows = [];
  const compactRowLineNumbers = new Set(compactRows.map(({ lineNumber }) => lineNumber));
  const externalProofAuditRefsByIssue = new Map();

  for (let index = 0; index < lines.length; index += 1) {
    const lineNumber = index + 1;
    if (compactRowLineNumbers.has(lineNumber)) continue;

    const line = lines[index].trim();
    if (!line.startsWith("|")) continue;

    const cells = splitTableRow(line);
    const issueId = (cells[0]?.match(/^#\d+/) ?? [])[0];
    if (!issueId) continue;

    const rowText = cells.join(" ");
    if (!externalProofKeywords.test(rowText)) continue;

    const refs = collectCriterionRefs(rowText);
    if (!refs.size) continue;

    const issueRefs = externalProofAuditRefsByIssue.get(issueId) ?? new Set();
    for (const ref of refs) issueRefs.add(ref);
    externalProofAuditRefsByIssue.set(issueId, issueRefs);
  }

  for (const { lineNumber, cells } of compactRows) {
    if (cells.length < 8) {
      errors.push(`compact TDD row ${lineNumber} has ${cells.length} cells; expected 8`);
      continue;
    }

    const authorityStatusCell = cells[2] ?? "";
    const authorityStatusError = validateAuthorityDispositionValue(authorityStatusCell);
    if (authorityStatusError) {
      errors.push(
        `compact TDD row ${lineNumber} ADRs/principles/docs status ${authorityStatusError}`
      );
    }

    const seamCell = cells[3] ?? "";
    const isExistingContractChangeExpectation =
      seamCell.trim() === "existing contract-change expectation";
    const redCell = cells[4];
    const greenCell = cells[5] ?? "";
    const acceptanceCell = cells[6] ?? "";
    const rowText = cells.join(" ");
    if (
      isExistingContractChangeExpectation &&
      !hasExistingContractChangeExpectationEvidence(redCell)
    ) {
      errors.push(
        `compact TDD row ${lineNumber} existing contract-change expectation evidence must start with \`existing contract-change expectation in <test file> because ...\` and name the failing command or assertion`
      );
    } else if (!hasConcreteRedEvidence(redCell)) {
      errors.push(
        `compact TDD row ${lineNumber} red command/failure is not concrete: ${redCell}; for expectation rewrites use \`existing contract-change expectation in <test file> because ...\`, not \`existing-test contract-change expectation\``
      );
    }

    const issueId = (cells[0]?.match(/^#\d+/) ?? [])[0];
    const issueNumber = Number(issueId?.slice(1));
    const manifestCheckIds =
      manifestIssues.find((issue) => issue.number === issueNumber)?.checks.map(({ id }) => id) ?? [];
    const acceptanceRefs = collectCriterionRefs(acceptanceCell);
    if (!hasExactAcceptanceReference(acceptanceCell, acceptanceRefs, manifestCheckIds)) {
      errors.push(
        `compact TDD row ${lineNumber} does not cite an exact AC/US, exact supplied manifest check ID, quoted criterion, or named checkbox in Acceptance covered`
      );
    }
    if (
      !/\batoms?\s*:/i.test(acceptanceCell) ||
      !/\bproof surfaces?\s*:/i.test(acceptanceCell) ||
      !/\bsequence\s*:/i.test(acceptanceCell)
    ) {
      errors.push(
        `compact TDD row ${lineNumber} Acceptance covered must include atoms:, proof surfaces:, and sequence: for the exact criterion`
      );
    }
    if (/\b(?:TODO|TBD|pending|unknown)\b/i.test(acceptanceCell)) {
      errors.push(`compact TDD row ${lineNumber} Acceptance covered contains an unresolved value`);
    }
    for (const label of ["atoms", "proof surfaces", "sequence"]) {
      const emptyLabel = new RegExp(`${label}:\\s*(?:;|$)`, "i");
      if (emptyLabel.test(acceptanceCell)) {
        errors.push(`compact TDD row ${lineNumber} Acceptance covered has an empty ${label}: value`);
      }
    }
    if (/\bsequence\s*:\s*N\/A\s*(?:;|$)/i.test(acceptanceCell)) {
      errors.push(`compact TDD row ${lineNumber} sequence N/A must include 'because'`);
    }
    const atoms = evidenceField(acceptanceCell, "atoms", ["proof surfaces", "sequence"]);
    const proofSurfaces = evidenceField(acceptanceCell, "proof surfaces", ["sequence"]);
    if (circularAcceptanceReference.test(atoms) || circularAcceptanceReference.test(proofSurfaces)) {
      errors.push(`compact TDD row ${lineNumber} Acceptance covered uses a circular atom or proof-surface reference`);
    }
    if (proofSurfaces && !concreteProofAnchor.test(proofSurfaces) && !hasConcreteGreenEvidence(greenCell)) {
      errors.push(
        `compact TDD row ${lineNumber} proof surfaces require a concrete test, command, path, route, artifact, URL, tracker reference, or matching concrete Green evidence`
      );
    }
    const claimsCoverageOnlyExistingBehavior = /\bcoverage-only existing behavior\b/i.test(rowText);
    if (claimsCoverageOnlyExistingBehavior && !hasConcreteGreenEvidence(greenCell)) {
      errors.push(
        `compact TDD row ${lineNumber} claims coverage-only existing behavior without concrete Green command or evidence that names the proof surface and observed passing result`
      );
    }
    const externalAuditRefs = externalProofAuditRefsByIssue.get(issueId) ?? new Set();
    const citesSameSinkExternalProof = intersects(acceptanceRefs, externalAuditRefs);
    const sameRowExternalProofCitation =
      externalProofKeywords.test(rowText) &&
      /\b(per-criterion|acceptance audit|audit row|same durable sink|closeout row|linked row|cites?)\b/i.test(rowText);
    const claimsExternalProof = externalProofKeywords.test(acceptanceCell) || citesSameSinkExternalProof;

    if (
      claimsExternalProof &&
      !hasExternalProofEvidence(greenCell) &&
      !citesSameSinkExternalProof &&
      !sameRowExternalProofCitation
    ) {
      errors.push(
        `compact TDD row ${lineNumber} claims external/cold/subagent proof without Green command or evidence naming that proof, or a same-sink audit citation naming it`
      );
    }

    if (reviewCellNeedsMap(cells[7])) {
      reviewFixRows.push({ lineNumber, issueId, seam: seamCell.trim(), cells });
    }

    if (isExistingContractChangeExpectation) {
      existingTestRows.push(lineNumber);
    }

    if (
      /\b(evidence-only|browser evidence|manual|walkthrough|screenshot)\b/i.test(seamCell) &&
      /\b(browser|manual|screenshot|walkthrough|route|action|Playwright|DOM|page)\b/i.test(rowText)
    ) {
      browserManualEvidenceRows.push(lineNumber);
    }
  }

  const consoleStateValue = extractFieldValue("Evidence-only browser console state");
  if (browserManualEvidenceRows.length && !consoleStateValue) {
    errors.push(
      `browser/manual evidence-only row(s) ${browserManualEvidenceRows.join(", ")} require Evidence-only browser console state`
    );
  }
  const consoleStateClaimsNoBrowserRows =
    /^none\b/i.test(consoleStateValue) ||
    /^N\/A\b.+no browser\/manual evidence-only rows\b/i.test(consoleStateValue);
  if (browserManualEvidenceRows.length && consoleStateClaimsNoBrowserRows) {
    errors.push(
      `browser/manual evidence-only row(s) ${browserManualEvidenceRows.join(", ")} cannot use Evidence-only browser console state ${consoleStateValue}`
    );
  }
  if (consoleStateValue) {
    const consoleStateError = validateConsoleStateValue(consoleStateValue);
    if (consoleStateError) {
      errors.push(`Evidence-only browser console state ${consoleStateError}`);
    }
  }

  const backendCurrentnessValues = extractFieldValues("Evidence-only backend process currentness");
  const backendCurrentnessValue = backendCurrentnessValues[0] ?? "";
  const backendCurrentnessClaimsNoBrowserRows =
    backendCurrentnessValues.some((value) => /^none\b.+\bno browser\/manual\b/i.test(value)) ||
    backendCurrentnessValues.some((value) => /^N\/A\b.+\bno browser\/manual evidence-only rows\b/i.test(value));
  if (browserManualEvidenceRows.length && backendCurrentnessClaimsNoBrowserRows) {
    errors.push(
      `browser/manual evidence-only row(s) ${browserManualEvidenceRows.join(", ")} cannot use Evidence-only backend process currentness ${backendCurrentnessValue}`
    );
  }
  validateBackendCurrentnessValues("Evidence-only backend process currentness", backendCurrentnessValues);
  const hasBrowserManualProof =
    browserManualEvidenceRows.length > 0 ||
    Boolean(consoleStateValue && !consoleStateClaimsNoBrowserRows) ||
    backendCurrentnessValues.some(
      (value) =>
        !/^none\b.+\bno browser\/manual\b/i.test(value) &&
        !/^N\/A\b.+\b(no browser\/manual|no backend\/API dependency)\b/i.test(value)
    );
  if (hasBrowserManualProof) {
    const fixturePaths = currentIdentities.match(/(?:^|;)\s*fixture paths\s+([^;]+)/i)?.[1]?.trim() ?? "";
    errors.push(
      ...fixtureSnapshotCurrentnessErrors(fixturePaths, backendCurrentnessValues, {
        label: "Evidence-only backend process currentness"
      })
    );
  }

  const proofServerPreflightValue = extractFieldValue("Evidence-only proof server preflight");
  const proofServerPreflightClaimsNoBrowserRows =
    /^N\/A\b.+\bno browser\/manual evidence-only rows\b/i.test(proofServerPreflightValue);
  if (browserManualEvidenceRows.length && proofServerPreflightClaimsNoBrowserRows) {
    errors.push(
      `browser/manual evidence-only row(s) ${browserManualEvidenceRows.join(", ")} cannot use Evidence-only proof server preflight ${proofServerPreflightValue}`
    );
  }
  const proofServerPreflightError = validateProofServerPreflightValue(proofServerPreflightValue);
  if (proofServerPreflightError) {
    errors.push(`Evidence-only proof server preflight ${proofServerPreflightError}`);
  }

  const gateClaimsExistingTestsListed =
    /existing-test contract-change rows\s+(?!none\b)[^.;]+/i.test(gateLine);
  const gateClaimsExistingTestsNone =
    /existing-test contract-change rows\s+none\b/i.test(gateLine);
  const fieldClaimsExistingTestsNone = /:\s*none\b/i.test(existingTestRowsField);
  const fieldClaimsExistingTestsListed = existingTestRowsField !== "" && !fieldClaimsExistingTestsNone;

  if ((gateClaimsExistingTestsListed || fieldClaimsExistingTestsListed) && !existingTestRows.length) {
    errors.push(
      "listed existing-test contract-change rows require a compact table row with Seam `existing contract-change expectation`"
    );
  }

  if (existingTestRows.length && gateClaimsExistingTestsNone) {
    errors.push("gate line says existing-test contract-change rows none but compact table has existing contract-change expectation row(s)");
  }

  if (existingTestRows.length && fieldClaimsExistingTestsNone) {
    errors.push("preflight says Existing-test contract-change rows none but compact table has existing contract-change expectation row(s)");
  }

  requireText("TDD review-fix map:", "TDD review-fix map disposition");
  const hasExplicitNoReviewFixMap =
    /^\s*TDD review-fix map:\s*N\/A\b.+\bbecause\b.+\bno TDD row changes\b/im.test(body);
  const reviewFixMapRows = tableRowsAfter(reviewFixMapHeader);
  const hasReviewFixMapHeader = body.includes(reviewFixMapHeader);

  if (reviewFixRows.length && hasExplicitNoReviewFixMap) {
    errors.push("TDD review-fix map says N/A but compact TDD rows contain review-fix evidence");
  }
  if (reviewFixRows.length && !hasReviewFixMapHeader) {
    errors.push("review-fix TDD rows require the exact keyed TDD review-fix map header");
  }
  if (hasReviewFixMapHeader && !reviewFixMapRows.length) {
    errors.push("TDD review-fix map must contain at least one keyed finding row");
  }

  const seenReviewFixIds = new Set();
  const reviewFixTargetLines = new Map();
  for (const [index, cells] of reviewFixMapRows.entries()) {
    const row = index + 1;
    if (cells.length !== 9) {
      errors.push(`TDD review-fix map row ${row} must contain exactly nine columns`);
      continue;
    }

    const [findingId, finding, intendedRed, green, updatedRow, regressionDurability, freshness, backend, identity] = cells;
    let hasUniqueFindingId = false;
    if (!/^RF-[1-9]\d*$/.test(findingId)) {
      errors.push(`TDD review-fix map row ${row} Finding ID must use RF-N with a positive integer`);
    } else if (seenReviewFixIds.has(findingId)) {
      errors.push(`TDD review-fix map row ${row} duplicates Finding ID ${findingId}`);
    } else {
      seenReviewFixIds.add(findingId);
      hasUniqueFindingId = true;
    }

    for (const [label, value] of [
      ["Finding/source", finding],
      ["Intended red command/failure", intendedRed],
      ["Green command/evidence", green],
      ["Updated TDD table row", updatedRow],
      ["Regression durability", regressionDurability],
      ["Browser/manual evidence freshness", freshness],
      ["Backend process currentness", backend],
      ["Evidence identity refresh", identity]
    ]) {
      if (!value || /^<.*>$/.test(value) || /\b(?:TODO|TBD|pending|unknown)\b/i.test(value)) {
        errors.push(`TDD review-fix map row ${row} ${label} is empty or unresolved`);
      }
    }

    if (!hasConcreteRedEvidence(intendedRed)) {
      errors.push(`TDD review-fix map row ${row} Intended red command/failure is not concrete`);
    }
    if (!hasConcreteGreenEvidence(green)) {
      errors.push(`TDD review-fix map row ${row} Green command/evidence is not concrete`);
    }

    const updatedMatch = updatedRow.match(/^#(\d+)\s*\/\s*(.+)$/);
    if (!updatedMatch) {
      errors.push(`TDD review-fix map row ${row} Updated TDD table row must use #N / <exact Seam>`);
    } else {
      const issueId = `#${updatedMatch[1]}`;
      const seam = updatedMatch[2].trim();
      const targetRow = compactRows.find(
        ({ cells: targetCells }) =>
          targetCells[0]?.match(/^#\d+/)?.[0] === issueId &&
          (targetCells[3] ?? "").trim().toLowerCase() === seam.toLowerCase()
      );
      if (!targetRow) {
        errors.push(`TDD review-fix map row ${row} targets missing compact row ${updatedRow}`);
      } else if (!new RegExp(`(?:^|[^A-Za-z0-9])${findingId}(?=$|[^A-Za-z0-9])`).test(targetRow.cells[7] ?? "")) {
        errors.push(
          `TDD review-fix map row ${row} Finding ID ${findingId} is not repeated in compact row ${updatedRow}`
        );
      } else if (hasUniqueFindingId) {
        reviewFixTargetLines.set(findingId, targetRow.lineNumber);
      }
    }

    const regressionDurabilityError = validateRegressionDurabilityValue(regressionDurability);
    if (regressionDurabilityError) {
      errors.push(`TDD review-fix map row ${row} Regression durability ${regressionDurabilityError}`);
    }
    const freshnessError = validateFreshnessValue(freshness);
    if (freshnessError) {
      errors.push(`TDD review-fix map row ${row} Browser/manual evidence freshness ${freshnessError}`);
    }
    validateBackendCurrentnessValues(`TDD review-fix map row ${row} Backend process currentness`, [backend]);
  }

  for (const { lineNumber, cells } of reviewFixRows) {
    const ids = [...(cells[7] ?? "").matchAll(/\bRF-[1-9]\d*\b/g)].map((match) => match[0]);
    if (!ids.length) {
      errors.push(`compact TDD row ${lineNumber} review-fix evidence must cite at least one keyed RF-N map row`);
    }
  }

  for (const { lineNumber, cells } of compactRows) {
    const ids = new Set([...(cells[7] ?? "").matchAll(/\bRF-[1-9]\d*\b/g)].map((match) => match[0]));
    for (const id of ids) {
      if (!seenReviewFixIds.has(id)) {
        errors.push(`compact TDD row ${lineNumber} cites missing TDD review-fix map row ${id}`);
      } else if (reviewFixTargetLines.get(id) !== lineNumber) {
        errors.push(`compact TDD row ${lineNumber} cites ${id}, but that map row targets a different compact TDD row`);
      }
    }
  }

  forbidText("TDD evidence gate passed: yes", "TDD evidence gate shorthand");

  return errors;
};

const isCli = process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;

if (isCli) {
  const args = process.argv.slice(2);
  const maxBytesFlag = args.indexOf("--max-bytes");
  const maxBytesText = maxBytesFlag >= 0 ? args[maxBytesFlag + 1] : undefined;
  const expectedFinalShaFlag = args.indexOf("--expected-final-sha");
  const expectedFinalSha = expectedFinalShaFlag >= 0 ? args[expectedFinalShaFlag + 1] : undefined;
  const acceptanceManifestFlag = args.indexOf("--acceptance-manifest");
  const acceptanceManifestPath = acceptanceManifestFlag >= 0 ? args[acceptanceManifestFlag + 1] : undefined;
  const valueIndexes = new Set(
    [maxBytesFlag, expectedFinalShaFlag, acceptanceManifestFlag]
      .filter((index) => index >= 0)
      .map((index) => index + 1)
  );
  const file = args.find((arg, index) => !arg.startsWith("--") && !valueIndexes.has(index));
  const flags = new Set(args.filter((arg) => arg.startsWith("--")));

  if (flags.has("--help")) {
    console.error(usage);
    process.exit(0);
  }

  if (!file) {
    console.error(usage);
    process.exit(2);
  }

  if (maxBytesFlag >= 0 && (!maxBytesText || maxBytesText.startsWith("--"))) {
    console.error("--max-bytes requires a value");
    console.error(usage);
    process.exit(2);
  }

  if (expectedFinalShaFlag >= 0 && (!expectedFinalSha || expectedFinalSha.startsWith("--"))) {
    console.error("--expected-final-sha requires a commit SHA");
    console.error(usage);
    process.exit(2);
  }

  if (acceptanceManifestFlag >= 0 && (!acceptanceManifestPath || acceptanceManifestPath.startsWith("--"))) {
    console.error("--acceptance-manifest requires a manifest path");
    console.error(usage);
    process.exit(2);
  }

  if (manifestScopeFlags.some((flag) => flags.has(flag)) && !acceptanceManifestPath) {
    console.error(
      `${manifestScopeFlags.filter((flag) => flags.has(flag)).join("/")} requires --acceptance-manifest`
    );
    console.error(usage);
    process.exit(2);
  }

  if (expectedFinalSha && !/^[0-9a-f]{7,40}$/i.test(expectedFinalSha)) {
    console.error("--expected-final-sha must be a 7-40 character hexadecimal commit SHA");
    console.error(usage);
    process.exit(2);
  }

  if (flags.has("--closing") && !expectedFinalSha) {
    console.error("--closing requires --expected-final-sha");
    console.error(usage);
    process.exit(2);
  }

  const maxBytes = maxBytesText === undefined ? DEFAULT_TDD_CLOSEOUT_BODY_MAX_BYTES : Number(maxBytesText);
  if (!Number.isInteger(maxBytes) || maxBytes <= 0) {
    console.error("--max-bytes must be a positive integer");
    console.error(usage);
    process.exit(2);
  }

  let acceptanceManifest;
  if (acceptanceManifestPath) {
    try {
      acceptanceManifest = JSON.parse(readFileSync(acceptanceManifestPath, "utf8"));
    } catch (error) {
      console.error(`Acceptance manifest read failed: ${error.message}`);
      process.exit(1);
    }
  }

  const body = readFileSync(file, "utf8");
  const errors = validateTddCloseoutBody(body, {
    flags,
    maxBytes,
    expectedFinalSha,
    acceptanceManifest
  });

  if (errors.length) {
    console.error(`TDD closeout body validation failed for ${file}:`);
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
  }

  console.log(`TDD closeout body validation passed: ${file}`);
  if (flags.has("--closing")) console.log(postCommentVerificationReminder);
}
