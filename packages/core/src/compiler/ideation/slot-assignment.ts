import type { ValidationRecord } from "../../validation/snapshot.js";
import { IDEATION_OPERATORS, REINCORPORATE_DORMANT_OPERATOR, type IdeationOperator } from "./operators.js";
import { citationKeysFor } from "./citation-keys.js";
import { ideationRequestSchema, type IdeationAssignment, type IdeationRequest, type IdeationSlot } from "./types.js";

export function assignSlots(records: readonly ValidationRecord[], requestInput: Partial<IdeationRequest> = {}): IdeationAssignment {
  const request = ideationRequestSchema.parse(requestInput);
  const keys = citationKeysFor(records);
  const slots: IdeationSlot[] = [];
  const nonDormantTarget = request.dormantSlot ? Math.max(request.count - 1, 0) : request.count;

  for (const operator of IDEATION_OPERATORS) {
    if (operator.id === "reincorporate_dormant" || slots.length >= nonDormantTarget) {
      continue;
    }

    const operatorRecords = eligibleRecordsForOperator(records, operator);
    if (operatorRecords.length === 0) {
      continue;
    }

    slots.push(toSlot(operator, operatorRecords, keys));
  }

  if (request.dormantSlot && slots.length < request.count) {
    const dormantRecords = dormantTargetRecords(records);
    if (REINCORPORATE_DORMANT_OPERATOR && dormantRecords.length > 0) {
      slots.push(toSlot(REINCORPORATE_DORMANT_OPERATOR, dormantRecords, keys));
    }
  }

  return {
    slots,
    requestedCount: request.count,
    assignedCount: slots.length,
    shrunk: slots.length < request.count
  };
}

function eligibleRecordsForOperator(records: readonly ValidationRecord[], operator: IdeationOperator): ValidationRecord[] {
  const matchingRecords = records.filter((record) => operator.feedingTypes.includes(record.type));
  const minimumRecords = operator.minimumRecords ?? 1;

  if (matchingRecords.length < minimumRecords || !hasRequiredTypeGroups(matchingRecords, operator.requiredTypeGroups)) {
    return [];
  }

  if (operator.id === "reveal") {
    const revealableSecrets = matchingRecords.filter(hasRevealPermission);
    return sortRecordsForSlot(revealableSecrets.length > 0 ? revealableSecrets : matchingRecords);
  }

  return sortRecordsForSlot(matchingRecords);
}

function hasRequiredTypeGroups(
  records: readonly ValidationRecord[],
  requiredGroups: IdeationOperator["requiredTypeGroups"]
): boolean {
  return (requiredGroups ?? []).every((group) => records.some((record) => group.includes(record.type)));
}

function hasRevealPermission(record: ValidationRecord): boolean {
  if (!record.payload || typeof record.payload !== "object" || !("reveal_permission" in record.payload)) {
    return false;
  }

  const revealPermission = (record.payload as { reveal_permission?: unknown }).reveal_permission;
  return revealPermission === "natural_reveal_allowed" || revealPermission === "directive_required";
}

function dormantTargetRecords(records: readonly ValidationRecord[]): ValidationRecord[] {
  const sortedRecords = records
    .filter((record) => REINCORPORATE_DORMANT_OPERATOR?.feedingTypes.includes(record.type) ?? false)
    .filter((record) => typeof record.metadata?.updatedAt === "string")
    .sort(compareDormancy);

  return sortedRecords.slice(0, 1);
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
    recordKeys: records.map((record) => keys.get(record.id) ?? citationKeysFor([record]).get(record.id) ?? "")
  };
}

function sortRecordsForSlot(records: readonly ValidationRecord[]): ValidationRecord[] {
  return [...records].sort((left, right) => left.type.localeCompare(right.type) || left.id.localeCompare(right.id));
}

function compareDormancy(left: ValidationRecord, right: ValidationRecord): number {
  return (
    (left.metadata?.updatedAt ?? "").localeCompare(right.metadata?.updatedAt ?? "") ||
    left.id.localeCompare(right.id)
  );
}
