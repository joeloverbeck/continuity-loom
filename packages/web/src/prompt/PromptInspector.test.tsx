// @vitest-environment jsdom

import type { CompileResult } from "@loom/core";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { PromptInspector } from "./PromptInspector.js";

afterEach(() => {
  cleanup();
});

describe("PromptInspector", () => {
  it("renders the compiled prompt, metadata, and prompt search highlighting", () => {
    const onSearchTermChange = vi.fn();
    const prompt = "<role>\nA prompt line.\nAnother prompt line.";

    render(<PromptInspector result={compileResult(prompt)} searchTerm="" onSearchTermChange={onSearchTermChange} />);

    const promptBody = screen.getByTestId("prompt-body");
    expect(promptBody.textContent).toContain("<role>");
    expect(promptBody.textContent).toContain("Another prompt line.");
    expect(promptBody.textContent).not.toContain("template-1");

    const metadata = screen.getByLabelText("Prompt metadata");
    expect(within(metadata).getByText("template-1")).toBeTruthy();
    expect(within(metadata).getByText("compiler-1")).toBeTruthy();
    expect(within(metadata).getByText("contract-1")).toBeTruthy();
    expect(within(metadata).getByText("fingerprint-1")).toBeTruthy();
    expect(within(metadata).getByText(String(prompt.length))).toBeTruthy();
    expect(within(metadata).getByText("7")).toBeTruthy();

    fireEvent.change(screen.getByLabelText("Search within prompt"), { target: { value: "prompt" } });
    expect(onSearchTermChange).toHaveBeenCalledWith("prompt");

    cleanup();
    render(
      <PromptInspector
        result={compileResult(prompt)}
        searchTerm="prompt"
        onSearchTermChange={onSearchTermChange}
      />
    );

    expect(screen.getByText("2 matches")).toBeTruthy();
    expect(screen.getAllByText("prompt")).toHaveLength(2);
  });
});

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
