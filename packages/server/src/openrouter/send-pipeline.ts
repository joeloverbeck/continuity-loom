import {
  readOpenRouterSettings,
  type OpenRouterSettingsStatus
} from "../settings.js";

import {
  sendChatCompletion,
  type TransportResult
} from "./client.js";
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
  contextWindow?: {
    promptTokenEstimate: number;
    refusal: OpenRouterPipelineRefusal;
  };
  metadata: OpenRouterPipelineMetadataProfile;
}

export interface RunOpenRouterSendPipelineInput {
  profile: OpenRouterSendProfile;
  settings?: OpenRouterSettingsStatus;
  transport?: (input: { request: OpenRouterRequest }) => Promise<TransportResult>;
}

export type OpenRouterSendPipelineResult =
  | {
      ok: true;
      candidate: { text: string };
      metadata: Readonly<Record<string, unknown>>;
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

  if (
    profile.contextWindow !== undefined &&
    isPromptTooLarge(profile.contextWindow.promptTokenEstimate, settings)
  ) {
    return { ok: false, ...profile.contextWindow.refusal };
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

  return {
    ok: true,
    candidate: transportResult.candidate,
    metadata: trustedMetadata(profile.metadata, inspection)
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

function isPromptTooLarge(
  promptTokenEstimate: number,
  settings: OpenRouterSettingsStatus
): boolean {
  const contextLength = settings.cachedModels
    ?.find((model) => model.id === settings.model)
    ?.contextLength;
  return contextLength !== undefined &&
    promptTokenEstimate + settings.maxOutputTokens > contextLength;
}
