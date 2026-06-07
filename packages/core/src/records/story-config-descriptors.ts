import type { FieldDescriptor } from "./editor-descriptors.js";
import { describeSchemaFields } from "./editor-descriptors.js";
import { enumerateCanonicalPaths } from "./field-path-enumeration.js";
import {
  proseModeSchema,
  storyContractSchema,
  universalContentPolicySchema
} from "./global-config.js";

export const storyConfigDescriptors: Readonly<Record<string, readonly FieldDescriptor[]>> = Object.freeze({
  "STORY CONTRACT": describeSchemaFields(storyContractSchema),
  "UNIVERSAL CONTENT POLICY": describeSchemaFields(universalContentPolicySchema),
  "PROSE MODE": describeSchemaFields(proseModeSchema)
});

export function storyConfigFieldPaths(): readonly string[] {
  return Object.entries(storyConfigDescriptors).flatMap(([ownerKind, fields]) =>
    enumerateCanonicalPaths(ownerKind, fields)
  );
}
