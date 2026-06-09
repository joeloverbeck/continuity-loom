import {
  cloneElement,
  isValidElement,
  type ReactElement,
  type ReactNode
} from "react";
import { getFieldGuidance, type FieldRequiredness } from "@loom/core";

import { FieldHelp } from "../field-help/FieldHelp.js";
import { RequirednessMarker } from "./RequirednessMarker.js";
import type { GenerationContext } from "./requiredness-now.js";

interface BriefFieldRowProps {
  path: string;
  schemaLabel: string;
  generationContext: GenerationContext;
  children: ReactNode;
}

export function BriefFieldRow({
  path,
  schemaLabel,
  generationContext,
  children
}: BriefFieldRowProps): React.JSX.Element {
  const guidance = getFieldGuidance(`GENERATION BRIEF.${path}`);
  const helperId = `brief-helper-${path.replace(/[^a-zA-Z0-9]+/g, "-")}`;
  const controlId = `brief-control-${path.replace(/[^a-zA-Z0-9]+/g, "-")}`;
  const displayLabel = guidance?.displayLabel ?? schemaLeaf(path);
  const describedBy = guidance?.short ? helperId : undefined;

  return (
    <div className="briefFieldRow">
      <span className="briefFieldLabelRow">
        <label className="briefFieldControlLabel" htmlFor={controlId}>
          <span className="briefFieldHumanLabel">{displayLabel}</span>
          <RequirednessMarker requiredness={guidance?.requiredness} generationContext={generationContext} />
          <code className="briefFieldSchemaPath">{schemaLabel}</code>
        </label>
        <FieldHelp fieldPath={`GENERATION BRIEF.${path}`} fieldLabel={displayLabel} showCriticalHint={false} />
      </span>
      {guidance?.short ? (
        <span id={helperId} className="briefFieldHelperText">
          {guidance.short}
        </span>
      ) : null}
      {guidance?.criticalVisibleHint ? (
        <span className="fieldHelpCriticalHint briefFieldCriticalHint">{guidance.criticalVisibleHint}</span>
      ) : null}
      {withControlProps(children, controlId, describedBy, guidance?.requiredness)}
    </div>
  );
}

function withControlProps(
  children: ReactNode,
  controlId: string,
  describedBy: string | undefined,
  requiredness: FieldRequiredness | undefined
): ReactNode {
  if (!isValidElement(children)) {
    return children;
  }

  const child = children as ReactElement<Record<string, unknown>>;
  const props: Record<string, unknown> = {};

  if (child.props.id === undefined) {
    props.id = controlId;
  }

  if (describedBy) {
    const existing = typeof child.props["aria-describedby"] === "string" ? child.props["aria-describedby"] : "";
    props["aria-describedby"] = [existing, describedBy].filter(Boolean).join(" ");
  }

  if (child.type === "textarea" && child.props.rows === undefined) {
    props.rows = requiredness === "always" || requiredness === "continuation" ? 4 : 2;
  }

  return Object.keys(props).length > 0 ? cloneElement(child, props) : children;
}

function schemaLeaf(path: string): string {
  return path.split(".").at(-1)?.replace(/\[]$/, "") ?? path;
}
