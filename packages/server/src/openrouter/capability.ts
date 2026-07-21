import type { ModelListEntry, OpenRouterSettings } from "../settings.js";

import type { OpenRouterRequestOptions } from "./request.js";

/**
 * Model-neutral admission for strict structured-output requests.
 *
 * OpenRouter's `provider.require_parameters: true` excludes, before generation, any endpoint whose
 * advertised `supported_parameters` does not cover every routing-relevant field in the request. When
 * no eligible endpoint exists the provider returns a pre-generation rejection and the request is
 * wasted. This module decides, from the cached secret-free capability union, whether the selected
 * model can satisfy the exact strict envelope, and fails closed when it cannot be proven — it never
 * drops a parameter, loosens strict output, enables a fallback, changes the model, or sends anyway.
 *
 * The cached `supportedParameters` is OpenRouter's per-model union across its endpoints. A token
 * absent from the union proves no endpoint advertises it (decisive rejection). The remaining live
 * per-endpoint arbitration stays with OpenRouter's own `require_parameters` at send time.
 */

export type CapabilityAdmissionCategory =
  | "structured-output-incompatible-model"
  | "structured-output-capability-unknown";

export interface CapabilityAdmissionRejection {
  ok: false;
  category: CapabilityAdmissionCategory;
  message: string;
  recovery: string;
  /** Representative routing-capability token for each unsatisfied requirement (incompatible case only). */
  missingCapabilities?: string[];
}

export type CapabilityAdmissionResult = { ok: true } | CapabilityAdmissionRejection;

export interface StructuredOutputAdmissionInput {
  settings: Pick<OpenRouterSettings, "model" | "temperature" | "topP" | "cachedModels">;
  requestOptions: OpenRouterRequestOptions;
}

/** A routing-relevant control the request declares. The model satisfies it by advertising ANY listed token. */
export interface CapabilityRequirement {
  label: string;
  anyOf: [string, ...string[]];
}

const INCOMPATIBLE_MESSAGE =
  "The selected model does not support the strict structured-output request this workflow requires.";
const INCOMPATIBLE_RECOVERY =
  "Select a model that advertises strict structured output (a JSON Schema response format), refresh the model list if needed, then inspect the recompiled source before Analyze. No request was sent. No retry is automatic.";
const UNKNOWN_MESSAGE =
  "Capability data for the selected model is missing or unusable, so strict structured-output support cannot be confirmed.";
const UNKNOWN_RECOVERY =
  "Refresh the OpenRouter model list and select a model that advertises strict structured output, then inspect the recompiled source before Analyze. No request was sent. No retry is automatic.";

/**
 * Derive the routing-relevant capability requirements from the exact request envelope. Requirements
 * mirror OpenRouter's `supported_parameters` vocabulary and are grouped so an alias (max_tokens vs
 * max_completion_tokens) is satisfied by either token.
 */
export function requiredStructuredOutputCapabilities(input: StructuredOutputAdmissionInput): CapabilityRequirement[] {
  const { settings, requestOptions } = input;
  const requirements: CapabilityRequirement[] = [];

  const responseFormat = asRecord(requestOptions.response_format);
  if (responseFormat !== undefined) {
    requirements.push({ label: "response format", anyOf: ["response_format"] });
    if (isStrictJsonSchema(responseFormat)) {
      requirements.push({ label: "strict structured output", anyOf: ["structured_outputs"] });
    }
  }

  // The chat-completion request always sends temperature and a completion-length ceiling.
  requirements.push({ label: "sampling temperature", anyOf: ["temperature"] });
  requirements.push({ label: "completion length", anyOf: ["max_tokens", "max_completion_tokens"] });

  if (settings.topP !== undefined) {
    requirements.push({ label: "sampling top_p", anyOf: ["top_p"] });
  }

  if (requestsToolUse(requestOptions)) {
    requirements.push({ label: "tools", anyOf: ["tools"] });
    if (requestsToolChoice(requestOptions)) {
      requirements.push({ label: "tool choice", anyOf: ["tool_choice"] });
    }
  }

  return requirements;
}

/**
 * Decide whether the selected model may receive the strict structured-output request. Fails closed
 * with `structured-output-capability-unknown` when capability data is missing/empty/stale, and with
 * `structured-output-incompatible-model` when the data proves at least one requirement is unmet.
 */
export function admitStructuredOutputModel(input: StructuredOutputAdmissionInput): CapabilityAdmissionResult {
  const entry = findSelectedModel(input.settings);
  const supported = entry?.supportedParameters;

  if (supported === undefined || supported.length === 0) {
    return {
      ok: false,
      category: "structured-output-capability-unknown",
      message: UNKNOWN_MESSAGE,
      recovery: UNKNOWN_RECOVERY
    };
  }

  const supportedSet = new Set(supported);
  const missingCapabilities = requiredStructuredOutputCapabilities(input)
    .filter((requirement) => !requirement.anyOf.some((token) => supportedSet.has(token)))
    .map((requirement) => requirement.anyOf[0]);

  if (missingCapabilities.length > 0) {
    return {
      ok: false,
      category: "structured-output-incompatible-model",
      message: INCOMPATIBLE_MESSAGE,
      recovery: INCOMPATIBLE_RECOVERY,
      missingCapabilities
    };
  }

  return { ok: true };
}

function findSelectedModel(
  settings: Pick<OpenRouterSettings, "model" | "cachedModels">
): ModelListEntry | undefined {
  if (!settings.model) {
    return undefined;
  }

  return settings.cachedModels?.find((model) => model.id === settings.model);
}

function isStrictJsonSchema(responseFormat: Record<string, unknown>): boolean {
  if (responseFormat.type !== "json_schema") {
    return false;
  }

  const jsonSchema = asRecord(responseFormat.json_schema);
  return jsonSchema?.strict === true;
}

function requestsToolUse(requestOptions: OpenRouterRequestOptions): boolean {
  return Array.isArray(requestOptions.tools) && requestOptions.tools.length > 0;
}

function requestsToolChoice(requestOptions: OpenRouterRequestOptions): boolean {
  const toolChoice = requestOptions.tool_choice;
  return toolChoice !== undefined && toolChoice !== "none";
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}
