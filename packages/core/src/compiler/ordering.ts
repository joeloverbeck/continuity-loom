import { whatWillCompile, type CompileDestinationFamilyId } from "../records/compile-destinations.js";
import type { ValidationRecord } from "../validation/snapshot.js";

const familyRank: Readonly<Record<CompileDestinationFamilyId, number>> = Object.freeze({
  story_contract_and_prose_mode: 0,
  pov_audience_and_reveal_constraints: 1,
  active_working_set: 2,
  plans_clocks_obligations: 3,
  rich_active_cast_dossiers: 4,
  present_minor_cast: 5,
  offstage_relevance: 6,
  facts_beliefs_events: 7,
  locations_objects_affordances: 8,
  other_selected_records: 9
});

const priorityRank: Readonly<Record<string, number>> = Object.freeze({
  critical: 0,
  high: 1,
  medium: 2,
  low: 3
});

export function orderCompilerRecords(records: readonly ValidationRecord[]): readonly ValidationRecord[] {
  const familyById = recordFamilies(records);

  return [...records].sort((left, right) => compareRecords(left, right, familyById));
}

function compareRecords(
  left: ValidationRecord,
  right: ValidationRecord,
  familyById: ReadonlyMap<string, CompileDestinationFamilyId>
): number {
  return compareNullableNumbers(left.metadata?.userOrder, right.metadata?.userOrder)
    || compareNumbers(familyRank[familyById.get(left.id) ?? "other_selected_records"], familyRank[familyById.get(right.id) ?? "other_selected_records"])
    || comparePriority(left.metadata?.salience, right.metadata?.salience)
    || comparePriority(left.metadata?.urgency, right.metadata?.urgency)
    || displayLabel(left).localeCompare(displayLabel(right))
    || left.id.localeCompare(right.id);
}

function recordFamilies(records: readonly ValidationRecord[]): ReadonlyMap<string, CompileDestinationFamilyId> {
  const buckets = whatWillCompile(
    records.map((record) => ({
      id: record.id,
      type: record.type,
      displayLabel: displayLabel(record)
    })),
    {}
  );
  const families = new Map<string, CompileDestinationFamilyId>();

  for (const bucket of buckets) {
    for (const record of bucket.records) {
      families.set(record.id, bucket.familyId);
    }
  }

  return families;
}

function compareNullableNumbers(left: number | null | undefined, right: number | null | undefined): number {
  if (left === right) {
    return 0;
  }

  if (left === null || left === undefined) {
    return 1;
  }

  if (right === null || right === undefined) {
    return -1;
  }

  return left - right;
}

function compareNumbers(left: number, right: number): number {
  return left - right;
}

function comparePriority(left: string | null | undefined, right: string | null | undefined): number {
  return (priorityRank[left ?? ""] ?? 4) - (priorityRank[right ?? ""] ?? 4);
}

function displayLabel(record: ValidationRecord): string {
  return record.metadata?.displayLabel ?? record.id;
}
