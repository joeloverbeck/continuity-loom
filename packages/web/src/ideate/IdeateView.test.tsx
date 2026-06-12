// @vitest-environment jsdom

import type { CompileResult, GenerationReadiness, ReadinessDiagnostic } from "@loom/core";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  compileIdeation,
  ideate,
  readiness
} from "../api.js";
import { IdeateView } from "./IdeateView.js";

vi.mock("../api.js", () => ({
  compileIdeation: vi.fn(),
  ideate: vi.fn(),
  readiness: vi.fn()
}));

beforeEach(() => {
  sessionStorage.clear();
  localStorage.clear();
  vi.mocked(compileIdeation).mockReset();
  vi.mocked(ideate).mockReset();
  vi.mocked(readiness).mockReset();
  vi.mocked(compileIdeation).mockResolvedValue(compileResult("# Grounded Ideation Prompt\n<ideation_slots>"));
  vi.mocked(readiness).mockResolvedValue(readinessFixture({}));
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("IdeateView", () => {
  it("shows the compiled ideation prompt before sending and keeps output quarantined", async () => {
    renderIdeate();

    expect(await screen.findByRole("heading", { name: "Ideate" })).toBeTruthy();
    expect((await screen.findByTestId("prompt-body")).textContent).toContain("# Grounded Ideation Prompt");
    expect(screen.getByText("template-ideation")).toBeTruthy();
    expect(screen.getAllByText("AI-suggested scratch - not story state.")).toHaveLength(2);
    expect(screen.getByText("No ideas yet.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /insert/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /accept/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /save/i })).toBeNull();
    expect(readiness).toHaveBeenCalledWith({ promptKind: "ideation" });
    expect(compileIdeation).toHaveBeenCalledWith({
      mode: "ideas",
      count: 5,
      dormantSlot: true,
      avoidList: []
    });
  });

  it("renders relaxed readiness warnings without disabling ideation", async () => {
    vi.mocked(readiness).mockResolvedValue(readinessFixture({
      warnings: [readinessDiagnostic({
        severity: "warning",
        code: "missing-manual-directive",
        legacyCode: "missing-manual-directive",
        title: "Manual directive is optional for ideation",
        group: "recommended-for-stronger-output"
      })]
    }));

    renderIdeate();

    expect(await screen.findByRole("heading", { name: "Manual directive is optional for ideation" })).toBeTruthy();
    expect(screen.getByRole<HTMLButtonElement>("button", { name: "Get ideas" }).disabled).toBe(false);
  });

  it("requests ideas and renders parsed scratch without durable insertion controls", async () => {
    vi.mocked(ideate).mockResolvedValue({
      ok: true,
      ideas: [{
        slotNumber: 1,
        operator: "Reveal",
        headline: "The sealed letter changes hands.",
        why: "The secret and handoff pressure support it.",
        grounds: ["[SECRET: Letter]"],
        unknownCitations: []
      }],
      metadata: generationMetadata()
    });

    renderIdeate();

    expect(await screen.findByTestId("prompt-body")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Get ideas" }));

    expect(await screen.findByRole("heading", { name: "The sealed letter changes hands." })).toBeTruthy();
    expect(screen.getByText("[SECRET: Letter]")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /insert/i })).toBeNull();
    expect(ideate).toHaveBeenCalledWith({
      mode: "ideas",
      count: 5,
      dormantSlot: true,
      avoidList: []
    });
  });

  it("sends current slate headlines as an avoid-list for per-slot regenerate", async () => {
    vi.mocked(ideate)
      .mockResolvedValueOnce({
        ok: true,
        ideas: [ideaFixture({ slotNumber: 1, headline: "The sealed letter changes hands." })],
        metadata: generationMetadata()
      })
      .mockResolvedValueOnce({
        ok: true,
        ideas: [ideaFixture({ slotNumber: 1, headline: "The latch interrupts the argument." })],
        metadata: generationMetadata()
      });

    renderIdeate();

    expect(await screen.findByTestId("prompt-body")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Get ideas" }));
    expect(await screen.findByRole("heading", { name: "The sealed letter changes hands." })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Regenerate slot" }));

    expect(await screen.findByRole("heading", { name: "The latch interrupts the argument." })).toBeTruthy();
    expect(ideate).toHaveBeenLastCalledWith({
      mode: "ideas",
      count: 5,
      dormantSlot: true,
      avoidList: ["The sealed letter changes hands."]
    });
  });

  it("keeps ideas in session scratch and clear-all removes slate and keepers", async () => {
    vi.mocked(ideate).mockResolvedValue({
      ok: true,
      ideas: [ideaFixture({ slotNumber: 1, headline: "The sealed letter changes hands." })],
      metadata: generationMetadata()
    });

    renderIdeate();

    expect(await screen.findByTestId("prompt-body")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Get ideas" }));
    expect(await screen.findByRole("heading", { name: "The sealed letter changes hands." })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Keep" }));

    expect(screen.getByRole("button", { name: "Kept" })).toBeTruthy();
    expect(sessionStorage.getItem("loom.ideate.keepers.v1")).toContain("The sealed letter changes hands.");

    fireEvent.click(screen.getByRole("button", { name: "Clear all" }));

    expect(screen.queryByRole("heading", { name: "The sealed letter changes hands." })).toBeNull();
    expect(screen.getByText("No ideas yet.")).toBeTruthy();
    expect(screen.getByText("No keepers yet.")).toBeTruthy();
    expect(sessionStorage.getItem("loom.ideate.keepers.v1")).toBeNull();
    expect(localStorage.length).toBe(0);
  });

  it("renders malformed raw scratch instead of treating it as story state", async () => {
    vi.mocked(ideate).mockResolvedValue({
      ok: true,
      malformed: true,
      raw: "freeform answer",
      metadata: generationMetadata()
    });

    renderIdeate();

    expect(await screen.findByTestId("prompt-body")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Get ideas" }));

    expect(await screen.findByText("The response could not be parsed into idea blocks.")).toBeTruthy();
    expect(screen.getByText("freeform answer")).toBeTruthy();
    expect(screen.getAllByText("AI-suggested scratch - not story state.")).toHaveLength(2);
  });
});

function renderIdeate() {
  return render(
    <MemoryRouter>
      <IdeateView />
    </MemoryRouter>
  );
}

function compileResult(prompt: string): CompileResult {
  return {
    prompt,
    metadata: {
      versions: {
        template: "template-ideation",
        compiler: "compiler-1",
        contract: "contract-1"
      },
      fingerprint: "fingerprint-1",
      lengthEstimate: prompt.length,
      tokenEstimate: 7
    }
  };
}

function generationMetadata() {
  return {
    model: "openai/gpt-4.1",
    provider: "openrouter" as const,
    temperature: 0.4,
    maxOutputTokens: 2200,
    versions: {
      template: "template-ideation",
      compiler: "compiler-1",
      contract: "contract-1"
    }
  };
}

function ideaFixture(input: { slotNumber: number; headline: string }) {
  return {
    slotNumber: input.slotNumber,
    operator: "Reveal",
    headline: input.headline,
    why: "The secret and handoff pressure support it.",
    grounds: ["[SECRET: Letter]"],
    unknownCitations: []
  };
}

function readinessFixture(input: {
  blockers?: readonly ReadinessDiagnostic[];
  warnings?: readonly ReadinessDiagnostic[];
  providerConfigured?: boolean;
  providerBlockers?: readonly ReadinessDiagnostic[];
}): GenerationReadiness {
  const blockers = input.blockers ?? [];
  const warnings = input.warnings ?? [];
  const providerConfigured = input.providerConfigured ?? true;
  const providerBlockers = input.providerBlockers ?? [];

  return {
    status: blockers.length > 0 ? "blocked" : warnings.length > 0 ? "ready-with-warnings" : "ready",
    canSaveDraft: true,
    canPreview: blockers.length === 0,
    canGenerate: blockers.length === 0 && providerBlockers.length === 0,
    blockers,
    warnings,
    provider: { configured: providerConfigured, blockers: providerBlockers },
    unsavedDraft: { hasUnsavedChanges: false, readinessMayBeStale: false },
    summary: blockers.length > 0 || providerBlockers.length > 0
      ? { headline: "Ideate is blocked", nextAction: "Fix blockers." }
      : warnings.length > 0
        ? { headline: "Ready with recommendations", nextAction: "Review warnings if useful." }
        : { headline: "Ready to ideate", nextAction: "Prompt inspection and Ideate are available." }
  };
}

function readinessDiagnostic(input: {
  severity: "blocker" | "warning";
  code: string;
  legacyCode: string;
  title: string;
  group: ReadinessDiagnostic["group"];
}): ReadinessDiagnostic {
  return {
    severity: input.severity,
    code: input.code,
    title: input.title,
    group: input.group,
    summary: `${input.title} summary.`,
    whyItMatters: `${input.title} matters.`,
    fastestFix: `${input.title} fastest fix.`,
    affected: [],
    actions: [{ kind: "copy-technical-json", label: "Copy technical JSON" }],
    dedupeKey: `${input.severity}:${input.code}`,
    sortKey: `${input.severity}:${input.code}`,
    technical: {
      legacyCode: input.legacyCode,
      ruleId: input.legacyCode,
      rawPaths: []
    }
  };
}
