export const HYGIENE_TYPE_ORDER = [
  "FACT",
  "EVENT",
  "BELIEF",
  "SECRET",
  "EMOTION",
  "RELATIONSHIP",
  "INTENTION",
  "PLAN",
  "CLOCK",
  "OBLIGATION",
  "CONSEQUENCE",
  "OPEN THREAD",
  "LOCATION",
  "OBJECT",
  "VISIBLE AFFORDANCE",
  "ENTITY STATUS"
] as const;

export type HygieneRecordType = (typeof HYGIENE_TYPE_ORDER)[number];

export interface RecordHygieneRequest {
  mode: "full_active_atomic_review" | "active_working_set_atomic_review";
}

export interface HygieneRecord {
  id: string;
  type: HygieneRecordType;
  displayLabel: string;
  fullDisplayLabel: string;
  status: string | null;
  payload: unknown;
}

export interface HygieneReferenceSummary {
  outgoing: readonly string[];
  incoming: readonly string[];
}

export interface StoryRecordHygieneVersions {
  template: string;
  compiler: string;
  contract: string;
}

export interface StoryRecordHygieneSnapshot {
  records: readonly HygieneRecord[];
  referenceIndex: Readonly<Record<string, HygieneReferenceSummary>>;
  versions: StoryRecordHygieneVersions;
}
