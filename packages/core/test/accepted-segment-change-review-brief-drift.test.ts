import { describe, expect, it } from "vitest";

import {
  ACCEPTED_SEGMENT_CHANGE_REVIEW_BRIEF_FIELD_PATHS,
  ACCEPTED_SEGMENT_CHANGE_REVIEW_OUTPUT_CONTRACT,
  acceptedSegmentChangeReviewVersionInfo,
  compileAcceptedSegmentChangeReviewPrompt,
  parseAcceptedSegmentChangeReviewOutput,
  partitionAcceptedSegmentSpans,
  type AcceptedSegmentChangeReviewSnapshot
} from "../src/index.js";

// F021 (issue #159): the inherited Generation Brief immediate-handoff fields presuppose a
// turn-to-face beat the latest accepted segment never renders — drift that rests on the
// segment's *absence* of the beat. This is elicited within the sanctioned
// accepted_segment_change_review.v2 profile as an `interpretation requiring author judgment`
// item with an empty evidence_excerpt; no new output field, read, or authority is added.

const DRIFTED_BRIEF_PATH = "immediate_handoff.last_visible_moment";
const DRIFT_CONTRAST_KEY = `[BRIEF:${DRIFTED_BRIEF_PATH}]`;

// The segment ends with the point-of-view character still facing the window; he never turns to
// the far bench, so the inherited handoff's "already turned and begun reading" is unsupported.
const ACCEPTED_SEGMENT_TEXT =
  "Wen told Toll to look at the far bench and see what the night shift had left undone. " +
  "Toll heard her, and his hand tightened on the ledger, but he kept his eyes on the window and the black yard beyond it.";

describe("Accepted-Segment Change Review inherited-brief drift (F021)", () => {
  it("declares the bumped template version while keeping compiler and output-contract versions", () => {
    expect(acceptedSegmentChangeReviewVersionInfo.template).toBe("2.1.0");
    expect(acceptedSegmentChangeReviewVersionInfo.compiler).toBe("2.0.0");
    expect(acceptedSegmentChangeReviewVersionInfo.contract).toBe("2.1.0");
    expect(ACCEPTED_SEGMENT_CHANGE_REVIEW_OUTPUT_CONTRACT).toBe("accepted_segment_change_review.v2");
  });

  it("elicits reverse-direction inherited-brief drift as interpretation-class over the segment's absence", () => {
    const prompt = compileAcceptedSegmentChangeReviewPrompt(driftSnapshot()).prompt;

    // The role/procedure must direct the model to flag an inherited current-state or
    // immediate-handoff assertion the latest accepted segment does not render, and to keep it
    // interpretation-class (never an established change grounded on absence). Tolerant anchors
    // keep a behavior-neutral reword from breaking the golden; "interpretation requiring author
    // judgment" is a stable contract enum value, so it is asserted verbatim.
    expect(prompt).toMatch(/does not (render|depict|show|support)/i);
    expect(prompt).toContain("interpretation requiring author judgment");
    expect(prompt).toMatch(/inherited[\s\S]*brief[\s\S]*(current[- ]state|handoff)/i);
  });

  it("compiles byte-identical deterministic source for identical inputs and versions", () => {
    const first = compileAcceptedSegmentChangeReviewPrompt(driftSnapshot());
    const second = compileAcceptedSegmentChangeReviewPrompt(driftSnapshot());

    expect(second.prompt).toBe(first.prompt);
    expect(second.disclosure.fingerprint).toBe(first.disclosure.fingerprint);
  });

  it("accepts an inherited-brief drift item as an interpretation with an empty excerpt, the drifted brief path, and a segment evidence key", () => {
    const snapshot = driftSnapshot();
    const context = parseContextFor(snapshot);
    const parsed = parseAcceptedSegmentChangeReviewOutput(JSON.stringify(driftGoldOutput(context)), context);

    expect(parsed.status).toBe("valid");
    if (parsed.status !== "valid") {
      return;
    }

    const item = parsed.output.items[0]!;
    expect(item.epistemicStatus).toBe("interpretation requiring author judgment");
    expect(item.evidenceExcerpt).toBe("");
    expect(item.contrast).toContain(DRIFT_CONTRAST_KEY);
    expect(item.evidence).toEqual([firstSegmentKey(context)]);
    // The immediate next-segment handoff coverage row reflects the surfaced drift item.
    const handoffRow = parsed.output.coverage.find((row) => row.dimension === "immediate next-segment handoff");
    expect(handoffRow?.status).toBe("changes found");
  });

  it("quarantines a drift item that is asserted as an established change from the segment's absence", () => {
    const snapshot = driftSnapshot();
    const context = parseContextFor(snapshot);
    const gold = driftGoldOutput(context);
    // Absence cannot be an established change: any non-empty excerpt is invented (it does not occur
    // in a cited span), so the whole response quarantines under the existing evidence_excerpt gate.
    const items = gold.items as Record<string, unknown>[];
    items[0] = {
      ...items[0],
      epistemic_status: "established change",
      evidence_excerpt: "Toll turned to the bench"
    };

    const parsed = parseAcceptedSegmentChangeReviewOutput(JSON.stringify(gold), context);

    expect(parsed).toMatchObject({ status: "quarantined", reasonCode: "invalid-evidence-excerpt" });
    expect(parsed).not.toHaveProperty("output");
  });
});

function driftSnapshot(): AcceptedSegmentChangeReviewSnapshot {
  return {
    request: { segmentSelection: "latest", recordScope: "active_working_set" },
    acceptedSegment: {
      id: "synthetic-segment-brief-drift",
      sequence: 15,
      acceptedAt: "2026-07-22T00:00:00.000Z",
      text: ACCEPTED_SEGMENT_TEXT
    },
    acceptedSegmentSpans: partitionAcceptedSegmentSpans(ACCEPTED_SEGMENT_TEXT, 15),
    generationBriefProjection: driftBriefProjection(),
    records: [
      {
        id: "019f7000-0015-7000-8000-000000000001",
        type: "ENTITY",
        displayLabel: "Toll",
        payload: {
          id: "019f7000-0015-7000-8000-000000000001",
          display_name: "Toll",
          entity_kind: "person",
          roles_in_story: ["viewpoint", "primary_actor"],
          short_description: "A night clerk balancing a ledger."
        }
      },
      {
        id: "019f7000-0015-7000-8000-000000000002",
        type: "ENTITY",
        displayLabel: "Wen",
        payload: {
          id: "019f7000-0015-7000-8000-000000000002",
          display_name: "Wen",
          entity_kind: "person",
          roles_in_story: ["allied_actor"],
          short_description: "The shift lead who directs Toll to the far bench."
        }
      }
    ],
    referenceStubs: [],
    versions: acceptedSegmentChangeReviewVersionInfo
  };
}

function driftBriefProjection(): Readonly<Record<string, unknown>> {
  const projection: Record<string, unknown> = {
    "current_authoritative_state.current_time": "Late in the night shift",
    "current_authoritative_state.current_location": "The counting room",
    "current_authoritative_state.onstage_entities": [
      "019f7000-0015-7000-8000-000000000001",
      "019f7000-0015-7000-8000-000000000002"
    ],
    "current_authoritative_state.immediate_situation_summary": "Wen has directed Toll to inspect the far bench.",
    "current_authoritative_state.offstage_pressuring_entities": [],
    "current_authoritative_state.positions": ["Toll stands at the ledger desk facing the window."],
    "current_authoritative_state.possessions": ["Toll holds the ledger."],
    "current_authoritative_state.visible_conditions": ["The yard beyond the window is dark."],
    "current_authoritative_state.environmental_conditions": ["The counting room is quiet."],
    "current_authoritative_state.entity_statuses": [],
    "current_authoritative_state.line_of_sight_and_visibility": "Toll can see the window; the far bench is behind him.",
    "current_authoritative_state.pov_cannot_perceive_now": [],
    "current_authoritative_state.routes_and_exits": ["The stair door leads down to the yard."],
    "current_authoritative_state.available_time": "No hard deadline.",
    "current_authoritative_state.consent_or_force_conditions": "No restraint is active.",
    "current_authoritative_state.current_locks": [],
    "immediate_handoff.recent_causal_context": "Wen directed Toll to the far bench.",
    // Drift: the handoff presupposes a turn the segment never renders.
    "immediate_handoff.last_visible_moment": "Toll had turned back to the far bench and begun reading the night-shift list.",
    "immediate_handoff.begin_after": "Begin after Toll starts reading the list at the far bench."
  };
  // Guard: the projection must carry exactly the nineteen declared paths.
  const keys = Object.keys(projection).sort();
  const expected = [...ACCEPTED_SEGMENT_CHANGE_REVIEW_BRIEF_FIELD_PATHS].sort();
  if (JSON.stringify(keys) !== JSON.stringify(expected)) {
    throw new Error("drift fixture projection must carry exactly the nineteen declared brief paths");
  }
  return projection;
}

function parseContextFor(snapshot: AcceptedSegmentChangeReviewSnapshot) {
  return {
    acceptedSegmentText: snapshot.acceptedSegment.text,
    evidenceKeys: snapshot.acceptedSegmentSpans.map((span) => span.key),
    evidenceTextByKey: Object.fromEntries(
      snapshot.acceptedSegmentSpans.map((span) => [span.key, span.text])
    ),
    contrastKeys: [
      ...ACCEPTED_SEGMENT_CHANGE_REVIEW_BRIEF_FIELD_PATHS.map((path) => `[BRIEF:${path}]`),
      "[RECORD-SCOPE]"
    ]
  };
}

function firstSegmentKey(context: ReturnType<typeof parseContextFor>): string {
  return context.evidenceKeys[0]!;
}

function driftGoldOutput(context: ReturnType<typeof parseContextFor>): Record<string, unknown> {
  return {
    contract: ACCEPTED_SEGMENT_CHANGE_REVIEW_OUTPUT_CONTRACT,
    items: [
      {
        id: "ITEM-001",
        change_statement:
          "The inherited handoff assumes the point-of-view clerk already pivoted to the coworker's workstation, yet the accepted segment closes before any such pivot.",
        evidence_excerpt: "",
        evidence: [firstSegmentKey(context)],
        contrast: [DRIFT_CONTRAST_KEY],
        epistemic_status: "interpretation requiring author judgment",
        retention_horizon: "next-brief-only",
        affected_target_hints: ["IMMEDIATE-HANDOFF"],
        uncertainty_or_rival_reading:
          "The author may have intended an off-screen pivot; only the author can reconcile the handoff with the rendered ending."
      }
    ],
    coverage: [
      { dimension: "spatial/material/bodily state", status: "checked - no relevant change", reason: "The clerk stays at the desk with the ledger in hand." },
      { dimension: "time/clocks/ongoing processes", status: "checked - no relevant change", reason: "The brief interval crosses no threshold." },
      { dimension: "facts/knowledge/beliefs/secrets", status: "checked - no relevant change", reason: "No new knowledge is established." },
      { dimension: "intentions/plans/commitments/promises/open pressures", status: "checked - no relevant change", reason: "The direction to inspect remains open and unchanged." },
      { dimension: "emotions/relationships", status: "checked - no relevant change", reason: "No relational shift is stated or strongly implied." },
      { dimension: "immediate next-segment handoff", status: "changes found", reason: "The inherited handoff presupposes a beat the segment does not render." }
    ]
  };
}
