import {
  acceptedSegmentProvenanceSchema,
  acceptedSegmentVersionsSchema
} from "@loom/core";
import type { DatabaseSync } from "node:sqlite";
import { z } from "zod";

const legacyOpenRouterMetadataSchema = z.strictObject({
  model: z.string().min(1),
  provider: z.literal("openrouter"),
  temperature: z.number(),
  maxOutputTokens: z.number().int(),
  topP: z.number().optional(),
  versions: acceptedSegmentVersionsSchema
});

const v4OpenRouterMetadataSchema = z.strictObject({
  source: z.literal("openrouter"),
  model: z.string().min(1),
  provider: z.literal("openrouter"),
  temperature: z.number(),
  maxOutputTokens: z.number().int(),
  topP: z.number().optional(),
  versions: acceptedSegmentVersionsSchema
});

const v4UserSuppliedMetadataSchema = z.strictObject({
  source: z.literal("user_supplied"),
  versions: acceptedSegmentVersionsSchema
});

const v5OpenRouterMetadataSchema = z.union([
  z.strictObject({
    source: z.literal("openrouter"),
    model: z.string().min(1),
    provider: z.literal("openrouter"),
    temperatureMode: z.literal("explicit"),
    temperature: z.number(),
    maxOutputTokens: z.number().int(),
    topP: z.number().optional(),
    versions: acceptedSegmentVersionsSchema
  }),
  z.strictObject({
    source: z.literal("openrouter"),
    model: z.string().min(1),
    provider: z.literal("openrouter"),
    temperatureMode: z.literal("provider_default"),
    maxOutputTokens: z.number().int(),
    topP: z.number().optional(),
    versions: acceptedSegmentVersionsSchema
  })
]);

interface AcceptedMetadataRow {
  id: number;
  metadata_json: string;
}

interface AcceptedMetadataRewrite {
  id: number;
  metadataJson: string;
}

export function rewriteAcceptedSegmentProvenance(database: DatabaseSync): void {
  const rows = database
    .prepare("SELECT id, metadata_json FROM accepted_segments ORDER BY id")
    .all() as unknown as AcceptedMetadataRow[];
  const rewrites = rows.flatMap((row): AcceptedMetadataRewrite[] => {
    const raw = JSON.parse(row.metadata_json) as unknown;
    if (acceptedSegmentProvenanceSchema.safeParse(raw).success) {
      return [];
    }

    const legacy = legacyOpenRouterMetadataSchema.parse(raw);
    return [{
      id: row.id,
      metadataJson: JSON.stringify({ source: "openrouter", ...legacy })
    }];
  });

  const update = database.prepare("UPDATE accepted_segments SET metadata_json = ? WHERE id = ?");
  for (const rewrite of rewrites) {
    update.run(rewrite.metadataJson, rewrite.id);
  }
}

export function rewriteAcceptedSegmentSamplingMode(database: DatabaseSync): void {
  const rows = database
    .prepare("SELECT id, metadata_json FROM accepted_segments ORDER BY id")
    .all() as unknown as AcceptedMetadataRow[];
  const rewrites = rows.flatMap((row): AcceptedMetadataRewrite[] => {
    const raw = JSON.parse(row.metadata_json) as unknown;
    if (acceptedSegmentProvenanceSchema.safeParse(raw).success) {
      return [];
    }

    const userSupplied = v4UserSuppliedMetadataSchema.safeParse(raw);
    if (userSupplied.success) {
      return [];
    }

    const legacy = v4OpenRouterMetadataSchema.parse(raw);
    return [{
      id: row.id,
      metadataJson: JSON.stringify({
        source: legacy.source,
        model: legacy.model,
        provider: legacy.provider,
        temperatureMode: "explicit",
        temperature: legacy.temperature,
        maxOutputTokens: legacy.maxOutputTokens,
        ...(legacy.topP === undefined ? {} : { topP: legacy.topP }),
        versions: legacy.versions
      })
    }];
  });

  const update = database.prepare("UPDATE accepted_segments SET metadata_json = ? WHERE id = ?");
  for (const rewrite of rewrites) {
    update.run(rewrite.metadataJson, rewrite.id);
  }
}

export function rewriteAcceptedSegmentReasoningIntent(database: DatabaseSync): void {
  const rows = database
    .prepare("SELECT id, metadata_json FROM accepted_segments ORDER BY id")
    .all() as unknown as AcceptedMetadataRow[];
  const rewrites = rows.flatMap((row): AcceptedMetadataRewrite[] => {
    const raw = JSON.parse(row.metadata_json) as unknown;
    if (acceptedSegmentProvenanceSchema.safeParse(raw).success) {
      return [];
    }

    const userSupplied = v4UserSuppliedMetadataSchema.safeParse(raw);
    if (userSupplied.success) {
      return [];
    }

    const legacy = v5OpenRouterMetadataSchema.parse(raw);
    const { versions, ...metadata } = legacy;
    return [{
      id: row.id,
      metadataJson: JSON.stringify({
        ...metadata,
        reasoningIntent: "provider_default",
        versions
      })
    }];
  });

  const update = database.prepare("UPDATE accepted_segments SET metadata_json = ? WHERE id = ?");
  for (const rewrite of rewrites) {
    update.run(rewrite.metadataJson, rewrite.id);
  }
}
