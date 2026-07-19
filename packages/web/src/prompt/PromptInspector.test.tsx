// @vitest-environment jsdom

import type { CompileResult } from "@loom/core";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { PromptInspector } from "./PromptInspector.js";

afterEach(() => {
  cleanup();
  Reflect.deleteProperty(HTMLElement.prototype, "scrollIntoView");
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

  it("navigates case-insensitive matches in both directions, wraps, keeps focus, and scrolls the active mark", () => {
    const scrollIntoView = vi.fn();
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      value: scrollIntoView
    });
    const prompt = "Alpha first. ALPHA second. alpha third.";
    const { rerender } = render(
      <PromptInspector
        result={compileResult(prompt)}
        searchTerm="alpha"
        onSearchTermChange={vi.fn()}
      />
    );

    const promptBody = screen.getByTestId("prompt-body");
    expect(promptBody.textContent).toBe(prompt);
    expect(promptBody.querySelectorAll("mark")).toHaveLength(3);
    expect(promptBody.querySelectorAll("mark")[0]?.getAttribute("aria-current")).toBe("true");
    expect(screen.getByRole("status").textContent).toContain("Current match 1 of 3");

    const next = screen.getByRole("button", { name: "Next" });
    next.focus();
    fireEvent.click(next);
    expect(document.activeElement).toBe(next);
    expect(promptBody.querySelector("mark[aria-current='true']")?.textContent).toBe("ALPHA");
    expect(screen.getByRole("status").textContent).toContain("Current match 2 of 3");
    expect(scrollIntoView).toHaveBeenLastCalledWith({ block: "center" });

    fireEvent.click(next);
    fireEvent.click(next);
    expect(promptBody.querySelector("mark[aria-current='true']")?.textContent).toBe("Alpha");

    const previous = screen.getByRole("button", { name: "Previous" });
    fireEvent.click(previous);
    expect(promptBody.querySelector("mark[aria-current='true']")?.textContent).toBe("alpha");

    rerender(
      <PromptInspector
        result={compileResult(prompt)}
        searchTerm="second"
        onSearchTermChange={vi.fn()}
      />
    );
    expect(promptBody.querySelector("mark[aria-current='true']")?.textContent).toBe("second");
    expect(screen.getByRole("status").textContent).toContain("Current match 1 of 1");

    rerender(
      <PromptInspector
        result={compileResult("Second replacement. second again.")}
        searchTerm="second"
        onSearchTermChange={vi.fn()}
      />
    );
    expect(promptBody.querySelector("mark[aria-current='true']")?.textContent).toBe("Second");
    expect(screen.getByRole("status").textContent).toContain("Current match 1 of 2");
  });

  it("has no active result for blank search and truthfully disables navigation for zero matches", () => {
    const result = compileResult("A deterministic prompt.");
    const { rerender } = render(
      <PromptInspector result={result} searchTerm="   " onSearchTermChange={vi.fn()} />
    );

    expect(screen.queryByRole("status")).toBeNull();
    expect(screen.queryByRole("button", { name: "Previous" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Next" })).toBeNull();
    expect(screen.getByTestId("prompt-body").querySelector("mark")).toBeNull();

    rerender(<PromptInspector result={result} searchTerm="missing" onSearchTermChange={vi.fn()} />);
    expect(screen.getByRole("status").textContent).toContain("0 matches");
    expect(screen.getByRole<HTMLButtonElement>("button", { name: "Previous" }).disabled).toBe(true);
    expect(screen.getByRole<HTMLButtonElement>("button", { name: "Next" }).disabled).toBe(true);
    expect(screen.getByTestId("prompt-body").querySelector("mark")).toBeNull();
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
