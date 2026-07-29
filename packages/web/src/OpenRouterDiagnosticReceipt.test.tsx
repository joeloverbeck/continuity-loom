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

  it("renders and copies one content-free local structural reason", async () => {
    const writeText = vi.fn<(text: string) => Promise<void>>(() => Promise.resolve());
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    render(
      <OpenRouterDiagnosticReceipt
        receipt={{
          ...receipt,
          classification: "local-validation",
          summary: "Candidate content reached Continuity Loom but failed local Ideate validation.",
          recovery: "Review the safe structural reason, then use the existing Ideate action manually if you want another attempt. No retry is automatic.",
          structuralReason: {
            code: "mismatched-operator",
            message: "Assigned slot 1: the operator did not match the compiled assignment.",
            slotNumber: 1
          }
        }}
      />
    );

    expect(screen.getByText("Safe structural reason:").parentElement?.textContent).toContain(
      "Assigned slot 1: the operator did not match the compiled assignment."
    );
    fireEvent.click(screen.getByRole("button", { name: "Copy diagnostic receipt" }));
    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    const copied = writeText.mock.calls[0]?.[0] ?? "";
    expect(copied).toContain("Structural rule: mismatched-operator");
    expect(copied).toContain("Structural slot: 1");
    expect(copied).toContain("Structural reason: Assigned slot 1: the operator did not match the compiled assignment.");
    expect(copied).not.toMatch(/model-private-field-canary|MODEL-PRIVATE-CITATION|rejected candidate/);
  });

  it("renders and copies a finding-scoped structural reason without response content", async () => {
    const writeText = vi.fn<(text: string) => Promise<void>>(() => Promise.resolve());
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    render(
      <OpenRouterDiagnosticReceipt
        receipt={{
          ...receipt,
          classification: "local-validation",
          structuralReason: {
            code: "invalid-action",
            message: "A finding action was not recognized.",
            findingNumber: 2
          }
        }}
      />
    );

    expect(screen.getByText("Safe structural reason:").parentElement?.textContent).toContain("Finding 2");
    expect(screen.getByText("Safe structural reason:").parentElement?.textContent).toContain(
      "A finding action was not recognized."
    );
    fireEvent.click(screen.getByRole("button", { name: "Copy diagnostic receipt" }));
    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    const copied = writeText.mock.calls[0]?.[0] ?? "";
    expect(copied).toContain("Structural finding: 2");
    expect(copied).toContain("Structural reason: A finding action was not recognized.");
    expect(copied).not.toMatch(/FIX_ALL|model-private-canary|rejected candidate/);
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

  it("offers only explicit affected-class output-limit recovery and announces stale inspection without sending", async () => {
    const writeText = vi.fn<(text: string) => Promise<void>>(() => Promise.resolve());
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    const fetchCalls: Array<{ url: string; init?: RequestInit }> = [];
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string, init?: RequestInit) => {
        fetchCalls.push({ url, ...(init === undefined ? {} : { init }) });
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            model: "test/model",
            temperatureMode: "provider_default",
            proseMaxOutputTokens: 2048,
            assistanceMaxOutputTokens: 4321,
            proseReasoningEffort: "low",
            assistanceReasoningEffort: "medium",
            hasOpenRouterCredential: true
          })
        } as Response);
      })
    );
    const outputLimitReceipt = {
      classification: "incomplete-generation" as const,
      summary: "Generation stopped before the workflow received a complete result.",
      recovery: "Reasoning may have consumed part or all of the completion allowance.",
      sentPolicy: {
        outputClass: "assistance" as const,
        completionCeiling: 4321,
        reasoningEnabled: true as const,
        reasoningEffort: "high" as const,
        reasoningExcluded: true as const,
        supportedLowerEfforts: ["low", "medium"] as const
      },
      details: {
        httpStatus: 200,
        requestedModel: "test/model",
        returnedModel: "returned/model",
        provider: "Safe Provider",
        termination: "length" as const,
        nativeFinishReason: "max_tokens",
        choiceCount: 1,
        contentShape: "null" as const,
        structuralOutcome: "null-content",
        usage: { reasoningTokens: 37 },
        rawBody: "RAW_BODY_MUST_NOT_COPY",
        prompt: "PROMPT_MUST_NOT_COPY",
        candidate: "CANDIDATE_MUST_NOT_COPY",
        acceptedProse: "ACCEPTED_PROSE_MUST_NOT_COPY",
        reasoningContent: "REASONING_CONTENT_MUST_NOT_COPY",
        credentials: "sk-or-secret",
        providerMetadata: { accountId: "ACCOUNT_MUST_NOT_COPY" }
      },
      requestSecret: "REQUEST_SECRET_MUST_NOT_COPY"
    };

    render(<OpenRouterDiagnosticReceipt receipt={outputLimitReceipt} />);

    expect(screen.getByText("Assistance output policy sent")).toBeTruthy();
    expect(screen.getByText(/high reasoning effort with a 4321-token completion ceiling/i)).toBeTruthy();
    expect(screen.getByText(/37 aggregate reasoning tokens/i)).toBeTruthy();
    expect(screen.queryByRole("checkbox", { name: /reasoning/i })).toBeNull();
    expect(screen.queryByText(/Prose reasoning effort/i)).toBeNull();

    fireEvent.change(screen.getByRole("combobox", { name: "Lower Assistance reasoning effort" }), {
      target: { value: "medium" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Lower Assistance effort" }));
    await waitFor(() => expect(screen.getByRole("status").textContent).toContain("Prior inspection is stale"));

    fireEvent.change(screen.getByRole("spinbutton", { name: "Higher Assistance completion ceiling" }), {
      target: { value: "5000" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Raise Assistance ceiling" }));
    await waitFor(() => expect(fetchCalls).toHaveLength(2));

    expect(fetchCalls.map((call) => [call.url, call.init?.method, call.init?.body])).toEqual([
      ["/api/settings/openrouter", "PUT", JSON.stringify({ assistanceReasoningEffort: "medium" })],
      ["/api/settings/openrouter", "PUT", JSON.stringify({ assistanceMaxOutputTokens: 5000 })]
    ]);
    expect(fetchCalls.every((call) => !String(call.url).includes("generate"))).toBe(true);
    expect(fetchCalls.every((call) => !String(call.url).includes("models"))).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "Copy diagnostic receipt" }));
    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    const copied = writeText.mock.calls[0]?.[0] ?? "";
    expect(copied).toContain("Output class: assistance");
    expect(copied).toContain("Returned model: returned/model");
    expect(copied).toContain("Aggregate reasoning tokens: 37");
    expect(copied).not.toMatch(
      /RAW_BODY|PROMPT_MUST|CANDIDATE_MUST|ACCEPTED_PROSE|REASONING_CONTENT|sk-or-secret|ACCOUNT_MUST|REQUEST_SECRET/u
    );
  });

  it("keeps the lower-effort route unavailable when the trusted receipt has no supported lower effort", () => {
    render(
      <OpenRouterDiagnosticReceipt
        receipt={{
          classification: "incomplete-generation",
          summary: "Output limit.",
          recovery: "Choose an explicit affected-class recovery.",
          sentPolicy: {
            outputClass: "prose",
            completionCeiling: 2048,
            reasoningEnabled: true,
            reasoningEffort: "minimal",
            reasoningExcluded: true,
            supportedLowerEfforts: []
          },
          details: {
            httpStatus: 200,
            requestedModel: "test/model",
            termination: "length",
            choiceCount: 1,
            contentShape: "null"
          }
        }}
      />
    );

    expect(screen.getByRole<HTMLSelectElement>("combobox", { name: "Lower Prose reasoning effort" }).disabled).toBe(true);
    expect(screen.getByRole<HTMLButtonElement>("button", { name: "Lower Prose effort" }).disabled).toBe(true);
    expect(screen.getByRole<HTMLButtonElement>("button", { name: "Raise Prose ceiling" }).disabled).toBe(false);
  });

  it("offers recovery for a normalized in-band provider output-limit diagnostic", () => {
    render(
      <OpenRouterDiagnosticReceipt
        receipt={{
          ...receipt,
          summary: "OpenRouter reported an output-limit provider error.",
          recovery: "Choose an explicit affected-class recovery.",
          sentPolicy: {
            outputClass: "prose",
            completionCeiling: 2048,
            reasoningEnabled: true,
            reasoningEffort: "high",
            reasoningExcluded: true,
            supportedLowerEfforts: ["low"]
          }
        }}
      />
    );

    expect(screen.getByRole("button", { name: "Lower Prose effort" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Raise Prose ceiling" })).toBeTruthy();
  });

  it("resets recovery selections when a later output-limit receipt replaces the current one", async () => {
    const firstReceipt = {
      classification: "incomplete-generation" as const,
      summary: "First output limit.",
      recovery: "Choose an explicit affected-class recovery.",
      sentPolicy: {
        outputClass: "prose" as const,
        completionCeiling: 2048,
        reasoningEnabled: true as const,
        reasoningEffort: "high" as const,
        reasoningExcluded: true as const,
        supportedLowerEfforts: ["low", "medium"] as const
      },
      details: {
        httpStatus: 200,
        requestedModel: "test/model",
        termination: "length" as const,
        choiceCount: 1,
        contentShape: "null" as const
      }
    };
    const { rerender } = render(<OpenRouterDiagnosticReceipt receipt={firstReceipt} />);

    fireEvent.change(screen.getByRole("combobox", { name: "Lower Prose reasoning effort" }), {
      target: { value: "low" }
    });
    fireEvent.change(screen.getByRole("spinbutton", { name: "Higher Prose completion ceiling" }), {
      target: { value: "5000" }
    });

    rerender(
      <OpenRouterDiagnosticReceipt
        receipt={{
          ...firstReceipt,
          summary: "Second output limit.",
          sentPolicy: {
            ...firstReceipt.sentPolicy,
            completionCeiling: 6000,
            reasoningEffort: "medium",
            supportedLowerEfforts: ["minimal"]
          }
        }}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole<HTMLSelectElement>("combobox", { name: "Lower Prose reasoning effort" }).value).toBe(
        "minimal"
      );
      expect(screen.getByRole<HTMLInputElement>("spinbutton", { name: "Higher Prose completion ceiling" }).value).toBe(
        "6001"
      );
    });
  });

  it.each([
    {
      classification: "incomplete-generation" as const,
      termination: "length" as const,
      summary: "Generation stopped before the workflow received a complete result.",
      recovery: "Review the completion ceiling, scope, or model, then inspect again before using the existing action. No retry is automatic."
    },
    {
      classification: "incomplete-generation" as const,
      termination: "content-filter" as const,
      summary: "OpenRouter stopped the result for content-policy reasons.",
      recovery: "Review the provider result and selected model, then inspect again before using the existing action. No retry is automatic."
    },
    {
      classification: "incomplete-generation" as const,
      termination: "tool" as const,
      summary: "OpenRouter returned an unexpected tool completion.",
      recovery: "Review the provider result and selected model, then inspect again before using the existing action. No retry is automatic."
    },
    {
      classification: "unrecognized-envelope" as const,
      termination: "normal" as const,
      summary: "The OpenRouter response envelope was unrecognized.",
      recovery: "Copy the sanitized diagnostic receipt and check OpenRouter Logs before using the existing action again. No retry is automatic."
    }
  ])("announces $termination before optional structural detail with manual recovery", (outcome) => {
    render(
      <OpenRouterDiagnosticReceipt
        receipt={{
          classification: outcome.classification,
          summary: outcome.summary,
          recovery: outcome.recovery,
          details: {
            httpStatus: 200,
            requestedModel: "test/model",
            termination: outcome.termination,
            choiceCount: 1,
            contentShape: "null",
            structuralOutcome: "null-content"
          }
        }}
      />
    );

    const alert = screen.getByRole("alert", { name: "OpenRouter diagnostic" });
    expect(alert.textContent).toContain(outcome.summary);
    expect(alert.textContent).toContain(outcome.recovery);
    expect(alert.textContent).toContain("Structural outcome: null-content");
    expect(alert.textContent?.indexOf(outcome.summary)).toBeLessThan(
      alert.textContent?.indexOf("Structural outcome: null-content") ?? -1
    );
    expect(screen.queryByRole("textbox", { name: "Candidate text" })).toBeNull();
  });
});
