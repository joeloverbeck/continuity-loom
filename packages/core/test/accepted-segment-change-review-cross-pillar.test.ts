import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  buildValidationSnapshot,
  compileAcceptedSegmentChangeReviewPrompt,
  compilePrompt,
  compileRecordHygienePrompt,
  demoGenerationSession,
  demoRecords,
  demoStoryConfig,
  HYGIENE_TYPE_ORDER,
  partitionAcceptedSegmentSpans,
  projectRecordStatus,
  type AcceptedSegmentChangeReviewSnapshot,
  type HygieneRecord,
  type StoryRecordHygieneSnapshot
} from "../src/index.js";

const acceptedSentinel = "ACCEPTED_SEGMENT_CAPSTONE_SENTINEL";

interface DemoRecordForHygiene {
  id: string;
  type: string;
  displayLabel?: string;
  payload: unknown;
}

interface GoldFixtureShape {
  readonly acceptedSegment: { readonly id: string; readonly sequence: number; readonly text: string };
  readonly generationBriefProjection: AcceptedSegmentChangeReviewSnapshot["generationBriefProjection"];
  readonly recordInputs: { readonly activeWorkingSet: AcceptedSegmentChangeReviewSnapshot["records"] };
}

describe("accepted-segment-change-review cross-pillar capstone", () => {
  it("confines accepted prose to the accepted-segment-change-review prompt only", () => {
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
    const reviewSnapshot = changeReviewSnapshot();
    const reviewPrompt = compileAcceptedSegmentChangeReviewPrompt(reviewSnapshot).prompt;

    expect(prosePrompt).not.toContain(acceptedSentinel);
    expect(ideationPrompt).not.toContain(acceptedSentinel);
    expect(hygienePrompt).not.toContain(acceptedSentinel);
    expect(reviewPrompt).toContain(acceptedSentinel);
    expect(countOccurrences(reviewPrompt, acceptedSentinel)).toBe(1);
    expect(countOccurrences(reviewPrompt, "<segment_span ")).toBe(reviewSnapshot.acceptedSegmentSpans.length);
  });
});

function changeReviewSnapshot(): AcceptedSegmentChangeReviewSnapshot {
  const fixtureUrl = new URL("./fixtures/accepted-segment-change-review/death.json", import.meta.url);
  const fixture = JSON.parse(readFileSync(fixtureUrl, "utf8")) as GoldFixtureShape;
  const acceptedText = `${fixture.acceptedSegment.text} ${acceptedSentinel}`;

  return {
    request: { segmentSelection: "latest", recordScope: "active_working_set" },
    acceptedSegment: {
      id: fixture.acceptedSegment.id,
      sequence: fixture.acceptedSegment.sequence,
      acceptedAt: "2026-07-21T00:00:00.000Z",
      text: acceptedText
    },
    acceptedSegmentSpans: partitionAcceptedSegmentSpans(acceptedText, fixture.acceptedSegment.sequence),
    generationBriefProjection: fixture.generationBriefProjection,
    records: fixture.recordInputs.activeWorkingSet,
    referenceStubs: [],
    versions: { template: "2.0.0", compiler: "2.0.0", contract: "2.0.0" }
  };
}

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

function countOccurrences(value: string, needle: string): number {
  return value.split(needle).length - 1;
}
