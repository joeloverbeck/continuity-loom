import type { z } from "zod";

import { causalPressureDefinitions } from "./causal-pressure.js";
import { castMemberDefinition } from "./cast-member.js";
import { entityDefinitions } from "./entity.js";
import { knowledgeDefinitions } from "./knowledge.js";
import { relationshipEmotionDefinitions } from "./relationship-emotion.js";
import type { RecordReference } from "./references.js";
import { spaceMaterialDefinitions } from "./space-material.js";

export type StatusProjector<TPayload = unknown> = (payload: TPayload) => string | null;
export type ProjectionProjector<TPayload = unknown> = (payload: TPayload) => string | number | null;

export interface RecordTypeDefinition<TPayload = unknown> {
  recordType: string;
  payloadSchema: z.ZodType<TPayload>;
  statusValues?: readonly string[];
  projectStatus?(payload: TPayload): string | null;
  projectSalience?(payload: TPayload): string | number | null;
  projectUrgency?(payload: TPayload): string | number | null;
  extractReferences(payload: TPayload): RecordReference[];
}

const definitions = [
  ...entityDefinitions,
  castMemberDefinition,
  ...knowledgeDefinitions,
  ...spaceMaterialDefinitions,
  ...causalPressureDefinitions,
  ...relationshipEmotionDefinitions
] satisfies RecordTypeDefinition[];

export const recordTypeRegistry: Readonly<Record<string, RecordTypeDefinition>> = Object.freeze(
  Object.fromEntries(definitions.map((definition) => [definition.recordType, definition]))
);

export const recordTypes = Object.freeze(definitions.map((definition) => definition.recordType));

export function getRecordTypeDefinition(recordType: string): RecordTypeDefinition | undefined {
  return recordTypeRegistry[recordType];
}

export function parseRecordPayload(recordType: string, payload: unknown): unknown {
  const definition = getRecordTypeDefinition(recordType);

  if (!definition) {
    throw new Error(`Unsupported record type: ${recordType}`);
  }

  return definition.payloadSchema.parse(payload);
}

export function extractRecordReferences(recordType: string, payload: unknown): RecordReference[] {
  const definition = getRecordTypeDefinition(recordType);

  if (!definition) {
    throw new Error(`Unsupported record type: ${recordType}`);
  }

  return definition.extractReferences(payload);
}

export function projectRecordStatus(recordType: string, payload: unknown): string | null {
  return getRecordTypeDefinition(recordType)?.projectStatus?.(payload) ?? null;
}

export function projectRecordSalience(recordType: string, payload: unknown): string | number | null {
  return getRecordTypeDefinition(recordType)?.projectSalience?.(payload) ?? null;
}

export function projectRecordUrgency(recordType: string, payload: unknown): string | number | null {
  return getRecordTypeDefinition(recordType)?.projectUrgency?.(payload) ?? null;
}
