import { readFileSync } from "node:fs";

import { describe, expect, it, vi } from "vitest";

import {
  buildChatCompletionRequest,
  inspectChatCompletionRequest,
  type OpenRouterRequest
} from "./openrouter/request.js";
import type { OpenRouterSettingsStatus } from "./settings.js";

describe("OpenRouter send pipeline", () => {
  it("applies strict and prose completion policies after one decoded transport handoff", async () => {
    const { runOpenRouterSendPipeline } = await import("./openrouter/send-pipeline.js");
    const settings: OpenRouterSettingsStatus = {
      model: "test/model",
      temperatureMode: "provider_default",
      proseMaxOutputTokens: 321,
      assistanceMaxOutputTokens: 4321,
      cachedModels: [{
        id: "test/model",
        name: "Test Model",
        supportedParameters: ["max_completion_tokens"]
      }],
      hasOpenRouterCredential: true
    };
    const prompt = "The inspected prompt";
    const expectedRequestFingerprint = (outputPolicy: "strict" | "prose") =>
      inspectChatCompletionRequest(
        buildChatCompletionRequest({ prompt, settings, outputPolicy }),
        outputPolicy,
        settings
      ).requestFingerprint;
    const transport = vi.fn(async () => ({
      ok: true as const,
      candidate: { text: "Incomplete prose must stay prose-only." },
      response: {
        httpStatus: 200,
        requestedModel: "test/model",
        termination: "length" as const,
        nativeFinishReason: "length",
        choiceCount: 1,
        contentShape: "string" as const,
        contentLength: 36
      }
    }));
    const baseProfile = {
      prompt,
      promptFingerprint: "prompt-fingerprint",
      staleness: {
        mode: "separate" as const,
        expectedPromptFingerprint: "prompt-fingerprint",
        expectedRequestFingerprint: "set-per-policy",
        promptRefusal: { status: 409, body: { ok: false } },
        providerRefusal: { status: 409, body: { ok: false } }
      },
      metadata: {
        providerFields: "full" as const,
        placement: "before" as const,
        additions: {}
      }
    };

    const strict = await runOpenRouterSendPipeline({
      profile: {
        ...baseProfile,
        outputPolicy: "strict",
        staleness: { ...baseProfile.staleness, expectedRequestFingerprint: expectedRequestFingerprint("strict") }
      },
      settings,
      transport
    });
    const prose = await runOpenRouterSendPipeline({
      profile: {
        ...baseProfile,
        outputPolicy: "prose",
        staleness: { ...baseProfile.staleness, expectedRequestFingerprint: expectedRequestFingerprint("prose") }
      },
      settings,
      transport
    });

    expect(strict).toMatchObject({
      ok: false,
      body: {
        ok: false,
        category: "output-limit",
        classification: "incomplete-generation",
        diagnostic: {
          classification: "incomplete-generation",
          details: {
            termination: "length",
            contentShape: "string",
            contentLength: 36
          }
        }
      }
    });
    expect(JSON.stringify(strict)).not.toContain("Incomplete prose must stay prose-only.");
    expect(prose).toMatchObject({
      ok: true,
      candidate: {
        text: "Incomplete prose must stay prose-only.",
        incomplete: true
      },
      diagnostic: {
        classification: "incomplete-prose",
        details: {
          termination: "length",
          contentLength: 36
        }
      }
    });

    transport.mockResolvedValue({
      ok: true,
      response: {
        httpStatus: 200,
        requestedModel: "test/model",
        termination: "length",
        nativeFinishReason: "length",
        choiceCount: 1,
        contentShape: "null",
        structuralOutcome: "null-content"
      }
    });

    const strictWithoutCandidate = await runOpenRouterSendPipeline({
      profile: {
        ...baseProfile,
        outputPolicy: "strict",
        staleness: { ...baseProfile.staleness, expectedRequestFingerprint: expectedRequestFingerprint("strict") }
      },
      settings,
      transport
    });
    const proseWithoutCandidate = await runOpenRouterSendPipeline({
      profile: {
        ...baseProfile,
        outputPolicy: "prose",
        staleness: { ...baseProfile.staleness, expectedRequestFingerprint: expectedRequestFingerprint("prose") }
      },
      settings,
      transport
    });

    for (const result of [strictWithoutCandidate, proseWithoutCandidate]) {
      expect(result).toMatchObject({
        ok: false,
        body: {
          ok: false,
          category: "output-limit",
          classification: "incomplete-generation",
          diagnostic: {
            classification: "incomplete-generation",
            details: {
              termination: "length",
              contentShape: "null",
              structuralOutcome: "null-content"
            }
          }
        }
      });
      expect(JSON.stringify(result)).not.toContain("candidate");
    }
    expect(transport).toHaveBeenCalledTimes(4);

    transport.mockClear();
    for (const terminationCase of [
      {
        termination: "content-filter" as const,
        category: "content-policy",
        summary: "OpenRouter stopped the result for content-policy reasons."
      },
      {
        termination: "tool" as const,
        category: "invalid-request",
        summary: "OpenRouter returned an unexpected tool completion."
      }
    ]) {
      for (const candidate of [undefined, { text: "UNUSABLE_TERMINATED_CONTENT" }]) {
        transport.mockResolvedValue({
          ok: true,
          ...(candidate === undefined ? {} : { candidate }),
          response: {
            httpStatus: 200,
            requestedModel: "test/model",
            termination: terminationCase.termination,
            choiceCount: 1,
            contentShape: candidate === undefined ? "null" : "string",
            ...(candidate === undefined
              ? { structuralOutcome: "null-content" as const }
              : { contentLength: candidate.text.length })
          }
        });

        for (const outputPolicy of ["strict", "prose"] as const) {
          const result = await runOpenRouterSendPipeline({
            profile: {
              ...baseProfile,
              outputPolicy,
              staleness: {
                ...baseProfile.staleness,
                expectedRequestFingerprint: expectedRequestFingerprint(outputPolicy)
              }
            },
            settings,
            transport
          });
          expect(result).toMatchObject({
            ok: false,
            body: {
              ok: false,
              category: terminationCase.category,
              classification: "incomplete-generation",
              message: terminationCase.summary,
              diagnostic: {
                classification: "incomplete-generation",
                summary: terminationCase.summary,
                details: { termination: terminationCase.termination }
              }
            }
          });
          expect(JSON.stringify(result)).not.toContain("UNUSABLE_TERMINATED_CONTENT");
        }
      }
    }
    expect(transport).toHaveBeenCalledTimes(8);
  });

  it("uses injected settings and transport for one finalized admitted request with trusted metadata", async () => {
    const { runOpenRouterSendPipeline } = await import("./openrouter/send-pipeline.js");
    const settings: OpenRouterSettingsStatus = {
      model: "test/model",
      temperatureMode: "provider_default",
      proseMaxOutputTokens: 321,
      assistanceMaxOutputTokens: 4321,
      topP: 0.75,
      cachedModels: [{
        id: "test/model",
        name: "Test Model",
        supportedParameters: ["max_completion_tokens", "top_p"]
      }],
      hasOpenRouterCredential: true
    };
    const prompt = "The inspected prompt";
    const expectedRequest = buildChatCompletionRequest({ prompt, settings, outputPolicy: "strict" });
    const expectedRequestFingerprint = inspectChatCompletionRequest(
      expectedRequest,
      "strict",
      settings
    ).requestFingerprint;
    let transportedRequest: OpenRouterRequest | undefined;
    const transport = vi.fn(async ({ request }: { request: OpenRouterRequest }) => {
      transportedRequest = request;
      return {
        ok: true as const,
        candidate: { text: "Candidate text" },
        response: {
          httpStatus: 200,
          requestedModel: "test/model",
          termination: "normal" as const,
          nativeFinishReason: "stop",
          choiceCount: 1,
          contentShape: "string" as const,
          contentLength: 14
        }
      };
    });

    const result = await runOpenRouterSendPipeline({
      profile: {
        outputPolicy: "strict",
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
        maxOutputTokens: 4321,
        topP: 0.75,
        versions: { template: "1", compiler: "2", contract: "3" }
      },
      response: {
        httpStatus: 200,
        requestedModel: "test/model",
        termination: "normal",
        nativeFinishReason: "stop",
        choiceCount: 1,
        contentShape: "string",
        contentLength: 14
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
      expect(source).not.toContain("decodeOpenRouterResponse");
      expect(source).not.toContain("normalizeTermination");
      expect(source).not.toContain("structuralOutcomeFor");
      expect(source).not.toContain("contextWindow:");
      expect(source.match(/\brunOpenRouterSendPipeline\(/g)).toHaveLength(1);
    }

    expect(routeSources["generate-routes.ts"]).not.toContain("buildChatCompletionRequest");
    expect(routeSources["ideate-routes.ts"]).not.toContain("buildChatCompletionRequest");
    expect(routeSources["generate-routes.ts"]).toMatch(/outputPolicy:\s*"prose"/u);
    for (const filename of [
      "ideate-routes.ts",
      "record-hygiene-routes.ts",
      "cast-possibilities-routes.ts",
      "accepted-segment-change-review-routes.ts"
    ]) {
      expect(routeSources[filename]).toMatch(/outputPolicy:\s*"strict"/u);
    }
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
      proseMaxOutputTokens: 50,
      assistanceMaxOutputTokens: 100,
      cachedModels: [{
        id: "test/model",
        name: "Test Model",
        supportedParameters: ["temperature", "max_completion_tokens"]
      }],
      hasOpenRouterCredential: true
    };
    const prompt = "Current prompt";
    const requestFingerprint = inspectChatCompletionRequest(
      buildChatCompletionRequest({ prompt, settings, outputPolicy: "strict" }),
      "strict",
      settings
    ).requestFingerprint;
    const transport = vi.fn(async () => ({
      ok: true as const,
      candidate: { text: "must not be sent" },
      response: {
        httpStatus: 200,
        requestedModel: "test/model",
        termination: "normal" as const,
        choiceCount: 1,
        contentShape: "string" as const,
        contentLength: 16
      }
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
        outputPolicy: "strict",
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
        outputPolicy: "strict",
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
        outputPolicy: "strict",
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
        outputPolicy: "strict",
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
