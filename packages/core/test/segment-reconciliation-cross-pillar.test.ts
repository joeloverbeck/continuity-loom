import { describe, expect, it } from "vitest";

import {
  buildSegmentReconciliationSchemaCatalog,
  buildValidationSnapshot,
  briefFieldCitationKey,
  compilePrompt,
  compileRecordHygienePrompt,
  compileSegmentReconciliationPrompt,
  demoGenerationSession,
  demoRecords,
  demoStoryConfig,
  HYGIENE_TYPE_ORDER,
  partitionAcceptedSegmentSpans,
  projectRecordStatus,
  recordTypes,
  RECONCILIATION_BRIEF_FIELD_PATHS,
  type HygieneRecord,
  type ReconciliationBriefField,
  type SegmentReconciliationSnapshot,
  type StoryRecordHygieneSnapshot
} from "../src/index.js";

const acceptedSentinel = "ACCEPTED_SEGMENT_CAPSTONE_SENTINEL";

interface DemoRecordForHygiene {
  id: string;
  type: string;
  displayLabel?: string;
  payload: unknown;
}

describe("segment reconciliation cross-pillar capstone", () => {
  it("confines accepted prose to the segment-reconciliation prompt only", () => {
    const snapshot = buildValidationSnapshot({
      records: demoRecords,
      generationSession: demoGenerationSession,
      storyConfig: demoStoryConfig,
      versions: { template: "1.7.0", compiler: "1.9.0", contract: "1.10.0" }
    });
    const prosePrompt = compilePrompt(snapshot).prompt;
    const ideationPrompt = compilePrompt(snapshot, {
      promptKind: "ideation",
      ideationRequest: { mode: "ideas", count: 3, dormantSlot: false }
    }).prompt;
    const hygienePrompt = compileRecordHygienePrompt(hygieneSnapshot()).prompt;
    const reconciliationSnapshot = segmentReconciliationSnapshot();
    const reconciliationPrompt = compileSegmentReconciliationPrompt(reconciliationSnapshot).prompt;

    expect(prosePrompt).not.toContain(acceptedSentinel);
    expect(ideationPrompt).not.toContain(acceptedSentinel);
    expect(hygienePrompt).not.toContain(acceptedSentinel);
    expect(reconciliationPrompt).toContain(acceptedSentinel);
    expect(countOccurrences(reconciliationPrompt, acceptedSentinel)).toBe(1);
    expect(countOccurrences(reconciliationPrompt, "<segment_span ")).toBe(reconciliationSnapshot.acceptedSegmentSpans.length);
    expect(reconciliationPrompt).toContain('"accepted_segment":');
    expect(reconciliationPrompt).toContain('"sequence": 9');
    expect(reconciliationPrompt).not.toMatch(/<segment_span[^>]+(?:sequence|start|end)=/);
  });

  it("keeps the reconciliation schema catalog aligned with the record registry", () => {
    const catalog = buildSegmentReconciliationSchemaCatalog("capstone");

    expect(catalog.recordTypes.map((entry) => entry.recordType)).toEqual([...recordTypes]);
    expect(catalog.recordTypes).toHaveLength(recordTypes.length);
    expect(catalog.recordTypes.every((entry) => entry.payloadJsonSchema && entry.fields.length > 0)).toBe(true);
  });
});

function hygieneSnapshot(): StoryRecordHygieneSnapshot {
  const hygieneRecords = (demoRecords as readonly DemoRecordForHygiene[])
    .filter((record): record is typeof record & { type: HygieneRecord["type"] } =>
      HYGIENE_TYPE_ORDER.includes(record.type as HygieneRecord["type"])
    )
    .map((record): HygieneRecord => {
      const label = "displayLabel" in record && typeof record.displayLabel === "string" ? record.displayLabel : record.id;

      return {
        id: record.id,
        type: record.type,
        displayLabel: label,
        fullDisplayLabel: label,
        status: projectRecordStatus(record.type, record.payload),
        payload: record.payload
      };
    });

  return {
    records: hygieneRecords,
    referenceIndex: Object.fromEntries(hygieneRecords.map((record) => [record.id, { outgoing: [], incoming: [] }])),
    versions: { template: "capstone", compiler: "capstone", contract: "capstone" }
  };
}

function segmentReconciliationSnapshot(): SegmentReconciliationSnapshot {
  const acceptedText = `Mara pockets the brass key. ${acceptedSentinel}`;
  const acceptedSegment = {
    id: "accepted-9",
    sequence: 9,
    acceptedAt: "2026-06-24T12:00:00.000Z",
    text: acceptedText
  };

  return {
    request: { segmentSelection: "latest", recordScope: "active_working_set" },
    acceptedSegment,
    generationBriefDraft: {},
    briefFields: briefFields(),
    records: [],
    referenceStubs: [],
    versions: { template: "capstone", compiler: "capstone", contract: "capstone" },
    normalizedAcceptedSegmentText: acceptedText,
    acceptedSegmentSpans: partitionAcceptedSegmentSpans(acceptedText, acceptedSegment.sequence)
  };
}

function briefFields(): readonly ReconciliationBriefField[] {
  return RECONCILIATION_BRIEF_FIELD_PATHS.map((fieldPath) => ({
    fieldPath,
    citationKey: briefFieldCitationKey(fieldPath),
    currentState: "missing"
  }));
}

function countOccurrences(value: string, needle: string): number {
  return value.split(needle).length - 1;
}
