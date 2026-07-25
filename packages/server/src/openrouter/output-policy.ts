import type { OpenRouterSettings } from "../settings.js";

export type OpenRouterOutputPolicy = "strict" | "prose";
export type CompletionCeilingClass = "prose" | "assistance";

export interface CompletionCeilingSelection {
  completionCeilingClass: CompletionCeilingClass;
  maxOutputTokens: number;
}

export function completionCeilingClassForPolicy(
  outputPolicy: OpenRouterOutputPolicy
): CompletionCeilingClass {
  return outputPolicy === "prose" ? "prose" : "assistance";
}

export function resolveCompletionCeiling(
  settings: OpenRouterSettings,
  outputPolicy: OpenRouterOutputPolicy
): CompletionCeilingSelection {
  return completionCeilingClassForPolicy(outputPolicy) === "prose"
    ? {
        completionCeilingClass: "prose",
        maxOutputTokens: settings.proseMaxOutputTokens
      }
    : {
        completionCeilingClass: "assistance",
        maxOutputTokens: settings.assistanceMaxOutputTokens
      };
}
