import type {
  AcceptedSegmentChangeReviewCoverageDimension,
  AcceptedSegmentChangeReviewCoverageRow
} from "@loom/core";
import { StrictMode, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";

import type {
  AcceptedSegmentChangeReviewAnalyzeResponse,
  AcceptedSegmentChangeReviewCompileResponse
} from "../api.js";
import "../styles.css";
import {
  AcceptedSegmentChangeReviewView,
  type AcceptedSegmentChangeReviewClient
} from "./AcceptedSegmentChangeReviewView.js";

type Scenario =
  | "success"
  | "empty"
  | "quarantined"
  | "stale"
  | "incompatible-model"
  | "provider"
  | "oversize";

function Harness(): React.JSX.Element {
  const [scenario, setScenario] = useState<Scenario>("success");
  const [lastNavigation, setLastNavigation] = useState("None");
  const client = useMemo<AcceptedSegmentChangeReviewClient>(() => ({
    compile: () => Promise.resolve(compileResponse()),
    analyze: () => Promise.resolve(analyzeResponse(scenario))
  }), [scenario]);

  return (
    <main>
      <section className="surface configPanel" aria-labelledby="comparison-harness-title">
        <p className="eyebrow">Non-production comparison surface</p>
        <h1 id="comparison-harness-title">Accepted-Segment Change Review Comparison Harness</h1>
        <label>
          Harness scenario
          <select aria-label="Harness scenario" value={scenario} onChange={(event) => setScenario(event.target.value as Scenario)}>
            <option value="success">Success</option>
            <option value="empty">Empty advisory</option>
            <option value="quarantined">Quarantined</option>
            <option value="stale">Stale</option>
            <option value="incompatible-model">Incompatible model</option>
            <option value="provider">Provider error</option>
            <option value="oversize">Oversize</option>
          </select>
        </label>
        <p>Last navigation: <output>{lastNavigation}</output></p>
      </section>
      <AcceptedSegmentChangeReviewView
        client={client}
        onNavigate={(target) => setLastNavigation(target)}
      />
    </main>
  );
}

function compileResponse(): Extract<AcceptedSegmentChangeReviewCompileResponse, { ok: true }> {
  return {
    ok: true,
    prompt: "Complete prompt source for the comparison harness. No project data or credential is present.",
    disclosure: {
      acceptedSegmentId: "synthetic-segment-7",
      acceptedSegmentSequence: 7,
      acceptedSegmentAcceptedAt: "2026-07-21T00:00:00.000Z",
      sourceProfile: "accepted-segment-change-review",
      recordScope: "active_working_set",
      fullRecordCount: 2,
      countsByType: { FACT: 1, SECRET: 1 },
      includesSecrets: true,
      promptLength: 86,
      tokenEstimate: 22,
      versions: { template: "1.0.0", compiler: "1.0.0", contract: "1.0.0" },
      fingerprint: "fnv1a32:13500007",
      citationMap: {
        "[SEG-7-S001]": "synthetic-segment-7:0-86",
        "[FACT-1]": "synthetic-record-fact-1",
        "[BRIEF:current_authoritative_state.current_location]": "current_authoritative_state.current_location"
      }
    },
    citations: {
      "[SEG-7-S001]": "synthetic-segment-7:0-86",
      "[FACT-1]": "synthetic-record-fact-1",
      "[BRIEF:current_authoritative_state.current_location]": "current_authoritative_state.current_location"
    },
    outputSchema: {},
    consumedGuidance: [
      { id: "manual_moment_directive.must_render[]:0", fieldPath: "manual_moment_directive.must_render[]", value: "Keep Mara guarded." },
      { id: "stop_guidance.soft_unit_guidance:0", fieldPath: "stop_guidance.soft_unit_guidance", value: "Stop after the reply." }
    ]
  };
}

function analyzeResponse(scenario: Scenario): AcceptedSegmentChangeReviewAnalyzeResponse {
  if (scenario === "stale") {
    return { ok: false, kind: "accepted-segment-change-review-source-changed", message: "Compile and inspect again before Analyze." };
  }
  if (scenario === "incompatible-model") {
    return {
      ok: false,
      category: "structured-output-incompatible-model",
      message: "The selected model does not support the strict structured-output request this workflow requires.",
      recovery:
        "Select a model that advertises strict structured output, then inspect the recompiled source before Analyze. No request was sent. No retry is automatic."
    };
  }
  if (scenario === "provider") {
    return { ok: false, category: "provider-unavailable", message: "The synthetic provider is unavailable." };
  }
  if (scenario === "oversize") {
    return { ok: false, kind: "accepted-segment-change-review-prompt-too-large", message: "The complete synthetic source is too large." };
  }
  if (scenario === "quarantined") {
    return {
      ok: true,
      quarantined: true,
      reasonCode: "schema-mismatch",
      summary: "The synthetic response omitted a required field.",
      recovery: "inspect-source-and-response",
      metadata: metadata()
    };
  }
  return {
    ok: true,
    review: {
      contract: "accepted_segment_change_review.v1",
      items: scenario === "empty" ? [] : [{
        id: "ITEM-001",
        changeStatement: "Mara found the brass key.",
        evidence: ["[SEG-7-S001]"],
        contrast: ["[FACT-1]", "[BRIEF:current_authoritative_state.current_location]"],
        epistemicStatus: "established change",
        retentionHorizon: "durable record candidate",
        affectedTargetHints: ["FACT", "OBJECT"],
        uncertaintyOrRivalReading: "Explicit source support: \"Mara found the brass key\". Possession is explicit; ownership remains undecided."
      }],
      coverage: coverageRows()
    },
    advisory: { verified: false, canonical: false },
    metadata: metadata()
  };
}

function metadata() {
  return {
    sourceProfile: "accepted-segment-change-review" as const,
    acceptedSegmentId: "synthetic-segment-7",
    acceptedSegmentSequence: 7,
    recordScope: "active_working_set" as const,
    versions: { template: "1.0.0", compiler: "1.0.0", contract: "1.0.0" },
    fingerprint: "fnv1a32:13500007",
    model: "synthetic/harness",
    provider: "openrouter" as const
  };
}

function coverageRows(): AcceptedSegmentChangeReviewCoverageRow[] {
  const dimensions: readonly AcceptedSegmentChangeReviewCoverageDimension[] = [
    "spatial/material/bodily state",
    "time/clocks/ongoing processes",
    "facts/knowledge/beliefs/secrets",
    "intentions/plans/commitments/promises/open pressures",
    "emotions/relationships",
    "immediate next-segment handoff"
  ];
  return dimensions.map((dimension, index) => ({
    dimension,
    status: index === 0 ? "changes found" : "checked - no relevant change",
    reason: index === 0 ? "The synthetic key changed custody." : "The synthetic dimension was checked."
  }));
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MemoryRouter>
      <Harness />
    </MemoryRouter>
  </StrictMode>
);
