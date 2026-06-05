import { DIAGNOSTIC_CODES, type Diagnostic } from "../types.js";
import type { ValidationRecord, ValidationSnapshot } from "../snapshot.js";
import type { ValidationRule } from "./types.js";

const KEY_LIKE_PATTERN = /\b(?:sk-or-v1-[A-Za-z0-9_-]{20,}|sk-[A-Za-z0-9]{20,}|[A-Za-z0-9_-]{24,}\.[A-Za-z0-9_-]{24,}\.[A-Za-z0-9_-]{24,})\b/;

export const securityRules: readonly ValidationRule[] = Object.freeze([
  validatePromptFacingKeySafety
]);

function validatePromptFacingKeySafety(snapshot: ValidationSnapshot): readonly Diagnostic[] {
  return promptFacingFields(snapshot)
    .filter((entry) => KEY_LIKE_PATTERN.test(entry.text))
    .map((entry) => ({
      severity: "blocker",
      code: DIAGNOSTIC_CODES.apiKeyLikePromptFacingText,
      message: "Prompt-facing text contains an API-key-like secret. Remove it before validation can pass.",
      affected: [{ field: entry.field }],
      whyItMatters: "Keys and credentials must never be sent to a prose model or surfaced in diagnostics.",
      suggestedActions: ["remove", "revise"]
    }));
}

function promptFacingFields(snapshot: ValidationSnapshot): readonly { field: string; text: string }[] {
  return [
    ...stringsFromUnknown("generationSession", snapshot.generationSession),
    ...snapshot.records.flatMap((record) => stringsFromRecord(record))
  ];
}

function stringsFromRecord(record: ValidationRecord): readonly { field: string; text: string }[] {
  return stringsFromUnknown(`record:${record.id}`, record.payload);
}

function stringsFromUnknown(field: string, value: unknown): readonly { field: string; text: string }[] {
  if (typeof value === "string") {
    return [{ field, text: value }];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item, index) => stringsFromUnknown(`${field}[${index}]`, item));
  }

  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([key, nested]) => stringsFromUnknown(`${field}.${key}`, nested));
  }

  return [];
}
