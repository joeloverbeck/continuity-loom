import type { FieldRequiredness } from "@loom/core";

import { isRequiredNow, type GenerationContext } from "./requiredness-now.js";

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

  if (isRequiredNow(requiredness, generationContext)) {
    return <strong aria-label="required"> *</strong>;
  }

  if (requiredness === "continuation") {
    return <span className="briefRequirednessTag">Optional for a first segment</span>;
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
