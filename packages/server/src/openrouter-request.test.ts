import { describe, expect, it } from "vitest";

import { buildChatCompletionRequest } from "./openrouter/request.js";

describe("buildChatCompletionRequest", () => {
  it("builds a non-streaming chat completion request from the compiled prompt and settings", () => {
    expect(
      buildChatCompletionRequest({
        prompt: "Compiled prompt\nwith records.",
        settings: {
          model: "anthropic/claude-sonnet-4",
          temperature: 0.7,
          maxOutputTokens: 1800,
          topP: 0.9
        }
      })
    ).toEqual({
      model: "anthropic/claude-sonnet-4",
      messages: [{ role: "user", content: "Compiled prompt\nwith records." }],
      temperature: 0.7,
      max_completion_tokens: 1800,
      top_p: 0.9,
      stream: false
    });
  });

  it("omits top_p when topP is not configured", () => {
    const request = buildChatCompletionRequest({
      prompt: "Prompt",
      settings: {
        model: "openai/gpt-4.1",
        temperature: 1,
        maxOutputTokens: 1024
      }
    });

    expect(request).toEqual({
      model: "openai/gpt-4.1",
      messages: [{ role: "user", content: "Prompt" }],
      temperature: 1,
      max_completion_tokens: 1024,
      stream: false
    });
    expect(request).not.toHaveProperty("top_p");
    expect(request.messages).toHaveLength(1);
  });
});
