import type { ValidationRecord } from "../../validation/snapshot.js";
import { IDEATION_OPERATORS, type IdeationOperator } from "./operators.js";
import { citationKeysFor } from "./citation-keys.js";
import {
  ideationRequestSchema,
  type IdeationAssignment,
  type IdeationOperatorId,
  type IdeationRequest,
  type IdeationSlot
} from "./types.js";

type PressureFamily =
  | "pursuit"
  | "time"
  | "duty/effect"
  | "unresolved pressure"
  | "relationship"
  | "affect"
  | "information/interpretation"
  | "material/agency"
  | "causal event";

export function assignSlots(records: readonly ValidationRecord[], requestInput: Partial<IdeationRequest> = {}): IdeationAssignment {
  const request = ideationRequestSchema.parse(requestInput);
  const keys = citationKeysFor(records);
  const slots: IdeationSlot[] = [];
  const usedRecordIds = new Set<string>();
  const nonDormantTarget = request.dormantSlot ? Math.max(request.count - 1, 0) : request.count;

  for (const operator of IDEATION_OPERATORS) {
    if (slots.length >= nonDormantTarget) {
      continue;
    }

    const operatorRecords = selectBundle(records, operator, keys, usedRecordIds);
    if (!operatorRecords) {
      continue;
    }

    slots.push(toSlot(operator, operatorRecords, keys));
    markUsed(usedRecordIds, operatorRecords);
  }

  if (request.dormantSlot && slots.length < request.count) {
    const assignedOperators = new Set(slots.map((slot) => slot.operator));
    const dormantSlot = selectDormantSlot(records, keys, usedRecordIds, assignedOperators);
    if (dormantSlot) {
      slots.push(dormantSlot);
    }
  }

  return {
    slots,
    requestedCount: request.count,
    assignedCount: slots.length,
    shrunk: slots.length < request.count
  };
}

function selectDormantSlot(
  records: readonly ValidationRecord[],
  keys: ReadonlyMap<string, string>,
  usedRecordIds: ReadonlySet<string>,
  assignedOperators: ReadonlySet<IdeationOperatorId>
): IdeationSlot | undefined {
  const dormantCandidates = records
    .filter(isDormantCandidate)
    .filter((record) => typeof record.metadata?.updatedAt === "string")
    .sort(compareDormancy);

  for (const candidate of dormantCandidates) {
    for (const operator of IDEATION_OPERATORS) {
      if (assignedOperators.has(operator.id) || !operator.feedingTypes.includes(candidate.type)) {
        continue;
      }

      const bundle = selectBundle(records, operator, keys, usedRecordIds, candidate);
      if (bundle) {
        const dormantRecordKey = keyFor(candidate, keys);
        return { ...toSlot(operator, bundle, keys), dormantRecordKey };
      }
    }
  }

  return undefined;
}

function selectBundle(
  records: readonly ValidationRecord[],
  operator: IdeationOperator,
  keys: ReadonlyMap<string, string>,
  usedRecordIds: ReadonlySet<string>,
  mandatoryRecord?: ValidationRecord
): readonly ValidationRecord[] | undefined {
  const bundles = candidateBundles(records, operator).filter((bundle) =>
    mandatoryRecord ? bundle.some((record) => record.id === mandatoryRecord.id) : true
  );

  return bundles.sort((left, right) => compareBundles(left, right, usedRecordIds, keys))[0];
}

function candidateBundles(records: readonly ValidationRecord[], operator: IdeationOperator): readonly ValidationRecord[][] {
  switch (operator.id) {
    case "reveal":
      return singletonBundles(activeRecords(records, operator, { reveal: true }));
    case "plan_meets_friction":
    case "emotion_becomes_action":
    case "shift_option_set":
    case "clock_advances":
    case "debt_comes_due":
    case "relationship_turns":
      return singletonBundles(activeRecords(records, operator));
    case "falsify_belief":
      return falsifyBeliefBundles(records);
    case "commit_at_a_cost":
      return commitAtCostBundles(records);
  }
}

function activeRecords(
  records: readonly ValidationRecord[],
  operator: IdeationOperator,
  options: { reveal?: boolean } = {}
): readonly ValidationRecord[] {
  return sortRecordsForSlot(
    records.filter((record) => operator.feedingTypes.includes(record.type) && isOperatorActive(record, options))
  );
}

function singletonBundles(records: readonly ValidationRecord[]): ValidationRecord[][] {
  return records.map((record) => [record]);
}

function falsifyBeliefBundles(records: readonly ValidationRecord[]): ValidationRecord[][] {
  const beliefs = records.filter((record) => record.type === "BELIEF" && isOperatorActive(record));
  const evidence = records.filter(
    (record) => (record.type === "FACT" || record.type === "EVENT") && isOperatorActive(record)
  );
  const bundles: ValidationRecord[][] = [];

  for (const belief of beliefs) {
    for (const evidenceRecord of evidence) {
      bundles.push(sortRecordsForSlot([belief, evidenceRecord]));
    }
  }

  return bundles;
}

function commitAtCostBundles(records: readonly ValidationRecord[]): ValidationRecord[][] {
  const activePressureRecords = records.filter((record) => pressureFamily(record) && isOperatorActive(record));
  const bundles: ValidationRecord[][] = [];

  for (let leftIndex = 0; leftIndex < activePressureRecords.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < activePressureRecords.length; rightIndex += 1) {
      const left = activePressureRecords[leftIndex]!;
      const right = activePressureRecords[rightIndex]!;
      if (pressureFamily(left) !== pressureFamily(right)) {
        bundles.push(sortRecordsForSlot([left, right]));
      }
    }
  }

  return bundles;
}

function isDormantCandidate(record: ValidationRecord): boolean {
  return record.type !== "FACT" && Boolean(pressureFamily(record)) && isOperatorActive(record);
}

function isOperatorActive(record: ValidationRecord, options: { reveal?: boolean } = {}): boolean {
  const payload = record.payload && typeof record.payload === "object" ? (record.payload as Record<string, unknown>) : {};
  const status = typeof payload.status === "string" ? payload.status : undefined;

  switch (record.type) {
    case "SECRET":
      if (status !== "hidden" && status !== "partially_revealed") {
        return false;
      }
      return options.reveal ? hasLegalRevealSurface(payload) : true;
    case "BELIEF":
      return status === "active";
    case "FACT":
      return true;
    case "EVENT":
      return status !== "abandoned" && payload.current_relevance !== "none";
    case "PLAN":
      return payload.plan_status === "active" || payload.plan_status === "blocked" || payload.plan_status === "suspended";
    case "INTENTION":
      return status === "active" || status === "blocked";
    case "CLOCK":
      return status === "active";
    case "OBLIGATION":
      return status === "open" || status === "escalated" || status === "transferred";
    case "CONSEQUENCE":
      return status === "pending" || status === "active" || status === "escalated";
    case "OPEN THREAD":
      return status === "active" || status === "escalated";
    case "RELATIONSHIP":
      return status === "active";
    case "EMOTION":
      return status === "active" || status === "suppressed" || status === "transformed" || status === "dissociated";
    case "VISIBLE AFFORDANCE":
    case "OBJECT":
    case "LOCATION":
    case "ENTITY STATUS":
      return true;
    default:
      return false;
  }
}

function hasLegalRevealSurface(payload: Record<string, unknown>): boolean {
  if (payload.reveal_permission === "natural_reveal_allowed" || payload.reveal_permission === "clue_only") {
    return true;
  }

  if (Array.isArray(payload.allowed_surface_cues) && payload.allowed_surface_cues.length > 0) {
    return true;
  }

  return (
    Array.isArray(payload.clue_carriers) &&
    payload.clue_carriers.some(
      (carrier) =>
        carrier &&
        typeof carrier === "object" &&
        (carrier as { status?: unknown }).status === "available" &&
        typeof (carrier as { clue_text?: unknown }).clue_text === "string" &&
        (carrier as { clue_text: string }).clue_text.trim().length > 0
    )
  );
}

function pressureFamily(record: ValidationRecord): PressureFamily | undefined {
  switch (record.type) {
    case "PLAN":
    case "INTENTION":
      return "pursuit";
    case "CLOCK":
      return "time";
    case "OBLIGATION":
    case "CONSEQUENCE":
      return "duty/effect";
    case "OPEN THREAD":
      return "unresolved pressure";
    case "RELATIONSHIP":
      return "relationship";
    case "EMOTION":
      return "affect";
    case "SECRET":
    case "BELIEF":
      return "information/interpretation";
    case "VISIBLE AFFORDANCE":
    case "OBJECT":
    case "LOCATION":
    case "ENTITY STATUS":
      return "material/agency";
    case "EVENT":
      return "causal event";
    default:
      return undefined;
  }
}

function toSlot(
  operator: IdeationOperator,
  records: readonly ValidationRecord[],
  keys: ReadonlyMap<string, string>
): IdeationSlot {
  return {
    operator: operator.id,
    operatorName: operator.name,
    definition: operator.definition,
    recordKeys: records.map((record) => keyFor(record, keys))
  };
}

function sortRecordsForSlot(records: readonly ValidationRecord[]): ValidationRecord[] {
  const keys = citationKeysFor(records);
  return [...records].sort((left, right) => keyFor(left, keys).localeCompare(keyFor(right, keys)) || left.id.localeCompare(right.id));
}

function compareBundles(
  left: readonly ValidationRecord[],
  right: readonly ValidationRecord[],
  usedRecordIds: ReadonlySet<string>,
  keys: ReadonlyMap<string, string>
): number {
  const reusedDelta = reusedCount(left, usedRecordIds) - reusedCount(right, usedRecordIds);
  if (reusedDelta !== 0) {
    return reusedDelta;
  }

  return bundleSortKey(left, keys).localeCompare(bundleSortKey(right, keys));
}

function reusedCount(records: readonly ValidationRecord[], usedRecordIds: ReadonlySet<string>): number {
  return records.filter((record) => usedRecordIds.has(record.id)).length;
}

function bundleSortKey(records: readonly ValidationRecord[], keys: ReadonlyMap<string, string>): string {
  return records.map((record) => keyFor(record, keys)).join("|");
}

function keyFor(record: ValidationRecord, keys: ReadonlyMap<string, string>): string {
  return keys.get(record.id) ?? citationKeysFor([record]).get(record.id) ?? "";
}

function markUsed(usedRecordIds: Set<string>, records: readonly ValidationRecord[]): void {
  for (const record of records) {
    usedRecordIds.add(record.id);
  }
}

function compareDormancy(left: ValidationRecord, right: ValidationRecord): number {
  return (
    (left.metadata?.updatedAt ?? "").localeCompare(right.metadata?.updatedAt ?? "") ||
    left.id.localeCompare(right.id)
  );
}
