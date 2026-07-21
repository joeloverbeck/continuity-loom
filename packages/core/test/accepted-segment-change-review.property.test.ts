import { readFileSync } from "node:fs";

import { fc } from "@fast-check/vitest";
import { describe, expect, it } from "vitest";

import {
  ACCEPTED_SEGMENT_CHANGE_REVIEW_OUTPUT_CONTRACT,
  applyConsumedGenerationGuidanceRemoval,
  compileAcceptedSegmentChangeReviewPrompt,
  listConsumedGenerationGuidance,
  parseAcceptedSegmentChangeReviewOutput,
  partitionAcceptedSegmentSpans,
  type AcceptedSegmentChangeReviewCoverageDimension,
  type AcceptedSegmentChangeReviewRecord
} from "../src/index.js";

const seed = 0x1352026;
const dimensions: readonly AcceptedSegmentChangeReviewCoverageDimension[] = [
  "spatial/material/bodily state",
  "time/clocks/ongoing processes",
  "facts/knowledge/beliefs/secrets",
  "intentions/plans/commitments/promises/open pressures",
  "emotions/relationships",
  "immediate next-segment handoff"
];

describe("Accepted-Segment Change Review properties", () => {
  it("keeps prompt bytes and fingerprint stable under record input permutation", () => {
    const fixture = loadDeathFixture();
    const baseline = compile(fixture.recordInputs.wholeProject, fixture);

    fc.assert(
      fc.property(
        fc.shuffledSubarray([...fixture.recordInputs.wholeProject], {
          minLength: fixture.recordInputs.wholeProject.length,
          maxLength: fixture.recordInputs.wholeProject.length
        }),
        (records) => {
          const permuted = compile(records, fixture);
          expect(permuted.prompt).toBe(baseline.prompt);
          expect(permuted.disclosure.fingerprint).toBe(baseline.disclosure.fingerprint);
        }
      ),
      { seed, numRuns: 32, verbose: true }
    );
  });

  it("quarantines every undeclared top-level field name", () => {
    const output = {
      contract: ACCEPTED_SEGMENT_CHANGE_REVIEW_OUTPUT_CONTRACT,
      items: [],
      coverage: dimensions.map((dimension) => ({
        dimension,
        status: "checked - no relevant change",
        reason: "The dimension was checked."
      }))
    };

    fc.assert(
      fc.property(
        fc.stringMatching(/^[a-z][a-z_]{0,20}$/).filter((key) => !["contract", "items", "coverage"].includes(key)),
        (key) => {
          expect(parseAcceptedSegmentChangeReviewOutput(
            JSON.stringify({ ...output, [key]: "forbidden" }),
            {
              acceptedSegmentText: "A segment changed nothing.",
              evidenceKeys: ["[SEG-1-S001]"],
              evidenceTextByKey: { "[SEG-1-S001]": "A segment changed nothing." },
              contrastKeys: ["[RECORD-SCOPE]"]
            }
          )).toMatchObject({ status: "quarantined", reasonCode: "schema-mismatch" });
        }
      ),
      { seed: seed + 1, numRuns: 32, verbose: true }
    );
  });

  it("removes exactly the selected manual-guidance indices", () => {
    fc.assert(
      fc.property(
        fc.uniqueArray(fc.stringMatching(/^[A-Za-z][A-Za-z ]{0,30}$/), { minLength: 1, maxLength: 8 }),
        fc.array(fc.boolean(), { minLength: 1, maxLength: 8 }),
        (values, mask) => {
          const draft = { manual_moment_directive: { must_render: values } };
          const entries = listConsumedGenerationGuidance(draft);
          const selected = entries.filter((_entry, index) => mask[index % mask.length]).map((entry) => entry.id);
          const updated = applyConsumedGenerationGuidanceRemoval(draft, selected);
          const selectedSet = new Set(selected);
          const expected = values.filter((_value, index) => !selectedSet.has(`manual_moment_directive.must_render[]:${index}`));

          expect(updated.manual_moment_directive?.must_render).toEqual(expected);
          expect(draft.manual_moment_directive.must_render).toEqual(values);
        }
      ),
      { seed: seed + 2, numRuns: 48, verbose: true }
    );
  });
});

interface DeathFixture {
  acceptedSegment: { id: string; sequence: number; text: string };
  generationBriefProjection: Readonly<Record<string, unknown>>;
  recordInputs: { wholeProject: readonly AcceptedSegmentChangeReviewRecord[] };
}

function loadDeathFixture(): DeathFixture {
  const url = new URL("./fixtures/accepted-segment-change-review/death.json", import.meta.url);
  return JSON.parse(readFileSync(url, "utf8")) as DeathFixture;
}

function compile(records: readonly AcceptedSegmentChangeReviewRecord[], fixture: DeathFixture) {
  return compileAcceptedSegmentChangeReviewPrompt({
    request: { segmentSelection: "latest", recordScope: "whole_project" },
    acceptedSegment: { ...fixture.acceptedSegment, acceptedAt: "2026-07-21T00:00:00.000Z" },
    acceptedSegmentSpans: partitionAcceptedSegmentSpans(fixture.acceptedSegment.text, fixture.acceptedSegment.sequence),
    generationBriefProjection: fixture.generationBriefProjection,
    records,
    referenceStubs: [],
    versions: { template: "1.0.0", compiler: "1.0.0", contract: "1.0.0" }
  });
}
