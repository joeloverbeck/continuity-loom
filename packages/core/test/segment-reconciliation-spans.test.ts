import fc from "fast-check";
import { describe, expect, it } from "vitest";

import {
  RECORD_SCOPE_CITATION_KEY,
  briefFieldCitationKey,
  reconciliationRecordCitationKeysFor,
  referenceStubCitationKeysFor,
  segmentSpanCitationKey
} from "../src/compiler/reconciliation/citation-keys.js";
import {
  normalizeAcceptedSegmentText,
  partitionAcceptedSegmentSpans
} from "../src/compiler/reconciliation/segment-spans.js";
import type { ReconciliationRecord, ReconciliationReferenceStub } from "../src/compiler/reconciliation/types.js";

describe("segment reconciliation span partitioning", () => {
  it("normalizes line endings before partitioning", () => {
    expect(normalizeAcceptedSegmentText("one\r\ntwo\rthree")).toBe("one\ntwo\nthree");
  });

  it("partitions normalized non-whitespace text with stable offsets and keys", () => {
    fc.assert(
      fc.property(fc.string({ maxLength: 2500 }), (text) => {
        const normalized = normalizeAcceptedSegmentText(text);
        const spans = partitionAcceptedSegmentSpans(text, 12);
        const covered = new Set<number>();

        for (const [index, span] of spans.entries()) {
          expect(span.key).toBe(segmentSpanCitationKey(12, index + 1));
          expect(span.sequence).toBe(12);
          expect(span.index).toBe(index + 1);
          expect(span.endOffset).toBeGreaterThan(span.startOffset);
          expect(span.endOffset - span.startOffset).toBeLessThanOrEqual(800);
          expect(span.text).toBe(normalized.slice(span.startOffset, span.endOffset));
          expect(/\S/.test(span.text)).toBe(true);

          for (let offset = span.startOffset; offset < span.endOffset; offset += 1) {
            expect(covered.has(offset)).toBe(false);
            covered.add(offset);
          }
        }

        for (let offset = 0; offset < normalized.length; offset += 1) {
          if (/\S/.test(normalized[offset] ?? "")) {
            expect(covered.has(offset)).toBe(true);
          }
        }
      }),
      { numRuns: 100 }
    );
  });

  it("splits long candidates at sentence boundaries, whitespace, then hard boundaries", () => {
    const sentenceText = `${"a".repeat(200)}. ${"b".repeat(750)}`;
    const sentenceSpans = partitionAcceptedSegmentSpans(sentenceText, 1);
    expect(sentenceSpans.map((span) => span.text)).toEqual([`${"a".repeat(200)}.`, "b".repeat(750)]);

    const whitespaceText = `${"a".repeat(790)} ${"b".repeat(20)}`;
    const whitespaceSpans = partitionAcceptedSegmentSpans(whitespaceText, 1);
    expect(whitespaceSpans.map((span) => span.text)).toEqual(["a".repeat(790), "b".repeat(20)]);

    const hardSplitText = "x".repeat(801);
    const hardSplitSpans = partitionAcceptedSegmentSpans(hardSplitText, 1);
    expect(hardSplitSpans.map((span) => span.text)).toEqual(["x".repeat(800), "x"]);
  });

  it("is deterministic for identical normalized accepted-segment text", () => {
    const first = partitionAcceptedSegmentSpans("First paragraph.\r\n\r\nSecond paragraph.", 7);
    const second = partitionAcceptedSegmentSpans("First paragraph.\n\nSecond paragraph.", 7);

    expect(second).toEqual(first);
  });
});

describe("segment reconciliation citation keys", () => {
  it("emits fixed grammar for segment, brief, record, stub, and scope keys", () => {
    const records: ReconciliationRecord[] = [
      record("rec-3", "OBJECT", "third"),
      record("rec-2", "CAST MEMBER", "second"),
      record("rec-1", "CAST MEMBER", "first")
    ];
    const stubs: ReconciliationReferenceStub[] = [
      stub("stub-2", "VISIBLE AFFORDANCE", "second"),
      stub("stub-1", "VISIBLE AFFORDANCE", "first")
    ];

    expect(segmentSpanCitationKey(4, 9)).toBe("[SEG-4-S009]");
    expect(briefFieldCitationKey("immediate_handoff.begin_after")).toBe("[BRIEF:immediate_handoff.begin_after]");
    expect(reconciliationRecordCitationKeysFor(records)).toEqual(
      new Map([
        ["rec-1", "[CAST-MEMBER-1]"],
        ["rec-2", "[CAST-MEMBER-2]"],
        ["rec-3", "[OBJECT-1]"]
      ])
    );
    expect(referenceStubCitationKeysFor(stubs)).toEqual(
      new Map([
        ["stub-1", "[REF-VISIBLE-AFFORDANCE-1]"],
        ["stub-2", "[REF-VISIBLE-AFFORDANCE-2]"]
      ])
    );
    expect(RECORD_SCOPE_CITATION_KEY).toBe("[RECORD-SCOPE]");
  });
});

function record(id: string, type: string, displayLabel: string): ReconciliationRecord {
  return {
    id,
    type,
    displayLabel,
    payload: {}
  };
}

function stub(id: string, type: string, displayLabel: string): ReconciliationReferenceStub {
  return {
    id,
    type,
    displayLabel
  };
}
