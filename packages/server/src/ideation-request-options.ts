import type { OpenRouterRequestOptions } from "./openrouter/request.js";

export function ideationRequestOptions(
  outputSchema: Readonly<Record<string, unknown>>
): OpenRouterRequestOptions {
  return {
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "grounded_ideation",
        strict: true,
        schema: outputSchema
      }
    },
    provider: { require_parameters: true, allow_fallbacks: false },
    transforms: [],
    plugins: [],
    tools: [],
    tool_choice: "none"
  };
}
