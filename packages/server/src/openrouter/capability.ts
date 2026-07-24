import type { ModelListEntry } from "../settings.js";

import type { OpenRouterRequest } from "./request.js";

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

export interface OpenRouterRequestAdmissionInput {
  request: OpenRouterRequest;
  cachedModels: ModelListEntry[] | undefined;
}

/** A routing-relevant control the request declares. The model satisfies it by advertising ANY listed token. */
export interface CapabilityRequirement {
  label: string;
  anyOf: [string, ...string[]];
}

const INCOMPATIBLE_MESSAGE =
  "The selected model cannot satisfy every requirement in the finalized request.";
const INCOMPATIBLE_RECOVERY =
  "Choose a model compatible with every named requirement, then reinspect before using the existing action. No request was sent. No retry is automatic.";
const UNKNOWN_MESSAGE =
  "The selected model has no usable cached capability data, so the finalized request cannot be admitted.";
const UNKNOWN_RECOVERY =
  "Refresh the OpenRouter model list, then reinspect before using the existing action. No request was sent; no retry is automatic. If admission still fails, choose a model compatible with every named requirement.";

/**
 * Derive the routing-relevant capability requirements from the exact request envelope. Requirements
 * mirror OpenRouter's `supported_parameters` vocabulary and are grouped so an alias (max_tokens vs
 * max_completion_tokens) is satisfied by either token.
 */
export function requiredOpenRouterCapabilities(request: OpenRouterRequest): CapabilityRequirement[] {
  const requirements: CapabilityRequirement[] = [];

  const responseFormat = asRecord(request.response_format);
  if (responseFormat !== undefined) {
    requirements.push({ label: "response format", anyOf: ["response_format"] });
    if (isStrictJsonSchema(responseFormat)) {
      requirements.push({ label: "strict structured output", anyOf: ["structured_outputs"] });
    }
  }

  if (request.temperature !== undefined) {
    requirements.push({ label: "sampling temperature", anyOf: ["temperature"] });
  }

  requirements.push({ label: "completion length", anyOf: ["max_tokens", "max_completion_tokens"] });

  if (request.top_p !== undefined) {
    requirements.push({ label: "sampling top_p", anyOf: ["top_p"] });
  }

  if (requestsToolUse(request)) {
    requirements.push({ label: "tools", anyOf: ["tools"] });
    if (requestsToolChoice(request)) {
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
export function admitOpenRouterRequest(input: OpenRouterRequestAdmissionInput): CapabilityAdmissionResult {
  const entry = findSelectedModel(input.request.model, input.cachedModels);
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
  const missingCapabilities = requiredOpenRouterCapabilities(input.request)
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

function findSelectedModel(model: string, cachedModels?: ModelListEntry[]): ModelListEntry | undefined {
  if (!model) {
    return undefined;
  }

  return cachedModels?.find((entry) => entry.id === model);
}

function isStrictJsonSchema(responseFormat: Record<string, unknown>): boolean {
  if (responseFormat.type !== "json_schema") {
    return false;
  }

  const jsonSchema = asRecord(responseFormat.json_schema);
  return jsonSchema?.strict === true;
}

function requestsToolUse(request: Pick<OpenRouterRequest, "tools">): boolean {
  return Array.isArray(request.tools) && request.tools.length > 0;
}

function requestsToolChoice(request: Pick<OpenRouterRequest, "tool_choice">): boolean {
  const toolChoice = request.tool_choice;
  return toolChoice !== undefined && toolChoice !== "none";
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}
