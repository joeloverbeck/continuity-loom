export const ACCEPTANCE_AUDIT_HEADER =
  "| Issue | Acceptance criterion or conformance check | Evidence | Status |";
export const ACCEPTANCE_AUDIT_DIVIDER = "|---|---|---|---|";

const tableText = (value) => value.replaceAll("|", "&#124;").replaceAll("\n", " ").trim();

export const acceptanceAuditCriterionCell = (check) =>
  `${check.id} - ${tableText(check.text)}`;

export const parseAcceptanceAuditRows = (markdown) => {
  const lines = markdown.split(/\r?\n/);
  const rows = [];

  for (let index = 0; index < lines.length; index += 1) {
    if (lines[index].trim() !== ACCEPTANCE_AUDIT_HEADER) continue;

    for (let rowIndex = index + 2; rowIndex < lines.length; rowIndex += 1) {
      const line = lines[rowIndex].trim();
      if (!line.startsWith("|")) break;
      if (!line.endsWith("|")) continue;

      const cells = line.slice(1, -1).split("|").map((cell) => cell.trim());
      const issue = cells[0]?.match(/^#([1-9]\d*)$/);
      if (!issue || cells.length !== 4) continue;

      rows.push({
        issueNumber: Number(issue[1]),
        criterion: cells[1],
        evidence: cells[2],
        status: cells[3],
        cells,
        line
      });
    }
  }

  return rows;
};

export const acceptanceAuditRowMatchesCheck = (row, issue, check) =>
  row.issueNumber === issue.number && row.criterion === acceptanceAuditCriterionCell(check);

export const matchingAcceptanceAuditRows = (rows, issue, check) =>
  rows.filter((row) => acceptanceAuditRowMatchesCheck(row, issue, check));

const manifestEntries = (manifest) => manifest.issues.flatMap((issue) =>
  issue.checks.map((check) => ({ issue, check }))
);

const manifestEntryKey = (issue, check) => JSON.stringify([issue.number, check.id]);

export const projectCompletedAcceptanceAudit = (fullManifest, selectedManifest, audit) => {
  if (!audit.includes(ACCEPTANCE_AUDIT_HEADER)) {
    throw new Error("completed audit is missing the exact audit table header");
  }

  const rows = parseAcceptanceAuditRows(audit);
  const matchedRows = new Set();
  const rowByEntry = new Map();

  for (const { issue, check } of manifestEntries(fullManifest)) {
    const matches = matchingAcceptanceAuditRows(rows, issue, check);
    if (matches.length !== 1) {
      throw new Error(
        `completed audit #${issue.number} ${check.id} requires exactly one exact audit row; found ${matches.length}`
      );
    }
    matchedRows.add(matches[0]);
    rowByEntry.set(manifestEntryKey(issue, check), matches[0]);
  }

  const unexpected = rows.find((row) => !matchedRows.has(row));
  if (unexpected) {
    throw new Error(`completed audit contains an unexpected or non-exact row: ${unexpected.line}`);
  }

  const projectedRows = [];
  for (const { issue, check } of manifestEntries(selectedManifest)) {
    const fullIssue = fullManifest.issues.find((candidate) => candidate.number === issue.number);
    const fullCheck = fullIssue?.checks.find(
      (candidate) => candidate.id === check.id && candidate.text === check.text
    );
    if (!fullIssue || !fullCheck) {
      throw new Error(
        `selected manifest #${issue.number} ${check.id} is not an exact subset of the full manifest`
      );
    }
    projectedRows.push(rowByEntry.get(manifestEntryKey(fullIssue, fullCheck)).line);
  }

  return `${ACCEPTANCE_AUDIT_HEADER}\n${ACCEPTANCE_AUDIT_DIVIDER}\n${projectedRows.join("\n")}\n`;
};
