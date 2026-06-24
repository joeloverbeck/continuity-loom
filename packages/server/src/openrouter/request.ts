import type { OpenRouterSettings } from "../settings.js";

export interface OpenRouterMessage {
  role: "user";
  content: string;
}

export interface OpenRouterRequest {
  model: string;
  messages: [OpenRouterMessage];
  temperature: number;
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

export function buildChatCompletionRequest({
  prompt,
  settings,
  requestOptions
}: {
  prompt: string;
  settings: OpenRouterSettings;
  requestOptions?: OpenRouterRequestOptions;
}): OpenRouterRequest {
  const request: OpenRouterRequest = {
    model: settings.model,
    messages: [{ role: "user", content: prompt }],
    temperature: settings.temperature,
    max_completion_tokens: settings.maxOutputTokens,
    stream: false
  };

  if (settings.topP !== undefined) {
    request.top_p = settings.topP;
  }

  return requestOptions === undefined ? request : { ...request, ...requestOptions };
}
