import { createHash } from "node:crypto";

import type { OpenRouterSettings } from "../settings.js";
import {
  admitOpenRouterRequest,
  type CapabilityAdmissionResult
} from "./capability.js";
import {
  resolveOutputPolicy,
  type CompletionCeilingClass,
  type OpenRouterOutputPolicy,
  type ReasoningEffort
} from "./output-policy.js";

export interface OpenRouterMessage {
  role: "user";
  content: string;
}

export interface OpenRouterRequest {
  model: string;
  messages: [OpenRouterMessage];
  temperature?: number;
  max_completion_tokens: number;
  reasoning: { effort: ReasoningEffort; exclude: true };
  top_p?: number;
  stream: false;
  response_format?: unknown;
  provider?: unknown;
  plugins?: readonly unknown[];
  transforms?: readonly string[];
  tools?: readonly unknown[];
  tool_choice?: unknown;
}

export interface OpenRouterRequestOptions {
  response_format?: unknown;
  provider?: unknown;
  plugins?: readonly unknown[];
  transforms?: readonly string[];
  tools?: readonly unknown[];
  tool_choice?: unknown;
}

export interface OpenRouterRequestInspection {
  model: string;
  temperatureMode: "explicit" | "provider_default";
  temperature?: number;
  completionCeilingClass: CompletionCeilingClass;
  maxOutputTokens: number;
  reasoningEnabled: true;
  reasoningEffort: ReasoningEffort;
  reasoningExcluded: true;
  capabilitySnapshot: OpenRouterCapabilitySnapshot;
  admission: CapabilityAdmissionResult;
  contextLength?: number;
  topP?: number;
  requestFingerprint: string;
}

export interface OpenRouterCapabilitySnapshot {
  model: string;
  cacheEntryFound: boolean;
  supportedParameters: readonly string[] | null;
  supportedEfforts: readonly ReasoningEffort[] | null;
  contextLength?: number;
}

export function buildChatCompletionRequest({
  prompt,
  settings,
  outputPolicy,
  requestOptions
}: {
  prompt: string;
  settings: OpenRouterSettings;
  outputPolicy: OpenRouterOutputPolicy;
  requestOptions?: OpenRouterRequestOptions;
}): OpenRouterRequest {
  const selectedPolicy = resolveOutputPolicy(settings, outputPolicy);
  const request: OpenRouterRequest = {
    model: settings.model,
    messages: [{ role: "user", content: prompt }],
    max_completion_tokens: selectedPolicy.maxOutputTokens,
    reasoning: { effort: selectedPolicy.reasoningEffort, exclude: true },
    ...(requestOptions ?? {}),
    provider: {
      ...asRecord(requestOptions?.provider),
      require_parameters: true,
      allow_fallbacks: false
    },
    plugins: [],
    transforms: [],
    tools: requestOptions?.tools ?? [],
    tool_choice: requestOptions?.tool_choice ?? "none",
    stream: false
  };

  if (settings.temperatureMode === "explicit") {
    if (settings.temperature === undefined) {
      throw new Error("Explicit temperature mode requires a numeric temperature.");
    }
    request.temperature = settings.temperature;
  }

  if (settings.topP !== undefined) {
    request.top_p = settings.topP;
  }

  return request;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

export function fingerprintChatCompletionRequest(
  request: OpenRouterRequest,
  outputPolicy: OpenRouterOutputPolicy,
  settings: OpenRouterSettings
): string {
  return createHash("sha256").update(JSON.stringify({
    request,
    outputPolicy,
    capabilitySnapshot: capabilitySnapshotFor(settings, request.model)
  })).digest("hex");
}

export function inspectChatCompletionRequest(
  request: OpenRouterRequest,
  outputPolicy: OpenRouterOutputPolicy,
  settings: OpenRouterSettings
): OpenRouterRequestInspection {
  const selectedPolicy = resolveOutputPolicy(settings, outputPolicy);
  if (request.max_completion_tokens !== selectedPolicy.maxOutputTokens) {
    const label = selectedPolicy.completionCeilingClass === "prose" ? "Prose" : "Assistance";
    throw new Error(
      `The finalized request uses ${request.max_completion_tokens} completion tokens but the ${label} ceiling is ` +
      `${selectedPolicy.maxOutputTokens}.`
    );
  }
  if (request.reasoning.effort !== selectedPolicy.reasoningEffort || request.reasoning.exclude !== true) {
    throw new Error("The finalized request reasoning policy does not match the selected output policy.");
  }

  const capabilitySnapshot = capabilitySnapshotFor(settings, request.model);

  return {
    model: request.model,
    temperatureMode: request.temperature === undefined ? "provider_default" : "explicit",
    ...(request.temperature === undefined ? {} : { temperature: request.temperature }),
    completionCeilingClass: selectedPolicy.completionCeilingClass,
    maxOutputTokens: request.max_completion_tokens,
    reasoningEnabled: true,
    reasoningEffort: request.reasoning.effort,
    reasoningExcluded: true,
    capabilitySnapshot,
    admission: admitOpenRouterRequest({ request, cachedModels: settings.cachedModels }),
    ...(capabilitySnapshot.contextLength === undefined ? {} : { contextLength: capabilitySnapshot.contextLength }),
    ...(request.top_p === undefined ? {} : { topP: request.top_p }),
    requestFingerprint: fingerprintChatCompletionRequest(request, outputPolicy, settings)
  };
}

function capabilitySnapshotFor(
  settings: OpenRouterSettings,
  model: string
): OpenRouterCapabilitySnapshot {
  const cached = settings.cachedModels?.find((entry) => entry.id === model);
  return {
    model,
    cacheEntryFound: cached !== undefined,
    supportedParameters: cached?.supportedParameters === undefined ? null : [...cached.supportedParameters],
    supportedEfforts: cached?.supportedEfforts === undefined ? null : [...cached.supportedEfforts],
    ...(cached?.contextLength === undefined ? {} : { contextLength: cached.contextLength })
  };
}
