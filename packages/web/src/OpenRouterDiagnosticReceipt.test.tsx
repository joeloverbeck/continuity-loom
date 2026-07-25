// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { OpenRouterDiagnosticReceipt } from "./OpenRouterDiagnosticReceipt.js";

const receipt = {
  classification: "provider-error" as const,
  summary: "OpenRouter reported an in-band provider error.",
  recovery: "Wait, inspect again, and use the existing action. No retry is automatic.",
  details: {
    httpStatus: 200,
    generationId: "gen-safe_123",
    requestedModel: "anthropic/claude-sonnet-4",
    returnedModel: "anthropic/claude-sonnet-4",
    provider: "Anthropic",
    termination: "error" as const,
    nativeFinishReason: "error",
    choiceCount: 1,
    contentShape: "string" as const,
    contentLength: 28,
    usage: { promptTokens: 12, completionTokens: 4, totalTokens: 16 }
  }
};

describe("OpenRouterDiagnosticReceipt", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("renders accessible current-attempt details, safe copy feedback, conditional Logs navigation, and clear", async () => {
    const writeText = vi.fn<(text: string) => Promise<void>>(() => Promise.resolve());
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    const onClear = vi.fn();
    render(<OpenRouterDiagnosticReceipt receipt={receipt} onClear={onClear} />);

    expect(screen.getByRole("alert", { name: "OpenRouter diagnostic" })).toBeTruthy();
    expect(screen.getByText(receipt.summary)).toBeTruthy();
    const details = screen.getByText("Technical details").closest("details");
    expect(details?.open).toBe(false);
    fireEvent.click(screen.getByText("Technical details"));
    expect(details?.open).toBe(true);
    expect(screen.getByText("Generation ID: gen-safe_123")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Copy diagnostic receipt" }));
    await waitFor(() => expect(screen.getByRole("status").textContent).toContain("Copied"));
    const copied = writeText.mock.calls[0]?.[0] ?? "";
    expect(copied).toContain("Generation ID: gen-safe_123");
    expect(copied).not.toMatch(/prompt|candidate prose|authorization|sk-or-/iu);

    const logs = screen.getByRole<HTMLAnchorElement>("link", { name: "Open OpenRouter Logs" });
    expect(logs.href).toContain("gen-safe_123");
    expect(logs.target).toBe("_blank");
    fireEvent.click(screen.getByRole("button", { name: "Clear diagnostic" }));
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it("reports copy failure and omits Logs navigation without a validated generation id", async () => {
    const writeText = vi.fn<(text: string) => Promise<void>>(() => Promise.reject(new Error("clipboard unavailable")));
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    const detailsWithoutGenerationId = {
      httpStatus: receipt.details.httpStatus,
      requestedModel: receipt.details.requestedModel,
      returnedModel: receipt.details.returnedModel,
      provider: receipt.details.provider,
      termination: receipt.details.termination,
      nativeFinishReason: receipt.details.nativeFinishReason,
      choiceCount: receipt.details.choiceCount,
      contentShape: receipt.details.contentShape,
      contentLength: receipt.details.contentLength,
      usage: receipt.details.usage
    };
    render(
      <OpenRouterDiagnosticReceipt
        receipt={{ ...receipt, details: detailsWithoutGenerationId }}
      />
    );

    expect(screen.queryByRole("link", { name: "Open OpenRouter Logs" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Copy diagnostic receipt" }));
    await waitFor(() => expect(screen.getByRole("status").textContent).toContain("Copy failed"));
  });
});
