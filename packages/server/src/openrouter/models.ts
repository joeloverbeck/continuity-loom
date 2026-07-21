import type { ModelListEntry } from "../settings.js";

import { normalizeOpenRouterError, type NormalizedTransportError } from "./errors.js";
import type { OpenRouterRequestConfig } from "./client.js";

const defaultModelsEndpoint = "https://openrouter.ai/api/v1/models";

export type ModelListResult =
  | { ok: true; models: ModelListEntry[] }
  | ({ ok: false } & NormalizedTransportError);

export interface RefreshModelListInput {
  apiKey?: string;
  signal?: AbortSignal;
  config?: OpenRouterRequestConfig;
}

export async function refreshModelList({
  apiKey = process.env.OPENROUTER_API_KEY,
  signal,
  config
}: RefreshModelListInput = {}): Promise<ModelListResult> {
  if (!apiKey) {
    return { ok: false, ...normalizeOpenRouterError(undefined, { category: "missing-key" }) };
  }

  try {
    const requestInit: RequestInit = {
      method: "GET",
      headers: buildHeaders(apiKey, config)
    };
    if (signal !== undefined) {
      requestInit.signal = signal;
    }

    const response = await fetch(config?.endpointUrl ?? defaultModelsEndpoint, requestInit);
    const body = await readJsonBody(response);
    const bodyWithHeaders = addRetryAfter(body, response.headers.get("retry-after"));

    if (!response.ok) {
      return { ok: false, ...normalizeOpenRouterError(response.status, bodyWithHeaders) };
    }

    const models = extractModels(body);
    if (models === undefined) {
      return { ok: false, ...normalizeOpenRouterError(response.status, { choices: [] }) };
    }

    return { ok: true, models };
  } catch (error) {
    return { ok: false, ...normalizeOpenRouterError(undefined, undefined, error) };
  }
}

function buildHeaders(apiKey: string, config: OpenRouterRequestConfig | undefined): HeadersInit {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`
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

function extractModels(body: unknown): ModelListEntry[] | undefined {
  const data = getUnknownProperty(body, "data");
  if (!Array.isArray(data)) {
    return undefined;
  }

  return data.flatMap((model): ModelListEntry[] => {
    const id = getUnknownProperty(model, "id");
    const name = getUnknownProperty(model, "name");
    const contextLength = getUnknownProperty(model, "context_length");
    const supportedParameters = extractSupportedParameters(getUnknownProperty(model, "supported_parameters"));

    if (typeof id !== "string" || !id.trim()) {
      return [];
    }

    const entry: ModelListEntry = {
      id,
      name: typeof name === "string" && name.trim() ? name : id
    };

    if (typeof contextLength === "number" && Number.isInteger(contextLength) && contextLength > 0) {
      entry.contextLength = contextLength;
    }

    if (supportedParameters !== undefined) {
      entry.supportedParameters = supportedParameters;
    }

    return [entry];
  });
}

function extractSupportedParameters(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const tokens = value.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0);
  return tokens.length > 0 ? tokens : undefined;
}

function getUnknownProperty(value: unknown, key: string): unknown {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  return (value as Record<string, unknown>)[key];
}
