import { normalizeListIndices } from "@loom/core";

export function fieldHelpId(canonicalPath: string, listContext?: string): string {
  const normalizedPath = normalizeListIndices(canonicalPath);
  const suffix = listContext ? `${normalizedPath}.${listContext}` : normalizedPath;

  return `field-help-${suffix.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
}
