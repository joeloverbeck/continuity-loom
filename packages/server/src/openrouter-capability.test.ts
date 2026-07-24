import { describe, expect, it } from "vitest";

import {
  admitOpenRouterRequest,
  requiredOpenRouterCapabilities,
  type CapabilityAdmissionResult
} from "./openrouter/capability.js";
import { buildChatCompletionRequest, type OpenRouterRequestOptions } from "./openrouter/request.js";
import type { ModelListEntry } from "./settings.js";

// The exact strict structured-output request options both analyze routes send.
const strictRequestOptions: OpenRouterRequestOptions = {
  response_format: {
    type: "json_schema",
    json_schema: { name: "accepted_segment_change_review", strict: true, schema: { type: "object" } }
  },
  provider: { require_parameters: true, allow_fallbacks: false },
  transforms: [],
  plugins: [],
  tools: [],
  tool_choice: "none"
};

// Observed OpenRouter /api/v1/models supported_parameters unions (2026-07-21).
const sonnet4Union = [
  "include_reasoning",
  "max_tokens",
  "reasoning",
  "stop",
  "temperature",
  "tool_choice",
  "tools",
  "top_k",
  "top_p"
];
const sonnet46Union = [
  "include_reasoning",
  "max_completion_tokens",
  "max_tokens",
  "reasoning",
  "reasoning_effort",
  "response_format",
  "stop",
  "structured_outputs",
  "temperature",
  "tool_choice",
  "tools",
  "top_k",
  "top_p",
  "verbosity"
];

function admit(model: string, cachedModels?: ModelListEntry[]): CapabilityAdmissionResult {
  const request = buildChatCompletionRequest({
    prompt: "",
    settings: {
      model,
      temperatureMode: "explicit",
      temperature: 0,
      maxOutputTokens: 4096,
      topP: 1
    },
    requestOptions: strictRequestOptions
  });
  return admitOpenRouterRequest({ request, cachedModels });
}

describe("admitOpenRouterRequest", () => {
  it("admits a model whose capability union covers the exact strict envelope", () => {
    const result = admit("anthropic/claude-sonnet-4.6", [
      { id: "anthropic/claude-sonnet-4.6", name: "Sonnet 4.6", supportedParameters: sonnet46Union }
    ]);

    expect(result).toEqual({ ok: true });
  });

  it("admits when completion length is advertised only as max_tokens (no max_completion_tokens alias)", () => {
    const result = admit("compat/max-tokens-only", [
      {
        id: "compat/max-tokens-only",
        name: "Compatible",
        supportedParameters: ["response_format", "structured_outputs", "temperature", "top_p", "max_tokens"]
      }
    ]);

    expect(result).toEqual({ ok: true });
  });

  it("rejects a model whose union lacks response_format and structured_outputs (the Sonnet 4 defect)", () => {
    const result = admit("anthropic/claude-sonnet-4", [
      { id: "anthropic/claude-sonnet-4", name: "Sonnet 4", supportedParameters: sonnet4Union }
    ]);

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected rejection");
    expect(result.category).toBe("structured-output-incompatible-model");
    expect(result.missingCapabilities).toEqual(expect.arrayContaining(["response_format", "structured_outputs"]));
    expect(result.recovery).toMatch(/every named requirement/i);
    expect(result.message.length).toBeGreaterThan(0);
  });

  it("rejects strict output when structured_outputs is absent even though response_format is present", () => {
    const result = admit("nonstrict/response-format-only", [
      {
        id: "nonstrict/response-format-only",
        name: "Non-strict",
        supportedParameters: ["response_format", "temperature", "top_p", "max_tokens"]
      }
    ]);

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected rejection");
    expect(result.category).toBe("structured-output-incompatible-model");
    expect(result.missingCapabilities).toEqual(["structured_outputs"]);
  });

  it("fails closed with capability-unknown when the model list is absent", () => {
    const result = admit("anthropic/claude-sonnet-4.6");

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected rejection");
    expect(result.category).toBe("structured-output-capability-unknown");
    expect(result.recovery).toMatch(/refresh/i);
  });

  it("fails closed with capability-unknown when the selected model is not in the cache", () => {
    const result = admit("anthropic/claude-sonnet-4.6", [
      { id: "some/other-model", name: "Other", supportedParameters: sonnet46Union }
    ]);

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected rejection");
    expect(result.category).toBe("structured-output-capability-unknown");
  });

  it("fails closed with capability-unknown when capability metadata is missing on the entry", () => {
    const result = admit("model/no-capabilities", [
      { id: "model/no-capabilities", name: "No caps" }
    ]);

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected rejection");
    expect(result.category).toBe("structured-output-capability-unknown");
  });

  it("fails closed with capability-unknown when capability metadata is empty", () => {
    const result = admit("model/empty-capabilities", [
      { id: "model/empty-capabilities", name: "Empty caps", supportedParameters: [] }
    ]);

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected rejection");
    expect(result.category).toBe("structured-output-capability-unknown");
  });

  it("never leaks secrets or prompt material in the sanitized rejection", () => {
    const result = admit("anthropic/claude-sonnet-4", [
      { id: "anthropic/claude-sonnet-4", name: "Sonnet 4", supportedParameters: sonnet4Union }
    ]);

    const serialized = JSON.stringify(result);
    expect(serialized).not.toMatch(/sk-or-|Bearer|Authorization/i);
  });
});

describe("requiredOpenRouterCapabilities", () => {
  it("derives strict-output, sampling, completion-length, and response-format requirements from the exact envelope", () => {
    const requirements = requiredOpenRouterCapabilities(finalizedStrictRequest());
    const anyOf = requirements.map((requirement) => requirement.anyOf);

    // strict json_schema requires both response_format and structured_outputs
    expect(anyOf).toContainEqual(["response_format"]);
    expect(anyOf).toContainEqual(["structured_outputs"]);
    // sampling controls that the envelope actually sends
    expect(anyOf).toContainEqual(["temperature"]);
    expect(anyOf).toContainEqual(["top_p"]);
    // completion length is an alias group so a max_tokens-only endpoint qualifies
    expect(anyOf).toContainEqual(["max_tokens", "max_completion_tokens"]);
  });

  it("omits tool requirements when the envelope requests no tools", () => {
    const requirements = requiredOpenRouterCapabilities(finalizedStrictRequest());
    const flattened = requirements.flatMap((requirement) => requirement.anyOf);

    expect(flattened).not.toContain("tools");
    expect(flattened).not.toContain("tool_choice");
  });

  it("requires tool capabilities only when the envelope actually requests tool use", () => {
    const requirements = requiredOpenRouterCapabilities(
      finalizedStrictRequest({
        ...strictRequestOptions,
        tools: [{ type: "function", function: { name: "lookup" } }],
        tool_choice: "auto"
      })
    );
    const flattened = requirements.flatMap((requirement) => requirement.anyOf);

    expect(flattened).toContain("tools");
    expect(flattened).toContain("tool_choice");
  });

  it("requires an active tool choice even when the envelope has no tools array", () => {
    const requirements = requiredOpenRouterCapabilities(
      finalizedStrictRequest({
        ...strictRequestOptions,
        tools: [],
        tool_choice: "required"
      })
    );
    const flattened = requirements.flatMap((requirement) => requirement.anyOf);

    expect(flattened).not.toContain("tools");
    expect(flattened).toContain("tool_choice");
  });

  it("omits the top_p requirement when the envelope sends no top_p", () => {
    const requirements = requiredOpenRouterCapabilities(
      buildChatCompletionRequest({
        prompt: "",
        settings: {
          model: "any/model",
          temperatureMode: "explicit",
          temperature: 0,
          maxOutputTokens: 4096
        },
        requestOptions: strictRequestOptions
      })
    );
    const flattened = requirements.flatMap((requirement) => requirement.anyOf);

    expect(flattened).not.toContain("top_p");
  });
});

function finalizedStrictRequest(requestOptions: OpenRouterRequestOptions = strictRequestOptions) {
  return buildChatCompletionRequest({
    prompt: "",
    settings: {
      model: "any/model",
      temperatureMode: "explicit",
      temperature: 0,
      maxOutputTokens: 4096,
      topP: 1
    },
    requestOptions
  });
}

describe("finalized request admission", () => {
  const sonnet5ShapedCapabilities = [
    "response_format",
    "structured_outputs",
    "max_completion_tokens"
  ];

  function finalizedRequest(temperatureMode: "explicit" | "provider_default", topP?: number) {
    return buildChatCompletionRequest({
      prompt: "Prompt",
      settings: {
        model: "synthetic/sonnet-5",
        temperatureMode,
        ...(temperatureMode === "explicit" ? { temperature: 1 } : {}),
        maxOutputTokens: 2048,
        ...(topP === undefined ? {} : { topP })
      },
      requestOptions: strictRequestOptions
    });
  }

  it("derives conditional sampling requirements from the exact finalized object", () => {
    const providerDefault = finalizedRequest("provider_default");
    const explicit = finalizedRequest("explicit");
    const withTopP = finalizedRequest("provider_default", 0.9);

    expect(requiredOpenRouterCapabilities(providerDefault).flatMap((requirement) => requirement.anyOf))
      .not.toContain("temperature");
    expect(requiredOpenRouterCapabilities(explicit).flatMap((requirement) => requirement.anyOf))
      .toContain("temperature");
    expect(requiredOpenRouterCapabilities(withTopP).flatMap((requirement) => requirement.anyOf))
      .toContain("top_p");
  });

  it("admits provider-default and rejects only the exact missing explicit parameter", () => {
    const cachedModels = [{
      id: "synthetic/sonnet-5",
      name: "Synthetic Sonnet 5",
      supportedParameters: sonnet5ShapedCapabilities
    }];

    expect(admitOpenRouterRequest({ request: finalizedRequest("provider_default"), cachedModels }))
      .toEqual({ ok: true });
    expect(admitOpenRouterRequest({ request: finalizedRequest("explicit"), cachedModels }))
      .toMatchObject({
        ok: false,
        missingCapabilities: ["temperature"]
      });
  });
});
