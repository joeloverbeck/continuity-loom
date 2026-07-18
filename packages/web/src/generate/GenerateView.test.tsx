// @vitest-environment jsdom

import type { CompileResult, GenerationReadiness, ReadinessDiagnostic } from "@loom/core";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  acknowledgeDurableChangeReminder,
  acceptCandidate,
  compile,
  generate,
  getDurableChangeReminder,
  readiness,
  type DurableChangeReminderResponse,
} from "../api.js";
import { DurableChangeReminder } from "../shell/DurableChangeReminder.js";
import { useProjectOpen } from "../shell/project-open.js";
import { ReminderRefreshProvider } from "../shell/reminder-refresh.js";
import { GenerateView } from "./GenerateView.js";

vi.mock("../api.js", () => ({
  acknowledgeDurableChangeReminder: vi.fn(),
  acceptCandidate: vi.fn(),
  compile: vi.fn(),
  generate: vi.fn(),
  getDurableChangeReminder: vi.fn(),
  readiness: vi.fn()
}));

vi.mock("../shell/project-open.js", () => ({
  useProjectOpen: vi.fn()
}));

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  vi.mocked(acceptCandidate).mockReset();
  vi.mocked(compile).mockReset();
  vi.mocked(generate).mockReset();
  vi.mocked(getDurableChangeReminder).mockReset();
  vi.mocked(readiness).mockReset();
  vi.mocked(acknowledgeDurableChangeReminder).mockReset();
  vi.mocked(readiness).mockResolvedValue(readinessFixture({}));
  vi.mocked(getDurableChangeReminder).mockResolvedValue(inactiveReminder());
  vi.mocked(useProjectOpen).mockReturnValue({
    isProjectOpen: true,
    refreshProjectOpen: vi.fn()
  });
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

describe("GenerateView", () => {
  it("edits and accepts the current draft candidate with its generation metadata", async () => {
    const storageSetItem = vi.spyOn(Storage.prototype, "setItem");
    vi.mocked(compile).mockResolvedValue(compileResult("<role>\nPrompt"));
    vi.mocked(generate).mockResolvedValue({ ok: true, candidate: { text: "Candidate prose." }, metadata: candidateMetadata() });
    vi.mocked(acceptCandidate).mockResolvedValue({
      ok: true,
      segment: { id: 9, sequence: 4, createdAt: "2026-06-06T08:10:00.000Z" }
    });

    renderGenerate();

    expect(await screen.findByRole("heading", { name: "Generate / Candidate" })).toBeTruthy();
    expect(await screen.findByTestId("prompt-body")).toBeTruthy();
    expect(screen.getByText("template-1")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Generate" }));

    expect(await screen.findByText("Draft candidate - not accepted, not canon.")).toBeTruthy();
    expect(screen.getByText("Source: OpenRouter")).toBeTruthy();
    expect(screen.getByText("Inspected prompt: fingerprint-1")).toBeTruthy();
    const editor = screen.getByRole<HTMLTextAreaElement>("textbox", { name: "Candidate text" });
    expect(editor.value).toBe("Candidate prose.");

    fireEvent.change(editor, { target: { value: "Edited accepted prose." } });
    fireEvent.click(screen.getByRole("button", { name: "Accept" }));

    expect(await screen.findByText("Accepted as segment 4.")).toBeTruthy();
    expect(screen.queryByText(/Durable changes likely need manual record updates/i)).toBeNull();
    expect(acceptCandidate).toHaveBeenCalledWith({
      text: "Edited accepted prose.",
      generationMetadata: { source: "openrouter", ...candidateMetadata() }
    });
    expect(screen.queryByRole("textbox", { name: "Candidate text" })).toBeNull();
    expect(storageSetItem).not.toHaveBeenCalled();
    expect(localStorage.getItem("Candidate prose.")).toBeNull();
    expect(sessionStorage.getItem("Candidate prose.")).toBeNull();
    expect(localStorage.getItem("Edited accepted prose.")).toBeNull();
    expect(sessionStorage.getItem("Edited accepted prose.")).toBeNull();
    expect(screen.queryByText("Accepted Segments")).toBeNull();
    expect(screen.queryByRole("button", { name: /acknowledge/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /snooze/i })).toBeNull();
  });

  it("refreshes readiness after acceptance and withholds stale prompt and candidate actions on a context mismatch", async () => {
    const mismatch = readinessDiagnostic({
      severity: "blocker",
      code: "generation-context-accepted-segment-mismatch",
      legacyCode: "generation-context-accepted-segment-mismatch",
      title: "Generation context does not match accepted segments",
      group: "required-before-prompt-generation",
      affected: [{
        kind: "generation-field",
        fieldPath: "generationSession.generation_validation_focus.validation_focus_tags.generation_context",
        displayLabel: "Generation Validation Focus"
      }],
      actions: [{
        kind: "focus-field",
        label: "Edit generation context",
        target: "generationSession.generation_validation_focus.validation_focus_tags.generation_context"
      }]
    });
    vi.mocked(compile)
      .mockResolvedValueOnce(compileResult("<role>\nStale first-segment prompt"))
      .mockResolvedValueOnce({
        ok: false,
        kind: "validation-blocked",
        validation: { blockers: [], warnings: [], isBlocked: true }
      });
    vi.mocked(readiness)
      .mockResolvedValueOnce(readinessFixture({}))
      .mockResolvedValueOnce(readinessFixture({ blockers: [mismatch] }));
    vi.mocked(acceptCandidate).mockResolvedValue({
      ok: true,
      segment: { id: 1, sequence: 1, createdAt: "2026-07-18T10:00:00.000Z" }
    });

    renderGenerate();

    expect((await screen.findByTestId("prompt-body")).textContent).toContain("Stale first-segment prompt");
    fireEvent.click(screen.getByRole("button", { name: "Write or paste candidate" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Candidate text" }), {
      target: { value: "Accepted boundary prose." }
    });
    fireEvent.click(screen.getByRole("button", { name: "Accept" }));

    expect(await screen.findByText("Generate is blocked.")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Generation context does not match accepted segments" })).toBeTruthy();
    expect(screen.getByText("Accepted as segment 1.")).toBeTruthy();
    expect(screen.queryByTestId("prompt-body")).toBeNull();
    expect(screen.queryByRole("button", { name: "Write or paste candidate" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Generate" })).toBeNull();
    expect(compile).toHaveBeenCalledTimes(2);
    expect(readiness).toHaveBeenCalledTimes(2);
    expect(generate).not.toHaveBeenCalled();
  });

  it("refreshes the shell durable-change reminder after a successful accept without navigation", async () => {
    vi.mocked(compile).mockResolvedValue(compileResult("<role>\nPrompt"));
    vi.mocked(generate).mockResolvedValue({ ok: true, candidate: { text: "Candidate prose." }, metadata: candidateMetadata() });
    vi.mocked(acceptCandidate).mockResolvedValue({
      ok: true,
      segment: { id: 9, sequence: 4, createdAt: "2026-06-06T08:10:00.000Z" }
    });
    vi.mocked(getDurableChangeReminder)
      .mockResolvedValueOnce(inactiveReminder())
      .mockResolvedValueOnce(activeReminder(4));

    renderGenerateWithReminder();

    expect(await screen.findByTestId("prompt-body")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Generate" }));
    expect(await screen.findByRole("textbox", { name: "Candidate text" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Accept" }));

    expect(await screen.findByRole("heading", { name: "Segment 4 was accepted" })).toBeTruthy();
    expect(screen.getByText("Accepted as segment 4.")).toBeTruthy();
    expect(screen.queryByText(/Durable changes likely need manual record updates/i)).toBeNull();
    expect(getDurableChangeReminder).toHaveBeenCalledTimes(2);
  });

  it("regenerates only after an inline discard confirmation and never accepts superseded drafts", async () => {
    vi.mocked(compile).mockResolvedValue(compileResult("<role>\nPrompt"));
    vi.mocked(generate)
      .mockResolvedValueOnce({ ok: true, candidate: { text: "First candidate." }, metadata: candidateMetadata() })
      .mockResolvedValueOnce({ ok: true, candidate: { text: "Second candidate." }, metadata: candidateMetadata() });

    renderGenerate();

    expect(await screen.findByTestId("prompt-body")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Generate" }));
    const editor = await screen.findByRole<HTMLTextAreaElement>("textbox", { name: "Candidate text" });
    fireEvent.change(editor, { target: { value: "Edited first candidate." } });

    fireEvent.click(screen.getByRole("button", { name: "Regenerate" }));
    expect(screen.getByRole("alertdialog", { name: "Replace draft candidate?" })).toBeTruthy();
    expect(generate).toHaveBeenCalledTimes(1);
    expect(screen.getByRole<HTMLTextAreaElement>("textbox", { name: "Candidate text" }).value).toBe("Edited first candidate.");

    fireEvent.click(screen.getByRole("button", { name: "Keep draft" }));
    expect(screen.queryByRole("alertdialog", { name: "Replace draft candidate?" })).toBeNull();
    expect(generate).toHaveBeenCalledTimes(1);
    expect(screen.getByRole<HTMLTextAreaElement>("textbox", { name: "Candidate text" }).value).toBe("Edited first candidate.");

    fireEvent.click(screen.getByRole("button", { name: "Regenerate" }));
    fireEvent.click(screen.getByRole("button", { name: "Discard draft and regenerate" }));
    expect(await screen.findByDisplayValue("Second candidate.")).toBeTruthy();
    expect(generate).toHaveBeenCalledTimes(2);
    expect(acceptCandidate).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Discard" }));
    expect(screen.queryByRole("textbox", { name: "Candidate text" })).toBeNull();
    expect(screen.getByTestId("prompt-body")).toBeTruthy();
    expect(acceptCandidate).not.toHaveBeenCalled();
  });

  it("discards an unedited candidate without a durable write", async () => {
    vi.mocked(compile).mockResolvedValue(compileResult("<role>\nPrompt"));
    vi.mocked(generate).mockResolvedValue({ ok: true, candidate: { text: "Candidate prose." }, metadata: candidateMetadata() });

    renderGenerate();

    expect(await screen.findByTestId("prompt-body")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Generate" }));
    expect(await screen.findByRole("textbox", { name: "Candidate text" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Discard" }));

    expect(screen.queryByRole("textbox", { name: "Candidate text" })).toBeNull();
    expect(screen.getByTestId("prompt-body")).toBeTruthy();
    expect(acceptCandidate).not.toHaveBeenCalled();
  });

  it("renders actionable generate errors without a candidate", async () => {
    vi.mocked(compile).mockResolvedValue(compileResult("<role>\nPrompt"));
    vi.mocked(generate).mockResolvedValue({
      ok: false,
      category: "missing-key",
      message: "OpenRouter API key is missing."
    });

    renderGenerate();

    expect(await screen.findByTestId("prompt-body")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Generate" }));

    expect(await screen.findByText("API key missing. Configure it in Settings.")).toBeTruthy();
    expect(screen.queryByRole("textbox", { name: "Candidate text" })).toBeNull();
  });

  it("prevents competing manual or refresh transitions while an initial generation is pending", async () => {
    let resolveGeneration: ((value: Awaited<ReturnType<typeof generate>>) => void) | undefined;
    vi.mocked(compile).mockResolvedValue(compileResult("<role>\nPrompt"));
    vi.mocked(generate).mockReturnValue(new Promise((resolve) => {
      resolveGeneration = resolve;
    }));

    renderGenerate();

    expect(await screen.findByTestId("prompt-body")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Generate" }));

    expect(await screen.findByText("Generating...")).toBeTruthy();
    expect(screen.getByRole<HTMLButtonElement>("button", { name: "Generate" }).disabled).toBe(true);
    expect(screen.getByRole<HTMLButtonElement>("button", { name: "Write or paste candidate" }).disabled).toBe(true);
    expect(screen.getByRole<HTMLButtonElement>("button", { name: "Refresh prompt" }).disabled).toBe(true);
    expect(compile).toHaveBeenCalledTimes(1);

    resolveGeneration?.({
      ok: true,
      candidate: { text: "Only candidate." },
      metadata: candidateMetadata()
    });

    expect(await screen.findByDisplayValue("Only candidate.")).toBeTruthy();
    expect(screen.getByRole<HTMLButtonElement>("button", { name: "Refresh prompt" }).disabled).toBe(false);
  });

  it.each([
    ["insufficient-credits", "Insufficient OpenRouter credits."],
    ["rate-limit", "Rate limited. Wait before retrying."],
    ["provider-unavailable", "Provider or model unavailable."]
  ])("keeps manual entry available after a %s transport failure", async (category, expectedMessage) => {
    vi.mocked(compile).mockResolvedValue(compileResult("<role>\nPrompt"));
    vi.mocked(generate).mockResolvedValue({
      ok: false,
      category,
      message: "The selected model or provider is unavailable."
    });

    renderGenerate();

    expect(await screen.findByTestId("prompt-body")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Generate" }));

    expect(await screen.findByText(expectedMessage)).toBeTruthy();
    expect(screen.queryByRole("textbox", { name: "Candidate text" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Write or paste candidate" }));
    expect(screen.getByRole<HTMLTextAreaElement>("textbox", { name: "Candidate text" }).value).toBe("");
  });

  it("renders validation blockers from readiness and disables Generate", async () => {
    vi.mocked(readiness).mockResolvedValue(readinessFixture({
      blockers: [readinessDiagnostic({
        severity: "blocker",
        code: "missing-launch-directive",
        legacyCode: "missing-manual-directive",
        title: "Add the launch directive",
        group: "required-before-prompt-generation"
      })]
    }));
    vi.mocked(compile).mockResolvedValue({
      ok: false,
      kind: "validation-blocked",
      validation: { blockers: [], warnings: [], isBlocked: true }
    });

    renderGenerate();

    expect(await screen.findByText("Generate is blocked.")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Add the launch directive" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Generate" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Write or paste candidate" })).toBeNull();
  });

  it("keeps Generate enabled for warning-only readiness when the provider is configured", async () => {
    vi.mocked(readiness).mockResolvedValue(readinessFixture({
      warnings: [readinessDiagnostic({
        severity: "warning",
        code: "cast-salience-risk",
        legacyCode: "cast-salience-risk",
        title: "Long cast context may dilute local voice emphasis",
        group: "prompt-length-salience-risk"
      })]
    }));
    vi.mocked(compile).mockResolvedValue(compileResult("<role>\nPrompt"));

    renderGenerate();

    expect(await screen.findByRole("heading", { name: "Long cast context may dilute local voice emphasis" })).toBeTruthy();
    expect(screen.getByRole<HTMLButtonElement>("button", { name: "Generate" }).disabled).toBe(false);
  });

  it("defers to the blocked view when generate returns validation-blocked", async () => {
    vi.mocked(compile)
      .mockResolvedValueOnce(compileResult("<role>\nPrompt"))
      .mockResolvedValueOnce({
        ok: false,
        kind: "validation-blocked",
        validation: { blockers: [], warnings: [], isBlocked: true }
      });
    vi.mocked(readiness)
      .mockResolvedValueOnce(readinessFixture({}))
      .mockResolvedValueOnce(readinessFixture({
        blockers: [readinessDiagnostic({
          severity: "blocker",
          code: "missing-current-state",
          legacyCode: "missing-current-authoritative-state",
          title: "Current state is required",
          group: "required-before-prompt-generation"
        })]
      }));
    vi.mocked(generate).mockResolvedValue({
      ok: false,
      kind: "validation-blocked",
      validation: { blockers: [], warnings: [], isBlocked: true }
    });

    renderGenerate();

    expect(await screen.findByTestId("prompt-body")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Generate" }));

    expect(await screen.findByText("Generate is blocked.")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Current state is required" })).toBeTruthy();
    expect(screen.queryByRole("textbox", { name: "Candidate text" })).toBeNull();
  });

  it("disables send when the OpenRouter key is missing", async () => {
    vi.mocked(readiness).mockResolvedValue(readinessFixture({
      providerConfigured: false,
      providerBlockers: [readinessDiagnostic({
        severity: "blocker",
        code: "provider-configuration-missing",
        legacyCode: "provider-configuration-missing",
        title: "Configure OpenRouter before generating",
        group: "required-before-prompt-generation",
        actions: [{ kind: "open-provider-settings", label: "Open provider settings", target: "/settings" }]
      })]
    }));
    vi.mocked(compile).mockResolvedValue(compileResult("<role>\nPrompt"));

    renderGenerate();

    expect(await screen.findByTestId("prompt-body")).toBeTruthy();
    const generateButton = screen.getByRole<HTMLButtonElement>("button", { name: "Generate" });
    expect(generateButton.disabled).toBe(true);
    expect(screen.getByRole("heading", { name: "Configure OpenRouter before generating" })).toBeTruthy();

    fireEvent.click(generateButton);
    expect(generate).not.toHaveBeenCalled();
    expect(screen.queryByRole("textbox", { name: "Candidate text" })).toBeNull();
  });

  it("opens an empty preview-grounded user-supplied draft when the provider is unavailable", async () => {
    const storageSetItem = vi.spyOn(Storage.prototype, "setItem");
    vi.mocked(readiness).mockResolvedValue(readinessFixture({
      providerConfigured: false,
      providerBlockers: [readinessDiagnostic({
        severity: "blocker",
        code: "provider-configuration-missing",
        legacyCode: "provider-configuration-missing",
        title: "Configure OpenRouter before generating",
        group: "required-before-prompt-generation"
      })]
    }));
    vi.mocked(compile).mockResolvedValue(compileResult("<role>\nPrompt"));

    renderGenerate();

    expect(await screen.findByTestId("prompt-body")).toBeTruthy();
    expect(screen.getByRole<HTMLButtonElement>("button", { name: "Generate" }).disabled).toBe(true);
    const manualEntry = screen.getByRole<HTMLButtonElement>("button", { name: "Write or paste candidate" });
    expect(manualEntry.disabled).toBe(false);

    fireEvent.click(manualEntry);

    const editor = screen.getByRole<HTMLTextAreaElement>("textbox", { name: "Candidate text" });
    expect(editor.value).toBe("");
    expect(screen.getByText("Source: User-supplied")).toBeTruthy();
    expect(screen.getByText("Draft candidate - not accepted, not canon.")).toBeTruthy();
    expect(screen.getByText("Inspected prompt: fingerprint-1")).toBeTruthy();
    expect(screen.getByText("Template template-1 · Compiler compiler-1 · Contract contract-1")).toBeTruthy();
    expect(screen.getByRole<HTMLButtonElement>("button", { name: "Accept" }).disabled).toBe(true);
    expect(screen.getByRole<HTMLButtonElement>("button", { name: "Replace with OpenRouter generation" }).disabled).toBe(true);
    expect(screen.queryByRole("button", { name: "Regenerate" })).toBeNull();
    expect(screen.getByTestId("prompt-body")).toBeTruthy();
    expect(generate).not.toHaveBeenCalled();
    expect(acceptCandidate).not.toHaveBeenCalled();
    expect(storageSetItem).not.toHaveBeenCalled();
  });

  it("discards and accepts user-supplied drafts only through the shared acceptance transition", async () => {
    const storageSetItem = vi.spyOn(Storage.prototype, "setItem");
    vi.mocked(compile).mockResolvedValue(compileResult("<role>\nPrompt"));
    vi.mocked(acceptCandidate).mockResolvedValue({
      ok: true,
      segment: { id: 10, sequence: 5, createdAt: "2026-06-06T08:15:00.000Z" }
    });
    vi.mocked(getDurableChangeReminder)
      .mockResolvedValueOnce(inactiveReminder())
      .mockResolvedValueOnce(activeReminder(5));

    renderGenerateWithReminder();

    expect(await screen.findByTestId("prompt-body")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Write or paste candidate" }));
    const firstEditor = screen.getByRole<HTMLTextAreaElement>("textbox", { name: "Candidate text" });
    fireEvent.change(firstEditor, { target: { value: " \n\t " } });
    expect(screen.getByRole<HTMLButtonElement>("button", { name: "Accept" }).disabled).toBe(true);

    fireEvent.change(firstEditor, { target: { value: "Discard this pasted draft." } });
    fireEvent.click(screen.getByRole("button", { name: "Discard" }));
    expect(screen.queryByRole("textbox", { name: "Candidate text" })).toBeNull();
    expect(acceptCandidate).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Write or paste candidate" }));
    const secondEditor = screen.getByRole<HTMLTextAreaElement>("textbox", { name: "Candidate text" });
    expect(secondEditor.value).toBe("");
    fireEvent.change(secondEditor, { target: { value: "  Exact externally supplied sentinel.  " } });
    fireEvent.click(screen.getByRole("button", { name: "Accept" }));

    expect(await screen.findByText("Accepted as segment 5.")).toBeTruthy();
    expect(acceptCandidate).toHaveBeenCalledTimes(1);
    expect(acceptCandidate).toHaveBeenCalledWith({
      text: "  Exact externally supplied sentinel.  ",
      generationMetadata: {
        source: "user_supplied",
        versions: {
          template: "template-1",
          compiler: "compiler-1",
          contract: "contract-1"
        }
      }
    });
    expect(await screen.findByRole("heading", { name: "Segment 5 was accepted" })).toBeTruthy();
    expect(generate).not.toHaveBeenCalled();
    expect(storageSetItem).not.toHaveBeenCalled();
  });

  it("preserves an exact non-empty draft when prompt refresh is cancelled and discards it only after confirmation", async () => {
    vi.mocked(compile)
      .mockResolvedValueOnce(compileResult("<role>\nFirst prompt", "fingerprint-1"))
      .mockResolvedValueOnce(compileResult("<role>\nSecond prompt", "fingerprint-2"));

    renderGenerate();

    expect((await screen.findByTestId("prompt-body")).textContent).toBe("<role>\nFirst prompt");
    fireEvent.click(screen.getByRole("button", { name: "Write or paste candidate" }));
    const editor = screen.getByRole<HTMLTextAreaElement>("textbox", { name: "Candidate text" });
    fireEvent.change(editor, { target: { value: "  Preserve this exact draft.  " } });

    fireEvent.click(screen.getByRole("button", { name: "Refresh prompt" }));

    expect(screen.getByRole("alertdialog", { name: "Refresh prompt and discard draft?" })).toBeTruthy();
    expect(compile).toHaveBeenCalledTimes(1);
    expect(screen.getByRole<HTMLTextAreaElement>("textbox", { name: "Candidate text" }).value).toBe("  Preserve this exact draft.  ");
    expect(screen.getByText("Inspected prompt: fingerprint-1")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Replace with OpenRouter generation" })).toBeTruthy();
    expect(screen.getByRole<HTMLButtonElement>("button", { name: "Accept" }).disabled).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Accept" }));
    expect(acceptCandidate).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Keep draft" }));

    expect(screen.queryByRole("alertdialog", { name: "Refresh prompt and discard draft?" })).toBeNull();
    expect(compile).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("prompt-body").textContent).toBe("<role>\nFirst prompt");
    expect(screen.getByRole<HTMLTextAreaElement>("textbox", { name: "Candidate text" }).value).toBe("  Preserve this exact draft.  ");

    fireEvent.click(screen.getByRole("button", { name: "Refresh prompt" }));
    fireEvent.click(screen.getByRole("button", { name: "Discard draft and refresh prompt" }));

    await waitFor(() => {
      expect(screen.getByTestId("prompt-body").textContent).toBe("<role>\nSecond prompt");
    });
    expect(compile).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole("textbox", { name: "Candidate text" })).toBeNull();
    expect(screen.getByText("fingerprint-2")).toBeTruthy();
  });

  it("lets empty drafts refresh or request a replacement without a discard confirmation", async () => {
    vi.mocked(compile).mockResolvedValue(compileResult("<role>\nPrompt"));
    vi.mocked(generate).mockResolvedValue({
      ok: true,
      candidate: { text: "Replacement candidate." },
      metadata: candidateMetadata()
    });

    renderGenerate();

    expect(await screen.findByTestId("prompt-body")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Write or paste candidate" }));
    fireEvent.click(screen.getByRole("button", { name: "Replace with OpenRouter generation" }));

    expect(await screen.findByDisplayValue("Replacement candidate.")).toBeTruthy();
    expect(generate).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("alertdialog")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Discard" }));
    fireEvent.click(screen.getByRole("button", { name: "Write or paste candidate" }));
    fireEvent.click(screen.getByRole("button", { name: "Refresh prompt" }));

    expect(await screen.findByRole("button", { name: "Write or paste candidate" })).toBeTruthy();
    expect(compile).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(screen.queryByRole("textbox", { name: "Candidate text" })).toBeNull();
  });

  it("preserves a user-supplied draft on replacement failure and records actual OpenRouter provenance after success", async () => {
    vi.mocked(compile).mockResolvedValue(compileResult("<role>\nPrompt"));
    vi.mocked(generate)
      .mockResolvedValueOnce({
        ok: false,
        category: "provider-unavailable",
        message: "The selected provider is unavailable."
      })
      .mockResolvedValueOnce({
        ok: true,
        candidate: { text: "Provider replacement." },
        metadata: candidateMetadata({ model: "anthropic/claude-sonnet-4", temperature: 0.7 })
      });
    vi.mocked(acceptCandidate).mockResolvedValue({
      ok: true,
      segment: { id: 11, sequence: 6, createdAt: "2026-06-06T08:20:00.000Z" }
    });

    renderGenerate();

    expect(await screen.findByTestId("prompt-body")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Write or paste candidate" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Candidate text" }), {
      target: { value: "Original user draft." }
    });

    fireEvent.click(screen.getByRole("button", { name: "Replace with OpenRouter generation" }));
    expect(screen.getByRole("alertdialog", { name: "Replace draft candidate?" })).toBeTruthy();
    expect(generate).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Discard draft and replace with OpenRouter generation" }));

    expect(await screen.findByText("Provider or model unavailable.")).toBeTruthy();
    expect(screen.getByRole<HTMLTextAreaElement>("textbox", { name: "Candidate text" }).value).toBe("Original user draft.");
    expect(screen.getByText("Source: User-supplied")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Replace with OpenRouter generation" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Regenerate" })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Replace with OpenRouter generation" }));
    fireEvent.click(screen.getByRole("button", { name: "Discard draft and replace with OpenRouter generation" }));

    expect(await screen.findByDisplayValue("Provider replacement.")).toBeTruthy();
    expect(screen.getByText("Source: OpenRouter")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Regenerate" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Replace with OpenRouter generation" })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Accept" }));

    expect(await screen.findByText("Accepted as segment 6.")).toBeTruthy();
    expect(acceptCandidate).toHaveBeenCalledWith({
      text: "Provider replacement.",
      generationMetadata: {
        source: "openrouter",
        ...candidateMetadata({ model: "anthropic/claude-sonnet-4", temperature: 0.7 })
      }
    });
  });
});

function renderGenerate() {
  return render(
    <MemoryRouter>
      <GenerateView />
    </MemoryRouter>
  );
}

function renderGenerateWithReminder() {
  return render(
    <MemoryRouter>
      <ReminderRefreshProvider>
        <DurableChangeReminder />
        <GenerateView />
      </ReminderRefreshProvider>
    </MemoryRouter>
  );
}

function compileResult(prompt: string, fingerprint = "fingerprint-1"): CompileResult {
  return {
    prompt,
    metadata: {
      versions: {
        template: "template-1",
        compiler: "compiler-1",
        contract: "contract-1"
      },
      fingerprint,
      lengthEstimate: prompt.length,
      tokenEstimate: 7
    }
  };
}

function candidateMetadata(overrides: Partial<{
  model: string;
  temperature: number;
}> = {}) {
  return {
    model: overrides.model ?? "openai/gpt-4.1",
    provider: "openrouter" as const,
    temperature: overrides.temperature ?? 0.4,
    maxOutputTokens: 2200,
    versions: {
      template: "template-1",
      compiler: "compiler-1",
      contract: "contract-1"
    }
  };
}

function activeReminder(sequence: number): DurableChangeReminderResponse {
  return {
    ok: true,
    reminder: {
      active: true,
      latestSegment: { sequence, createdAt: "2026-06-06T08:10:00.000Z" },
      acknowledgedThroughSequence: sequence - 1
    }
  };
}

function inactiveReminder(): DurableChangeReminderResponse {
  return {
    ok: true,
    reminder: {
      active: false,
      latestSegment: null,
      acknowledgedThroughSequence: 0
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
      ? { headline: "Generate is blocked", nextAction: "Fix blockers." }
      : warnings.length > 0
        ? { headline: "Ready with recommendations", nextAction: "Review warnings if useful." }
        : { headline: "Ready to generate", nextAction: "Preview and Generate are available." }
  };
}

function readinessDiagnostic(input: {
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
