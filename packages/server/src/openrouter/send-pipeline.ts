import {
  readOpenRouterSettings,
  type OpenRouterSettingsStatus
} from "../settings.js";

import {
  sendChatCompletion,
  type TransportResult
} from "./client.js";
import {
  createDiagnosticReceipt,
  type OpenRouterDiagnosticReceipt,
  type OpenRouterDiagnosticSentPolicy,
  type OpenRouterResponseFacts
} from "./response.js";
import {
  REASONING_EFFORTS,
  type OpenRouterOutputPolicy
} from "./output-policy.js";
import {
  buildChatCompletionRequest,
  inspectChatCompletionRequest,
  type OpenRouterRequest,
  type OpenRouterRequestInspection,
  type OpenRouterRequestOptions
} from "./request.js";

export interface OpenRouterPipelineRefusal {
  status?: number;
  body: unknown;
}

export type OpenRouterPipelineStaleness =
  | {
      mode: "separate";
      expectedPromptFingerprint: string;
      expectedRequestFingerprint: string;
      promptRefusal: OpenRouterPipelineRefusal;
      providerRefusal: OpenRouterPipelineRefusal;
    }
  | {
      mode: "combined";
      expectedPromptFingerprint: string;
      expectedRequestFingerprint: string;
      refusal: OpenRouterPipelineRefusal;
    };

export interface OpenRouterPipelineMetadataProfile {
  providerFields: "full" | "identity";
  placement: "before" | "after";
  additions: Readonly<Record<string, unknown>>;
}

export interface OpenRouterSendProfile {
  prompt: string;
  promptFingerprint: string;
  requestOptions?: OpenRouterRequestOptions;
  staleness: OpenRouterPipelineStaleness;
  metadata: OpenRouterPipelineMetadataProfile;
  outputPolicy: OpenRouterOutputPolicy;
}

export interface RunOpenRouterSendPipelineInput {
  profile: OpenRouterSendProfile;
  settings?: OpenRouterSettingsStatus;
  transport?: (input: { request: OpenRouterRequest }) => Promise<TransportResult>;
}

export type OpenRouterSendPipelineResult =
  | {
      ok: true;
      candidate: { text: string; incomplete?: true };
      metadata: Readonly<Record<string, unknown>>;
      response: OpenRouterResponseFacts;
      diagnostic?: OpenRouterDiagnosticReceipt;
    }
  | ({ ok: false } & OpenRouterPipelineRefusal);

export async function runOpenRouterSendPipeline(
  input: RunOpenRouterSendPipelineInput
): Promise<OpenRouterSendPipelineResult> {
  const { profile } = input;

  if (
    profile.staleness.mode === "separate" &&
    profile.promptFingerprint !== profile.staleness.expectedPromptFingerprint
  ) {
    return { ok: false, ...profile.staleness.promptRefusal };
  }

  const settings = input.settings ?? readOpenRouterSettings();
  const request = buildChatCompletionRequest({
    prompt: profile.prompt,
    settings,
    outputPolicy: profile.outputPolicy,
    ...(profile.requestOptions === undefined ? {} : { requestOptions: profile.requestOptions })
  });
  const inspection = inspectChatCompletionRequest(request, profile.outputPolicy, settings);

  if (profile.staleness.mode === "combined") {
    if (
      profile.promptFingerprint !== profile.staleness.expectedPromptFingerprint ||
      inspection.requestFingerprint !== profile.staleness.expectedRequestFingerprint
    ) {
      return { ok: false, ...profile.staleness.refusal };
    }
  } else if (inspection.requestFingerprint !== profile.staleness.expectedRequestFingerprint) {
    return { ok: false, ...profile.staleness.providerRefusal };
  }

  if (!settings.hasOpenRouterCredential) {
    return {
      ok: false,
      body: {
        ok: false,
        category: "missing-key",
        message: "OpenRouter API key is missing."
      }
    };
  }

  const admission = inspection.admission;
  if (!admission.ok) {
    return { ok: false, body: admission };
  }

  const transport = input.transport ?? sendChatCompletion;
  const transportResult = await transport({ request });
  if (!transportResult.ok) {
    if (transportResult.category === "output-limit" && transportResult.diagnostic !== undefined) {
      return {
        ok: false,
        body: {
          ...transportResult,
          diagnostic: {
            ...transportResult.diagnostic,
            recovery: outputLimitRecovery(),
            sentPolicy: diagnosticSentPolicy(inspection)
          }
        }
      };
    }
    return { ok: false, body: transportResult };
  }

  const policyResult = applyOutputPolicy(transportResult, profile.outputPolicy, inspection);
  if (!policyResult.ok) {
    return { ok: false, body: policyResult.failure };
  }

  return {
    ok: true,
    candidate: policyResult.candidate,
    metadata: trustedMetadata(profile.metadata, inspection),
    response: transportResult.response,
    ...(policyResult.diagnostic === undefined ? {} : { diagnostic: policyResult.diagnostic })
  };
}

function applyOutputPolicy(
  result: Extract<TransportResult, { ok: true }>,
  policy: OpenRouterSendProfile["outputPolicy"],
  inspection: OpenRouterRequestInspection
):
  | {
      ok: true;
      candidate: { text: string; incomplete?: true };
      diagnostic?: OpenRouterDiagnosticReceipt;
    }
  | { ok: false; failure: Record<string, unknown> } {
  const { termination } = result.response;
  if (termination === "normal") {
    if (result.candidate === undefined) {
      return {
        ok: false,
        failure: workflowMissingCandidateFailure(result.response)
      };
    }
    return { ok: true, candidate: result.candidate };
  }

  if (
    policy === "prose" &&
    termination === "length" &&
    result.candidate !== undefined
  ) {
    return {
      ok: true,
      candidate: { ...result.candidate, incomplete: true },
      diagnostic: createDiagnosticReceipt(
        "incomplete-prose",
        result.response,
        "Generation stopped at the output limit; this Draft Candidate is incomplete.",
        outputLimitRecovery(),
        diagnosticSentPolicy(inspection)
      )
    };
  }

  const failure = workflowTerminationFailure(result.response, inspection);
  return { ok: false, failure };
}

function workflowMissingCandidateFailure(response: OpenRouterResponseFacts): Record<string, unknown> {
  const summary = "The OpenRouter response envelope was unrecognized.";
  return {
    ok: false,
    category: "unrecognized-response",
    classification: "unrecognized-envelope",
    message: summary,
    diagnostic: createDiagnosticReceipt(
      "unrecognized-envelope",
      response,
      summary,
      "Copy the sanitized diagnostic receipt and check OpenRouter Logs before using the existing action again. No retry is automatic."
    )
  };
}

function workflowTerminationFailure(
  response: OpenRouterResponseFacts,
  inspection: OpenRouterRequestInspection
): Record<string, unknown> {
  const category = response.termination === "length"
    ? "output-limit"
    : response.termination === "content-filter"
      ? "content-policy"
      : response.termination === "tool"
        ? "invalid-request"
        : "unrecognized-response";
  const summary = response.termination === "length"
    ? "Generation stopped before the workflow received a complete result."
    : response.termination === "content-filter"
      ? "OpenRouter stopped the result for content-policy reasons."
      : response.termination === "tool"
        ? "OpenRouter returned an unexpected tool completion."
        : response.termination === "missing"
          ? "OpenRouter did not report how generation finished."
          : "OpenRouter reported an unknown finish reason.";
  return {
    ok: false,
    category,
    classification: "incomplete-generation",
    message: summary,
    diagnostic: createDiagnosticReceipt(
      "incomplete-generation",
      response,
      summary,
      response.termination === "length"
        ? outputLimitRecovery()
        : "Review the provider result and selected model, then inspect again before using the existing action. No retry is automatic.",
      response.termination === "length" ? diagnosticSentPolicy(inspection) : undefined
    )
  };
}

function outputLimitRecovery(): string {
  return "Reasoning may have consumed part or all of the completion allowance. Lower the affected output class's supported reasoning effort or raise that class's completion ceiling, then inspect again before a new explicit request. No reasoning content is exposed, and no setting change, retry, resend, refresh, or fallback is automatic.";
}

function diagnosticSentPolicy(inspection: OpenRouterRequestInspection): OpenRouterDiagnosticSentPolicy {
  const selectedIndex = REASONING_EFFORTS.indexOf(inspection.reasoningEffort);
  const supportedEfforts = inspection.capabilitySnapshot.supportedEfforts ?? [];
  return {
    outputClass: inspection.completionCeilingClass,
    completionCeiling: inspection.maxOutputTokens,
    reasoningEnabled: true,
    reasoningEffort: inspection.reasoningEffort,
    reasoningExcluded: true,
    supportedLowerEfforts: REASONING_EFFORTS.filter(
      (effort, index) => index < selectedIndex && supportedEfforts.includes(effort)
    )
  };
}

function trustedMetadata(
  profile: OpenRouterPipelineMetadataProfile,
  inspection: OpenRouterRequestInspection
): Readonly<Record<string, unknown>> {
  const reasoningMetadata = {
    completionCeilingClass: inspection.completionCeilingClass,
    reasoningEnabled: inspection.reasoningEnabled,
    reasoningEffort: inspection.reasoningEffort,
    reasoningExcluded: inspection.reasoningExcluded
  };
  const providerMetadata = profile.providerFields === "full"
    ? {
        model: inspection.model,
        provider: "openrouter",
        ...reasoningMetadata,
        temperatureMode: inspection.temperatureMode,
        ...(inspection.temperature === undefined ? {} : { temperature: inspection.temperature }),
        maxOutputTokens: inspection.maxOutputTokens,
        ...(inspection.topP === undefined ? {} : { topP: inspection.topP })
      }
    : {
        model: inspection.model,
        provider: "openrouter",
        ...reasoningMetadata
      };

  return profile.placement === "before"
    ? { ...providerMetadata, ...profile.additions }
    : { ...profile.additions, ...providerMetadata };
}
