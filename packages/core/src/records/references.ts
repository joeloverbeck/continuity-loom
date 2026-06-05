export interface RecordReference {
  refRole: string;
  targetId: string;
}

export function compactReferences(
  values: Array<RecordReference | undefined | null | false>
): RecordReference[] {
  return values.filter((value): value is RecordReference => Boolean(value));
}

export function refsFromStrings(refRole: string, targetIds: string[] | undefined): RecordReference[] {
  return (targetIds ?? [])
    .filter((targetId) =>
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetId)
    )
    .map((targetId) => ({ refRole, targetId }));
}
