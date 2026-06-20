import type { GenerationSession } from "./generation-brief.js";

export type CompileDestinationFamilyId =
  | "story_contract_and_prose_mode"
  | "pov_audience_and_reveal_constraints"
  | "active_working_set"
  | "plans_clocks_obligations"
  | "rich_active_cast_dossiers"
  | "present_minor_cast"
  | "offstage_relevance"
  | "facts_beliefs_events"
  | "locations_objects_affordances"
  | "other_selected_records";

export interface CompileDestinationRecord {
  id: string;
  type: string;
  displayLabel: string;
}

export interface CompileDestinationBucket {
  familyId: CompileDestinationFamilyId;
  label: string;
  records: readonly CompileDestinationRecord[];
}

type ActiveWorkingSet = NonNullable<GenerationSession["active_working_set"]>;

const familyLabels: Readonly<Record<CompileDestinationFamilyId, string>> = Object.freeze({
  story_contract_and_prose_mode: "Story contract and prose mode",
  pov_audience_and_reveal_constraints: "POV, audience knowledge, and reveal constraints",
  active_working_set: "Active working set and current voice pressure pins",
  plans_clocks_obligations: "Plans, intentions, clocks, obligations, consequences, and open threads",
  rich_active_cast_dossiers: "Rich active cast dossiers",
  present_minor_cast: "Present-minor cast",
  offstage_relevance: "Offstage cast relevance",
  facts_beliefs_events: "Facts, beliefs, and events",
  locations_objects_affordances: "Locations, objects, affordances, and physical continuity",
  other_selected_records: "Other selected records"
});

const promptFamilyOrder: readonly CompileDestinationFamilyId[] = [
  "story_contract_and_prose_mode",
  "pov_audience_and_reveal_constraints",
  "active_working_set",
  "plans_clocks_obligations",
  "rich_active_cast_dossiers",
  "present_minor_cast",
  "offstage_relevance",
  "facts_beliefs_events",
  "locations_objects_affordances",
  "other_selected_records"
];

export const compileDestinationFamilyIds: readonly CompileDestinationFamilyId[] = promptFamilyOrder;

const recordTypeFamilies: Readonly<Record<string, CompileDestinationFamilyId>> = Object.freeze({
  BELIEF: "facts_beliefs_events",
  CLOCK: "plans_clocks_obligations",
  CONSEQUENCE: "plans_clocks_obligations",
  EMOTION: "facts_beliefs_events",
  ENTITY: "locations_objects_affordances",
  "ENTITY STATUS": "locations_objects_affordances",
  EVENT: "facts_beliefs_events",
  FACT: "facts_beliefs_events",
  INTENTION: "plans_clocks_obligations",
  LOCATION: "locations_objects_affordances",
  OBJECT: "locations_objects_affordances",
  OBLIGATION: "plans_clocks_obligations",
  "OPEN THREAD": "plans_clocks_obligations",
  PLAN: "plans_clocks_obligations",
  RELATIONSHIP: "facts_beliefs_events",
  SECRET: "pov_audience_and_reveal_constraints",
  "VISIBLE AFFORDANCE": "locations_objects_affordances"
});

export function whatWillCompile(
  selectedRecords: readonly CompileDestinationRecord[],
  activeWorkingSet: Partial<ActiveWorkingSet> = {}
): readonly CompileDestinationBucket[] {
  const buckets = new Map<CompileDestinationFamilyId, CompileDestinationRecord[]>();

  for (const record of selectedRecords) {
    const familyId = destinationFamilyForRecord(record, activeWorkingSet);
    const records = buckets.get(familyId) ?? [];

    records.push(record);
    buckets.set(familyId, records);
  }

  return promptFamilyOrder
    .filter((familyId) => buckets.has(familyId))
    .map((familyId) => ({
      familyId,
      label: familyLabels[familyId],
      records: [...(buckets.get(familyId) ?? [])].sort(compareRecords)
    }));
}

function destinationFamilyForRecord(
  record: CompileDestinationRecord,
  activeWorkingSet: Partial<ActiveWorkingSet>
): CompileDestinationFamilyId {
  if (record.type === "CAST MEMBER") {
    return castDestinationFamily(record.id, activeWorkingSet);
  }

  return recordTypeFamilies[record.type] ?? "other_selected_records";
}

function castDestinationFamily(
  recordId: string,
  activeWorkingSet: Partial<ActiveWorkingSet>
): CompileDestinationFamilyId {
  if (activeWorkingSet.active_onstage_cast_full?.some((entry) => entry.cast_member_id === recordId)) {
    return "rich_active_cast_dossiers";
  }

  if (activeWorkingSet.present_minor_cast_compressed?.includes(recordId)) {
    return "present_minor_cast";
  }

  if (activeWorkingSet.offstage_relevant_cast?.includes(recordId)) {
    return "offstage_relevance";
  }

  return "active_working_set";
}

function compareRecords(left: CompileDestinationRecord, right: CompileDestinationRecord): number {
  return left.type.localeCompare(right.type)
    || left.displayLabel.localeCompare(right.displayLabel)
    || left.id.localeCompare(right.id);
}
