import type { ValidationSnapshot } from "./snapshot.js";

export type ReferenceClassification = "selected" | "unselected" | "dangling";

export interface ClassifiedReference {
  classification: ReferenceClassification;
  actualType: string | undefined;
  typeMatches: boolean;
}

export function classifyReference(
  snapshot: ValidationSnapshot,
  id: string,
  expectedTypes?: readonly string[]
): ClassifiedReference {
  const selectedRecord = snapshot.records.find((record) => record.id === id);
  const actualType = selectedRecord?.type ?? snapshot.projectRecordIndex[id];
  const classification: ReferenceClassification = selectedRecord
    ? "selected"
    : actualType
      ? "unselected"
      : "dangling";

  return {
    classification,
    actualType,
    typeMatches: expectedTypes ? actualType !== undefined && expectedTypes.includes(actualType) : true
  };
}
