// @vitest-environment jsdom

import type { CompileResult, Diagnostic, ValidationResult } from "@loom/core";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  acknowledgeDurableChangeReminder,
  acceptCandidate,
  compile,
  generate,
  getDurableChangeReminder,
  getOpenRouterSettings,
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
  getOpenRouterSettings: vi.fn()
}));

vi.mock("../shell/project-open.js", () => ({
  useProjectOpen: vi.fn()
}));

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  vi.mocked(acceptCandidate).mockReset();
  vi.mocked(generate).mockReset();
  vi.mocked(getDurableChangeReminder).mockReset();
  vi.mocked(getOpenRouterSettings).mockReset();
  vi.mocked(acknowledgeDurableChangeReminder).mockReset();
  vi.mocked(getOpenRouterSettings).mockResolvedValue(openRouterSettings({ hasOpenRouterCredential: true }));
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
    const editor = screen.getByRole<HTMLTextAreaElement>("textbox", { name: "Candidate text" });
    expect(editor.value).toBe("Candidate prose.");

    fireEvent.change(editor, { target: { value: "Edited accepted prose." } });
    fireEvent.click(screen.getByRole("button", { name: "Accept" }));

    expect(await screen.findByText("Accepted as segment 4.")).toBeTruthy();
    expect(screen.queryByText(/Durable changes likely need manual record updates/i)).toBeNull();
    expect(acceptCandidate).toHaveBeenCalledWith({
      text: "Edited accepted prose.",
      generationMetadata: candidateMetadata()
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

  it("regenerates with edit-loss warning and never accepts discarded or superseded drafts", async () => {
    const confirm = vi.spyOn(window, "confirm");
    vi.mocked(compile).mockResolvedValue(compileResult("<role>\nPrompt"));
    vi.mocked(generate)
      .mockResolvedValueOnce({ ok: true, candidate: { text: "First candidate." }, metadata: candidateMetadata() })
      .mockResolvedValueOnce({ ok: true, candidate: { text: "Second candidate." }, metadata: candidateMetadata() });

    renderGenerate();

    expect(await screen.findByTestId("prompt-body")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Generate" }));
    const editor = await screen.findByRole<HTMLTextAreaElement>("textbox", { name: "Candidate text" });
    fireEvent.change(editor, { target: { value: "Edited first candidate." } });

    confirm.mockReturnValueOnce(false);
    fireEvent.click(screen.getByRole("button", { name: "Regenerate" }));
    expect(generate).toHaveBeenCalledTimes(1);
    expect(screen.getByRole<HTMLTextAreaElement>("textbox", { name: "Candidate text" }).value).toBe("Edited first candidate.");

    confirm.mockReturnValueOnce(true);
    fireEvent.click(screen.getByRole("button", { name: "Regenerate" }));
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

  it("renders generic transport generate errors without a candidate", async () => {
    vi.mocked(compile).mockResolvedValue(compileResult("<role>\nPrompt"));
    vi.mocked(generate).mockResolvedValue({
      ok: false,
      category: "provider-unavailable",
      message: "The selected model or provider is unavailable."
    });

    renderGenerate();

    expect(await screen.findByTestId("prompt-body")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Generate" }));

    expect(await screen.findByText("Provider or model unavailable.")).toBeTruthy();
    expect(screen.queryByRole("textbox", { name: "Candidate text" })).toBeNull();
  });

  it("defers to the blocked view when generate returns validation-blocked", async () => {
    vi.mocked(compile).mockResolvedValue(compileResult("<role>\nPrompt"));
    vi.mocked(generate).mockResolvedValue({
      ok: false,
      kind: "validation-blocked",
      validation: validationResult()
    });

    renderGenerate();

    expect(await screen.findByTestId("prompt-body")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Generate" }));

    expect(await screen.findByText("Prompt preview is unavailable while blockers exist.")).toBeTruthy();
    expect(screen.queryByRole("textbox", { name: "Candidate text" })).toBeNull();
  });

  it("disables send when the OpenRouter key is missing", async () => {
    vi.mocked(getOpenRouterSettings).mockResolvedValue(openRouterSettings({ hasOpenRouterCredential: false }));
    vi.mocked(compile).mockResolvedValue(compileResult("<role>\nPrompt"));

    renderGenerate();

    expect(await screen.findByTestId("prompt-body")).toBeTruthy();
    const generateButton = screen.getByRole<HTMLButtonElement>("button", { name: "Generate" });
    expect(generateButton.disabled).toBe(true);
    expect(screen.getByText("API key missing. Configure it in Settings.")).toBeTruthy();

    fireEvent.click(generateButton);
    expect(generate).not.toHaveBeenCalled();
    expect(screen.queryByRole("textbox", { name: "Candidate text" })).toBeNull();
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

function compileResult(prompt: string): CompileResult {
  return {
    prompt,
    metadata: {
      versions: {
        template: "template-1",
        compiler: "compiler-1",
        contract: "contract-1"
      },
      fingerprint: "fingerprint-1",
      lengthEstimate: prompt.length,
      tokenEstimate: 7
    }
  };
}

function candidateMetadata() {
  return {
    model: "openai/gpt-4.1",
    provider: "openrouter" as const,
    temperature: 0.4,
    maxOutputTokens: 2200,
    versions: {
      template: "template-1",
      compiler: "compiler-1",
      contract: "contract-1"
    }
  };
}

function openRouterSettings({ hasOpenRouterCredential }: { hasOpenRouterCredential: boolean }) {
  return {
    model: "openai/gpt-4.1",
    temperature: 0.4,
    maxOutputTokens: 2200,
    hasOpenRouterCredential
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

function validationResult(): ValidationResult {
  return {
    blockers: [diagnostic("blocker", "missing-current-authoritative-state", "generationSession.current_authoritative_state")],
    warnings: [],
    isBlocked: true
  };
}

function diagnostic(severity: "blocker" | "warning", code: string, field: string): Diagnostic {
  return {
    severity,
    code,
    message: `${code} message`,
    affected: [{ field }],
    whyItMatters: `${code} rationale`,
    suggestedActions: ["revise"]
  };
}
