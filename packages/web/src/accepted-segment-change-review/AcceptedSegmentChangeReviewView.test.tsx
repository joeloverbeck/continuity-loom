// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { AcceptedSegmentChangeReviewCoverageRow } from "@loom/core";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type {
  AcceptedSegmentChangeReviewAnalyzeResponse,
  AcceptedSegmentChangeReviewCompileResponse
} from "../api.js";
import {
  AcceptedSegmentChangeReviewView,
  type AcceptedSegmentChangeReviewClient
} from "./AcceptedSegmentChangeReviewView.js";

const compileMock = vi.fn<AcceptedSegmentChangeReviewClient["compile"]>();
const analyzeMock = vi.fn<AcceptedSegmentChangeReviewClient["analyze"]>();
const navigateMock = vi.fn();
const writeTextMock = vi.fn().mockResolvedValue(undefined);
const client: AcceptedSegmentChangeReviewClient = { compile: compileMock, analyze: analyzeMock };

beforeEach(() => {
  compileMock.mockResolvedValue(compileResponse());
  analyzeMock.mockResolvedValue(successResponse());
  navigateMock.mockReset();
  writeTextMock.mockClear();
  Object.assign(navigator, { clipboard: { writeText: writeTextMock } });
});

afterEach(() => {
  cleanup();
  localStorage.clear();
  sessionStorage.clear();
  vi.clearAllMocks();
});

describe("AcceptedSegmentChangeReviewView", () => {
  it("discloses the complete source and sends only after explicit confirmation", async () => {
    renderView();

    expect(await screen.findByRole("heading", { name: "Accepted-Segment Change Review" })).toBeTruthy();
    expect(screen.getByText("Latest accepted segment 7")).toBeTruthy();
    expect(screen.getByText("Accepted 2026-07-21T00:00:00.000Z")).toBeTruthy();
    expect(screen.getByText("2 records")).toBeTruthy();
    expect(screen.getByText(/SECRET records are included/)).toBeTruthy();
    expect(screen.getByText("fnv1a32:12345678")).toBeTruthy();
    expect(screen.getByText("1.0.0 / 1.0.0 / 1.0.0")).toBeTruthy();
    expect(screen.getByText("Complete prompt source for comparison.")).toBeTruthy();
    expect(analyzeMock).not.toHaveBeenCalled();

    const analyze = screen.getByRole<HTMLButtonElement>("button", { name: "Analyze with OpenRouter" });
    expect(analyze.disabled).toBe(true);
    fireEvent.click(screen.getByLabelText("I inspected the complete source and confirm this one-time send"));
    fireEvent.click(analyze);

    await waitFor(() => expect(analyzeMock).toHaveBeenCalledWith({
      segmentSelection: "latest",
      recordScope: "active_working_set",
      expectedPromptFingerprint: "fnv1a32:12345678"
    }));
    expect(await screen.findByRole("heading", { name: "Possible change ITEM-001" })).toBeTruthy();
    expect(screen.getAllByRole("row")).toHaveLength(7);
    expect(screen.getAllByText(/Unverified, noncanonical advice/)).toHaveLength(2);
  });

  it("keeps all card actions in component memory and provides navigation instead of mutation", async () => {
    const { unmount } = renderView();
    await analyze();

    fireEvent.click(screen.getByRole("button", { name: "Keep ITEM-001" }));
    fireEvent.click(screen.getByRole("button", { name: "Mark ITEM-001 reviewed" }));
    fireEvent.click(screen.getByRole("button", { name: "Copy ITEM-001" }));
    fireEvent.click(screen.getByRole("button", { name: "Open evidence [SEG-7-S001] for ITEM-001" }));
    fireEvent.click(screen.getByRole("button", { name: "Open contrast [FACT-1] for ITEM-001" }));
    fireEvent.click(screen.getByRole("button", { name: "Open contrast [BRIEF:current_authoritative_state.current_location] for ITEM-001" }));

    expect(screen.getByText("Kept for this session")).toBeTruthy();
    expect(screen.getByText("Reviewed for this session")).toBeTruthy();
    expect(writeTextMock).toHaveBeenCalledTimes(1);
    expect(navigateMock).toHaveBeenCalledWith("/accepted-segments#segment-7");
    expect(navigateMock).toHaveBeenCalledWith("/records?recordId=record-fact-1");
    expect(navigateMock).toHaveBeenCalledWith("/generation-brief?field=current_authoritative_state.current_location");
    expect(Object.keys(localStorage)).toHaveLength(0);
    expect(Object.keys(sessionStorage)).toHaveLength(0);

    for (const forbidden of ["Apply", "Prefill", "Patch", "Create", "Archive", "Merge", "Use as prose", "Generate prose"]) {
      expect(screen.queryByRole("button", { name: forbidden })).toBeNull();
    }

    unmount();
    renderView();
    expect(await screen.findByRole("heading", { name: "Accepted-Segment Change Review" })).toBeTruthy();
    expect(screen.queryByText("Kept for this session")).toBeNull();
    expect(screen.queryByText("Reviewed for this session")).toBeNull();
  });

  it("keeps the inspected scope immutable while Analyze is in flight", async () => {
    let resolveAnalysis: ((response: AcceptedSegmentChangeReviewAnalyzeResponse) => void) | undefined;
    analyzeMock.mockImplementation(() => new Promise((resolve) => {
      resolveAnalysis = resolve;
    }));
    renderView();
    await analyze();

    const wholeProject = screen.getByRole<HTMLInputElement>("radio", { name: "Whole Project" });
    expect(wholeProject.disabled).toBe(true);
    const wholeProjectCompile = compileResponse();
    compileMock.mockResolvedValue({
      ...wholeProjectCompile,
      disclosure: {
        ...wholeProjectCompile.disclosure,
        recordScope: "whole_project",
        fingerprint: "fnv1a32:87654321"
      }
    });
    fireEvent.click(wholeProject);
    expect(analyzeMock).toHaveBeenCalledWith({
      segmentSelection: "latest",
      recordScope: "active_working_set",
      expectedPromptFingerprint: "fnv1a32:12345678"
    });
    expect(await screen.findByText("fnv1a32:87654321")).toBeTruthy();

    resolveAnalysis?.(successResponse());
    await waitFor(() => expect(screen.queryByRole("heading", { name: "Possible change ITEM-001" })).toBeNull());
    expect(screen.getByText("No review output yet.")).toBeTruthy();
  });

  it("explains canonical retention destinations without treating every segment as an EVENT", async () => {
    renderView();
    await analyze();

    expect(screen.getByText(/EVENT only when the change is independently reusable as an event/i)).toBeTruthy();
    expect(screen.getByText(/FACT for independently reusable truth/i)).toBeTruthy();
    expect(screen.getByText(/typed current-state or pressure record/i)).toBeTruthy();
    expect(screen.getByText(/immediate handoff belongs only in the next Generation Brief/i)).toBeTruthy();
    expect(screen.getByText(/incidental texture needs no storage/i)).toBeTruthy();
    expect(screen.getByText(/Do not create an EVENT for every accepted segment/i)).toBeTruthy();
  });

  it("hands only explicitly selected consumed guidance to the existing Generation Brief editor", async () => {
    renderView();
    await screen.findByRole("heading", { name: "Consumed guidance check" });

    const handoff = screen.getByRole<HTMLButtonElement>("button", { name: "Open Generation Brief with selected removals" });
    expect(handoff.disabled).toBe(true);
    const checks = screen.getAllByRole("checkbox", { name: /Consumed guidance:/ });
    expect(checks).toHaveLength(2);
    expect(checks.every((check) => !(check as HTMLInputElement).checked)).toBe(true);
    fireEvent.click(checks[1]!);
    fireEvent.click(handoff);

    expect(navigateMock).toHaveBeenCalledWith("/generation-brief", {
      state: { acceptedSegmentChangeReviewConsumedGuidanceIds: ["stop_guidance.soft_unit_guidance:0"] }
    });
  });

  it.each([
    ["empty", emptyResponse(), "Unverified no-change result", "No change items were returned"],
    ["quarantined", quarantineResponse(), "Quarantined response", "schema-mismatch"],
    ["stale", staleResponse(), "Source changed", "Compile and inspect again"],
    ["provider", providerResponse(), "OpenRouter request failed", "No retry is automatic"],
    ["oversize", oversizeResponse(), "Complete source is too large", "Choose Whole Project only when needed"],
    ["local request", localRequestResponse(), "Local request failed", "Inspect local project state"]
  ] as const)("renders the %s state with distinct manual recovery", async (_label, response, heading, detail) => {
    analyzeMock.mockResolvedValue(response);
    renderView();
    await analyze();

    expect(await screen.findByRole("heading", { name: heading })).toBeTruthy();
    expect(screen.getByText(new RegExp(detail, "i"))).toBeTruthy();
    expect(analyzeMock).toHaveBeenCalledTimes(1);
  });

  it("clears all review scratch without another provider call", async () => {
    renderView();
    await analyze();
    fireEvent.click(screen.getByRole("button", { name: "Keep ITEM-001" }));
    fireEvent.click(screen.getByRole("button", { name: "Clear review scratch" }));

    expect(screen.getByText("No review output yet.")).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Possible change ITEM-001" })).toBeNull();
    expect(analyzeMock).toHaveBeenCalledTimes(1);
  });
});

function renderView() {
  return render(
    <MemoryRouter>
      <AcceptedSegmentChangeReviewView client={client} onNavigate={navigateMock} />
    </MemoryRouter>
  );
}

async function analyze(): Promise<void> {
  fireEvent.click(await screen.findByLabelText("I inspected the complete source and confirm this one-time send"));
  fireEvent.click(screen.getByRole("button", { name: "Analyze with OpenRouter" }));
  await waitFor(() => expect(analyzeMock).toHaveBeenCalledTimes(1));
}

type CompileSuccess = Extract<AcceptedSegmentChangeReviewCompileResponse, { ok: true }>;
type AnalyzeSuccess = Extract<AcceptedSegmentChangeReviewAnalyzeResponse, { ok: true; review: unknown }>;

function compileResponse(): CompileSuccess {
  return {
    ok: true as const,
    prompt: "Complete prompt source for comparison.",
    disclosure: {
      acceptedSegmentId: "7",
      acceptedSegmentSequence: 7,
      acceptedSegmentAcceptedAt: "2026-07-21T00:00:00.000Z",
      sourceProfile: "accepted-segment-change-review" as const,
      recordScope: "active_working_set" as const,
      fullRecordCount: 2,
      countsByType: { FACT: 1, SECRET: 1 },
      includesSecrets: true,
      promptLength: 38,
      tokenEstimate: 10,
      versions: { template: "1.0.0", compiler: "1.0.0", contract: "1.0.0" },
      fingerprint: "fnv1a32:12345678",
      citationMap: {
        "[SEG-7-S001]": "7:0-38",
        "[FACT-1]": "record-fact-1",
        "[BRIEF:current_authoritative_state.current_location]": "current_authoritative_state.current_location"
      }
    },
    citations: {
      "[SEG-7-S001]": "7:0-38",
      "[FACT-1]": "record-fact-1",
      "[BRIEF:current_authoritative_state.current_location]": "current_authoritative_state.current_location"
    },
    outputSchema: {},
    consumedGuidance: [
      { id: "manual_moment_directive.must_render[]:0", fieldPath: "manual_moment_directive.must_render[]", value: "Open the door." },
      { id: "stop_guidance.soft_unit_guidance:0", fieldPath: "stop_guidance.soft_unit_guidance", value: "Stop after the reply." }
    ]
  };
}

function successResponse(): AnalyzeSuccess {
  return {
    ok: true as const,
    review: {
      contract: "accepted_segment_change_review.v1" as const,
      items: [{
        id: "ITEM-001",
        changeStatement: "Mara found the brass key.",
        evidence: ["[SEG-7-S001]"],
        contrast: ["[FACT-1]", "[BRIEF:current_authoritative_state.current_location]"],
        epistemicStatus: "established change" as const,
        retentionHorizon: "durable record candidate" as const,
        affectedTargetHints: ["FACT", "OBJECT"],
        uncertaintyOrRivalReading: "Possession is explicit; ownership remains undecided."
      }],
      coverage: coverageRows()
    },
    advisory: { verified: false as const, canonical: false as const },
    metadata: {
      sourceProfile: "accepted-segment-change-review" as const,
      acceptedSegmentId: "7",
      acceptedSegmentSequence: 7,
      recordScope: "active_working_set" as const,
      versions: { template: "1.0.0", compiler: "1.0.0", contract: "1.0.0" },
      fingerprint: "fnv1a32:12345678",
      model: "test/model",
      provider: "openrouter" as const
    }
  };
}

function emptyResponse(): AnalyzeSuccess {
  return { ...successResponse(), review: { ...successResponse().review, items: [] } };
}

function quarantineResponse(): AcceptedSegmentChangeReviewAnalyzeResponse {
  return {
    ok: true as const,
    quarantined: true as const,
    reasonCode: "schema-mismatch",
    summary: "The complete response was malformed.",
    recovery: "inspect-source-and-response" as const,
    metadata: successResponse().metadata
  };
}

function staleResponse(): AcceptedSegmentChangeReviewAnalyzeResponse {
  return {
    ok: false as const,
    kind: "accepted-segment-change-review-source-changed",
    message: "Compile and inspect again before Analyze."
  };
}

function providerResponse(): AcceptedSegmentChangeReviewAnalyzeResponse {
  return {
    ok: false as const,
    category: "provider-unavailable" as const,
    message: "OpenRouter request failed."
  };
}

function oversizeResponse(): AcceptedSegmentChangeReviewAnalyzeResponse {
  return {
    ok: false as const,
    kind: "accepted-segment-change-review-prompt-too-large",
    message: "Complete source is too large. Choose Whole Project only when needed."
  };
}

function localRequestResponse(): AcceptedSegmentChangeReviewAnalyzeResponse {
  return {
    ok: false as const,
    kind: "no-open-project",
    message: "No project is open."
  };
}

function coverageRows(): AcceptedSegmentChangeReviewCoverageRow[] {
  const dimensions = [
    "spatial/material/bodily state",
    "time/clocks/ongoing processes",
    "facts/knowledge/beliefs/secrets",
    "intentions/plans/commitments/promises/open pressures",
    "emotions/relationships",
    "immediate next-segment handoff"
  ] as const;
  return dimensions.map((dimension, index) => ({
    dimension,
    status: index === 0 ? "changes found" as const : "checked - no relevant change" as const,
    reason: index === 0 ? "The key changed custody." : "Checked without another relevant change."
  }));
}
