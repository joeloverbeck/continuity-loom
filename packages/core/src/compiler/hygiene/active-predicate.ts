import { projectRecordStatus } from "../../records/registry.js";
import { HYGIENE_TYPE_ORDER, type HygieneRecordType } from "./types.js";

export interface HygieneActiveCandidate {
  type: string;
  archived: boolean;
  payload: unknown;
}

export const HYGIENE_RECORD_TYPES = new Set<string>(HYGIENE_TYPE_ORDER);

export const HYGIENE_LIVE_STATUSES = {
  FACT: ["active"],
  EVENT: ["active"],
  BELIEF: ["active"],
  SECRET: ["hidden", "partially_revealed", "revealed"],
  EMOTION: ["active", "suppressed", "transformed", "dissociated"],
  RELATIONSHIP: ["active"],
  INTENTION: ["active", "blocked"],
  PLAN: ["active", "blocked", "suspended"],
  CLOCK: ["active", "paused"],
  OBLIGATION: ["open", "escalated"],
  CONSEQUENCE: ["pending", "active", "escalated"],
  "OPEN THREAD": ["active", "escalated"],
  LOCATION: ["active"],
  OBJECT: ["active"],
  "VISIBLE AFFORDANCE": ["available", "blocked"],
  "ENTITY STATUS": []
} as const satisfies Readonly<Record<HygieneRecordType, readonly string[]>>;

export function isHygieneRecordType(recordType: string): recordType is HygieneRecordType {
  return HYGIENE_RECORD_TYPES.has(recordType);
}

export function isHygieneActive(record: HygieneActiveCandidate): boolean {
  if (record.archived || !isHygieneRecordType(record.type)) {
    return false;
  }

  if (record.type === "ENTITY STATUS") {
    return true;
  }

  const liveStatuses: readonly string[] = HYGIENE_LIVE_STATUSES[record.type];
  return liveStatuses.includes(projectRecordStatus(record.type, record.payload) ?? "");
}
