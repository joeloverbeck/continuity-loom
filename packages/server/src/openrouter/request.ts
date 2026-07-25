import { createHash } from "node:crypto";

import type { OpenRouterSettings } from "../settings.js";
import {
  resolveCompletionCeiling,
  type CompletionCeilingClass,
  type OpenRouterOutputPolicy
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
  contextLength?: number;
  topP?: number;
  requestFingerprint: string;
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
  const completionCeiling = resolveCompletionCeiling(settings, outputPolicy);
  const request: OpenRouterRequest = {
    model: settings.model,
    messages: [{ role: "user", content: prompt }],
    max_completion_tokens: completionCeiling.maxOutputTokens,
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

export function fingerprintChatCompletionRequest(request: OpenRouterRequest): string {
  return createHash("sha256").update(JSON.stringify(request)).digest("hex");
}

export function inspectChatCompletionRequest(
  request: OpenRouterRequest,
  outputPolicy: OpenRouterOutputPolicy,
  settings: OpenRouterSettings
): OpenRouterRequestInspection {
  const completionCeiling = resolveCompletionCeiling(settings, outputPolicy);
  if (request.max_completion_tokens !== completionCeiling.maxOutputTokens) {
    const label = completionCeiling.completionCeilingClass === "prose" ? "Prose" : "Assistance";
    throw new Error(
      `The finalized request uses ${request.max_completion_tokens} completion tokens but the ${label} ceiling is ` +
      `${completionCeiling.maxOutputTokens}.`
    );
  }

  const contextLength = settings.cachedModels
    ?.find((model) => model.id === request.model)
    ?.contextLength;

  return {
    model: request.model,
    temperatureMode: request.temperature === undefined ? "provider_default" : "explicit",
    ...(request.temperature === undefined ? {} : { temperature: request.temperature }),
    completionCeilingClass: completionCeiling.completionCeilingClass,
    maxOutputTokens: request.max_completion_tokens,
    ...(contextLength === undefined ? {} : { contextLength }),
    ...(request.top_p === undefined ? {} : { topP: request.top_p }),
    requestFingerprint: fingerprintChatCompletionRequest(request)
  };
}
