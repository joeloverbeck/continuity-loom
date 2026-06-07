import { describeSchemaFields } from "./editor-descriptors.js";
import { enumerateCanonicalPaths } from "./field-path-enumeration.js";
import { generationSessionSchema } from "./generation-brief.js";

export const generationBriefDescriptors = describeSchemaFields(generationSessionSchema);

export function generationBriefFieldPaths(): readonly string[] {
  return enumerateCanonicalPaths("GENERATION BRIEF", generationBriefDescriptors);
}
