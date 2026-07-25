import { normalizeOpenRouterError, type NormalizedTransportError } from "./errors.js";
import type { OpenRouterRequest } from "./request.js";
import {
  decodeOpenRouterResponse,
  type OpenRouterDiagnosticReceipt,
  type OpenRouterResponseClassification,
  type OpenRouterResponseFacts
} from "./response.js";

const defaultChatCompletionEndpoint = "https://openrouter.ai/api/v1/chat/completions";

export type TransportResult =
  | { ok: true; candidate: { text: string }; response: OpenRouterResponseFacts }
  | ({
      ok: false;
      classification?: OpenRouterResponseClassification;
      diagnostic?: OpenRouterDiagnosticReceipt;
    } & NormalizedTransportError);

export interface OpenRouterRequestConfig {
  endpointUrl?: string;
  appUrl?: string;
  appTitle?: string;
}

export interface SendChatCompletionInput {
  request: OpenRouterRequest;
  apiKey?: string;
  signal?: AbortSignal;
  config?: OpenRouterRequestConfig;
}

export async function sendChatCompletion({
  request,
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
      body: JSON.stringify(request)
    };
    if (signal !== undefined) {
      requestInit.signal = signal;
    }

    const response = await fetch(config?.endpointUrl ?? defaultChatCompletionEndpoint, requestInit);
    const decodedBody = await readJsonBody(response);
    const bodyWithHeaders = addRetryAfter(decodedBody.body, response.headers.get("retry-after"));

    if (!response.ok) {
      return { ok: false, ...normalizeOpenRouterError(response.status, bodyWithHeaders) };
    }

    return decodeOpenRouterResponse({
      httpStatus: response.status,
      body: decodedBody.body,
      bodyWasJson: decodedBody.ok,
      generationIdHeader: response.headers.get("x-openrouter-generation-id"),
      requestedModel: request.model,
      retryAfterHeader: response.headers.get("retry-after")
    });
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

async function readJsonBody(response: Response): Promise<{ ok: boolean; body: unknown }> {
  try {
    return { ok: true, body: await response.json() };
  } catch {
    return { ok: false, body: undefined };
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
