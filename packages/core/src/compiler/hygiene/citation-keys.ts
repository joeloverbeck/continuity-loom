import type { HygieneRecord } from "./types.js";

export function hygieneCitationKeysFor(records: readonly HygieneRecord[]): ReadonlyMap<string, string> {
  const typeCounts = new Map<string, number>();
  const keys = new Map<string, string>();

  for (const record of records) {
    const count = (typeCounts.get(record.type) ?? 0) + 1;
    typeCounts.set(record.type, count);
    keys.set(record.id, `[${record.type}-${count}]`);
  }

  return keys;
}
