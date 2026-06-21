// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  recordHygieneAnalyze,
  recordHygieneCompile
} from "../api.js";
import { RecordHygieneView } from "./RecordHygieneView.js";

vi.mock("../api.js", () => ({
  recordHygieneAnalyze: vi.fn(),
  recordHygieneCompile: vi.fn()
}));

let clipboardWriteText: ReturnType<typeof vi.fn>;

beforeEach(() => {
  sessionStorage.clear();
  localStorage.clear();
  vi.mocked(recordHygieneAnalyze).mockReset();
  vi.mocked(recordHygieneCompile).mockReset();
  vi.mocked(recordHygieneCompile).mockResolvedValue(compileResponse());
  clipboardWriteText = vi.fn();
  Object.assign(navigator, {
    clipboard: {
      writeText: clipboardWriteText
    }
  });
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("RecordHygieneView", () => {
  it("renders local prompt inspection, source disclosure, and copy without credentials", async () => {
    renderRecordHygiene();

    expect(await screen.findByRole("heading", { name: "Record Hygiene" })).toBeTruthy();
    expect(screen.getByText("AI-suggested review scratch - not story state.")).toBeTruthy();
    expect(screen.getByText(/Full active atomic story-record review/)).toBeTruthy();
    expect(screen.getByText(/ENTITY payloads/)).toBeTruthy();
    expect(screen.getByText(/accepted prose/)).toBeTruthy();
    expect(screen.getAllByText("2").length).toBeGreaterThanOrEqual(2);
    expect((await screen.findByTestId("prompt-body")).textContent).toContain("# Story-Record Hygiene Prompt");

    fireEvent.click(screen.getByRole("button", { name: "Copy prompt" }));

    expect(clipboardWriteText).toHaveBeenCalledWith("# Story-Record Hygiene Prompt\nFACT payload");
    expect(recordHygieneAnalyze).not.toHaveBeenCalled();
  });

  it("requires explicit send confirmation, renders findings, and navigates citations to record ids", async () => {
    vi.mocked(recordHygieneAnalyze).mockResolvedValue({
      ok: true,
      findings: [
        findingFixture({ action: "KEEP_DISTINCT", cluster: "locked-door legitimate near match" }),
        findingFixture({ number: 2, action: "REMOVE", cluster: "obsolete duplicate", citations: ["[FACT-1]", "[FACT-2]"] }),
        findingFixture({ number: 3, action: "HUMAN_REVIEW", cluster: "uncertain overlap", citations: ["[FACT-1]", "[FACT-2]"] })
      ],
      metadata: analyzeMetadata()
    });

    renderRecordHygiene();

    const analyzeButton = await screen.findByRole<HTMLButtonElement>("button", { name: "Analyze with OpenRouter" });
    expect(analyzeButton.disabled).toBe(true);
    expect(screen.getByText(/including hidden SECRET content/)).toBeTruthy();

    fireEvent.click(screen.getByLabelText("Confirm this one-time send"));
    expect(analyzeButton.disabled).toBe(false);
    fireEvent.click(analyzeButton);

    expect(await screen.findByText("Protective action: KEEP_DISTINCT")).toBeTruthy();
    expect(screen.getByText("High caution action: REMOVE")).toBeTruthy();
    expect(screen.getByText("Review required action: HUMAN_REVIEW")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /apply/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /merge/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /delete/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /archive/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /working set/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /generation brief/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /use as prose/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /accept/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /fix all/i })).toBeNull();

    fireEvent.click(screen.getAllByRole("button", { name: "[FACT-1]" })[0]!);

    await waitFor(() => expect(screen.getByTestId("location").textContent).toBe("/records?recordId=fact-a"));
  });

  it("keeps findings in session scratch and clear removes session residue", async () => {
    vi.mocked(recordHygieneAnalyze).mockResolvedValue({
      ok: true,
      findings: [findingFixture({ cluster: "locked-door duplicate" })],
      metadata: analyzeMetadata()
    });

    const { unmount } = renderRecordHygiene();

    await analyzeOnce();
    fireEvent.click(await screen.findByRole("button", { name: "Keep" }));

    expect(screen.getByRole("button", { name: "Kept" })).toBeTruthy();
    expect(sessionStorage.getItem("loom.record-hygiene.keepers.v1")).toContain("locked-door duplicate");

    unmount();
    renderRecordHygiene();

    expect(await screen.findByText("locked-door duplicate")).toBeTruthy();

    await analyzeOnce();
    fireEvent.click(await screen.findByRole("button", { name: "Clear" }));

    expect(screen.getByText("No findings yet.")).toBeTruthy();
    expect(screen.getByText("No keepers yet.")).toBeTruthy();
    expect(sessionStorage.getItem("loom.record-hygiene.keepers.v1")).toBeNull();
    expect(localStorage.length).toBe(0);
  });

  it("labels malformed output as non-canonical scratch and makes it copyable", async () => {
    vi.mocked(recordHygieneAnalyze).mockResolvedValue({
      ok: true,
      malformed: true,
      raw: "freeform answer",
      metadata: analyzeMetadata()
    });

    renderRecordHygiene();

    await analyzeOnce();

    expect(await screen.findByText(/Non-canonical raw output/)).toBeTruthy();
    expect(screen.getByText("freeform answer")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Copy raw output" }));

    expect(clipboardWriteText).toHaveBeenCalledWith("freeform answer");
  });
});

async function analyzeOnce(): Promise<void> {
  fireEvent.click(await screen.findByLabelText("Confirm this one-time send"));
  fireEvent.click(screen.getByRole("button", { name: "Analyze with OpenRouter" }));
}

function renderRecordHygiene() {
  return render(
    <MemoryRouter initialEntries={["/record-hygiene"]}>
      <RecordHygieneView />
      <LocationProbe />
    </MemoryRouter>
  );
}

function LocationProbe(): React.JSX.Element {
  const location = useLocation();
  return <span data-testid="location">{`${location.pathname}${location.search}`}</span>;
}

function compileResponse() {
  return {
    ok: true as const,
    prompt: "# Story-Record Hygiene Prompt\nFACT payload",
    metadata: {
      versions: {
        template: "template-hygiene",
        compiler: "compiler-1",
        contract: "contract-1"
      },
      fingerprint: "fingerprint-1",
      lengthEstimate: 42,
      tokenEstimate: 11,
      recordCount: 2,
      countsByType: {
        FACT: 2,
        SECRET: 0
      }
    },
    citations: {
      "[FACT-1]": "fact-a",
      "[FACT-2]": "fact-b"
    }
  };
}

function findingFixture(overrides: Partial<ReturnType<typeof baseFinding>> = {}) {
  return {
    ...baseFinding(),
    ...overrides
  };
}

function baseFinding() {
  return {
    number: 1,
    cluster: "locked-door duplicate",
    relation: "NEAR_DUPLICATE",
    action: "REWORD",
    citations: ["[FACT-1]", "[FACT-2]"],
    sharedCore: "The cellar door is locked.",
    materialDifferences: "One record adds the attempted test.",
    whyItMatters: "The overlap adds prompt noise.",
    manualRecommendation: "Make one fact more specific.",
    survivor: null,
    referenceCaution: "Check references first.",
    confidence: "high"
  };
}

function analyzeMetadata() {
  return {
    model: "openai/gpt-4.1",
    provider: "openrouter" as const,
    temperature: 0.4,
    maxOutputTokens: 2200,
    versions: {
      template: "template-hygiene",
      compiler: "compiler-1",
      contract: "contract-1"
    },
    fingerprint: "fingerprint-1",
    lengthEstimate: 42,
    tokenEstimate: 11,
    recordCount: 2,
    countsByType: { FACT: 2 }
  };
}
