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
  type OpenRouterResponseFacts
} from "./response.js";
import { admitOpenRouterRequest } from "./capability.js";
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
  outputPolicy: "strict" | "prose";
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
    ...(profile.requestOptions === undefined ? {} : { requestOptions: profile.requestOptions })
  });
  const inspection = inspectChatCompletionRequest(request);

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

  const admission = admitOpenRouterRequest({
    request,
    cachedModels: settings.cachedModels
  });
  if (!admission.ok) {
    return { ok: false, body: admission };
  }

  const transport = input.transport ?? sendChatCompletion;
  const transportResult = await transport({ request });
  if (!transportResult.ok) {
    return { ok: false, body: transportResult };
  }

  const policyResult = applyOutputPolicy(transportResult, profile.outputPolicy);
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
  policy: OpenRouterSendProfile["outputPolicy"]
):
  | {
      ok: true;
      candidate: { text: string; incomplete?: true };
      diagnostic?: OpenRouterDiagnosticReceipt;
    }
  | { ok: false; failure: Record<string, unknown> } {
  const { termination } = result.response;
  if (termination === "normal") {
    return { ok: true, candidate: result.candidate };
  }

  if (policy === "prose" && termination === "length") {
    return {
      ok: true,
      candidate: { ...result.candidate, incomplete: true },
      diagnostic: createDiagnosticReceipt(
        "incomplete-prose",
        result.response,
        "Generation stopped at the output limit; this Draft Candidate is incomplete.",
        "Edit or discard this non-canonical draft, or review the completion ceiling and inspect again before an explicit replacement request. No continuation is automatic."
      )
    };
  }

  const failure = workflowTerminationFailure(result.response);
  return { ok: false, failure };
}

function workflowTerminationFailure(response: OpenRouterResponseFacts): Record<string, unknown> {
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
        ? "Review the completion ceiling, scope, or model, then inspect again before using the existing action. No retry is automatic."
        : "Review the provider result and selected model, then inspect again before using the existing action. No retry is automatic."
    )
  };
}

function trustedMetadata(
  profile: OpenRouterPipelineMetadataProfile,
  inspection: OpenRouterRequestInspection
): Readonly<Record<string, unknown>> {
  const providerMetadata = profile.providerFields === "full"
    ? {
        model: inspection.model,
        provider: "openrouter",
        temperatureMode: inspection.temperatureMode,
        ...(inspection.temperature === undefined ? {} : { temperature: inspection.temperature }),
        maxOutputTokens: inspection.maxOutputTokens,
        ...(inspection.topP === undefined ? {} : { topP: inspection.topP })
      }
    : {
        model: inspection.model,
        provider: "openrouter"
      };

  return profile.placement === "before"
    ? { ...providerMetadata, ...profile.additions }
    : { ...profile.additions, ...providerMetadata };
}
