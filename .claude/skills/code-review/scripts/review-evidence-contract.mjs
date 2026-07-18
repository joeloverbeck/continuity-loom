import { fixtureSnapshotCurrentnessErrors } from "../../tdd/scripts/tdd-evidence-contract.mjs";

const childTableHeader = "| Issue | Acceptance source | Evidence reviewed | Findings/residuals |";
const reviewFindingLedgerHeader =
  "| Finding ID | Review pass | Axis | Reviewer | Original finding | Repair class | TDD disposition | Repair | Rerun evidence | Final status |";

export const DEFAULT_REVIEW_CLOSEOUT_BODY_MAX_BYTES = 65_536;

export const validateReviewClosingBodySize = (body, errors, options = {}) => {
  if (!options.closing) return;
  const maxBytes = options.maxBytes ?? DEFAULT_REVIEW_CLOSEOUT_BODY_MAX_BYTES;
  const bodyBytes = Buffer.byteLength(body, "utf8");
  if (bodyBytes > maxBytes) {
    errors.push(`review closeout body is ${bodyBytes} bytes; maximum is ${maxBytes} bytes`);
  }
};

const fieldPattern = (label, flags = "im") => {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`^\\s*[-*]?\\s*(?:\\*\\*)?${escaped}(?:\\*\\*)?:\\s*(.+)$`, flags);
};

export const fieldValues = (body, label) =>
  [...body.matchAll(fieldPattern(label, "gim"))].map((match) => match[1].trim());

export const fieldValue = (body, label) => fieldValues(body, label)[0] ?? "";

export const unresolvedValue = (value) =>
  !value ||
  /^<.*>$/.test(value) ||
  /\b(?:TBD|TODO|pending|unknown)\b/i.test(value) ||
  /<[^>]+>/.test(value);

const splitMarkdownTableRow = (row) =>
  row.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((cell) => cell.trim());

const findRowsAfterTableHeader = (body) => {
  const lines = body.split(/\r?\n/);
  const headerIndex = lines.findIndex((line) => line.trim() === childTableHeader);
  if (headerIndex === -1) return [];

  const rows = [];
  for (const line of lines.slice(headerIndex + 2)) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("|")) break;
    rows.push(trimmed);
  }
  return rows;
};

const findRowsAfterExactHeader = (body, header) => {
  const lines = body.split(/\r?\n/);
  const headerIndex = lines.findIndex((line) => line.trim() === header);
  if (headerIndex === -1) return [];

  const rows = [];
  for (const line of lines.slice(headerIndex + 2)) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("|")) break;
    rows.push(trimmed);
  }
  return rows;
};

const leadingCount = (value) => {
  const match = value.match(/^(\d+)(?:\s*\/|\b)/);
  return match ? Number(match[1]) : undefined;
};

const validTddDisposition = (value) =>
  /\bRF-\d+\b/i.test(value) ||
  /^red-first skipped because\s+\S/i.test(value) ||
  /^coverage-only review fix;\s*red-first N\/A because\s+\S/i.test(value) ||
  /^partial red - wrong reason:\s*\S/i.test(value) ||
  /\bred\b.+\bfailed\b.+\bgreen\b.+\bpassed\b/i.test(value) ||
  /^N\/A because accepted residual\b.+/i.test(value);

export const validateReviewFindingLedger = (body, errors, options = {}) => {
  if (!body.includes(reviewFindingLedgerHeader)) {
    errors.push(`missing review finding ledger header: ${reviewFindingLedgerHeader}`);
    return;
  }

  const ledgerLines = body.split(/\r?\n/);
  const headerIndex = ledgerLines.findIndex((line) => line.trim() === reviewFindingLedgerHeader);
  if (ledgerLines[headerIndex + 1]?.trim() !== "|---|---|---|---|---|---|---|---|---|---|") {
    errors.push("review finding ledger must use the exact 10-column separator");
  }

  const rows = findRowsAfterExactHeader(body, reviewFindingLedgerHeader);
  if (!rows.length) {
    errors.push("review finding ledger has no finding rows");
    return;
  }

  const findingCount = leadingCount(fieldValue(body, "Findings found"));
  if (findingCount === undefined) {
    errors.push("Findings found must begin with an integer count");
  } else if (findingCount !== rows.length) {
    errors.push(`${findingCount} findings but the review finding ledger has ${rows.length} rows`);
  }

  const seenIds = new Set();
  const parsedRows = [];
  const allowedRepairClasses = /^(?:behavior|coverage-only|Standards-only|ADR-only|conformance-only|docs-only|evidence-only)$/i;

  for (const [index, row] of rows.entries()) {
    const rowNumber = index + 1;
    const cells = splitMarkdownTableRow(row);
    if (cells.length !== 10) {
      errors.push(`review finding ledger row ${rowNumber} must have exactly 10 cells`);
      continue;
    }

    const [findingId, reviewPass, axis, reviewer, originalFinding, repairClass, tddDisposition, repair, rerunEvidence, finalStatus] = cells;
    const idMatch = findingId.match(/^P([1-9]\d*)-(standards|spec)-([1-9]\d*)$/i);
    const passMatch = reviewPass.match(/^P([1-9]\d*)$/i);
    if (!idMatch) {
      errors.push(`review finding ledger row ${rowNumber} Finding ID must use P<N>-standards|spec-<ordinal>`);
    } else {
      const normalizedId = findingId.toLowerCase();
      if (seenIds.has(normalizedId)) errors.push(`review finding ledger has duplicate Finding ID ${findingId}`);
      seenIds.add(normalizedId);
    }
    if (!passMatch) errors.push(`review finding ledger row ${rowNumber} Review pass must use P<N>`);
    if (!/^(?:Standards|Spec)$/i.test(axis)) {
      errors.push(`review finding ledger row ${rowNumber} Axis must be Standards or Spec`);
    }
    if (idMatch && passMatch && idMatch[1] !== passMatch[1]) {
      errors.push(`review finding ledger row ${rowNumber} Finding ID and Review pass disagree`);
    }
    if (idMatch && /standards/i.test(idMatch[2]) !== /^Standards$/i.test(axis)) {
      errors.push(`review finding ledger row ${rowNumber} Finding ID and Axis disagree`);
    }
    for (const [label, value] of [
      ["Reviewer", reviewer],
      ["Original finding", originalFinding],
      ["Repair", repair],
      ["Rerun evidence", rerunEvidence]
    ]) {
      if (unresolvedValue(value)) errors.push(`review finding ledger row ${rowNumber} ${label} is empty or unresolved`);
    }
    if (!allowedRepairClasses.test(repairClass)) {
      errors.push(`review finding ledger row ${rowNumber} Repair class is not recognized`);
    }
    if (!validTddDisposition(tddDisposition)) {
      errors.push(`review finding ledger row ${rowNumber} TDD disposition must link RF-N or state structured red/green, coverage-only, red-first-skip, partial-red, or accepted-residual evidence`);
    }
    if (!/^(?:fixed|accepted residual)$/i.test(finalStatus)) {
      errors.push(`review finding ledger row ${rowNumber} Final status must be fixed or accepted residual`);
    }

    parsedRows.push({
      axis: /^Standards$/i.test(axis) ? "Standards" : /^Spec$/i.test(axis) ? "Spec" : "",
      reviewPass,
      finalStatus
    });
  }

  if (options.validateAxisOutcomes) {
    for (const axis of ["Standards", "Spec"]) {
      const initialValue = fieldValue(body, `Initial ${axis} outcome`);
      const initialCount = leadingCount(initialValue);
      const initialRows = parsedRows.filter((row) => row.axis === axis && /^P1$/i.test(row.reviewPass)).length;
      if (initialCount === undefined) {
        errors.push(`Initial ${axis} outcome must begin with an integer count`);
      } else if (initialCount !== initialRows) {
        errors.push(`Initial ${axis} outcome reports ${initialCount} findings but ledger pass P1 has ${initialRows}`);
      }

      const finalValue = fieldValue(body, `Final ${axis} outcome`);
      const finalCount = leadingCount(finalValue);
      const residualRows = parsedRows.filter(
        (row) => row.axis === axis && /^accepted residual$/i.test(row.finalStatus)
      ).length;
      if (finalCount === undefined) {
        errors.push(`Final ${axis} outcome must begin with an integer count`);
      } else if (finalCount !== residualRows) {
        errors.push(`Final ${axis} outcome reports ${finalCount} findings but the ledger has ${residualRows} accepted residuals`);
      }
    }
  }
};

const sourceEnumeratesAcceptanceItems = (source) =>
  /\b(?:AC|A|US)\s*#?\d+\b/i.test(source) ||
  /\bParent-(?:Solution|Implementation-Decisions|Testing-Decisions)\b/i.test(source) ||
  /\b(?:acceptance item|acceptance criterion|criterion|criteria|checkbox|checklist item|user story|story)\s*#?\d+\b/i.test(source);

const sourceCitesExactAcceptanceRows = (source) =>
  /\b(?:exact\s+)?(?:acceptance|criterion|checkbox|audit|closeout)\s+(?:table|rows?)\b/i.test(source) &&
  /\b(?:row|rows?|range|below|above|adjacent|#\d+)\b/i.test(source);

const cellClaimsNoResidualFindings = (cell) =>
  /\b(?:no findings|none|no residuals?|residuals?\s+none|0 residuals?)\b/i.test(cell);

const validateSequenceSource = (source) => {
  const sequence = source.match(/\bsequence:\s*(.+)$/i)?.[1]?.trim() ?? "";
  if (unresolvedValue(sequence)) return "must include sequence: with ordered proof or a justified N/A";
  if (/^N\/A\b/i.test(sequence)) {
    return /^N\/A\s+because\s+\S.+/i.test(sequence)
      ? ""
      : "must justify sequence N/A with 'N/A because ...'";
  }

  const hasOrder = /(?:→|->|\b(?:before|after|then|followed by|ordered)\b)/i.test(sequence);
  const hasProof = /\b(?:observ(?:e|ed|es|ing)|asserted|verified|proved|test|trace|evidence|artifact|log|browser|report|API)\b/i.test(sequence);
  if (!hasOrder || !hasProof) {
    return "must name ordered events and the proof that observes their order";
  }
  return "";
};

const specClaimsZeroFindings = (body) => {
  const lines = body.split(/\r?\n/);
  const specStart = lines.findIndex((line) => line.trim() === "## Spec");
  const specEndOffset = specStart < 0
    ? -1
    : lines.slice(specStart + 1).findIndex((line) => /^##\s+/.test(line.trim()));
  const specEnd = specEndOffset < 0 ? lines.length : specStart + 1 + specEndOffset;
  const specSection = specStart < 0 ? "" : lines.slice(specStart + 1, specEnd).join("\n");
  return (
    /^\s*Findings:\s*(?:none|no findings|0)\b/im.test(specSection) ||
    /^(?:0|none|no findings)\b/i.test(fieldValue(body, "Final Spec outcome")) ||
    /\bSpec\s+(?:0|none|no findings)\b/i.test(fieldValue(body, "Axis summary"))
  );
};

const validateAcceptanceManifest = (manifest, errors, coverageLabel) => {
  if (!manifest) {
    errors.push(`${coverageLabel} requires an acceptance manifest`);
    return [];
  }
  if (manifest.version !== 1 || !Array.isArray(manifest.issues) || manifest.issues.length === 0) {
    errors.push("acceptance manifest must have version 1 and a non-empty issues array");
    return [];
  }

  const seen = new Set();
  for (const issue of manifest.issues) {
    if (!Number.isInteger(issue?.number) || seen.has(issue.number) || !Array.isArray(issue.checks) || !issue.checks.length) {
      errors.push("acceptance manifest issues require unique integer numbers and non-empty checks arrays");
      return [];
    }
    seen.add(issue.number);
    if (issue.checks.some((check) => typeof check?.id !== "string" || !check.id.trim())) {
      errors.push(`acceptance manifest issue #${issue.number} has an invalid check id`);
      return [];
    }
  }
  return manifest.issues;
};

const sourceNamesCheck = (source, id) => {
  const sourceForExactMatch = /^US\d+$/i.test(id)
    ? source.replace(/\bUS\s*#?\d+\s*(?:-|–|—|to|through)\s*(?:US\s*)?#?\d+\b/gi, " ")
    : source;
  const escapedId = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  if (new RegExp(`(?:^|[^A-Za-z0-9])${escapedId}(?=$|[^A-Za-z0-9])`, "i").test(sourceForExactMatch)) {
    return true;
  }

  const parentAliases = {
    "Parent-Solution": /\bSolution\b/i,
    "Parent-Implementation-Decisions": /\bImplementation(?:\s+Decisions)?\b/i,
    "Parent-Testing-Decisions": /\bTesting(?:\s+Decisions)?\b/i
  };
  if (parentAliases[id]?.test(source)) return true;

  const numericId = id.match(/^([A-Za-z]+)(\d+)$/);
  if (!numericId) return false;

  const [, prefix, numberText] = numericId;
  if (/^US$/i.test(prefix)) return false;
  const escapedPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const rangePattern = new RegExp(
    `(?:^|[^A-Za-z0-9])${escapedPrefix}\\s*#?(\\d+)\\s*(?:-|–|—|to|through)\\s*(?:${escapedPrefix}\\s*)?#?(\\d+)(?:[^A-Za-z0-9]|$)`,
    "gi"
  );
  const number = Number(numberText);
  return [...source.matchAll(rangePattern)].some((match) => {
    const start = Number(match[1]);
    const end = Number(match[2]);
    return number >= Math.min(start, end) && number <= Math.max(start, end);
  });
};

export const validateReviewSpecCoverage = (body, errors, options = {}) => {
  const requiresCoverageTable = options.requireChildFamily || options.requireParentPrd || options.requireIssueSet;
  if (!requiresCoverageTable) {
    if (specClaimsZeroFindings(body)) {
      const sequenceCoverage = fieldValue(body, "Spec sequence coverage");
      const sequenceError = validateSequenceSource(sequenceCoverage);
      if (sequenceError) errors.push(`Spec sequence coverage ${sequenceError}`);
    }
    return;
  }

  const coverageLabel = options.requireIssueSet && !options.requireChildFamily && !options.requireParentPrd
    ? "issue-set coverage"
    : "PRD child coverage";
  const manifestIssues = validateAcceptanceManifest(options.acceptanceManifest, errors, coverageLabel);

  if (!body.includes(childTableHeader)) {
    errors.push(`missing ${coverageLabel} table header`);
    return;
  }
  if (!body.includes("|---|---|---|---|")) {
    errors.push(`missing ${coverageLabel} table separator`);
  }

  const childIssueRows = findRowsAfterTableHeader(body).filter((row) => {
    const cells = splitMarkdownTableRow(row);
    return cells.length >= 4 && /^#\d+\b/.test(cells[0]);
  });
  if (!childIssueRows.length) {
    errors.push(`${coverageLabel} table has no issue rows`);
    return;
  }

  const actualIssueNumbers = new Set(childIssueRows.map((row) => Number(splitMarkdownTableRow(row)[0].slice(1))));
  const expectedIssueNumbers = new Set(manifestIssues.map((issue) => issue.number));
  for (const issue of manifestIssues) {
    if (!actualIssueNumbers.has(issue.number)) errors.push(`${coverageLabel} table is missing issue #${issue.number}`);
  }
  for (const issueNumber of actualIssueNumbers) {
    if (!expectedIssueNumbers.has(issueNumber)) errors.push(`${coverageLabel} table has unexpected issue #${issueNumber}`);
  }

  for (const row of childIssueRows) {
    const [issue, acceptanceSource, , findingsCell] = splitMarkdownTableRow(row);
    if (!cellClaimsNoResidualFindings(findingsCell ?? "")) continue;

    if (
      !sourceEnumeratesAcceptanceItems(acceptanceSource ?? "") &&
      !sourceCitesExactAcceptanceRows(acceptanceSource ?? "")
    ) {
      errors.push(
        `${coverageLabel} row ${issue} acceptance source is too broad for zero residual Spec findings; enumerate exact acceptance items or cite adjacent exact acceptance table rows: ${acceptanceSource}`
      );
    }

    const sequenceError = validateSequenceSource(acceptanceSource ?? "");
    if (sequenceError) errors.push(`${coverageLabel} row ${issue} ${sequenceError}`);
  }

  const sourcesByIssue = new Map(manifestIssues.map((issue) => [issue.number, []]));
  const addIssueSource = (issueNumber, source) => {
    if (sourcesByIssue.has(issueNumber)) sourcesByIssue.get(issueNumber).push(source);
  };

  for (const row of childIssueRows) {
    const [rowIssue, source] = splitMarkdownTableRow(row);
    addIssueSource(Number(rowIssue.slice(1)), source);
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

  for (const line of body.split(/\r?\n/)) {
    if (!line.trim().startsWith("|")) continue;
    const cells = splitMarkdownTableRow(line);
    const issueNumber = Number(cells[0]?.match(/^#(\d+)\b/)?.[1]);
    if (Number.isInteger(issueNumber)) {
      addIssueSource(issueNumber, cells.slice(1).join(" "));
      continue;
    }

    const owners = checkOwners.get((cells[0] ?? "").toLowerCase()) ?? [];
    if (owners.length === 1) addIssueSource(owners[0], cells.join(" "));
  }

  for (const issue of manifestIssues) {
    const issueSources = sourcesByIssue.get(issue.number) ?? [];
    for (const check of issue.checks) {
      if (!issueSources.some((source) => sourceNamesCheck(source, check.id))) {
        errors.push(`${coverageLabel} issue #${issue.number} is missing acceptance source ${check.id}`);
      }
    }
  }
};

const identityCategories = [
  "fixture paths",
  "browser sessions",
  "packet paths/hashes",
  "active revisions",
  "artifacts"
];

const identityInventory = (value) => {
  const inventory = new Map();
  for (const category of identityCategories) {
    const escaped = category.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const match = value.match(new RegExp(`(?:^|;)\\s*${escaped}\\s+([^;]+)`, "i"));
    inventory.set(category, match?.[1]?.trim() ?? "");
  }
  return inventory;
};

const normalizeIdentityToken = (value) => {
  let token = value.trim().replace(/[.,;:!?]+$/u, "");
  for (const [open, close] of [
    ["**", "**"],
    ["__", "__"],
    ["`", "`"],
    ["*", "*"],
    ["_", "_"]
  ]) {
    if (token.startsWith(open) && token.endsWith(close) && token.length > open.length + close.length) {
      token = token.slice(open.length, -close.length).trim().replace(/[.,;:!?]+$/u, "");
      break;
    }
  }
  return token;
};

const markdownWrappedIdentityList = (value) => {
  const parts = value.split(/\s*,\s*/);
  if (parts.length < 2) return null;
  const wrappedToken = /^(?:`[^`]+`|\*\*[^*]+\*\*|__[^_]+__|\*[^*]+\*|_[^_]+_)[.,;:!?]*$/u;
  return parts.every((part) => wrappedToken.test(part)) ? parts : null;
};

const identityTokens = (value) =>
  value
    .split(/\s+\|\s+/)
    .flatMap((segment) => markdownWrappedIdentityList(segment) ?? [segment])
    .map(normalizeIdentityToken)
    .filter((token) => token && !/^none$/i.test(token));

export const validateReviewFixtureSnapshotCurrentness = (body, errors, options = {}) => {
  if (!options.requireBrowser) return;

  const fixturePaths = identityInventory(fieldValue(body, "Current evidence identities")).get("fixture paths") ?? "";
  const backendCurrentnessValues = fieldValues(body, "Backend process currentness");
  errors.push(...fixtureSnapshotCurrentnessErrors(fixturePaths, backendCurrentnessValues));
};

const validateIdentityInventory = (value, label, errors) => {
  if (unresolvedValue(value)) {
    errors.push(`${label} is empty or unresolved`);
    return;
  }
  const inventory = identityInventory(value);
  for (const category of identityCategories) {
    if (!value.toLowerCase().includes(category.toLowerCase())) {
      errors.push(`${label} must enumerate ${category}`);
    } else if (!inventory.get(category)) {
      errors.push(`${label} ${category} requires a value or none`);
    }
  }
};

export const validateReviewEvidenceIdentities = (body, errors) => {
  if (!body.includes("Evidence identity refresh:")) {
    errors.push("missing Evidence identity refresh block");
  }

  const current = fieldValue(body, "Current evidence identities");
  const historicalRed = fieldValue(body, "Historical red identities retained");
  const superseded = fieldValue(body, "Superseded evidence identities");
  const sweep = fieldValue(body, "Superseded-token sweep");

  validateIdentityInventory(current, "Current evidence identities", errors);
  validateIdentityInventory(superseded, "Superseded evidence identities", errors);
  const fixturePaths = identityInventory(current).get("fixture paths") ?? "";
  if (/^none published because\b/i.test(fixturePaths)) {
    errors.push("withheld fixture paths must use the structured 'fixture paths withheld because ...' identity form");
  }
  if (
    /^withheld\b/i.test(fixturePaths) &&
    !/fixture paths\s+withheld because\s+[^;]+;\s*logical fixture\s+[^;]+;\s*content SHA-256\s+[0-9a-f]{64};\s*provenance\s+[^;]+(?=;|$)/i.test(
      current
    )
  ) {
    errors.push(
      "withheld fixture identity must include reason, logical fixture, 64-character content SHA-256, and provenance"
    );
  }
  if (unresolvedValue(historicalRed)) {
    errors.push("Historical red identities retained is empty or unresolved");
  } else if (!/^none$/i.test(historicalRed)) {
    validateIdentityInventory(historicalRed, "Historical red identities retained", errors);
  }
  if (unresolvedValue(sweep)) {
    errors.push("Superseded-token sweep is empty or unresolved");
    return;
  }

  const supersededInventory = identityInventory(superseded);
  const supersededValues = [
    ...new Set([...supersededInventory.values()].flatMap(identityTokens))
  ];
  const everySupersededCategoryIsNone = supersededValues.length === 0;
  if (/^N\/A\b/i.test(sweep)) {
    if (!everySupersededCategoryIsNone || !/because every superseded category is none/i.test(sweep)) {
      errors.push("Superseded-token sweep may be N/A only because every superseded category is none");
    }
    return;
  }

  const namesAllSupersededValues = supersededValues.every((value) => sweep.includes(value));
  const hasSearchCommand = /\b(?:rg|grep)\b/i.test(sweep);
  const hasClassifiedHistoryResult = /\bno hits outside classified identity\/history lines\b/i.test(sweep);
  const hasActiveProofResult = /\bno active-proof hits\b/i.test(sweep);
  const classifiesHistoricalRed = /^none$/i.test(historicalRed) || /historical-red .+classified/i.test(sweep);
  if (
    !hasSearchCommand ||
    !hasClassifiedHistoryResult ||
    !hasActiveProofResult ||
    !classifiesHistoricalRed ||
    !namesAllSupersededValues
  ) {
    errors.push(
      "Superseded-token sweep must name rg/grep, every normalized superseded value, no hits outside classified identity/history lines and no active-proof hits, and classified historical-red hits"
    );
  }
};
