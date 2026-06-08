// @vitest-environment jsdom

import type { CompileResult, GenerationReadiness, ReadinessDiagnostic } from "@loom/core";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { compile, getGenerationBrief, listStoryConfig, readiness, setGenerationBrief } from "../api.js";
import { GenerateView } from "../generate/GenerateView.js";
import { GenerationBriefView } from "../generation-brief/GenerationBriefView.js";
import { ValidationPanel } from "../generation-brief/ValidationPanel.js";
import { PromptPreviewView } from "../preview/PromptPreviewView.js";

vi.mock("../api.js", () => ({
  acceptCandidate: vi.fn(),
  compile: vi.fn(),
  generate: vi.fn(),
  getGenerationBrief: vi.fn(),
  getDurableChangeReminder: vi.fn(),
  listStoryConfig: vi.fn(),
  readiness: vi.fn(),
  setGenerationBrief: vi.fn()
}));

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

const originalResizeObserver = globalThis.ResizeObserver;
const writeText = vi.fn();

beforeAll(() => {
  globalThis.ResizeObserver = ResizeObserverStub;
});

beforeEach(() => {
  writeText.mockReset();
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText }
  });
  vi.mocked(compile).mockResolvedValue(compileResult("<role>\nPrompt body only."));
  vi.mocked(getGenerationBrief).mockResolvedValue({
    ok: true,
    session: {},
    defaults: {
      generation_context: {
        value: "first_segment",
        source: "accepted-segment-count",
        acceptedSegmentCount: 0
      }
    }
  });
  vi.mocked(listStoryConfig).mockResolvedValue({ ok: true, configs: {} });
  vi.mocked(setGenerationBrief).mockResolvedValue({ ok: true, session: {} });
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

afterAll(() => {
  globalThis.ResizeObserver = originalResizeObserver;
});

describe("cross-page readiness behavior", () => {
  it("renders the same warning checklist on Generation Brief, Preview, and Generate without gating Preview or Generate", async () => {
    const sharedReadiness = readinessFixture({
      warnings: [castWarning()]
    });
    vi.mocked(readiness).mockResolvedValue(sharedReadiness);

    const panelText = await renderAndCollect(() => renderPanel());
    const previewText = await renderAndCollect(() => renderPreview());
    const generateText = await renderAndCollect(() => renderGenerate());

    for (const text of [panelText, previewText, generateText]) {
      expect(text).toContain("Long cast context may dilute local voice emphasis");
      expect(text).toContain("Prompt length / salience risks (1)");
      expect(text).toContain("Mara Vale");
    }

    renderPreview();
    expect(await screen.findByTestId("prompt-body")).toBeTruthy();
    expect(screen.getByTestId("prompt-body").textContent).toBe("<role>\nPrompt body only.");
    cleanup();

    renderGenerate();
    expect((await screen.findByRole<HTMLButtonElement>("button", { name: "Generate" })).disabled).toBe(false);
  });

  it("provider blockers disable Generate but not Preview", async () => {
    vi.mocked(readiness).mockResolvedValue(readinessFixture({
      providerConfigured: false,
      providerBlockers: [providerBlocker()]
    }));

    renderPreview();
    expect(await screen.findByTestId("prompt-body")).toBeTruthy();
    expect(screen.queryByText("Prompt preview is blocked.")).toBeNull();
    cleanup();

    renderGenerate();
    expect(await screen.findByTestId("prompt-body")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Configure OpenRouter before generating" })).toBeTruthy();
    expect(screen.getByRole<HTMLButtonElement>("button", { name: "Generate" }).disabled).toBe(true);
  });

  it("launch-directive blockers gate Preview and Generate but not draft Save", async () => {
    vi.mocked(readiness).mockResolvedValue(readinessFixture({
      blockers: [launchDirectiveBlocker()]
    }));

    renderBrief();
    expect(await screen.findByRole("heading", { name: "Generation Brief" })).toBeTruthy();
    expect(screen.getByRole<HTMLButtonElement>("button", { name: "Save Generation Brief" }).disabled).toBe(false);
    fireEvent.change(screen.getByLabelText(/^soft_unit_guidance/), { target: { value: "Stop." } });
    expect(screen.getByText("Displayed readiness may be stale until you save this draft.")).toBeTruthy();
    expect(screen.getByText("This draft has unsaved changes. The readiness checklist may be stale.")).toBeTruthy();
    cleanup();

    renderPreview();
    expect(await screen.findByText("Prompt preview is blocked.")).toBeTruthy();
    expect(screen.queryByTestId("prompt-body")).toBeNull();
    cleanup();

    renderGenerate();
    expect(await screen.findByText("Generate is blocked.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Generate" })).toBeNull();
  });

  it("keeps raw codes and raw record IDs out of primary labels", async () => {
    vi.mocked(readiness).mockResolvedValue(readinessFixture({
      warnings: [castWarning()]
    }));

    renderPanel();

    expect(await screen.findByRole("heading", { name: "Long cast context may dilute local voice emphasis" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "cast-salience-risk" })).toBeNull();
    expect(screen.getByText("Mara Vale")).toBeTruthy();

    const technicalDetails = screen.getAllByText("Technical details")[0]?.closest("details");
    expect(technicalDetails).toBeTruthy();
    expect(within(technicalDetails as HTMLElement).getAllByText("cast-salience-risk").length).toBeGreaterThan(0);
    expect(within(technicalDetails as HTMLElement).getByText("cast-a")).toBeTruthy();
  });

  it("keeps summary live, counts visible, technical details collapsed, and field actions keyboard reachable", async () => {
    const onFocusField = vi.fn((field: string) => {
      if (field === "generationSession.manual_moment_directive.must_render") {
        screen.getByLabelText("Launch directive").focus();
      }
    });
    vi.mocked(readiness).mockResolvedValue(readinessFixture({
      blockers: [launchDirectiveBlocker()]
    }));

    render(
      <MemoryRouter>
        <input name="generationSession.manual_moment_directive.must_render" aria-label="Launch directive" />
        <ValidationPanel validationKey={0} hasUnsavedChanges={false} onFocusField={onFocusField} />
      </MemoryRouter>
    );

    expect(await screen.findByRole("status")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Required before prompt generation (1)" })).toBeTruthy();
    const details = screen.getAllByText("Technical details")[0]?.closest("details");
    expect(details?.hasAttribute("open")).toBe(false);

    const edit = screen.getByRole("button", { name: "Edit launch directive" });
    edit.focus();
    expect(document.activeElement).toBe(edit);
    fireEvent.click(edit);

    expect(onFocusField).toHaveBeenCalledWith("generationSession.manual_moment_directive.must_render");
    expect(document.activeElement).toBe(screen.getByLabelText("Launch directive"));
  });
});

async function renderAndCollect(renderSurface: () => void): Promise<string> {
  renderSurface();
  await screen.findByRole("heading", { name: "Long cast context may dilute local voice emphasis" });
  const text = document.body.textContent ?? "";
  cleanup();
  return text;
}

function renderPanel(): void {
  render(
    <MemoryRouter>
      <ValidationPanel validationKey={0} hasUnsavedChanges={false} />
    </MemoryRouter>
  );
}

function renderPreview(): void {
  render(
    <MemoryRouter>
      <PromptPreviewView />
    </MemoryRouter>
  );
}

function renderGenerate(): void {
  render(
    <MemoryRouter>
      <GenerateView />
    </MemoryRouter>
  );
}

function renderBrief(): void {
  render(
    <MemoryRouter>
      <GenerationBriefView />
    </MemoryRouter>
  );
}

function compileResult(prompt: string): CompileResult {
  return {
    prompt,
    metadata: {
      versions: { template: "template-1", compiler: "compiler-1", contract: "contract-1" },
      fingerprint: "fingerprint-1",
      lengthEstimate: prompt.length,
      tokenEstimate: 7
    }
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
  const providerBlockers = input.providerBlockers ?? [];

  return {
    status: blockers.length > 0 ? "blocked" : warnings.length > 0 ? "ready-with-warnings" : "ready",
    canSaveDraft: true,
    canPreview: blockers.length === 0,
    canGenerate: blockers.length === 0 && providerBlockers.length === 0,
    blockers,
    warnings,
    provider: { configured: input.providerConfigured ?? true, blockers: providerBlockers },
    unsavedDraft: { hasUnsavedChanges: false, readinessMayBeStale: false },
    summary: blockers.length > 0 || providerBlockers.length > 0
      ? { headline: "Generation is blocked", nextAction: "Fix required items." }
      : warnings.length > 0
        ? { headline: "Ready with recommendations", nextAction: "Warnings do not block Preview or Generate." }
        : { headline: "Ready to generate", nextAction: "Preview and Generate are available." }
  };
}

function launchDirectiveBlocker(): ReadinessDiagnostic {
  return diagnostic({
    severity: "blocker",
    code: "missing-launch-directive",
    legacyCode: "missing-manual-directive",
    title: "Add the launch directive",
    group: "required-before-prompt-generation",
    affected: [{
      kind: "generation-field",
      fieldPath: "generationSession.manual_moment_directive.must_render",
      displayLabel: "Launch directive"
    }],
    actions: [{
      kind: "focus-field",
      label: "Edit launch directive",
      target: "generationSession.manual_moment_directive.must_render"
    }]
  });
}

function providerBlocker(): ReadinessDiagnostic {
  return diagnostic({
    severity: "blocker",
    code: "provider-configuration-missing",
    legacyCode: "provider-configuration-missing",
    title: "Configure OpenRouter before generating",
    group: "required-before-prompt-generation",
    actions: [{ kind: "open-provider-settings", label: "Open provider settings", target: "/settings" }]
  });
}

function castWarning(): ReadinessDiagnostic {
  return diagnostic({
    severity: "warning",
    code: "cast-salience-risk",
    legacyCode: "cast-salience-risk",
    title: "Long cast context may dilute local voice emphasis",
    group: "prompt-length-salience-risk",
    affected: [{ kind: "record", recordId: "cast-a", recordType: "CAST MEMBER", displayLabel: "Mara Vale" }],
    actions: [{ kind: "open-record", label: "Open Mara Vale", target: "cast-a" }]
  });
}

function diagnostic(input: {
  severity: "blocker" | "warning";
  code: string;
  legacyCode: string;
  title: string;
  group: ReadinessDiagnostic["group"];
  affected?: ReadinessDiagnostic["affected"];
  actions?: ReadinessDiagnostic["actions"];
}): ReadinessDiagnostic {
  return {
    severity: input.severity,
    code: input.code,
    title: input.title,
    group: input.group,
    summary: `${input.title} summary.`,
    whyItMatters: `${input.title} matters.`,
    fastestFix: `${input.title} fastest fix.`,
    affected: input.affected ?? [],
    actions: [
      ...(input.actions ?? []),
      { kind: "copy-technical-json", label: "Copy technical JSON" }
    ],
    dedupeKey: `${input.severity}:${input.code}`,
    sortKey: `${input.severity}:${input.code}`,
    technical: {
      legacyCode: input.legacyCode,
      ruleId: input.legacyCode,
      rawPaths: input.affected?.flatMap((target) => target.fieldPath ? [target.fieldPath] : []) ?? []
    }
  };
}
