import { isTransportFailure, type TransportFailure } from "./openrouter-transport.js";

export function presentOpenRouterFailure(failure: TransportFailure): string {
  const parts = [failure.message];

  if (failure.providerStatus !== undefined) {
    parts.push(`Provider status: ${failure.providerStatus}.`);
  }

  if (failure.providerReason !== undefined) {
    parts.push(`Provider reason: ${failure.providerReason}`);
  }

  if (failure.providerErrorType !== undefined) {
    parts.push(`Provider error type: ${failure.providerErrorType}.`);
  }

  if (failure.providerCode !== undefined) {
    parts.push(`Provider code: ${failure.providerCode}.`);
  }

  if (failure.missingCapabilities?.length) {
    const names = requirementNames(failure.missingCapabilities);
    parts.push(`Missing requirements: ${names.join(", ")}.`);
    parts.push(`Technical detail: ${failure.missingCapabilities.join(", ")}.`);
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
    case "structured-output-incompatible-model":
      if (failure.missingCapabilities?.some((token) => token === "temperature" || token === "top_p")) {
        const nonSamplingCapabilities = failure.missingCapabilities.filter(
          (token) => token !== "temperature" && token !== "top_p"
        );
        const settings = [
          ...(failure.missingCapabilities.includes("temperature") ? ["Temperature"] : []),
          ...(failure.missingCapabilities.includes("top_p") ? ["Top P"] : [])
        ];
        const settingsAction = settings.length === 1
          ? settings[0]
          : `both ${settings.join(" and ")}`;
        if (nonSamplingCapabilities.length > 0) {
          const modelRequirements = requirementNames(nonSamplingCapabilities);
          return `Open Settings to deliberately change ${settingsAction} if you want to remove ${
            settings.length === 1 ? "that sampling requirement" : "those sampling requirements"
          }. You must also choose a model compatible with ${modelRequirements.join(" and ")}. Or keep ${
            settings.join(" and ")
          } and choose a model compatible with ${[...settings, ...modelRequirements].join(" and ")}. Reinspect before using the existing action. No request was sent. No retry is automatic.`;
        }
        return `Open Settings to deliberately change ${settingsAction}, or choose a compatible model. Reinspect before using the existing action. No request was sent. No retry is automatic.`;
      }
      return (
        failure.recovery ??
        "Choose a compatible model, then reinspect before using the existing action. No request was sent. No retry is automatic."
      );
    case "structured-output-capability-unknown":
      return (
        failure.recovery ??
        "Refresh the OpenRouter model list to update its cached capability data, then inspect the recompiled source and Analyze again. No request was sent. No retry is automatic."
      );
    case "moderation-refusal":
      return "Review the requested content and provider policy before trying again. No retry is automatic.";
    case "content-policy":
    case "refusal":
      return "Review the requested content and provider policy before trying again. No retry is automatic.";
    case "output-limit":
      return "Review the completion ceiling, scope, or model, then reinspect before using the existing action. No retry is automatic.";
    case "no-content":
    case "unrecognized-response":
      return "Copy the sanitized diagnostic receipt and check OpenRouter Logs before using the existing action again. No retry is automatic.";
    case "server-error":
      return "Check OpenRouter or provider availability before using the existing action again. No retry is automatic.";
    case "provider-unavailable":
    case "timeout":
    case "malformed-response":
    case "network":
    case "unknown":
      return "Use the existing action to try again when ready. No retry is automatic.";
  }
}

function requirementNames(tokens: readonly string[]): string[] {
  const names = tokens.map((token) => {
    switch (token) {
      case "temperature":
        return "Temperature";
      case "top_p":
        return "Top P";
      case "response_format":
        return "response format";
      case "structured_outputs":
        return "strict structured output";
      case "max_tokens":
      case "max_completion_tokens":
        return "completion length";
      case "tools":
        return "tools";
      case "tool_choice":
        return "tool choice";
      default:
        return token;
    }
  });
  return [...new Set(names)];
}
