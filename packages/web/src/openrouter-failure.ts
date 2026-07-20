import { isTransportFailure, type TransportFailure } from "./openrouter-transport.js";

export function presentOpenRouterFailure(failure: TransportFailure): string {
  const parts = [failure.message];

  if (failure.providerStatus !== undefined) {
    parts.push(`Provider status: ${failure.providerStatus}.`);
  }

  if (failure.providerReason !== undefined) {
    parts.push(`Provider reason: ${failure.providerReason}`);
  }

  parts.push(recoveryGuidance(failure));
  return parts.join(" ");
}

export function presentThrownOpenRouterFailure(error: unknown, fallback: string): string {
  return isTransportFailure(error) ? presentOpenRouterFailure(error) : fallback;
}

function recoveryGuidance(failure: TransportFailure): string {
  switch (failure.category) {
    case "missing-key":
      return "Open Settings and configure an API key before trying again. No retry is automatic.";
    case "invalid-key":
      return "Open Settings and replace the rejected API key before trying again. No retry is automatic.";
    case "insufficient-credits":
      return "Add OpenRouter credits, then use the existing action to try again. No retry is automatic.";
    case "rate-limit":
      return failure.retryAfter === undefined
        ? "Wait before using the existing action to try again. No retry is automatic."
        : `Wait at least ${failure.retryAfter} seconds, then use the existing action to try again. No retry is automatic.`;
    case "invalid-request":
      return "Review the selected model and request settings before trying again. No retry is automatic.";
    case "structured-output-rejection":
      return "Choose a model that supports the requested structured output, then use the existing action to try again. No retry is automatic.";
    case "moderation-refusal":
      return "Review the requested content and provider policy before trying again. No retry is automatic.";
    case "provider-unavailable":
    case "timeout":
    case "malformed-response":
    case "network":
    case "unknown":
      return "Use the existing action to try again when ready. No retry is automatic.";
  }
}
