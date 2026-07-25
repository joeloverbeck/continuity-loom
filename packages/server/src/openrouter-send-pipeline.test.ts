import { readFileSync } from "node:fs";

import { describe, expect, it, vi } from "vitest";

import {
  buildChatCompletionRequest,
  inspectChatCompletionRequest,
  type OpenRouterRequest
} from "./openrouter/request.js";
import type { OpenRouterSettingsStatus } from "./settings.js";

describe("OpenRouter send pipeline", () => {
  it("uses injected settings and transport for one finalized admitted request with trusted metadata", async () => {
    const { runOpenRouterSendPipeline } = await import("./openrouter/send-pipeline.js");
    const settings: OpenRouterSettingsStatus = {
      model: "test/model",
      temperatureMode: "provider_default",
      maxOutputTokens: 321,
      topP: 0.75,
      cachedModels: [{
        id: "test/model",
        name: "Test Model",
        supportedParameters: ["max_completion_tokens", "top_p"]
      }],
      hasOpenRouterCredential: true
    };
    const prompt = "The inspected prompt";
    const expectedRequest = buildChatCompletionRequest({ prompt, settings });
    const expectedRequestFingerprint = inspectChatCompletionRequest(expectedRequest).requestFingerprint;
    let transportedRequest: OpenRouterRequest | undefined;
    const transport = vi.fn(async ({ request }: { request: OpenRouterRequest }) => {
      transportedRequest = request;
      return { ok: true as const, candidate: { text: "Candidate text" } };
    });

    const result = await runOpenRouterSendPipeline({
      profile: {
        prompt,
        promptFingerprint: "prompt-fingerprint",
        staleness: {
          mode: "separate",
          expectedPromptFingerprint: "prompt-fingerprint",
          expectedRequestFingerprint,
          promptRefusal: {
            status: 409,
            body: { ok: false, kind: "stale-prompt", message: "Prompt changed." }
          },
          providerRefusal: {
            status: 409,
            body: { ok: false, kind: "stale-provider-request", message: "Provider changed." }
          }
        },
        metadata: {
          providerFields: "full",
          placement: "before",
          additions: { versions: { template: "1", compiler: "2", contract: "3" } }
        }
      },
      settings,
      transport
    });

    expect(transport).toHaveBeenCalledTimes(1);
    expect(transportedRequest).toEqual(expectedRequest);
    expect(result).toEqual({
      ok: true,
      candidate: { text: "Candidate text" },
      metadata: {
        model: "test/model",
        provider: "openrouter",
        temperatureMode: "provider_default",
        maxOutputTokens: 321,
        topP: 0.75,
        versions: { template: "1", compiler: "2", contract: "3" }
      }
    });
  });

  it("is the sole owner of send-path primitives and contains no context-window refusal gate", () => {
    const routeSources = Object.fromEntries(
      [
        "generate-routes.ts",
        "ideate-routes.ts",
        "record-hygiene-routes.ts",
        "cast-possibilities-routes.ts",
        "accepted-segment-change-review-routes.ts"
      ].map((filename) => [
        filename,
        readFileSync(new URL(`./${filename}`, import.meta.url), "utf8")
      ])
    );
    const pipelineSource = readFileSync(new URL("./openrouter/send-pipeline.ts", import.meta.url), "utf8");

    for (const source of Object.values(routeSources)) {
      expect(source).not.toContain("admitOpenRouterRequest");
      expect(source).not.toContain("sendChatCompletion");
      expect(source).not.toContain("contextWindow:");
      expect(source.match(/\brunOpenRouterSendPipeline\(/g)).toHaveLength(1);
    }

    expect(routeSources["generate-routes.ts"]).not.toContain("buildChatCompletionRequest");
    expect(routeSources["ideate-routes.ts"]).not.toContain("buildChatCompletionRequest");
    for (const filename of [
      "record-hygiene-routes.ts",
      "cast-possibilities-routes.ts",
      "accepted-segment-change-review-routes.ts"
    ]) {
      expect(routeSources[filename]?.match(/\bbuildChatCompletionRequest\(/g)).toHaveLength(1);
    }

    expect(pipelineSource.match(/\bbuildChatCompletionRequest\(/g)).toHaveLength(1);
    expect(pipelineSource.match(/\badmitOpenRouterRequest\(/g)).toHaveLength(1);
    expect(pipelineSource).not.toContain("contextWindow");
    expect(pipelineSource).not.toContain("isPromptTooLarge");
    expect(pipelineSource).not.toContain("prompt-too-large");
    expect(pipelineSource).toContain("input.settings ?? readOpenRouterSettings()");
    expect(pipelineSource).toContain("input.transport ?? sendChatCompletion");
  });

  it("preserves separate and combined staleness vocabularies before transport", async () => {
    const { runOpenRouterSendPipeline } = await import("./openrouter/send-pipeline.js");
    const settings: OpenRouterSettingsStatus = {
      model: "test/model",
      temperatureMode: "explicit",
      temperature: 0.4,
      maxOutputTokens: 100,
      cachedModels: [{
        id: "test/model",
        name: "Test Model",
        supportedParameters: ["temperature", "max_completion_tokens"]
      }],
      hasOpenRouterCredential: true
    };
    const prompt = "Current prompt";
    const requestFingerprint = inspectChatCompletionRequest(
      buildChatCompletionRequest({ prompt, settings })
    ).requestFingerprint;
    const transport = vi.fn(async () => ({
      ok: true as const,
      candidate: { text: "must not be sent" }
    }));
    const metadata = {
      providerFields: "identity" as const,
      placement: "after" as const,
      additions: {}
    };
    const promptRefusal = {
      status: 409,
      body: { ok: false, kind: "prompt-stale", message: "Prompt stale." }
    };
    const providerRefusal = {
      status: 409,
      body: { ok: false, kind: "provider-stale", message: "Provider stale." }
    };
    const combinedRefusal = {
      status: 409,
      body: { ok: false, kind: "combined-stale", message: "Source or provider stale." }
    };

    const separatePrompt = await runOpenRouterSendPipeline({
      profile: {
        prompt,
        promptFingerprint: "current",
        staleness: {
          mode: "separate",
          expectedPromptFingerprint: "inspected",
          expectedRequestFingerprint: requestFingerprint,
          promptRefusal,
          providerRefusal
        },
        metadata
      },
      settings,
      transport
    });
    const separateProvider = await runOpenRouterSendPipeline({
      profile: {
        prompt,
        promptFingerprint: "current",
        staleness: {
          mode: "separate",
          expectedPromptFingerprint: "current",
          expectedRequestFingerprint: "inspected-provider",
          promptRefusal,
          providerRefusal
        },
        metadata
      },
      settings,
      transport
    });
    const combinedPrompt = await runOpenRouterSendPipeline({
      profile: {
        prompt,
        promptFingerprint: "current",
        staleness: {
          mode: "combined",
          expectedPromptFingerprint: "inspected",
          expectedRequestFingerprint: requestFingerprint,
          refusal: combinedRefusal
        },
        metadata
      },
      settings,
      transport
    });
    const combinedProvider = await runOpenRouterSendPipeline({
      profile: {
        prompt,
        promptFingerprint: "current",
        staleness: {
          mode: "combined",
          expectedPromptFingerprint: "current",
          expectedRequestFingerprint: "inspected-provider",
          refusal: combinedRefusal
        },
        metadata
      },
      settings,
      transport
    });

    expect(separatePrompt).toEqual({ ok: false, ...promptRefusal });
    expect(separateProvider).toEqual({ ok: false, ...providerRefusal });
    expect(combinedPrompt).toEqual({ ok: false, ...combinedRefusal });
    expect(combinedProvider).toEqual({ ok: false, ...combinedRefusal });
    expect(transport).not.toHaveBeenCalled();
  });
});
