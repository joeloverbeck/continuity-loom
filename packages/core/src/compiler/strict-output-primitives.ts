export interface OutputReasonError<ReasonCode extends string> extends Error {
  reasonCode: ReasonCode;
}

export function outputReason<ReasonCode extends string>(
  reasonCode: ReasonCode,
  message: string
): OutputReasonError<ReasonCode> {
  return Object.assign(new Error(message), { reasonCode });
}

export function isOutputReasonError<ReasonCode extends string>(
  error: unknown
): error is OutputReasonError<ReasonCode> {
  return error instanceof Error && "reasonCode" in error;
}

export function parsePureJsonObject<ReasonCode extends string>(
  rawOutput: string,
  reasonCode: ReasonCode,
  messages: { surroundingText: string; nonObject: string; malformed: string }
): Record<string, unknown> {
  const trimmed = rawOutput.trim();
  if (!trimmed.startsWith("{") || !trimmed.endsWith("}")) {
    throw outputReason(reasonCode, messages.surroundingText);
  }

  try {
    const value: unknown = JSON.parse(trimmed);
    if (!isPlainObject(value)) {
      throw outputReason(reasonCode, messages.nonObject);
    }
    return value;
  } catch (error) {
    if (isOutputReasonError(error)) {
      throw error;
    }
    throw outputReason(reasonCode, messages.malformed);
  }
}

export function expectExactKeys(
  value: Record<string, unknown>,
  expectedKeys: readonly string[],
  error: () => Error
): void {
  const expected = new Set(expectedKeys);
  const actual = Object.keys(value);
  if (actual.length !== expected.size || actual.some((key) => !expected.has(key))) {
    throw error();
  }
}

export function parseCitationKeys(
  value: unknown,
  allowed: ReadonlySet<string>,
  errors: { invalidList: () => Error; unknown: (citation: string) => Error },
  options: { allowDuplicates?: boolean } = {}
): string[] {
  if (!Array.isArray(value) || value.length === 0 || !value.every((item) => typeof item === "string")) {
    throw errors.invalidList();
  }
  if (!options.allowDuplicates && new Set(value).size !== value.length) {
    throw errors.invalidList();
  }
  for (const citation of value) {
    if (!allowed.has(citation)) {
      throw errors.unknown(citation);
    }
  }
  return value;
}

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
