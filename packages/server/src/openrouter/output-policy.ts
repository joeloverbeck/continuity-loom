import type { OpenRouterSettings } from "../settings.js";

export type OpenRouterOutputPolicy = "strict" | "prose";
export type CompletionCeilingClass = "prose" | "assistance";
export const REASONING_EFFORTS = ["minimal", "low", "medium", "high", "xhigh", "max"] as const;
export type ReasoningEffort = (typeof REASONING_EFFORTS)[number];

export interface OutputPolicySelection {
  completionCeilingClass: CompletionCeilingClass;
  maxOutputTokens: number;
  reasoningEffort: ReasoningEffort;
}

export function completionCeilingClassForPolicy(
  outputPolicy: OpenRouterOutputPolicy
): CompletionCeilingClass {
  return outputPolicy === "prose" ? "prose" : "assistance";
}

export function resolveOutputPolicy(
  settings: OpenRouterSettings,
  outputPolicy: OpenRouterOutputPolicy
): OutputPolicySelection {
  return completionCeilingClassForPolicy(outputPolicy) === "prose"
    ? {
        completionCeilingClass: "prose",
        maxOutputTokens: settings.proseMaxOutputTokens,
        reasoningEffort: settings.proseReasoningEffort
      }
    : {
        completionCeilingClass: "assistance",
        maxOutputTokens: settings.assistanceMaxOutputTokens,
        reasoningEffort: settings.assistanceReasoningEffort
      };
}
