const citationPattern = /^\[(?:SEG-\d+-S\d{3}|BRIEF:[^\]]+|(?:REF-)?[A-Z][A-Z -]*-\d+|RECORD-SCOPE)]$/;
const recordTokenPattern = /^\$record:\[[^\]]+]$/;
const newTokenPattern = /^\$new:NEW-\d{3}$/;

export function containsMaterialAcceptedSegmentEcho(output: unknown, acceptedSegmentText: string): boolean {
  const accepted = normalizeEchoText(acceptedSegmentText);
  const acceptedTokens = tokensForEcho(accepted);

  for (const text of collectStrings(output)) {
    if (isEchoExempt(text)) {
      continue;
    }

    const normalized = normalizeEchoText(text);
    if (normalized.length >= 50 && accepted.includes(normalized)) {
      return true;
    }

    if (hasVerbatimTokenRun(tokensForEcho(normalized), acceptedTokens, 8)) {
      return true;
    }
  }

  return false;
}

function collectStrings(value: unknown): string[] {
  if (typeof value === "string") {
    return [value];
  }

  if (Array.isArray(value)) {
    return value.flatMap(collectStrings);
  }

  if (isPlainObject(value)) {
    return Object.values(value).flatMap(collectStrings);
  }

  return [];
}

function normalizeEchoText(text: string): string {
  return text.normalize("NFKC").toLocaleLowerCase().replace(/\s+/g, " ").trim();
}

function tokensForEcho(text: string): string[] {
  return text.split(/\s+/).filter(Boolean);
}

function hasVerbatimTokenRun(tokens: readonly string[], acceptedTokens: readonly string[], runLength: number): boolean {
  if (tokens.length < runLength) {
    return false;
  }

  const acceptedRuns = new Set<string>();
  for (let index = 0; index <= acceptedTokens.length - runLength; index += 1) {
    acceptedRuns.add(acceptedTokens.slice(index, index + runLength).join(" "));
  }

  for (let index = 0; index <= tokens.length - runLength; index += 1) {
    if (acceptedRuns.has(tokens.slice(index, index + runLength).join(" "))) {
      return true;
    }
  }

  return false;
}

function isEchoExempt(text: string): boolean {
  return (
    citationPattern.test(text) ||
    recordTokenPattern.test(text) ||
    newTokenPattern.test(text) ||
    /^(?:BRIEF|RECORD|NEW|ITEM)-\d{3}$/.test(text) ||
    /^(?:true|false|null|active|resolved|abandoned|hidden|open|pending|settled)$/i.test(text) ||
    text.trim().split(/\s+/).length <= 3 && /^[\p{L}\p{N} .'-]+$/u.test(text)
  );
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
