import type { FieldRequiredness } from "@loom/core";

export type GenerationContext = "first_segment" | "continuation_after_accepted_segment";

export function isRequiredNow(
  requiredness: FieldRequiredness | undefined,
  generationContext: GenerationContext
): boolean {
  return requiredness === "always"
    || (requiredness === "continuation" && generationContext === "continuation_after_accepted_segment");
}
