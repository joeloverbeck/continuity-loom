const executableCommandPattern = /^(?:(?:[A-Za-z_][A-Za-z0-9_]*=\S+)\s+)*(?:(?:pnpm|npm|npx|node|cargo|git|gh|curl|bash|sh|pytest|python3?|go|make|deno|bun|dotnet|mvn|gradle|java|ruby|bundle|composer|php|swift|xcodebuild|cmake|ctest|zig|vitest|jest|playwright|mocha|ava|tap)\b|(?:\.{0,2}\/|\/)[^\s`]+)/i;

export const isExecutableCommand = (value) => executableCommandPattern.test(value.trim());

const hasBacktickedExecutableCommand = (value) =>
  [...value.matchAll(/`([^`\n]+)`/g)].some((match) => isExecutableCommand(match[1]));

export const hasConcreteRedEvidence = (value) => {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (/^(N\/A|not applicable)\b.+\bbecause\b/i.test(normalized)) return true;
  if (/\bred-first skipped\b.+\bbecause\b/i.test(normalized)) return true;
  if (/\bpartial red - wrong reason:/i.test(normalized)) return true;
  if (/\bcoverage-only review fix\b/i.test(normalized)) return true;
  if (/\bcoverage-only existing behavior\b.+\bred-first N\/A because behavior already existed\b/i.test(normalized)) {
    return true;
  }
  if (/\bexisting contract-change expectation\b/i.test(normalized)) return true;
  if (/\b(shared[- ]red[- ]command|same red command as|linked shared red command)\b/i.test(normalized)) return true;

  return hasBacktickedExecutableCommand(normalized) &&
    /\b(fail(?:ed|ing|ure)?|expected failure|assertion|error|exit code|no test files|red)\b/i.test(normalized);
};

export const hasConcreteGreenEvidence = (value) => {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized || /^<.*>$/.test(normalized) || /^N\/A\b/i.test(normalized)) return false;

  const namesProofSurface =
    /`[^`]+`/.test(normalized) ||
    /\b(?:pnpm|npm|npx|node|cargo|git|gh|curl|bash)\s+\S+/i.test(normalized) ||
    /\b(?:same|shared|linked|focused)\b.+\bcommand\b/i.test(normalized) ||
    /\b(?:browser|Playwright|route|action|request|response|HTTP|DOM|page|artifact|screenshot)\b/i.test(normalized);
  const namesObservedResult = /\b(pass(?:ed|ing)?|observed|received|rendered|returned|verified|confirmed|assert(?:ed|ion)?|HTTP\s+\d{3})\b/i.test(
    normalized
  );

  return namesProofSurface && namesObservedResult;
};

export const validateFreshnessValue = (value) => {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized) return "is empty";
  if (/^<.*>$/.test(normalized)) return "is unresolved placeholder";
  if (/^none\b/i.test(normalized)) return "";
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

  return "must state rerun proof, justified not affected, blocked/stale reason, non-semantic proof, N/A because, or none";
};

export const validateRegressionDurabilityValue = (value) => {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized) return "is empty";
  if (/^<.*>$/.test(normalized)) return "is unresolved placeholder";
  if (/^durable (?:automated )?(?:regression )?test added at\b.+/i.test(normalized)) return "";
  if (
    /^evidence-only\b.+\bbecause\b.+\b(no supported committed harness|no committed (?:browser|e2e|test) harness|supported committed harness (?:does not|doesn't) exist)\b/i.test(
      normalized
    )
  ) {
    return "";
  }
  if (/^blocked\b.+\bbecause\b.+/i.test(normalized)) return "";
  if (/^N\/A\b.+\bbecause\b.+\bnot (?:a )?transient browser\/manual probe\b/i.test(normalized)) return "";
  return "must state durable test added at a path, evidence-only because no supported committed harness exists, blocked because, or N/A because the intended red was not a transient browser/manual probe";
};

export const validateBackendCurrentnessValue = (value) => {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized) return "is empty";
  if (/^<.*>$/.test(normalized)) return "is unresolved placeholder";
  if (/^N\/A\b.+\bbecause\b.+\b(no browser\/manual|no backend\/API dependency)\b/i.test(normalized)) return "";
  if (/^none\b.+\bno browser\/manual\b/i.test(normalized)) return "";
  if (/\bblocked\b.+\b(because|reason|unable|cannot)\b/i.test(normalized)) return "";

  const hasServerCommand = /\bserver command\b/i.test(normalized);
  const hasWatchMode = /\bwatch(?:\/reload)? mode\b/i.test(normalized);
  const hasOwnership = /\b(?:process|port)(?:(?:\s+or\s+|\s*\/\s*)(?:process|port))? ownership\b/i.test(
    normalized
  );
  const hasRestartOrReloadProof = /\b(?:restart|reload)(?:\/(?:restart|reload))? proof\b/i.test(normalized);
  const hasExpectedApiProbe =
    /\bexpected(?: [\w-]+){0,3} API (?:field|behavior)(?: probe)?\b|\bAPI probe\b/i.test(normalized);
  if (hasServerCommand && hasWatchMode && hasOwnership && hasRestartOrReloadProof && hasExpectedApiProbe) return "";

  return "must state server command, watch/reload mode, process or port ownership, restart/reload proof, and expected API field/behavior probe, or a justified N/A/blocked reason";
};

export const fixtureSnapshotCurrentnessErrors = (
  fixturePaths,
  backendCurrentnessValues,
  { label = "Backend process currentness" } = {}
) => {
  if (!fixturePaths || /^none$/i.test(fixturePaths.trim())) return [];

  const errors = [];
  const candidates = backendCurrentnessValues.length ? backendCurrentnessValues : [""];
  for (const [index, backendCurrentness] of candidates.entries()) {
    if (/\bN\/A because no stateful fixture was copied\b/i.test(backendCurrentness)) continue;

    const hasSnapshotMethod = /\bstateful fixture snapshot method\b/i.test(backendCurrentness);
    const hasSnapshotSource = /\bsnapshot source\b/i.test(backendCurrentness);
    const hasExpectedStateProbe = /\bexpected-state probe\b/i.test(backendCurrentness);
    if (hasSnapshotMethod && hasSnapshotSource && hasExpectedStateProbe) continue;

    const occurrence = backendCurrentnessValues.length > 1 ? ` occurrence ${index + 1}` : "";
    errors.push(
      `${label}${occurrence} with non-none fixture paths must state stateful fixture snapshot method, snapshot source, and expected-state probe, or 'N/A because no stateful fixture was copied'`
    );
  }

  return errors;
};
