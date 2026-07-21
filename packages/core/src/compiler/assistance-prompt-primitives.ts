export interface AssistanceCitationSpan {
  key: string;
  startOffset: number;
  endOffset: number;
}

export function renderTaggedSection(name: string, body: string): string {
  return `<${name}>\n${body}\n</${name}>`;
}

export function escapePromptAttribute(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function countRecordsByType(records: readonly { type: string }[]): Readonly<Record<string, number>> {
  const counts: Record<string, number> = {};

  for (const record of records) {
    counts[record.type] = (counts[record.type] ?? 0) + 1;
  }

  return Object.fromEntries(Object.entries(counts).sort(([left], [right]) => left.localeCompare(right)));
}

export function buildAssistanceCitationMap(input: {
  acceptedSegmentId: string;
  acceptedSegmentSpans: readonly AssistanceCitationSpan[];
  fieldEntries: readonly (readonly [key: string, target: string])[];
  recordKeys: ReadonlyMap<string, string>;
  referenceStubKeys: ReadonlyMap<string, string>;
}): Readonly<Record<string, string>> {
  const entries: Array<[string, string]> = [
    ...input.acceptedSegmentSpans.map((span): [string, string] => [
      span.key,
      `${input.acceptedSegmentId}:${span.startOffset}-${span.endOffset}`
    ]),
    ...input.fieldEntries.map(([key, target]): [string, string] => [key, target]),
    ...[...input.recordKeys.entries()].map(([recordId, key]): [string, string] => [key, recordId]),
    ...[...input.referenceStubKeys.entries()].map(([recordId, key]): [string, string] => [key, recordId])
  ];

  return Object.fromEntries(entries.sort(([left], [right]) => left.localeCompare(right)));
}
