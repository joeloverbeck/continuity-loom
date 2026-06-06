// @vitest-environment jsdom

import type { CompileResult, Diagnostic, ValidationResult } from "@loom/core";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { compile } from "../api.js";
import { PromptPreviewView } from "./PromptPreviewView.js";

vi.mock("../api.js", () => ({
  compile: vi.fn()
}));

const writeText = vi.fn();

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  writeText.mockReset();
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText }
  });
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

describe("PromptPreviewView", () => {
  it("renders validation blockers without rendering a prompt element", async () => {
    vi.mocked(compile).mockResolvedValue({
      ok: false,
      kind: "validation-blocked",
      validation: validationResult()
    });

    renderPreview();

    expect(await screen.findByText("Prompt preview is unavailable while blockers exist.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "missing-current-authoritative-state" })).toBeTruthy();
    expect(screen.queryByTestId("prompt-body")).toBeNull();
  });

  it("renders prompt text and metadata outside the prompt body", async () => {
    vi.mocked(compile).mockResolvedValue(compileResult("<role>\nWrite locally.\n<final_output_instruction>"));

    renderPreview();

    const promptBody = await screen.findByTestId("prompt-body");
    expect(promptBody.textContent).toContain("<role>");
    expect(promptBody.textContent).toContain("<final_output_instruction>");
    expect(promptBody.textContent).not.toContain("template-1");
    expect(promptBody.textContent).not.toContain("fingerprint-1");

    const metadata = screen.getByLabelText("Prompt metadata");
    expect(within(metadata).getByText("template-1")).toBeTruthy();
    expect(within(metadata).getByText("compiler-1")).toBeTruthy();
    expect(within(metadata).getByText("contract-1")).toBeTruthy();
    expect(within(metadata).getByText("fingerprint-1")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Generate" })).toBeNull();
    expect(screen.queryByTestId("candidate-body")).toBeNull();
  });

  it("copies, searches, clears, and leaves browser storage untouched", async () => {
    const storageSetItem = vi.spyOn(Storage.prototype, "setItem");
    const indexedDbOpen = vi.fn();
    vi.stubGlobal("indexedDB", { open: indexedDbOpen });
    const prompt = "<role>\nA long prompt line.\nAnother prompt line.";
    vi.mocked(compile).mockResolvedValue(compileResult(prompt));
    writeText.mockResolvedValue(undefined);

    renderPreview();

    expect(await screen.findByTestId("prompt-body")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Copy prompt" }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith(prompt));
    expect(await screen.findByText("Prompt copied.")).toBeTruthy();

    fireEvent.change(screen.getByLabelText("Search within prompt"), { target: { value: "prompt" } });
    expect(await screen.findByText("2 matches")).toBeTruthy();
    expect(screen.getAllByText("prompt")).toHaveLength(2);

    fireEvent.click(screen.getByRole("button", { name: "Clear" }));
    expect(screen.queryByTestId("prompt-body")).toBeNull();
    expect(screen.queryByText("fingerprint-1")).toBeNull();
    expect(screen.getByText("No prompt is currently compiled.")).toBeTruthy();
    expect(storageSetItem).not.toHaveBeenCalled();
    expect(indexedDbOpen).not.toHaveBeenCalled();
  });

  it("refreshes the preview and replaces stale compiled state", async () => {
    vi.mocked(compile)
      .mockResolvedValueOnce(compileResult("<role>\nFIRST"))
      .mockResolvedValueOnce(compileResult("<role>\nSECOND"));

    renderPreview();

    expect(await screen.findByText(/FIRST/)).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Refresh preview" }));

    expect(await screen.findByText(/SECOND/)).toBeTruthy();
    expect(screen.queryByText(/FIRST/)).toBeNull();
    expect(compile).toHaveBeenCalledTimes(2);
  });

  it.each([
    [{ ok: false as const, kind: "no-open-project", message: "No open project." }, "Open a project first."],
    [
      { ok: false as const, kind: "malformed-validation-source", message: "Validation source is malformed." },
      "Validation source is malformed."
    ]
  ])("renders structured errors without a prompt element", async (response, message) => {
    vi.mocked(compile).mockResolvedValue(response);

    renderPreview();

    expect(await screen.findByText(message)).toBeTruthy();
    expect(screen.queryByTestId("prompt-body")).toBeNull();
  });
});

function renderPreview() {
  return render(
    <MemoryRouter>
      <PromptPreviewView />
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
