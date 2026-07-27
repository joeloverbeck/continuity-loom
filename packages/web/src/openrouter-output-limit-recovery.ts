import {
  putOpenRouterSettings,
  type ApiFailure,
  type OpenRouterReasoningEffort
} from "./api.js";
import type { OpenRouterDiagnosticReceipt } from "./openrouter-transport.js";

type OutputLimitReceipt = OpenRouterDiagnosticReceipt & {
  sentPolicy: NonNullable<OpenRouterDiagnosticReceipt["sentPolicy"]>;
};

export function isRecoverableOutputLimitReceipt(
  receipt: OpenRouterDiagnosticReceipt
): receipt is OutputLimitReceipt {
  return (receipt.classification === "incomplete-generation" || receipt.classification === "incomplete-prose") &&
    receipt.details.termination === "length" &&
    receipt.sentPolicy !== undefined;
}

export async function lowerOutputLimitEffort(
  receipt: OutputLimitReceipt,
  effort: OpenRouterReasoningEffort
): Promise<void> {
  if (!receipt.sentPolicy.supportedLowerEfforts.includes(effort)) {
    throw new Error("Choose a supported effort lower than the sent effort.");
  }

  await saveRecoverySetting(
    receipt.sentPolicy.outputClass === "prose"
      ? { proseReasoningEffort: effort }
      : { assistanceReasoningEffort: effort }
  );
}

export async function raiseOutputLimitCeiling(
  receipt: OutputLimitReceipt,
  completionCeiling: number
): Promise<void> {
  if (!Number.isSafeInteger(completionCeiling) || completionCeiling <= receipt.sentPolicy.completionCeiling) {
    throw new Error(`Enter a whole-number ceiling above ${receipt.sentPolicy.completionCeiling}.`);
  }

  await saveRecoverySetting(
    receipt.sentPolicy.outputClass === "prose"
      ? { proseMaxOutputTokens: completionCeiling }
      : { assistanceMaxOutputTokens: completionCeiling }
  );
}

async function saveRecoverySetting(
  patch:
    | { proseReasoningEffort: OpenRouterReasoningEffort }
    | { assistanceReasoningEffort: OpenRouterReasoningEffort }
    | { proseMaxOutputTokens: number }
    | { assistanceMaxOutputTokens: number }
): Promise<void> {
  const result = await putOpenRouterSettings(patch);
  if (isApiFailure(result)) {
    throw new Error(result.message);
  }
}

function isApiFailure(value: unknown): value is ApiFailure {
  return value !== null && typeof value === "object" &&
    "ok" in value && (value as { ok?: unknown }).ok === false;
}
