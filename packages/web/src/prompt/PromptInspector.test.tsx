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
  it("keeps suitability and context advisories distinct across all four states", () => {
    const { rerender } = render(
      <PromptInspector
        result={compileResult("Prompt")}
        providerRequest={providerRequest("assistance", 4095)}
        searchTerm=""
        onSearchTermChange={vi.fn()}
      />
    );

    const suitability = screen.getByRole("status", { name: "Assistance-ceiling suitability advisory" });
    expect(suitability.textContent).toContain("configured Assistance ceiling is 4095 tokens");
    expect(suitability.textContent).toContain("may be too small for a complete structured result");
    expect(suitability.textContent).toContain("4096 is a starting allowance, not a guarantee");
    expect(within(suitability).getByRole("link", { name: "Open Settings" }).getAttribute("href"))
      .toBe("/settings");
    expect(screen.queryByRole("status", { name: "Context-window advisory" })).toBeNull();

    rerender(
      <PromptInspector
        result={compileResult("Prompt")}
        providerRequest={{ ...providerRequest("prose", 5000), contextLength: 5006 }}
        searchTerm=""
        onSearchTermChange={vi.fn()}
      />
    );
    expect(screen.queryByRole("status", { name: "Assistance-ceiling suitability advisory" })).toBeNull();
    expect(screen.getByRole("status", { name: "Context-window advisory" }).textContent)
      .toContain("configured Prose ceiling of 5000 tokens");

    rerender(
      <PromptInspector
        result={compileResult("Prompt")}
        providerRequest={{ ...providerRequest("assistance", 4095), contextLength: 4101 }}
        searchTerm=""
        onSearchTermChange={vi.fn()}
      />
    );
    expect(screen.getByRole("status", { name: "Assistance-ceiling suitability advisory" })).toBeTruthy();
    expect(screen.getByRole("status", { name: "Context-window advisory" })).toBeTruthy();

    rerender(
      <PromptInspector
        result={compileResult("Prompt")}
        providerRequest={{ ...providerRequest("assistance", 4096), contextLength: 4103 }}
        searchTerm=""
        onSearchTermChange={vi.fn()}
      />
    );
    expect(screen.queryByRole("status", { name: "Assistance-ceiling suitability advisory" })).toBeNull();
    expect(screen.queryByRole("status", { name: "Context-window advisory" })).toBeNull();
    expect(within(screen.getByLabelText("Prompt metadata")).getByText("Assistance ceiling")).toBeTruthy();
  });

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

  it("discloses the exact finalized provider controls and omits absent Top P", () => {
    const { rerender } = render(
      <PromptInspector
        result={compileResult("Prompt")}
        providerRequest={{
          model: "provider/model",
          temperatureMode: "provider_default",
          completionCeilingClass: "prose",
          maxOutputTokens: 2048,
          requestFingerprint: "request-fingerprint"
        }}
        searchTerm=""
        onSearchTermChange={vi.fn()}
      />
    );

    const metadata = screen.getByLabelText("Prompt metadata");
    expect(within(metadata).getByText("provider/model")).toBeTruthy();
    expect(within(metadata).getByText("Provider default")).toBeTruthy();
    expect(within(metadata).queryByText("Top P")).toBeNull();
    expect(within(metadata).getByText("2048")).toBeTruthy();
    expect(within(metadata).getByText("request-fingerprint")).toBeTruthy();

    rerender(
      <PromptInspector
        result={compileResult("Prompt")}
        providerRequest={{
          model: "provider/model",
          temperatureMode: "explicit",
          temperature: 0.7,
          topP: 0.9,
          completionCeilingClass: "assistance",
          maxOutputTokens: 2048,
          requestFingerprint: "request-fingerprint"
        }}
        searchTerm=""
        onSearchTermChange={vi.fn()}
      />
    );

    expect(within(metadata).getByText("Explicit: 0.7")).toBeTruthy();
    expect(within(metadata).getByText("Top P")).toBeTruthy();
    expect(within(metadata).getByText("0.9")).toBeTruthy();
  });

  it("presents one accessible non-gating context-window advisory from disclosed estimates", () => {
    const { rerender } = render(
      <PromptInspector
        result={compileResult("Prompt")}
        providerRequest={{
          model: "provider/compact-model",
          temperatureMode: "provider_default",
          completionCeilingClass: "assistance",
          maxOutputTokens: 2048,
          contextLength: 2054,
          requestFingerprint: "request-fingerprint"
        }}
        searchTerm=""
        onSearchTermChange={vi.fn()}
      />
    );

    const advisory = screen.getByRole("status", { name: "Context-window advisory" });
    expect(advisory.textContent).toContain("provider/compact-model");
    expect(advisory.textContent).toContain("estimated at 7 tokens");
    expect(advisory.textContent).toContain("cached context window of 2054 tokens");
    expect(advisory.textContent).toContain("reduce the configured Assistance ceiling");
    expect(advisory.textContent).toContain("choose a model with a larger context window");
    expect(advisory.textContent).not.toContain("narrow the selected scope");
    expect(advisory.textContent).not.toContain("Prompt");

    rerender(
      <PromptInspector
        result={compileResult("Prompt")}
        providerRequest={{
          model: "provider/compact-model",
          temperatureMode: "provider_default",
          completionCeilingClass: "assistance",
          maxOutputTokens: 2047,
          contextLength: 2054,
          requestFingerprint: "request-fingerprint"
        }}
        searchTerm=""
        onSearchTermChange={vi.fn()}
      />
    );
    expect(screen.queryByRole("status", { name: "Context-window advisory" })).toBeNull();

    rerender(
      <PromptInspector
        result={compileResult("Prompt")}
        providerRequest={{
          model: "provider/unknown-model",
          temperatureMode: "provider_default",
          completionCeilingClass: "assistance",
          maxOutputTokens: 2048,
          requestFingerprint: "request-fingerprint"
        }}
        searchTerm=""
        onSearchTermChange={vi.fn()}
      />
    );
    expect(screen.queryByRole("status", { name: "Context-window advisory" })).toBeNull();

    rerender(
      <PromptInspector
        result={compileResult("Prompt")}
        providerRequest={{
          model: "provider/compact-model",
          temperatureMode: "provider_default",
          completionCeilingClass: "assistance",
          maxOutputTokens: 2048,
          contextLength: 2054,
          requestFingerprint: "request-fingerprint"
        }}
        canNarrowScope
        searchTerm=""
        onSearchTermChange={vi.fn()}
      />
    );
    expect(screen.getByRole("status", { name: "Context-window advisory" }).textContent)
      .toContain("narrow the selected scope");
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

function providerRequest(
  completionCeilingClass: "prose" | "assistance",
  maxOutputTokens: number
) {
  return {
    model: "provider/model",
    temperatureMode: "provider_default" as const,
    completionCeilingClass,
    maxOutputTokens,
    requestFingerprint: `request-${completionCeilingClass}-${maxOutputTokens}`
  };
}
