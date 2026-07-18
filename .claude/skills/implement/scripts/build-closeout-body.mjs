#!/usr/bin/env node

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { buildAuditScaffold } from "./build-acceptance-manifest.mjs";
import {
  hasConcreteGreenEvidence,
  hasConcreteRedEvidence,
  validateBackendCurrentnessValue as backendCurrentnessError,
  validateFreshnessValue as freshnessError,
  validateRegressionDurabilityValue as regressionDurabilityError
} from "../../tdd/scripts/tdd-evidence-contract.mjs";

export const DEFAULT_CLOSEOUT_BODY_MAX_BYTES = 65_536;
export const DEFAULT_CLOSEOUT_EVIDENCE_HEADROOM_BYTES = 16_384;

const usage = `Usage: node .claude/skills/implement/scripts/build-closeout-body.mjs <manifest.json> --output <body.md> --parent <issue> --review <normal|fallback> [--audit-input <audit.md>] [--evidence-input <evidence.json>] [--immediate-fix] [--tdd-parent-rollup] [--browser] [--principles] [--local-only] [--fixed-child <none|pending|final>] [--max-bytes <positive integer>] [--size-plan] [--require-headroom]`;

export const assertCloseoutBodySize = (body, maxBytes = DEFAULT_CLOSEOUT_BODY_MAX_BYTES) => {
  if (!Number.isInteger(maxBytes) || maxBytes <= 0) {
    throw new Error("max bytes must be a positive integer");
  }

  const bodyBytes = Buffer.byteLength(body, "utf8");
  if (bodyBytes > maxBytes) {
    throw new Error(
      `closeout body is ${bodyBytes} bytes; maximum is ${maxBytes} bytes. Shorten concrete evidence or split it into separately validated durable tracker sinks before publication`
    );
  }

  return body;
};

export const buildCloseoutBodySizePlan = (
  body,
  audit,
  maxBytes = DEFAULT_CLOSEOUT_BODY_MAX_BYTES
) => {
  if (!Number.isInteger(maxBytes) || maxBytes <= 0) {
    throw new Error("max bytes must be a positive integer");
  }

  const scaffoldBytes = Buffer.byteLength(body, "utf8");
  const auditBytes = Buffer.byteLength(audit, "utf8");
  const remainingBytes = maxBytes - scaffoldBytes;
  const recommendedEvidenceHeadroomBytes = Math.min(
    DEFAULT_CLOSEOUT_EVIDENCE_HEADROOM_BYTES,
    Math.floor(maxBytes / 4)
  );
  const status = scaffoldBytes > maxBytes
    ? "exceeds-limit"
    : remainingBytes < recommendedEvidenceHeadroomBytes
      ? "low-headroom"
      : "ok";

  return {
    maxBytes,
    scaffoldBytes,
    auditBytes,
    nonAuditScaffoldBytes: scaffoldBytes - auditBytes,
    remainingBytes,
    recommendedEvidenceHeadroomBytes,
    status
  };
};

const tableText = (value) => value.replaceAll("|", "&#124;").replaceAll("\n", " ").trim();

const requireManifest = (manifest) => {
  if (!Array.isArray(manifest?.issues) || manifest.issues.length === 0) {
    throw new Error("manifest must contain a non-empty issues array");
  }

  for (const issue of manifest.issues) {
    if (!Number.isInteger(issue?.number) || !Array.isArray(issue?.checks) || issue.checks.length === 0) {
      throw new Error("each manifest issue must contain an integer number and non-empty checks array");
    }
    for (const check of issue.checks) {
      if (typeof check?.id !== "string" || !check.id || typeof check?.text !== "string") {
        throw new Error(`manifest issue #${issue.number} contains an invalid check`);
      }
    }
  }
};

const exactAuditKey = (issue, check) =>
  `| #${issue.number} | ${check.id} - ${tableText(check.text)} |`;

export const validateAuditInput = (manifest, audit) => {
  const header = "| Issue | Acceptance criterion or conformance check | Evidence | Status |";
  if (!audit.includes(header)) throw new Error("audit input is missing the exact audit table header");

  for (const issue of manifest.issues) {
    for (const check of issue.checks) {
      const key = exactAuditKey(issue, check);
      const count = audit.split(key).length - 1;
      if (count !== 1) {
        throw new Error(`#${issue.number} ${check.id} requires exactly one exact audit row; found ${count}`);
      }
    }
  }

  return audit.trim();
};

const acceptanceId = (check) => /^(?:AC|US)\d+$/i.test(check.id) ? check.id : `\`${check.id}\``;

const acceptanceIds = (issue) => issue.checks.map(acceptanceId).join(", ");

const requiredEvidenceText = (value, field) => {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`evidence ${field} must be a non-empty string`);
  }
  return value.trim();
};

const allowedRepairClasses = new Set([
  "behavior",
  "coverage-only",
  "standards-only",
  "adr-only",
  "conformance-only",
  "docs-only",
  "evidence-only"
]);

const validTddDisposition = (value) =>
  /\bRF-\d+\b/i.test(value) ||
  /^red-first skipped because\s+\S/i.test(value) ||
  /^coverage-only review fix;\s*red-first N\/A because\s+\S/i.test(value) ||
  /^partial red - wrong reason:\s*\S/i.test(value) ||
  /\bred\b.+\bfailed\b.+\bgreen\b.+\bpassed\b/i.test(value) ||
  /^N\/A because accepted residual\b.+/i.test(value);

const structuredAuditKey = (issueNumber, checkId) => JSON.stringify([issueNumber, checkId]);

const validateStructuredAuditRows = (manifest, auditRows) => {
  if (auditRows.length === 0) return [];
  const expected = new Map();
  for (const issue of manifest.issues) {
    for (const check of issue.checks) {
      expected.set(structuredAuditKey(issue.number, check.id), { issue, check });
    }
  }

  const seen = new Set();
  const normalizedRows = [];
  for (const [index, row] of auditRows.entries()) {
    if (!Number.isInteger(row?.issue)) {
      throw new Error(`evidence auditRows[${index}].issue must name one manifest issue`);
    }
    const checkId = requiredEvidenceText(row.checkId, `auditRows[${index}].checkId`);
    const key = structuredAuditKey(row.issue, checkId);
    if (!expected.has(key)) {
      throw new Error(`evidence auditRows[${index}] must name one exact manifest check; received #${row.issue}:${checkId}`);
    }
    if (seen.has(key)) throw new Error(`evidence contains duplicate audit row for #${row.issue}:${checkId}`);
    seen.add(key);
    const atoms = requiredEvidenceText(row.atoms, `auditRows[${index}].atoms`);
    const proofSurfaces = requiredEvidenceText(row.proofSurfaces, `auditRows[${index}].proofSurfaces`);
    const sequence = requiredEvidenceText(row.sequence, `auditRows[${index}].sequence`);
    if (!["satisfied", "blocked", "not done"].includes(row.status)) {
      throw new Error(`evidence auditRows[${index}].status must be satisfied, blocked, or not done`);
    }
    normalizedRows.push({ issue: row.issue, checkId, atoms, proofSurfaces, sequence, status: row.status });
  }

  for (const [key, { issue, check }] of expected) {
    if (!seen.has(key)) throw new Error(`evidence auditRows is missing #${issue.number}:${check.id}`);
  }
  return normalizedRows;
};

const buildStructuredAudit = (manifest, auditRows) => {
  const byKey = new Map(auditRows.map((row) => [structuredAuditKey(row.issue, row.checkId), row]));
  const lines = [
    "| Issue | Acceptance criterion or conformance check | Evidence | Status |",
    "|---|---|---|---|"
  ];
  for (const issue of manifest.issues) {
    for (const check of issue.checks) {
      const row = byKey.get(structuredAuditKey(issue.number, check.id));
      lines.push(`| #${issue.number} | ${check.id} - ${tableText(check.text)} | atoms: ${tableText(row.atoms)}; proof surfaces: ${tableText(row.proofSurfaces)}; sequence: ${tableText(row.sequence)} | ${row.status} |`);
    }
  }
  return lines.join("\n");
};

const evidenceArrays = (evidence) => {
  if (evidence === undefined) return undefined;
  if (!evidence || typeof evidence !== "object" || Array.isArray(evidence)) {
    throw new Error("evidence must be an object");
  }

  const arrays = {};
  for (const key of ["auditRows", "tddRows", "tddReviewFixes", "reviewFindings"]) {
    const value = evidence[key] ?? [];
    if (!Array.isArray(value)) throw new Error(`evidence ${key} must be an array`);
    arrays[key] = value;
  }
  if (Object.values(arrays).every((value) => value.length === 0)) {
    throw new Error("evidence must contain at least one audit row, TDD row, TDD review fix, or review finding");
  }
  return arrays;
};

const validateStructuredEvidence = (manifest, evidence, { immediateFix, tddParentRollup }) => {
  const arrays = evidenceArrays(evidence);
  if (!arrays) return undefined;
  const { auditRows, tddRows, tddReviewFixes, reviewFindings } = arrays;
  const normalizedAuditRows = validateStructuredAuditRows(manifest, auditRows);

  if ((tddRows.length > 0 || tddReviewFixes.length > 0) && !tddParentRollup) {
    throw new Error("TDD evidence requires --tdd-parent-rollup");
  }
  if (reviewFindings.length > 0 && !immediateFix) {
    throw new Error("review finding evidence requires --immediate-fix");
  }

  const manifestNumbers = new Set(manifest.issues.map((issue) => issue.number));
  const rowKeys = new Set();
  const representedIssues = new Set();
  for (const [index, row] of tddRows.entries()) {
    if (!Number.isInteger(row?.issue) || !manifestNumbers.has(row.issue)) {
      throw new Error(`evidence tddRows[${index}].issue must name one manifest issue; for split manifests keep every evidence-referenced issue in the subset or filter the evidence file`);
    }
    for (const field of [
      "contextStatus",
      "authorityStatus",
      "seam",
      "red",
      "green",
      "acceptance",
      "reviewDisposition"
    ]) {
      requiredEvidenceText(row[field], `tddRows[${index}].${field}`);
    }
    const rowKey = JSON.stringify([row.issue, row.seam]);
    if (rowKeys.has(rowKey)) {
      throw new Error(`evidence contains duplicate TDD row for #${row.issue} / ${row.seam}`);
    }
    rowKeys.add(rowKey);
    representedIssues.add(row.issue);
    for (const marker of ["atoms:", "proof surfaces:", "sequence:"]) {
      if (!row.acceptance.includes(marker)) {
        throw new Error(`evidence tddRows[${index}].acceptance must contain ${marker}`);
      }
    }
  }
  if (tddRows.length > 0 && representedIssues.size !== manifestNumbers.size) {
    throw new Error("structured TDD evidence must contain at least one row for every manifest issue; for split manifests keep every evidence-referenced issue in the subset or filter the evidence file");
  }

  const fixIds = new Set();
  for (const [index, fix] of tddReviewFixes.entries()) {
    if (typeof fix?.id !== "string" || !/^RF-[1-9]\d*$/.test(fix.id)) {
      throw new Error(`evidence tddReviewFixes[${index}].id must match RF-N`);
    }
    if (fixIds.has(fix.id)) throw new Error(`evidence contains duplicate review-fix ID ${fix.id}`);
    fixIds.add(fix.id);
    if (!Number.isInteger(fix.issue) || !manifestNumbers.has(fix.issue)) {
      throw new Error(`evidence tddReviewFixes[${index}].issue must name one manifest issue; for split manifests keep every evidence-referenced issue in the subset or filter the evidence file`);
    }
    for (const field of [
      "finding",
      "red",
      "green",
      "seam",
      "durability",
      "browserFreshness",
      "backendCurrentness",
      "identityRefresh"
    ]) {
      requiredEvidenceText(fix[field], `tddReviewFixes[${index}].${field}`);
    }
    if (!hasConcreteRedEvidence(fix.red)) {
      throw new Error(`evidence tddReviewFixes[${index}].red is not concrete`);
    }
    if (!hasConcreteGreenEvidence(fix.green)) {
      throw new Error(`evidence tddReviewFixes[${index}].green is not concrete`);
    }
    const durabilityError = regressionDurabilityError(fix.durability);
    if (durabilityError) throw new Error(`evidence tddReviewFixes[${index}].durability ${durabilityError}`);
    const browserError = freshnessError(fix.browserFreshness);
    if (browserError) throw new Error(`evidence tddReviewFixes[${index}].browserFreshness ${browserError}`);
    const backendError = backendCurrentnessError(fix.backendCurrentness);
    if (backendError) throw new Error(`evidence tddReviewFixes[${index}].backendCurrentness ${backendError}`);
    const row = tddRows.find(
      (candidate) => candidate.issue === fix.issue && candidate.seam === fix.seam
    );
    if (!row) {
      throw new Error(`evidence ${fix.id} must map to an exact structured TDD issue/seam row`);
    }
  }

  const findingIds = new Set();
  for (const [index, finding] of reviewFindings.entries()) {
    const match = typeof finding?.id === "string"
      ? finding.id.match(/^P([1-9]\d*)-(standards|spec)-([1-9]\d*)$/)
      : null;
    if (!match) throw new Error(`evidence reviewFindings[${index}].id must match P<pass>-<standards|spec>-N`);
    if (findingIds.has(finding.id)) throw new Error(`evidence contains duplicate review finding ID ${finding.id}`);
    findingIds.add(finding.id);
    if (!["critical", "high", "medium", "low"].includes(finding.severity)) {
      throw new Error(`evidence reviewFindings[${index}].severity is invalid`);
    }
    for (const field of [
      "reviewer",
      "originalFinding",
      "repairClass",
      "tddDisposition",
      "repair",
      "rerunEvidence",
      "finalStatus"
    ]) {
      requiredEvidenceText(finding[field], `reviewFindings[${index}].${field}`);
    }
    if (!allowedRepairClasses.has(finding.repairClass.trim().toLowerCase())) {
      throw new Error(`evidence reviewFindings[${index}].repairClass is not recognized`);
    }
    if (!validTddDisposition(finding.tddDisposition.trim())) {
      throw new Error(`evidence reviewFindings[${index}].tddDisposition must link RF-N or state structured red/green, coverage-only, red-first-skip, partial-red, or accepted-residual evidence`);
    }
    if (!["fixed", "accepted residual"].includes(finding.finalStatus)) {
      throw new Error(`evidence reviewFindings[${index}].finalStatus must be fixed or accepted residual`);
    }
    for (const fixId of finding.tddDisposition.match(/RF-[1-9]\d*/g) ?? []) {
      if (!fixIds.has(fixId)) {
        throw new Error(`evidence review finding ${finding.id} references unknown ${fixId}`);
      }
    }
  }

  return { auditRows: normalizedAuditRows, tddRows, tddReviewFixes, reviewFindings };
};

const evidenceIds = (items) => items.map((item) => item.id).join(", ");

const tddBlock = (manifest, evidence) => {
  const structuredRows = evidence?.tddRows ?? [];
  const reviewFixes = evidence?.tddReviewFixes ?? [];
  const rows = structuredRows.length > 0
    ? structuredRows.map((row) => {
      const mappedFixes = reviewFixes.filter((fix) => fix.issue === row.issue && fix.seam === row.seam);
      const disposition = mappedFixes.length > 0
        ? `${evidenceIds(mappedFixes)} mapped below`
        : row.reviewDisposition;
      return `| #${row.issue} | ${tableText(row.contextStatus)} | ${tableText(row.authorityStatus)} | ${tableText(row.seam)} | ${tableText(row.red)} | ${tableText(row.green)} | ${tableText(row.acceptance)} | ${tableText(disposition)} |`;
    })
    : manifest.issues.map(
      (issue) =>
        `| #${issue.number} | <CONTEXT.md status> | <ADRs/principles/docs status> | <seam> | <red command/failure or skip reason> | <green command/evidence with passing result> | ${acceptanceIds(issue)}; atoms: <authoritative atoms>; proof surfaces: <surface for each atom>; sequence: <ordered proof or justified N/A> | <review fix / red-first skip reason> |`
    );
  const reviewFixIds = evidenceIds(reviewFixes);
  const reviewFixMap = reviewFixes.length > 0
    ? `${reviewFixIds} below.`
    : "<N/A because review created no TDD row changes or replace with the keyed map below>";
  const reviewFixRows = reviewFixes.length > 0
    ? reviewFixes.map((fix) =>
      `| ${fix.id} | ${tableText(fix.finding)} | ${tableText(fix.red)} | ${tableText(fix.green)} | #${fix.issue} / ${tableText(fix.seam)} | ${tableText(fix.durability)} | ${tableText(fix.browserFreshness)} | ${tableText(fix.backendCurrentness)} | ${tableText(fix.identityRefresh)} |`
    )
    : ["| RF-1 | <one review finding/source> | <one red command/failure or explicit skip> | <one green command/evidence> | #N / <exact Seam cell> | <durable regression or reasoned N/A> | <freshness disposition> | <currentness disposition> | <same-sink identity refresh disposition> |"];
  const accountedRows = structuredRows.length > 0
    ? `${structuredRows.map((row) => `#${row.issue} / ${row.seam}`).join("; ")}${reviewFixes.length > 0 ? `; ${reviewFixIds}` : ""}`
    : "<all issues and seams>";
  const accountedGate = structuredRows.length > 0 ? accountedRows : "<all listed>";

  return `TDD evidence

| Issue | CONTEXT.md status | ADRs/principles/docs status | Seam | Red command/failure | Green command or evidence | Acceptance covered | Review fix / red-first skip reason |
|---|---|---|---|---|---|---|---|
${rows.join("\n")}

Existing-test contract-change rows: <none or listed expectation-rewrite rows>

TDD review-fix map: ${reviewFixMap}

| Finding ID | Finding/source | Intended red command/failure | Green command/evidence | Updated TDD table row | Regression durability | Browser/manual evidence freshness | Backend process currentness | Evidence identity refresh |
|---|---|---|---|---|---|---|---|---|
${reviewFixRows.join("\n")}

Browser/manual freshness: <rerun, justified not affected, blocked, or N/A>

TDD closeout preflight:
- Durable sink/body inspected: <stable issue reference>
- Compact table/header: <present after structural check>
- Rows accounted for: ${accountedRows}
- Pre-red recovery status: <status>
- Pre-red evidence reference: <durable sink plus heading/row anchor and chronology proof, anchored recovery addendum, or reasoned N/A>
- CONTEXT.md status: <present, absent, or N/A>
- ADRs/principles/docs status: <present or N/A>
- Acceptance atom map: <all rows list exact criteria, atoms, and proof surfaces>
- Acceptance sequence map: <all rows list ordered proof or justified N/A>
- Partial-red / red-first skip reasons: <none or listed>
- Evidence-only rows freshness: <none or freshness result>
- Evidence-only browser console state: <state or N/A>
- Evidence-only proof server preflight: <configured ports/owner-check/isolation/proxy/cleanup proof or N/A>
- Evidence-only backend process currentness: <currentness proof or N/A>
- Evidence identity refresh: <same-sink identity block inspected>
- Existing-test contract-change rows: <none or listed>

TDD evidence gate passed: durable sink <stable issue reference>; compact table/header <present after structural check>; seams accounted for ${accountedGate}; CONTEXT.md status <present, absent, or N/A>; ADRs/principles/docs status <present or N/A>; sequence evidence <present or N/A>; evidence identities <present>; partial-red / red-first skip reasons <none or listed>; evidence-only rows <none or listed>; proof server preflight <present or N/A>; existing-test contract-change rows <none or listed>.`;
};

const reviewRows = (manifest) => manifest.issues.map(
  (issue) =>
    `| #${issue.number} | ${acceptanceIds(issue)}; sequence: <ordered events and observing proof or justified N/A> | <diff, tests, docs, and artifacts reviewed> | <none or finding> |`
).join("\n");

const reviewRuntimeEvidenceBlock = `Browser/manual evidence freshness: <final-tree rerun, justified not affected proof, blocked reason, or N/A because no browser/manual evidence was used>

Browser/manual console state: <0 errors and 0 warnings, classified output, blocked reason, or N/A because no browser/manual evidence was used>

Backend process currentness: <server command, watch/reload mode, ownership, restart/reload proof, and API probe; when current identities name a local or withheld fixture, stateful fixture snapshot method, snapshot source, and expected-state probe, or N/A because no stateful fixture was copied; otherwise justified N/A/blocked reason>`;

const reviewFindingParts = (finding) => {
  const match = finding.id.match(/^(P[1-9]\d*)-(standards|spec)-[1-9]\d*$/);
  return { pass: match[1], axis: match[2] === "standards" ? "Standards" : "Spec" };
};

const reviewFindingLedgerBlock = (evidence) => {
  const findings = evidence?.reviewFindings ?? [];
  const rows = findings.length > 0
    ? findings.map((finding) => {
      const { pass, axis } = reviewFindingParts(finding);
      return `| ${finding.id} | ${pass} | ${axis} | ${tableText(finding.reviewer)} | ${tableText(finding.originalFinding)} | ${tableText(finding.repairClass)} | ${tableText(finding.tddDisposition)} | ${tableText(finding.repair)} | ${tableText(finding.rerunEvidence)} | ${tableText(finding.finalStatus)} |`;
    })
    : ["| P1-standards-1 | P1 | Standards | <initial reviewer ID or local fallback> | <original finding> | <repair class> | <RF-N or structured per-finding TDD disposition> | <repair> | <affected/full-axis rerun evidence> | <fixed or accepted residual> |"];
  return `| Finding ID | Review pass | Axis | Reviewer | Original finding | Repair class | TDD disposition | Repair | Rerun evidence | Final status |
|---|---|---|---|---|---|---|---|---|---|
${rows.join("\n")}`;
};

const severityOrder = ["critical", "high", "medium", "low"];

const reviewOutcome = (findings, axis) => {
  const matching = findings.filter((finding) => reviewFindingParts(finding).axis === axis);
  if (matching.length === 0) return "0 findings, worst none: none";
  const worst = severityOrder.find((severity) => matching.some((finding) => finding.severity === severity));
  const noun = matching.length === 1 ? "finding" : "findings";
  return `${matching.length} ${noun}, worst ${worst}: ${matching.map((finding) => finding.originalFinding).join("; ")}`;
};

const structuredImmediateFixFields = (evidence) => {
  const findings = evidence?.reviewFindings ?? [];
  if (findings.length === 0) return undefined;
  const initialFindings = findings.filter((finding) => reviewFindingParts(finding).pass === "P1");
  const residuals = findings.filter((finding) => finding.finalStatus === "accepted residual");
  const fixes = evidence?.tddReviewFixes ?? [];
  const reruns = [...new Set(findings.map((finding) => finding.rerunEvidence))];
  return {
    initialStandards: reviewOutcome(initialFindings, "Standards"),
    initialSpec: reviewOutcome(initialFindings, "Spec"),
    finalStandards: reviewOutcome(residuals, "Standards"),
    finalSpec: reviewOutcome(residuals, "Spec"),
    found: `${findings.length}: ${findings.map((finding) => finding.originalFinding).join("; ")}`,
    fixed: findings.map((finding) => finding.repair).join("; "),
    tdd: fixes.length > 0
      ? `${evidenceIds(fixes)} mapped above; remaining dispositions are recorded per finding below.`
      : findings.map((finding) => `${finding.id}: ${finding.tddDisposition}`).join("; "),
    tddGate: evidence?.tddRows?.length > 0
      ? `structured rows ${evidence.tddRows.map((row) => `#${row.issue} / ${row.seam}`).join("; ")}; review fixes ${evidenceIds(fixes) || "none"}`
      : "N/A because no tdd skill was invoked",
    rerun: reruns.join("; ")
  };
};

const normalImmediateFixBlock = (evidence) => {
  const fields = structuredImmediateFixFields(evidence);
  return `Initial Standards outcome: ${fields?.initialStandards ?? "<count/worst plus findings before fixes>"}

Initial Spec outcome: ${fields?.initialSpec ?? "<count/worst plus findings before fixes>"}

Final Standards outcome: ${fields?.finalStandards ?? "<count/worst after final re-review>"}

Final Spec outcome: ${fields?.finalSpec ?? "<count/worst after final re-review>"}

Findings found: ${fields?.found ?? "<integer count and short titles>"}

${reviewFindingLedgerBlock(evidence)}

Fixes made: ${fields?.fixed ?? "<files/behavior/proof changed>"}

TDD/review-fix evidence: ${fields?.tdd ?? "<red/green proof, coverage-only proof, or justified red-first skip>"}

TDD closeout gate: ${fields?.tddGate ?? "<fielded gate or N/A because no tdd skill was invoked>"}

Verification rerun: ${fields?.rerun ?? "<exact final-tree commands and observed results>"}

Commit handling: <amended/follow-up/unchanged commit SHA or no commit yet>`;
};

const fallbackImmediateFixBlock = (evidence) => {
  const fields = structuredImmediateFixFields(evidence);
  return `Findings found: ${fields?.found ?? "<integer count and short titles>"}

${reviewFindingLedgerBlock(evidence)}

Fixes made: ${fields?.fixed ?? "<files/behavior/proof changed>"}

TDD/review-fix evidence: ${fields?.tdd ?? "<red/green proof, coverage-only proof, or justified red-first skip>"}

Verification rerun: ${fields?.rerun ?? "<exact final-tree commands and observed results>"}

Commit handling: <amended/follow-up/unchanged commit SHA or no commit yet>

Residual findings: <remaining Standards and Spec findings or none>`;
};

const normalReviewBlock = (manifest, immediateFix, evidence) => `Review frame: fixed point input <ref>; fixed point resolved SHA <sha>; reviewed HEAD SHA <sha>; diff command \`git diff <resolved SHA>...HEAD\`; commits <commit list>; worktree scope <scope>; excluded dirty files <none or paths>; spec source <issues and specs>.

Review: code-review against <resolved fixed point>; outcome ${immediateFix ? "findings fixed in SHA <final SHA>" : "<no findings or accepted residuals>"}; verification rerun <commands>.

Review subagents: Standards initial reviewer <ID> completed, final reviewer <ID> completed; Spec initial reviewer <ID> completed, final reviewer <ID> completed

Review subagent cleanup: Standards <disposition>; Spec <disposition>

Review subagent cleanup proof: Standards <reviewer IDs and observed cleanup proof>; Spec <reviewer IDs and observed cleanup proof>

Pre-dispatch Standards source inventory: <concrete path | concrete path | smell baseline>

Pre-dispatch Spec source inventory: <issue #N | concrete spec path | no spec available>

## Standards

Handoff Standards source inventory: <exact same entry set as Pre-dispatch Standards source inventory>

Sources reviewed: <standards sources and smell baseline>

Findings: <none or findings>

## Spec

Handoff Spec source inventory: <exact same entry set as Pre-dispatch Spec source inventory>

Sources reviewed: <issues, PRD, principles, ADRs, and specs>

| Issue | Acceptance source | Evidence reviewed | Findings/residuals |
|---|---|---|---|
${reviewRows(manifest)}

Findings: <none or findings>

Axis summary: Standards <count/worst>, Spec <count/worst>

Residual findings: <none or accepted residual records>

Parent PRD coverage: <parent row present, exact audit rows cited, or N/A>

Spec sequence coverage: sequence: <ordered events and observing proof or justified N/A>

${reviewRuntimeEvidenceBlock}${immediateFix ? `\n\n${normalImmediateFixBlock(evidence)}` : ""}`;

const fallbackReviewBlock = (manifest, immediateFix, evidence) => `Review frame: fixed point input <ref>; fixed point resolved SHA <sha>; reviewed HEAD SHA <sha>; diff command \`git diff <resolved SHA>...HEAD\`; commits <commit list>; worktree scope <scope>; excluded dirty files <none or paths>; spec source <issues and specs>.

## Standards

Fallback used: <unavailable tooling, policy-blocked delegation, partial-axis fallback, or other reason>.

Delegation policy source: <policy source or unavailable surface>

Sources reviewed: <standards sources and smell baseline>

Smell baseline applied: <yes or justified skip>

Findings: <none or findings>

## Spec

Sources reviewed: <issues, PRD, principles, ADRs, and specs>

| Issue | Acceptance source | Evidence reviewed | Findings/residuals |
|---|---|---|---|
${reviewRows(manifest)}

Findings: <none or findings>

TDD closeout gate: <fielded TDD closeout gate or N/A because no tdd skill was invoked>

${reviewRuntimeEvidenceBlock}

${immediateFix ? fallbackImmediateFixBlock(evidence) : "Residual findings: <none or accepted residual records>"}

Axis summary: Standards <count/worst>, Spec <count/worst>

Review fallback gate passed: frame <yes>; delegation policy source <yes>; Standards <yes>; Spec <yes>; child table <yes or N/A>; smell baseline <yes>; evidence identities <yes>; found-vs-residual <yes or N/A>; closeout line <yes>; immediate-fix block <yes or N/A>; tdd fielded closeout gate <yes or N/A>; verification/browser freshness <yes or N/A>.

Review fallback: <why code-review could not run>; standards/spec result <result>; fixes <none or SHA>; verification rerun <commands>.`;

const browserBlock = (browser) => browser
  ? `Browser evidence:
- Route/action/outcome: <production route, action path, and observed result>
- Console state: <0 errors and 0 warnings, classified output, or blocked>
- Final freshness delta: <files touched since smoke and rerun/not-affected/blocked result>`
  : `Browser evidence: N/A because <reason no browser/manual evidence applies>
Console state: N/A because browser evidence is N/A
Final freshness delta: N/A because browser evidence is N/A`;

const identityBlock = `Evidence identity refresh:
- Current evidence identities: fixture paths <path 1 | path 2 | none, or structured withheld identity>; browser sessions <name 1 | name 2 | none>; packet paths/hashes <path/hash 1 | path/hash 2 | none>; active revisions <ID 1 | ID 2 | none>; artifacts <path/ID 1 | path/ID 2 | none>
- Historical red identities retained: <all five categories or none>
- Superseded evidence identities: fixture paths <path 1 | path 2 | none>; browser sessions <name 1 | name 2 | none>; packet paths/hashes <path/hash 1 | path/hash 2 | none>; active revisions <ID 1 | ID 2 | none>; artifacts <path/ID 1 | path/ID 2 | none>
- Superseded-token sweep: <rg/grep command naming every normalized exact superseded value individually; no hits outside classified identity/history lines and no active-proof hits; historical-red hits classified or none, or N/A because every superseded category is none>`;

const fixedChildBlock = (mode) => {
  if (mode === "pending") {
    return `Fixed child inline close comment: Completed by <final SHA>. Evidence: this parent rollup comment URL
Fixed child final inline close comment inspected: N/A before parent URL exists`;
  }
  if (mode === "final") {
    return `Fixed child inline close comment: Completed by <final SHA>. Evidence: <parent rollup comment URL>
Fixed child final inline close comment inspected: Completed by <final SHA>. Evidence: <parent rollup comment URL>`;
  }
  return `Fixed child inline close comment: N/A because no fixed-template child closeout applies
Fixed child final inline close comment inspected: N/A because no fixed-template child closeout applies`;
};

const renderCloseoutBodyScaffold = (manifest, options) => {
  requireManifest(manifest);
  const {
    parentIssue,
    audit,
    evidence,
    reviewMode,
    immediateFix = false,
    tddParentRollup = false,
    browser = false,
    principles = false,
    localOnly = false,
    fixedChildMode = "none",
    maxBytes = DEFAULT_CLOSEOUT_BODY_MAX_BYTES
  } = options;

  if (!Number.isInteger(parentIssue) || parentIssue <= 0) throw new Error("parent issue must be a positive integer");
  if (!["normal", "fallback"].includes(reviewMode)) throw new Error("review mode must be normal or fallback");
  if (!["none", "pending", "final"].includes(fixedChildMode)) {
    throw new Error("fixed child mode must be none, pending, or final");
  }

  const structuredEvidence = validateStructuredEvidence(manifest, evidence, {
    immediateFix,
    tddParentRollup
  });
  if (audit !== undefined && structuredEvidence?.auditRows.length > 0) {
    throw new Error("use either audit input or evidence auditRows, not both");
  }
  const auditSource = structuredEvidence?.auditRows.length > 0
    ? buildStructuredAudit(manifest, structuredEvidence.auditRows)
    : audit ?? buildAuditScaffold(manifest);
  const auditText = validateAuditInput(manifest, auditSource);
  const review = reviewMode === "normal"
    ? normalReviewBlock(manifest, immediateFix, structuredEvidence)
    : fallbackReviewBlock(manifest, immediateFix, structuredEvidence);
  const tdd = tddParentRollup
    ? tddBlock(manifest, structuredEvidence)
    : "TDD evidence: N/A because no tdd skill was invoked.";
  const localSha = localOnly
    ? "Local-only SHA: <final SHA> is not remote-reachable because <reason>; local-only closeout is acceptable because <user request or repo policy>."
    : "Local-only SHA: N/A because <remote branch contains final SHA>.";
  const principlesLine = principles
    ? "Principles/ADR conformance: <no deliberate exceptions or approved exception>."
    : "Principles/ADR conformance: N/A because no in-scope issue has a Principles section.";

  const body = `Implementation closeout for #${parentIssue}

Scaffold status: incomplete — replace every angle-bracket placeholder and validate before publication.

Final SHA: <final SHA>

${localSha}

Verification:

| Exact command | Observed result/counts | Run count | Represented SHA/tree |
|---|---|---:|---|
| \`<exact command>\` | <passed/failed/blocked plus output-derived counts or result> | <positive integer> | \`<final SHA>\` |

${tdd}

${review}

${browserBlock(browser)}

${identityBlock}

## Acceptance audit

${auditText}

${principlesLine}

${fixedChildBlock(fixedChildMode)}

Child state snapshot before child closeout: <exact issue states or N/A>

Post-child closure verification before parent closeout: <exact issue states or pending follow-up>

Closeout preflight:
- Audit sink: <stable issue reference>
- Body file(s) inspected: <local body inspected privately or N/A>
- Parent rollup URL: <this comment URL, real URL, or N/A>
- Fixed child inline close comment: <inspection status or N/A>
- Fixed child final inline close comment inspected: <exact final text or N/A>
- Final SHA: <final SHA>
- Remote reachability: <remote branch contains SHA or no remote branch contains SHA>
- Principles/ADR conformance: <present or N/A>
- Local-only SHA: <full explanatory sentence present or N/A>
- TDD evidence: <present or N/A>
- Review evidence: <Review or Review fallback reference>
- Evidence identity refresh: <current/historical/superseded inventory and sweep present>
- Browser console state: <state or N/A>
- Browser evidence freshness: <rerun, not affected, blocked, or N/A>
- Final post-commit freshness delta: <delta and disposition>
- Child states verified: <exact states or N/A>

Closeout gate passed: audit sink <stable issue reference>; review evidence <line or reference>; TDD evidence <present or N/A>; final SHA <sha>; Principles/ADR conformance <present or N/A>; Local-only SHA sentence <full explanatory sentence present or N/A>; child states verified <yes or N/A>; browser evidence <present, N/A, or blocked>.

Closeout body check passed: audit table columns exact; every acceptance checkbox or conformance check named; every satisfied Evidence cell contains atoms/proof surfaces/sequence; every status literal satisfied/blocked/not done; final SHA present; verification evidence present; TDD evidence present or N/A; review evidence present; evidence identity refresh and superseded-token sweep present; Principles/ADR conformance string present or N/A; full Local-only SHA explanatory sentence present or N/A; browser evidence present/N/A/blocked; browser console state recorded when browser evidence is present or N/A/blocked; final browser/manual freshness delta present/N/A; exact fixed child inline comment inspected <yes or N/A>.
`;

  return { body, auditText, maxBytes };
};

export const buildCloseoutBodyPlan = (manifest, options) => {
  const rendered = renderCloseoutBodyScaffold(manifest, options);
  return {
    body: rendered.body,
    sizePlan: buildCloseoutBodySizePlan(rendered.body, rendered.auditText, rendered.maxBytes)
  };
};

export const buildCloseoutBodyScaffold = (manifest, options) => {
  const { body, sizePlan } = buildCloseoutBodyPlan(manifest, options);
  return assertCloseoutBodySize(body, sizePlan.maxBytes);
};

const isCli = process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;

if (isCli) {
  const args = process.argv.slice(2);
  const valueFlags = [
    "--output",
    "--audit-input",
    "--evidence-input",
    "--parent",
    "--review",
    "--fixed-child",
    "--max-bytes"
  ];
  const valueFor = (flag) => {
    const index = args.indexOf(flag);
    return index < 0 ? undefined : args[index + 1];
  };
  const valueIndexes = new Set(
    valueFlags
      .map((flag) => args.indexOf(flag))
      .filter((index) => index >= 0)
      .map((index) => index + 1)
  );
  const manifestPath = args.find((arg, index) => !arg.startsWith("--") && !valueIndexes.has(index));

  if (args.includes("--help")) {
    console.error(usage);
    process.exit(0);
  }

  try {
    if (!manifestPath) throw new Error("manifest path is required");
    const outputPath = valueFor("--output");
    const parentText = valueFor("--parent");
    const reviewMode = valueFor("--review");
    const fixedChildMode = valueFor("--fixed-child") ?? "none";
    for (const flag of ["--output", "--parent", "--review"]) {
      const value = valueFor(flag);
      if (!value || value.startsWith("--")) throw new Error(`${flag} requires a value`);
    }
    if (args.includes("--audit-input")) {
      const value = valueFor("--audit-input");
      if (!value || value.startsWith("--")) throw new Error("--audit-input requires a path");
    }
    if (args.includes("--evidence-input")) {
      const value = valueFor("--evidence-input");
      if (!value || value.startsWith("--")) throw new Error("--evidence-input requires a path");
    }
    if (args.includes("--fixed-child") && (!fixedChildMode || fixedChildMode.startsWith("--"))) {
      throw new Error("--fixed-child requires a value");
    }
    if (args.includes("--max-bytes")) {
      const value = valueFor("--max-bytes");
      if (!value || value.startsWith("--")) throw new Error("--max-bytes requires a value");
    }

    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    const auditPath = valueFor("--audit-input");
    const evidencePath = valueFor("--evidence-input");
    const { body, sizePlan } = buildCloseoutBodyPlan(manifest, {
      parentIssue: Number(parentText),
      audit: auditPath ? readFileSync(auditPath, "utf8") : undefined,
      evidence: evidencePath ? JSON.parse(readFileSync(evidencePath, "utf8")) : undefined,
      reviewMode,
      immediateFix: args.includes("--immediate-fix"),
      tddParentRollup: args.includes("--tdd-parent-rollup"),
      browser: args.includes("--browser"),
      principles: args.includes("--principles"),
      localOnly: args.includes("--local-only"),
      fixedChildMode,
      maxBytes: valueFor("--max-bytes") === undefined
        ? DEFAULT_CLOSEOUT_BODY_MAX_BYTES
        : Number(valueFor("--max-bytes"))
    });
    if (args.includes("--size-plan")) {
      process.stdout.write(`${JSON.stringify(sizePlan, null, 2)}\n`);
    }
    assertCloseoutBodySize(body, sizePlan.maxBytes);
    if (args.includes("--require-headroom") && sizePlan.status === "low-headroom") {
      throw new Error(
        `closeout scaffold leaves ${sizePlan.remainingBytes} bytes for completed evidence; recommended minimum headroom is ${sizePlan.recommendedEvidenceHeadroomBytes} bytes. Generate issue/check subset manifests and split the durable audit before filling the body`
      );
    }
    writeFileSync(outputPath, body);
  } catch (error) {
    console.error(`Closeout body scaffold build failed: ${error.message}`);
    console.error(usage);
    process.exit(1);
  }
}
