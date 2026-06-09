import type { FieldRequiredness } from "@loom/core";

type GenerationContext = "first_segment" | "continuation_after_accepted_segment";

export function RequirednessMarker({
  requiredness,
  generationContext
}: {
  requiredness: FieldRequiredness | undefined;
  generationContext: GenerationContext;
}): React.JSX.Element | null {
  if (!requiredness) {
    return null;
  }

  if (requiredness === "always") {
    return <strong aria-label="required"> *</strong>;
  }

  if (requiredness === "continuation") {
    return generationContext === "continuation_after_accepted_segment"
      ? <strong aria-label="required"> *</strong>
      : <span className="briefRequirednessTag">Optional for a first segment</span>;
  }

  if (requiredness === "conditional") {
    return (
      <span className="briefRequirednessTag" aria-label="conditional" title="Required when relevant - the readiness checklist confirms when.">
        Conditional
      </span>
    );
  }

  return <span className="briefRequirednessTag">Optional</span>;
}
