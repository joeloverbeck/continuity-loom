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
}

export function buildChatCompletionRequest({
  prompt,
  settings
}: {
  prompt: string;
  settings: OpenRouterSettings;
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

  return request;
}
