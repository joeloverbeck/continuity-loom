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
