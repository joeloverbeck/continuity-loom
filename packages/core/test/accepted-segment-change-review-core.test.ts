import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  ACCEPTED_SEGMENT_CHANGE_REVIEW_BRIEF_FIELD_PATHS,
  ACCEPTED_SEGMENT_CHANGE_REVIEW_OUTPUT_CONTRACT,
  ACCEPTED_SEGMENT_CHANGE_REVIEW_SOURCE_PROFILE,
  acceptedSegmentChangeReviewOutputJsonSchema,
  compileAcceptedSegmentChangeReviewPrompt,
  parseAcceptedSegmentChangeReviewOutput,
  partitionAcceptedSegmentSpans,
  type AcceptedSegmentChangeReviewSnapshot
} from "../src/index.js";

const caseIds = [
  "death",
  "injury",
  "location-change",
  "custody-change",
  "clock-threshold-crossing",
  "commitment-change",
  "secret-disclosure",
  "no-change"
] as const;

interface FixtureRecord {
  readonly id: string;
  readonly type: string;
  readonly displayLabel: string;
  readonly archived: boolean;
  readonly payload: unknown;
}

interface GoldFixture {
  readonly caseId: string;
  readonly acceptedSegment: {
    readonly id: string;
    readonly sequence: number;
    readonly text: string;
  };
  readonly generationBriefProjection: Readonly<Record<string, unknown>>;
  readonly recordInputs: {
    readonly activeWorkingSet: readonly FixtureRecord[];
    readonly wholeProject: readonly FixtureRecord[];
  };
  readonly expectedSourceAccounting: {
    readonly acceptedSegmentId: string;
    readonly acceptedSegmentSequence: number;
    readonly generationBriefFieldCount: number;
    readonly activeWorkingSetRecordIds: readonly string[];
    readonly wholeProjectRecordIds: readonly string[];
    readonly evidenceKeys: readonly string[];
    readonly contrastKeys: readonly string[];
    readonly secretRecordIds: readonly string[];
  };
  readonly adjudication: {
    readonly findings: readonly {
      readonly summary: string;
      readonly evidenceExcerpt: string;
      readonly evidenceKeys: readonly string[];
      readonly contrastKeys: readonly string[];
      readonly epistemicStatus: string;
      readonly retentionHorizon: string;
      readonly targetHints: readonly string[];
      readonly uncertaintyOrRivalReading: string;
    }[];
    readonly coverage: readonly {
      readonly dimension: string;
      readonly status: string;
      readonly reason: string;
    }[];
  };
}

describe("Accepted-Segment Change Review core contract", () => {
  it("compiles the bounded candidate source with complete deterministic disclosure", () => {
    const fixture = loadFixture("death");
    const acceptedSegmentSpans = partitionAcceptedSegmentSpans(
      fixture.acceptedSegment.text,
      fixture.acceptedSegment.sequence
    );

    const result = compileAcceptedSegmentChangeReviewPrompt({
      request: {
        segmentSelection: "latest",
        recordScope: "active_working_set"
      },
      acceptedSegment: {
        ...fixture.acceptedSegment,
        acceptedAt: "2026-07-21T00:00:00.000Z"
      },
      acceptedSegmentSpans,
      generationBriefProjection: fixture.generationBriefProjection,
      records: fixture.recordInputs.activeWorkingSet,
      referenceStubs: [],
      versions: {
        template: "2.0.0",
        compiler: "2.0.0",
        contract: "2.0.0"
      }
    });

    expect(ACCEPTED_SEGMENT_CHANGE_REVIEW_SOURCE_PROFILE).toBe("accepted-segment-change-review");
    expect(ACCEPTED_SEGMENT_CHANGE_REVIEW_OUTPUT_CONTRACT).toBe("accepted_segment_change_review.v2");
    expect(ACCEPTED_SEGMENT_CHANGE_REVIEW_BRIEF_FIELD_PATHS).toHaveLength(
      fixture.expectedSourceAccounting.generationBriefFieldCount
    );
    expect(Object.keys(fixture.generationBriefProjection).sort()).toEqual(
      [...ACCEPTED_SEGMENT_CHANGE_REVIEW_BRIEF_FIELD_PATHS].sort()
    );
    expect(result.disclosure).toMatchObject({
      acceptedSegmentId: fixture.acceptedSegment.id,
      acceptedSegmentSequence: fixture.acceptedSegment.sequence,
      acceptedSegmentAcceptedAt: "2026-07-21T00:00:00.000Z",
      sourceProfile: ACCEPTED_SEGMENT_CHANGE_REVIEW_SOURCE_PROFILE,
      recordScope: "active_working_set",
      fullRecordCount: fixture.expectedSourceAccounting.activeWorkingSetRecordIds.length,
      includesSecrets: false,
      promptLength: result.prompt.length,
      versions: {
        template: "2.0.0",
        compiler: "2.0.0",
        contract: "2.0.0"
      }
    });
    expect(result.disclosure.fingerprint).toMatch(/^fnv1a32:[0-9a-f]{8}$/);
    expect(result.prompt).toContain("accepted-segment-change-review");
    expect(result.prompt).toContain("accepted_segment_change_review.v2");
    expect(result.prompt).toContain(fixture.acceptedSegment.text);
    expect(result.prompt).toContain("2026-07-21T00:00:00.000Z");
    expect(result.prompt).not.toContain("record_creation_schema_catalog");
    expect(result.prompt).not.toContain("JSON Patch");
  });

  it("discloses SECRET source content when a SECRET is present only as a reference stub", () => {
    const snapshot = candidateSnapshot(loadFixture("death"));
    const result = compileAcceptedSegmentChangeReviewPrompt({
      ...snapshot,
      referenceStubs: [{
        id: "019f7000-0001-7000-8000-000000000099",
        type: "SECRET",
        displayLabel: "The hidden relay claim"
      }]
    });

    expect(result.disclosure.countsByType).not.toHaveProperty("SECRET");
    expect(result.disclosure.includesSecrets).toBe(true);
    expect(result.prompt).toContain("The hidden relay claim");
  });

  it.each(caseIds)("compiles complete Active Working Set and Whole Project source accounting for %s", (caseId) => {
    const fixture = loadFixture(caseId);

    for (const [recordScope, records, expectedIds] of [
      ["active_working_set", fixture.recordInputs.activeWorkingSet, fixture.expectedSourceAccounting.activeWorkingSetRecordIds],
      ["whole_project", fixture.recordInputs.wholeProject, fixture.expectedSourceAccounting.wholeProjectRecordIds]
    ] as const) {
      const result = compileAcceptedSegmentChangeReviewPrompt(candidateSnapshot(fixture, recordScope, records));

      expect(result.disclosure).toMatchObject({
        acceptedSegmentId: fixture.expectedSourceAccounting.acceptedSegmentId,
        acceptedSegmentSequence: fixture.expectedSourceAccounting.acceptedSegmentSequence,
        recordScope,
        fullRecordCount: expectedIds.length,
        includesSecrets: records.some((record) => record.type === "SECRET")
      });
      expect(Object.keys(fixture.generationBriefProjection)).toHaveLength(19);
      for (const recordId of expectedIds) {
        expect(Object.values(result.disclosure.citationMap)).toContain(recordId);
      }
      for (const evidenceKey of fixture.expectedSourceAccounting.evidenceKeys) {
        expect(result.disclosure.citationMap).toHaveProperty(evidenceKey);
      }
    }
  });

  it("publishes a strict shallow output schema with only contract, items, and coverage", () => {
    const schema = acceptedSegmentChangeReviewOutputJsonSchema() as {
      additionalProperties: boolean;
      required: readonly string[];
      properties: Readonly<Record<string, unknown>>;
    };

    expect(schema.additionalProperties).toBe(false);
    expect(schema.required).toEqual(["contract", "items", "coverage"]);
    expect(Object.keys(schema.properties)).toEqual(["contract", "items", "coverage"]);
  });

  it("rejects accepted-segment spans that are not the complete deterministic partition", () => {
    const fixture = loadFixture("death");

    expect(() => compileAcceptedSegmentChangeReviewPrompt({
      request: { segmentSelection: "latest", recordScope: "active_working_set" },
      acceptedSegment: {
        ...fixture.acceptedSegment,
        acceptedAt: "2026-07-21T00:00:00.000Z"
      },
      acceptedSegmentSpans: [{
        key: `[SEG-${fixture.acceptedSegment.sequence}-S001]`,
        sequence: fixture.acceptedSegment.sequence,
        index: 1,
        startOffset: 0,
        endOffset: 12,
        text: fixture.acceptedSegment.text.slice(0, 12)
      }],
      generationBriefProjection: fixture.generationBriefProjection,
      records: fixture.recordInputs.activeWorkingSet,
      referenceStubs: [],
      versions: { template: "2.0.0", compiler: "2.0.0", contract: "2.0.0" }
    })).toThrow(/evidence is unrepresentable/i);
  });

  it("fails closed for invalid requests, incomplete projections, and archived records", () => {
    const snapshot = candidateSnapshot(loadFixture("death"));
    const withoutCurrentTime = { ...snapshot.generationBriefProjection };
    delete withoutCurrentTime["current_authoritative_state.current_time"];

    expect(() => compileAcceptedSegmentChangeReviewPrompt({
      ...snapshot,
      request: { ...snapshot.request, segmentSelection: "older" as "latest" }
    })).toThrow(/only the latest/i);
    expect(() => compileAcceptedSegmentChangeReviewPrompt({
      ...snapshot,
      request: { ...snapshot.request, recordScope: "ranked" as "active_working_set" }
    })).toThrow(/scope is invalid/i);
    expect(() => compileAcceptedSegmentChangeReviewPrompt({
      ...snapshot,
      acceptedSegment: { ...snapshot.acceptedSegment, id: "" }
    })).toThrow(/representable accepted segment/i);
    expect(() => compileAcceptedSegmentChangeReviewPrompt({
      ...snapshot,
      generationBriefProjection: withoutCurrentTime
    })).toThrow(/exactly the nineteen/i);
    expect(() => compileAcceptedSegmentChangeReviewPrompt({
      ...snapshot,
      records: snapshot.records.map((record, index) => index === 0 ? { ...record, archived: true } : record)
    })).toThrow(/cannot compile archived/i);
  });

  it.each(caseIds)("accepts the adjudicated %s gold response as advisory output", (caseId) => {
    const fixture = loadFixture(caseId);
    const parsed = parseAcceptedSegmentChangeReviewOutput(
      JSON.stringify(goldOutput(fixture)),
      parseContext(fixture)
    );

    expect(parsed).toMatchObject({
      status: "valid",
      output: {
        contract: ACCEPTED_SEGMENT_CHANGE_REVIEW_OUTPUT_CONTRACT,
        items: { length: fixture.adjudication.findings.length },
        coverage: { length: 6 }
      }
    });
  });

  it.each([
    ["extra top-level field", (output: Record<string, unknown>) => ({ ...output, source: {} }), "schema-mismatch"],
    ["duplicate coverage", (output: Record<string, unknown>) => ({ ...output, coverage: repeatFirstCoverage(output) }), "coverage-incomplete"],
    ["unknown citation", (output: Record<string, unknown>) => mutateFirstItem(output, { evidence: ["[SEG-999-S999]"] }), "unknown-citation"],
    ["material accepted-prose echo", (output: Record<string, unknown>) => mutateFirstItem(output, {
      change_statement: "Iven sagged against the observatory rail. Sera caught him, but his breath had stopped and no pulse answered beneath her fingers.",
      epistemic_status: "interpretation requiring author judgment",
      evidence_excerpt: ""
    }), "verbatim-source-echo"],
    ["established claim flagged by an invention marker", (output: Record<string, unknown>) => mutateFirstItem(output, {
      epistemic_status: "established change",
      change_statement: "Iven's ownership of the observatory is inferred but not stated.",
      uncertainty_or_rival_reading: "No rival reading is apparent."
    }), "invalid-established-claim"],
    ["established evidence_excerpt missing from the schema keys", (output: Record<string, unknown>) => omitFirstItemKey(output, "evidence_excerpt"), "schema-mismatch"],
    ["established evidence_excerpt is the empty string", (output: Record<string, unknown>) => mutateFirstItem(output, { evidence_excerpt: "" }), "invalid-evidence-excerpt"],
    ["established evidence_excerpt shorter than three words", (output: Record<string, unknown>) => mutateFirstItem(output, { evidence_excerpt: "his breath" }), "invalid-evidence-excerpt"],
    ["established evidence_excerpt longer than seven words", (output: Record<string, unknown>) => mutateFirstItem(output, { evidence_excerpt: "his breath had stopped and no pulse answered beneath" }), "invalid-evidence-excerpt"],
    ["established evidence_excerpt absent from every cited span", (output: Record<string, unknown>) => mutateFirstItem(output, { evidence_excerpt: "the moon rose over the harbor" }), "invalid-evidence-excerpt"],
    ["established evidence_excerpt is not a string", (output: Record<string, unknown>) => mutateFirstItem(output, { evidence_excerpt: 4 }), "schema-mismatch"],
    ["interpretation carrying a non-empty evidence_excerpt", (output: Record<string, unknown>) => mutateFirstItem(output, {
      epistemic_status: "interpretation requiring author judgment",
      evidence_excerpt: "his breath had stopped"
    }), "invalid-evidence-excerpt"],
    ["evidence citation with appended prose", (output: Record<string, unknown>) => mutateFirstItem(output, { evidence: ["[SEG-21-S001] the rail"] }), "unknown-citation"],
    ["future possibility", (output: Record<string, unknown>) => mutateFirstItem(output, {
      change_statement: "Sera might investigate who damaged the rail tomorrow."
    }), "future-possibility"],
    ["unknown enum", (output: Record<string, unknown>) => mutateFirstItem(output, {
      retention_horizon: "keep forever"
    }), "invalid-enum"],
    ["wrong contract", (output: Record<string, unknown>) => ({ ...output, contract: "other.v1" }), "schema-mismatch"],
    ["non-array items", (output: Record<string, unknown>) => ({ ...output, items: {} }), "schema-mismatch"],
    ["non-object item", (output: Record<string, unknown>) => ({ ...output, items: [null] }), "schema-mismatch"],
    ["non-sequential item id", (output: Record<string, unknown>) => mutateFirstItem(output, { id: "ITEM-009" }), "schema-mismatch"],
    ["empty evidence list", (output: Record<string, unknown>) => mutateFirstItem(output, { evidence: [] }), "schema-mismatch"],
    ["duplicate target hints", (output: Record<string, unknown>) => mutateFirstItem(output, { affected_target_hints: ["FACT", "FACT"] }), "schema-mismatch"],
    ["blank uncertainty", (output: Record<string, unknown>) => mutateFirstItem(output, { uncertainty_or_rival_reading: " " }), "schema-mismatch"],
    ["missing coverage row", (output: Record<string, unknown>) => ({ ...output, coverage: (output.coverage as unknown[]).slice(1) }), "coverage-incomplete"],
    ["non-object coverage row", (output: Record<string, unknown>) => ({ ...output, coverage: [null, ...(output.coverage as unknown[]).slice(1)] }), "schema-mismatch"],
    ["unknown coverage dimension", (output: Record<string, unknown>) => mutateFirstCoverage(output, { dimension: "plot" }), "coverage-incomplete"],
    ["unknown coverage status", (output: Record<string, unknown>) => mutateFirstCoverage(output, { status: "complete" }), "invalid-enum"],
    // Constraints removed from the strict schema by #142 (uniqueItems, pattern, maxItems) must
    // still be enforced by the parser with equal strength.
    ["duplicate evidence citations", (output: Record<string, unknown>) => mutateFirstItem(output, { evidence: duplicateFirstCitation(output) }), "schema-mismatch"],
    ["malformed item id shape", (output: Record<string, unknown>) => mutateFirstItem(output, { id: "ITEM-1" }), "schema-mismatch"],
    ["too many coverage rows", (output: Record<string, unknown>) => ({ ...output, coverage: [...(output.coverage as unknown[]), (output.coverage as unknown[])[0]] }), "coverage-incomplete"]
  ] as const)("quarantines the whole response for %s", (_label, mutate, reasonCode) => {
    const fixture = loadFixture("death");
    const parsed = parseAcceptedSegmentChangeReviewOutput(
      JSON.stringify(mutate(goldOutput(fixture))),
      parseContext(fixture)
    );

    expect(parsed).toMatchObject({ status: "quarantined", reasonCode });
    expect(parsed).not.toHaveProperty("rawOutput");
    expect(parsed).not.toHaveProperty("output");
  });

  it.each([
    ["malformed JSON", "{"],
    ["non-object JSON", "[]"]
  ])("quarantines %s without returning raw output", (_label, rawOutput) => {
    const parsed = parseAcceptedSegmentChangeReviewOutput(rawOutput, parseContext(loadFixture("death")));

    expect(parsed).toMatchObject({ status: "quarantined", reasonCode: "not-pure-json" });
    expect(parsed).not.toHaveProperty("rawOutput");
  });
});

function candidateSnapshot(
  fixture: GoldFixture,
  recordScope: "active_working_set" | "whole_project" = "active_working_set",
  records: readonly FixtureRecord[] = fixture.recordInputs.activeWorkingSet
): AcceptedSegmentChangeReviewSnapshot {
  return {
    request: { segmentSelection: "latest", recordScope },
    acceptedSegment: { ...fixture.acceptedSegment, acceptedAt: "2026-07-21T00:00:00.000Z" },
    acceptedSegmentSpans: partitionAcceptedSegmentSpans(fixture.acceptedSegment.text, fixture.acceptedSegment.sequence),
    generationBriefProjection: fixture.generationBriefProjection,
    records,
    referenceStubs: [],
    versions: { template: "2.0.0", compiler: "2.0.0", contract: "2.0.0" }
  };
}

function loadFixture(caseId: (typeof caseIds)[number]): GoldFixture {
  const fixtureUrl = new URL(`./fixtures/accepted-segment-change-review/${caseId}.json`, import.meta.url);
  return JSON.parse(readFileSync(fixtureUrl, "utf8")) as GoldFixture;
}

function goldOutput(fixture: GoldFixture): Record<string, unknown> {
  return {
    contract: ACCEPTED_SEGMENT_CHANGE_REVIEW_OUTPUT_CONTRACT,
    items: fixture.adjudication.findings.map((finding, index) => ({
      id: `ITEM-${String(index + 1).padStart(3, "0")}`,
      change_statement: finding.summary,
      evidence_excerpt: finding.evidenceExcerpt,
      evidence: finding.evidenceKeys,
      contrast: finding.contrastKeys,
      epistemic_status: finding.epistemicStatus,
      retention_horizon: finding.retentionHorizon,
      affected_target_hints: finding.targetHints,
      uncertainty_or_rival_reading: finding.uncertaintyOrRivalReading
    })),
    coverage: fixture.adjudication.coverage
  };
}

function parseContext(fixture: GoldFixture) {
  return {
    acceptedSegmentText: fixture.acceptedSegment.text,
    evidenceKeys: fixture.expectedSourceAccounting.evidenceKeys,
    evidenceTextByKey: Object.fromEntries(
      fixture.expectedSourceAccounting.evidenceKeys.map((key) => [key, fixture.acceptedSegment.text])
    ),
    contrastKeys: [
      ...fixture.expectedSourceAccounting.contrastKeys,
      ...ACCEPTED_SEGMENT_CHANGE_REVIEW_BRIEF_FIELD_PATHS.map((path) => `[BRIEF:${path}]`),
      "[RECORD-SCOPE]"
    ]
  };
}

function repeatFirstCoverage(output: Record<string, unknown>): unknown[] {
  const coverage = output.coverage as readonly unknown[];
  return coverage.map((row, index) => index === 1 ? coverage[0] : row);
}

function mutateFirstItem(output: Record<string, unknown>, replacement: Record<string, unknown>): Record<string, unknown> {
  const items = output.items as readonly Record<string, unknown>[];
  return {
    ...output,
    items: [{ ...items[0], ...replacement }, ...items.slice(1)]
  };
}

function omitFirstItemKey(output: Record<string, unknown>, key: string): Record<string, unknown> {
  const items = output.items as readonly Record<string, unknown>[];
  const first = { ...items[0] };
  delete first[key];
  return { ...output, items: [first, ...items.slice(1)] };
}

function mutateFirstCoverage(
  output: Record<string, unknown>,
  replacement: Record<string, unknown>
): Record<string, unknown> {
  const coverage = output.coverage as readonly Record<string, unknown>[];
  return {
    ...output,
    coverage: [{ ...coverage[0], ...replacement }, ...coverage.slice(1)]
  };
}

function duplicateFirstCitation(output: Record<string, unknown>): string[] {
  const firstItem = (output.items as readonly Record<string, unknown>[])[0];
  const evidence = firstItem?.evidence as readonly string[] | undefined;
  const firstKey = evidence?.[0];
  if (firstKey === undefined) {
    throw new Error("Expected the gold fixture's first item to cite at least one evidence key.");
  }
  return [firstKey, firstKey];
}
