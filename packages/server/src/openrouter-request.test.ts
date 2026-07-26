import { describe, expect, it } from "vitest";

import {
  buildChatCompletionRequest,
  fingerprintChatCompletionRequest,
  inspectChatCompletionRequest
} from "./openrouter/request.js";

describe("buildChatCompletionRequest", () => {
  it("selects one mandatory reasoning policy and ceiling through the output policy", () => {
    const settings = {
      model: "test/model",
      temperatureMode: "provider_default" as const,
      proseMaxOutputTokens: 1200,
      assistanceMaxOutputTokens: 5000,
      proseReasoningEffort: "low" as const,
      assistanceReasoningEffort: "high" as const,
      cachedModels: [{
        id: "test/model",
        name: "Test Model",
        supportedParameters: ["max_completion_tokens", "reasoning"],
        supportedEfforts: ["low" as const, "high" as const]
      }]
    };
    const proseRequest = buildChatCompletionRequest({ prompt: "Same prompt", settings, outputPolicy: "prose" });
    const assistanceRequest = buildChatCompletionRequest({
      prompt: "Same prompt",
      settings,
      outputPolicy: "strict"
    });

    expect(inspectChatCompletionRequest(proseRequest, "prose", settings)).toMatchObject({
      completionCeilingClass: "prose",
      maxOutputTokens: 1200,
      reasoningEnabled: true,
      reasoningEffort: "low",
      reasoningExcluded: true,
      capabilitySnapshot: { supportedEfforts: ["low", "high"] },
      admission: { ok: true }
    });
    expect(inspectChatCompletionRequest(assistanceRequest, "strict", settings)).toMatchObject({
      completionCeilingClass: "assistance",
      maxOutputTokens: 5000,
      reasoningEnabled: true,
      reasoningEffort: "high",
      reasoningExcluded: true,
      admission: { ok: true }
    });
    expect(proseRequest.reasoning).toEqual({ effort: "low", exclude: true });
    expect(assistanceRequest.reasoning).toEqual({ effort: "high", exclude: true });
    expect(fingerprintChatCompletionRequest(proseRequest, "prose", settings)).not.toBe(
      fingerprintChatCompletionRequest(assistanceRequest, "strict", settings)
    );
    expect(fingerprintChatCompletionRequest(proseRequest, "prose", settings)).toBe(fingerprintChatCompletionRequest(
      buildChatCompletionRequest({
        prompt: "Same prompt",
        settings: { ...settings, assistanceMaxOutputTokens: 9000 },
        outputPolicy: "prose"
      }), "prose", { ...settings, assistanceMaxOutputTokens: 9000 }
    ));
    expect(fingerprintChatCompletionRequest(assistanceRequest, "strict", settings)).toBe(fingerprintChatCompletionRequest(
      buildChatCompletionRequest({
        prompt: "Same prompt",
        settings: { ...settings, proseMaxOutputTokens: 3000 },
        outputPolicy: "strict"
      }), "strict", { ...settings, proseMaxOutputTokens: 3000 }
    ));
  });

  it("builds a non-streaming chat completion request from the compiled prompt and settings", () => {
    expect(
      buildChatCompletionRequest({
        prompt: "Compiled prompt\nwith records.",
        settings: {
          model: "anthropic/claude-sonnet-4",
          temperatureMode: "explicit",
          temperature: 0.7,
          proseMaxOutputTokens: 1800,
          assistanceMaxOutputTokens: 4096,
          proseReasoningEffort: "low",
          assistanceReasoningEffort: "low",
          topP: 0.9
        },
        outputPolicy: "prose"
      })
    ).toEqual({
      model: "anthropic/claude-sonnet-4",
      messages: [{ role: "user", content: "Compiled prompt\nwith records." }],
      temperature: 0.7,
      max_completion_tokens: 1800,
      reasoning: { effort: "low", exclude: true },
      top_p: 0.9,
      provider: { require_parameters: true, allow_fallbacks: false },
      plugins: [],
      transforms: [],
      tools: [],
      tool_choice: "none",
      stream: false
    });
  });

  it("omits top_p when topP is not configured", () => {
    const request = buildChatCompletionRequest({
      prompt: "Prompt",
      settings: {
        model: "openai/gpt-4.1",
        temperatureMode: "explicit",
        temperature: 1,
        proseMaxOutputTokens: 1024,
        assistanceMaxOutputTokens: 4096,
        proseReasoningEffort: "low",
        assistanceReasoningEffort: "low"
      },
      outputPolicy: "prose"
    });

    expect(request).toEqual({
      model: "openai/gpt-4.1",
      messages: [{ role: "user", content: "Prompt" }],
      temperature: 1,
      max_completion_tokens: 1024,
      reasoning: { effort: "low", exclude: true },
      provider: { require_parameters: true, allow_fallbacks: false },
      plugins: [],
      transforms: [],
      tools: [],
      tool_choice: "none",
      stream: false
    });
    expect(request).not.toHaveProperty("top_p");
    expect(request.messages).toHaveLength(1);
  });

  it("preserves global routing and no-transform protections around workflow options", () => {
    const request = buildChatCompletionRequest({
      prompt: "Prompt",
      settings: {
        model: "openai/gpt-4.1",
        temperatureMode: "explicit",
        temperature: 1,
        proseMaxOutputTokens: 1024,
        assistanceMaxOutputTokens: 4096,
        proseReasoningEffort: "low",
        assistanceReasoningEffort: "low"
      },
      outputPolicy: "strict",
      requestOptions: {
        provider: { require_parameters: false, allow_fallbacks: true, data_collection: "deny" },
        plugins: [{ id: "unexpected" }],
        transforms: ["middle-out"],
        tools: [{ type: "function", function: { name: "lookup" } }],
        tool_choice: "auto"
      }
    });

    expect(request.provider).toEqual({
      require_parameters: true,
      allow_fallbacks: false,
      data_collection: "deny"
    });
    expect(request.plugins).toEqual([]);
    expect(request.transforms).toEqual([]);
    expect(request.tools).toHaveLength(1);
    expect(request.tool_choice).toBe("auto");
  });

  it("omits temperature in provider-default mode and discloses no invented numeric value", () => {
    const settings = {
      model: "anthropic/claude-sonnet-5",
      temperatureMode: "provider_default" as const,
      proseMaxOutputTokens: 1024,
      assistanceMaxOutputTokens: 2048,
      proseReasoningEffort: "low" as const,
      assistanceReasoningEffort: "low" as const
    };
    const request = buildChatCompletionRequest({
      prompt: "Prompt",
      settings,
      outputPolicy: "strict"
    });

    expect(request).not.toHaveProperty("temperature");
    expect(inspectChatCompletionRequest(request, "strict", settings)).toEqual({
      model: "anthropic/claude-sonnet-5",
      temperatureMode: "provider_default",
      completionCeilingClass: "assistance",
      maxOutputTokens: 2048,
      reasoningEnabled: true,
      reasoningEffort: "low",
      reasoningExcluded: true,
      capabilitySnapshot: {
        model: "anthropic/claude-sonnet-5",
        cacheEntryFound: false,
        supportedParameters: null,
        supportedEfforts: null
      },
      admission: {
        ok: false,
        category: "structured-output-capability-unknown",
        message: "The selected model has no usable cached reasoning-effort capability data.",
        recovery: "Refresh the OpenRouter model list, then reinspect before using the existing action. No request was sent; no retry is automatic."
      },
      requestFingerprint: fingerprintChatCompletionRequest(request, "strict", settings)
    });
  });

  it("discloses only the selected model's capability snapshot and fingerprints cache changes", () => {
    const settings = {
      model: "provider/selected",
      temperatureMode: "provider_default" as const,
      proseMaxOutputTokens: 1024,
      assistanceMaxOutputTokens: 2048,
      proseReasoningEffort: "low" as const,
      assistanceReasoningEffort: "low" as const,
      cachedModels: [
        { id: "provider/other", name: "Other", contextLength: 999 },
        { id: "provider/selected", name: "Selected", contextLength: 4096 }
      ]
    };
    const request = buildChatCompletionRequest({ prompt: "Prompt", settings, outputPolicy: "strict" });

    const inspected = inspectChatCompletionRequest(request, "strict", settings);
    expect(inspected).toEqual({
      model: "provider/selected",
      temperatureMode: "provider_default",
      completionCeilingClass: "assistance",
      maxOutputTokens: 2048,
      reasoningEnabled: true,
      reasoningEffort: "low",
      reasoningExcluded: true,
      capabilitySnapshot: {
        model: "provider/selected",
        cacheEntryFound: true,
        supportedParameters: null,
        supportedEfforts: null,
        contextLength: 4096
      },
      admission: {
        ok: false,
        category: "structured-output-capability-unknown",
        message: "The selected model has no usable cached reasoning-effort capability data.",
        recovery: "Refresh the OpenRouter model list, then reinspect before using the existing action. No request was sent; no retry is automatic."
      },
      contextLength: 4096,
      requestFingerprint: fingerprintChatCompletionRequest(request, "strict", settings)
    });
    const refreshed = inspectChatCompletionRequest(request, "strict", {
      ...settings,
      cachedModels: [{ id: "provider/selected", name: "Selected" }]
    });
    expect(refreshed).not.toHaveProperty("contextLength");
    expect(refreshed.requestFingerprint).not.toBe(inspected.requestFingerprint);
  });

  it("refuses inspection when the ceiling policy contradicts the finalized request", () => {
    const settings = {
      model: "provider/selected",
      temperatureMode: "provider_default" as const,
      proseMaxOutputTokens: 1024,
      assistanceMaxOutputTokens: 4096,
      proseReasoningEffort: "low" as const,
      assistanceReasoningEffort: "low" as const
    };
    const request = buildChatCompletionRequest({ prompt: "Prompt", settings, outputPolicy: "prose" });

    expect(() => inspectChatCompletionRequest(request, "strict", settings)).toThrow(
      /finalized request uses 1024 completion tokens but the Assistance ceiling is 4096/i
    );
  });

  it("fingerprints provider configuration without changing prompt bytes", () => {
    const explicit = buildChatCompletionRequest({
      prompt: "Byte-identical prompt",
      settings: {
        model: "test/model",
        temperatureMode: "explicit",
        temperature: 1,
        proseMaxOutputTokens: 1024,
        assistanceMaxOutputTokens: 4096,
        proseReasoningEffort: "low",
        assistanceReasoningEffort: "low"
      },
      outputPolicy: "prose"
    });
    const providerDefault = buildChatCompletionRequest({
      prompt: "Byte-identical prompt",
      settings: {
        model: "test/model",
        temperatureMode: "provider_default",
        proseMaxOutputTokens: 1024,
        assistanceMaxOutputTokens: 4096,
        proseReasoningEffort: "low",
        assistanceReasoningEffort: "low"
      },
      outputPolicy: "prose"
    });

    expect(explicit.messages).toEqual(providerDefault.messages);
    expect(fingerprintChatCompletionRequest(explicit, "prose", {
      model: "test/model",
      temperatureMode: "explicit",
      temperature: 1,
      proseMaxOutputTokens: 1024,
      assistanceMaxOutputTokens: 4096,
      proseReasoningEffort: "low",
      assistanceReasoningEffort: "low"
    })).not.toBe(fingerprintChatCompletionRequest(providerDefault, "prose", {
      model: "test/model",
      temperatureMode: "provider_default",
      proseMaxOutputTokens: 1024,
      assistanceMaxOutputTokens: 4096,
      proseReasoningEffort: "low",
      assistanceReasoningEffort: "low"
    }));
  });
});
