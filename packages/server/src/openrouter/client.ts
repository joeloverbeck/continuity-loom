import type { OpenRouterSettings } from "../settings.js";

import { normalizeOpenRouterError, type NormalizedTransportError } from "./errors.js";
import { buildChatCompletionRequest } from "./request.js";

const defaultChatCompletionEndpoint = "https://openrouter.ai/api/v1/chat/completions";

export type TransportResult =
  | { ok: true; candidate: { text: string } }
  | ({ ok: false } & NormalizedTransportError);

export interface OpenRouterRequestConfig {
  endpointUrl?: string;
  appUrl?: string;
  appTitle?: string;
}

export interface SendChatCompletionInput {
  prompt: string;
  settings: OpenRouterSettings;
  apiKey?: string;
  signal?: AbortSignal;
  config?: OpenRouterRequestConfig;
}

export async function sendChatCompletion({
  prompt,
  settings,
  apiKey = process.env.OPENROUTER_API_KEY,
  signal,
  config
}: SendChatCompletionInput): Promise<TransportResult> {
  if (!apiKey) {
    return { ok: false, ...normalizeOpenRouterError(undefined, { category: "missing-key" }) };
  }

  try {
    const requestInit: RequestInit = {
      method: "POST",
      headers: buildHeaders(apiKey, config),
      body: JSON.stringify(buildChatCompletionRequest({ prompt, settings }))
    };
    if (signal !== undefined) {
      requestInit.signal = signal;
    }

    const response = await fetch(config?.endpointUrl ?? defaultChatCompletionEndpoint, requestInit);
    const body = await readJsonBody(response);
    const bodyWithHeaders = addRetryAfter(body, response.headers.get("retry-after"));

    if (!response.ok) {
      return { ok: false, ...normalizeOpenRouterError(response.status, bodyWithHeaders) };
    }

    const text = extractCandidateText(body);
    if (text === undefined) {
      return { ok: false, ...normalizeOpenRouterError(response.status, bodyWithHeaders) };
    }

    return { ok: true, candidate: { text } };
  } catch (error) {
    return { ok: false, ...normalizeOpenRouterError(undefined, undefined, error) };
  }
}

function buildHeaders(apiKey: string, config: OpenRouterRequestConfig | undefined): HeadersInit {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json"
  };

  if (config?.appUrl) {
    headers["HTTP-Referer"] = config.appUrl;
  }

  if (config?.appTitle) {
    headers["X-Title"] = config.appTitle;
  }

  return headers;
}

async function readJsonBody(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return undefined;
  }
}

function addRetryAfter(body: unknown, retryAfter: string | null): unknown {
  if (!retryAfter) {
    return body;
  }

  if (!body || typeof body !== "object") {
    return { retryAfter };
  }

  return {
    ...body,
    retryAfter
  };
}

function extractCandidateText(body: unknown): string | undefined {
  const choices = getUnknownProperty(body, "choices");
  if (!Array.isArray(choices) || choices.length === 0) {
    return undefined;
  }

  const firstChoice: unknown = choices[0];
  const message = getUnknownProperty(firstChoice, "message");
  const content = getUnknownProperty(message, "content");

  return typeof content === "string" ? content : undefined;
}

function getUnknownProperty(value: unknown, key: string): unknown {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  return (value as Record<string, unknown>)[key];
}
