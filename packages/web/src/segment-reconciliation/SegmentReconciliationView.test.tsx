// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  getProject,
  segmentReconciliationAnalyze,
  segmentReconciliationCompile,
  type SegmentReconciliationAnalyzeResponse,
  type SegmentReconciliationCompileResponse
} from "../api.js";
import { SegmentReconciliationView } from "./SegmentReconciliationView.js";

vi.mock("../api.js", () => ({
  getProject: vi.fn(),
  segmentReconciliationAnalyze: vi.fn(),
  segmentReconciliationCompile: vi.fn()
}));

const projectStatus = {
  folderPath: "/tmp/loom/segment-reconciliation",
  title: "Segment Reconciliation",
  projectUuid: "018f9c47-81f1-7cc0-9559-6bb9865ee7d9",
  databaseFilename: "loom.sqlite",
  appSchemaVersion: 1,
  storeUserVersion: 1,
  compatibility: "ok" as const
};

beforeEach(() => {
  vi.mocked(getProject).mockResolvedValue(projectStatus);
  vi.mocked(segmentReconciliationCompile).mockResolvedValue(compileResponse("fingerprint-a"));
  vi.mocked(segmentReconciliationAnalyze).mockResolvedValue(analyzeResponse("fingerprint-a"));
  Object.assign(navigator, {
    clipboard: { writeText: vi.fn() }
  });
});

afterEach(() => {
  cleanup();
  sessionStorage.clear();
  vi.clearAllMocks();
});

describe("SegmentReconciliationView", () => {
  it("discloses the source, shows the prompt inspector, and requires one-time confirmation before send", async () => {
    renderView();

    expect(await screen.findByRole("heading", { name: "Segment Reconciliation" })).toBeTruthy();
    expect(await screen.findByRole("heading", { name: "Source Disclosure" })).toBeTruthy();
    expect(screen.getByText(/Latest accepted segment 1, 1 span/)).toBeTruthy();
    expect(screen.getByText(/Secret exposure warning/i)).toBeTruthy();
    expect(screen.getByLabelText("Search within prompt")).toBeTruthy();
    expect(screen.getByTestId("prompt-body").textContent).toContain(
      'catalog "segment_reconciliation.schema_catalog.v1"'
    );
    const metadata = within(screen.getByLabelText("Prompt metadata"));
    expect(metadata.getByText("1.9.0")).toBeTruthy();
    expect(metadata.getByText("1.11.0")).toBeTruthy();
    expect(metadata.getByText("1.12.0")).toBeTruthy();

    const send = screen.getByRole("button", { name: "Analyze with OpenRouter" });
    expect(send).toHaveProperty("disabled", true);
    fireEvent.click(screen.getByLabelText("Confirm this one-time send"));
    fireEvent.click(send);

    await waitFor(() => expect(segmentReconciliationAnalyze).toHaveBeenCalledWith({
      segmentSelection: "latest",
      recordScope: "active_working_set",
      expectedPromptFingerprint: "fingerprint-a"
    }));
  });

  it("renders grouped suggestion-only cards with navigation, copy, and keeper controls only", async () => {
    renderView();

    fireEvent.click(await screen.findByLabelText("Confirm this one-time send"));
    fireEvent.click(screen.getByRole("button", { name: "Analyze with OpenRouter" }));

    expect(await screen.findByRole("heading", { name: "Generation Brief" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Existing Records" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "New Records" })).toBeTruthy();
    expect(screen.getAllByText("Suggestion only")).toHaveLength(3);
    expect(screen.getByRole("button", { name: "Open Generation Brief" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Open record" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Open blank typed editor" })).toBeTruthy();
    expect(screen.getAllByRole("button", { name: "Copy proposal" })).toHaveLength(3);
    expect(screen.getAllByRole("button", { name: "Keep" })).toHaveLength(3);

    for (const forbidden of ["Apply", "Prefill", "Create", "Deactivate", "Archive", "Merge", "Remove", "Add to working set", "Use as prose"]) {
      expect(screen.queryByRole("button", { name: forbidden })).toBeNull();
    }
  });

  it("quarantines malformed output and clears scratch without parsed cards", async () => {
    vi.mocked(segmentReconciliationAnalyze).mockResolvedValue({
      ok: true,
      malformed: true,
      reasonCode: "schema-mismatch",
      summary: "Missing proposal arrays.",
      raw: "raw malformed output",
      metadata: analyzeMetadata("fingerprint-a")
    });
    renderView();

    fireEvent.click(await screen.findByLabelText("Confirm this one-time send"));
    fireEvent.click(screen.getByRole("button", { name: "Analyze with OpenRouter" }));

    expect(await screen.findByText("Malformed segment reconciliation output: schema-mismatch")).toBeTruthy();
    expect(screen.getByText("Missing proposal arrays.")).toBeTruthy();
    expect(screen.getByText("raw malformed output")).toBeTruthy();
    expect(screen.queryByText("Suggestion only")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Clear" }));
    expect(screen.queryByText("raw malformed output")).toBeNull();
    expect(screen.getByText("No proposals yet.")).toBeTruthy();
  });

  it("shows stale-prompt invalidation from analyze and serializes changed scope requests", async () => {
    vi.mocked(segmentReconciliationAnalyze).mockResolvedValue({
      ok: false,
      kind: "reconciliation-source-changed",
      message: "Reconciliation source changed. Recompile before sending."
    });
    renderView();

    fireEvent.click(await screen.findByLabelText("Confirm this one-time send"));
    fireEvent.click(screen.getByRole("button", { name: "Analyze with OpenRouter" }));
    expect((await screen.findByRole("alert")).textContent).toBe("Reconciliation source changed. Recompile before sending.");

    fireEvent.click(screen.getByLabelText("Whole project"));
    await waitFor(() => expect(segmentReconciliationCompile).toHaveBeenLastCalledWith({
      segmentSelection: "latest",
      recordScope: "whole_project"
    }));
  });

  it("scopes keepers by project and prompt fingerprint", async () => {
    renderView();

    fireEvent.click(await screen.findByLabelText("Confirm this one-time send"));
    fireEvent.click(screen.getByRole("button", { name: "Analyze with OpenRouter" }));
    const firstKeep = await screen.findAllByRole("button", { name: "Keep" });
    const keepButton = firstKeep[0];
    if (!keepButton) {
      throw new Error("Expected at least one keep button.");
    }
    fireEvent.click(keepButton);
    expect(screen.getByRole("button", { name: "Kept" })).toBeTruthy();

    vi.mocked(segmentReconciliationCompile).mockResolvedValueOnce(compileResponse("fingerprint-b"));
    fireEvent.click(screen.getByRole("button", { name: "Refresh prompt" }));

    await waitFor(() => expect(screen.getByText("No keepers yet.")).toBeTruthy());
    expect(Object.keys(sessionStorage).some((key) => key.includes("fingerprint-a"))).toBe(true);
    expect(Object.keys(sessionStorage).some((key) => key.includes("fingerprint-b"))).toBe(false);
  });
});

function renderView() {
  return render(
    <MemoryRouter>
      <SegmentReconciliationView />
    </MemoryRouter>
  );
}

function compileResponse(fingerprint: string): SegmentReconciliationCompileResponse {
  const prompt = `PROMPT_BODY ${fingerprint}\ncatalog "segment_reconciliation.schema_catalog.v1" contract="1.12.0"`;
  return {
    ok: true,
    prompt,
    metadata: {
      versions: { template: "1.9.0", compiler: "1.11.0", contract: "1.12.0" },
      fingerprint,
      lengthEstimate: prompt.length,
      tokenEstimate: Math.ceil(prompt.length / 4),
      recordCount: 2,
      countsByType: { FACT: 1, SECRET: 1 },
      citationMap: { "[SEG-1-S001]": "1:0-12", "[FACT-1]": "fact-1" }
    },
    citations: { "[SEG-1-S001]": "1:0-12", "[FACT-1]": "fact-1" },
    disclosure: {
      sourceProfile: "segment-reconciliation",
      acceptedSegment: {
        id: "1",
        sequence: 1,
        acceptedAt: "2026-06-24T12:00:00.000Z",
        spanCount: 1
      },
      recordScope: "active_working_set",
      recordCount: 2,
      referenceStubCount: 1,
      briefFieldCount: 19
    },
    outputSchema: { type: "object" },
    source: {
      segmentSelection: "latest",
      recordScope: "active_working_set",
      acceptedSegmentId: "1",
      acceptedSegmentSequence: 1,
      acceptedSegmentAcceptedAt: "2026-06-24T12:00:00.000Z"
    }
  };
}

function analyzeResponse(fingerprint: string): SegmentReconciliationAnalyzeResponse {
  return {
    ok: true,
    proposals: {
      contract: "segment_reconciliation.v1",
      source: {
        profile: "segment-reconciliation",
        accepted_segment_id: "1",
        accepted_segment_sequence: 1,
        record_scope: "active_working_set",
        prompt_fingerprint: fingerprint
      },
      briefProposals: [
        {
          id: "BRIEF-001",
          action: "FILL",
          fieldPath: "immediate_handoff.last_visible_moment",
          proposedValue: "Mara hides the key.",
          evidence: ["[SEG-1-S001]"],
          contrast: ["[BRIEF:immediate_handoff.last_visible_moment]"],
          rationale: "The accepted segment changed the handoff."
        }
      ],
      recordChangeProposals: [
        {
          id: "RECORD-001",
          action: "UPDATE_FIELDS",
          recordId: "fact-1",
          recordKey: "[FACT-1]",
          patches: [{ op: "replace", path: "/statement", value: "Mara has the key." }],
          evidence: ["[SEG-1-S001]"],
          contrast: ["[FACT-1]"],
          rationale: "The existing fact is stale."
        }
      ],
      recordCreationProposals: [
        {
          id: "NEW-001",
          recordType: "OBJECT",
          payload: { object_name: "Brass key" },
          dependencies: [],
          evidence: ["[SEG-1-S001]"],
          contrast: ["[RECORD-SCOPE]"],
          rationale: "The object is now materially relevant."
        }
      ]
    },
    metadata: analyzeMetadata(fingerprint)
  };
}

function analyzeMetadata(fingerprint: string): SegmentReconciliationAnalyzeResponse extends infer Response
  ? Response extends { metadata: infer Metadata }
    ? Metadata
    : never
  : never {
  return {
    model: "test/model",
    provider: "openrouter",
    temperature: 0.4,
    maxOutputTokens: 1800,
    versions: { template: "1.9.0", compiler: "1.11.0", contract: "1.12.0" },
    fingerprint,
    lengthEstimate: 1200,
    tokenEstimate: 300,
    recordCount: 2,
    countsByType: { FACT: 1, SECRET: 1 },
    citationMap: { "[SEG-1-S001]": "1:0-12", "[FACT-1]": "fact-1" }
  };
}
