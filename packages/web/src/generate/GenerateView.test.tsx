// @vitest-environment jsdom

import type { CompileResult, Diagnostic, ValidationResult } from "@loom/core";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { compile, generate } from "../api.js";
import { GenerateView } from "./GenerateView.js";

vi.mock("../api.js", () => ({
  compile: vi.fn(),
  generate: vi.fn()
}));

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  vi.mocked(generate).mockReset();
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

describe("GenerateView", () => {
  it("renders the prompt inspector and generates a read-only ephemeral draft candidate", async () => {
    const storageSetItem = vi.spyOn(Storage.prototype, "setItem");
    vi.mocked(compile).mockResolvedValue(compileResult("<role>\nPrompt"));
    vi.mocked(generate).mockResolvedValue({ ok: true, candidate: { text: "Candidate prose." }, metadata: candidateMetadata() });

    renderGenerate();

    expect(await screen.findByRole("heading", { name: "Generate / Candidate" })).toBeTruthy();
    expect(await screen.findByTestId("prompt-body")).toBeTruthy();
    expect(screen.getByText("template-1")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Generate" }));

    expect(await screen.findByText("Draft candidate; not accepted, not canon.")).toBeTruthy();
    expect(screen.getByTestId("candidate-body").textContent).toBe("Candidate prose.");
    expect(screen.queryByRole("textbox", { name: /candidate/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /accept/i })).toBeNull();
    expect(storageSetItem).not.toHaveBeenCalled();
    expect(localStorage.getItem("Candidate prose.")).toBeNull();
    expect(sessionStorage.getItem("Candidate prose.")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Clear candidate" }));
    expect(screen.queryByTestId("candidate-body")).toBeNull();
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
    expect(screen.queryByTestId("candidate-body")).toBeNull();
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
    expect(screen.queryByTestId("candidate-body")).toBeNull();
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
    expect(screen.queryByTestId("candidate-body")).toBeNull();
  });
});

function renderGenerate() {
  return render(
    <MemoryRouter>
      <GenerateView />
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
