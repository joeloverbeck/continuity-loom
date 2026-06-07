import * as Popover from "@radix-ui/react-popover";
import {
  getFieldGuidance,
  type EnumValueGuidance,
  type FieldGuidance
} from "@loom/core";
import { useState } from "react";

import { fieldHelpId } from "./field-help-ids.js";

export interface FieldHelpProps {
  fieldPath: string;
  fieldLabel: string;
  listContext?: string;
}

export function FieldHelp({ fieldPath, fieldLabel, listContext }: FieldHelpProps) {
  const guidance = getFieldGuidance(fieldPath);
  const [open, setOpen] = useState(false);

  if (!guidance) {
    return null;
  }

  const contentId = fieldHelpId(guidance.fieldPath, listContext);
  const descriptionId = `${contentId}-summary`;

  return (
    <span className="fieldHelp">
      {guidance.criticalVisibleHint ? (
        <span className="fieldHelpCriticalHint">{guidance.criticalVisibleHint}</span>
      ) : null}
      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger asChild>
          <button
            type="button"
            className="fieldHelpTrigger"
            aria-label={`Help for ${fieldLabel}`}
            aria-expanded={open}
            aria-controls={contentId}
            aria-describedby={descriptionId}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                setOpen((current) => !current);
              }
            }}
          >
            i
          </button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            id={contentId}
            className="fieldHelpPopover"
            sideOffset={8}
            collisionPadding={12}
          >
            <div className="fieldHelpHeader">
              <strong>{fieldLabel}</strong>
              <span className="fieldHelpBadge">{statusLabel(guidance)}</span>
            </div>
            <p id={descriptionId}>{guidance.short}</p>
            <GuidanceSection title="Prompt" items={promptItems(guidance)} />
            <GuidanceSection title="Validation" items={[guidance.validationRole]} />
            <GuidanceSection title="Continuity" items={[guidance.continuityRole]} />
            <GuidanceSection title="Advice" items={[guidance.authoringAdvice]} />
            <GuidanceSection title="Warnings" items={guidance.doctrineWarnings} />
            <GuidanceSection title="Examples" items={guidance.examples} />
            <GuidanceSection title="Avoid" items={guidance.antiExamples ?? guidance.commonMistakes} />
            <EnumGuidance enumValues={guidance.enumValues} />
            <GuidanceSection title="Related" items={guidance.relatedFields} />
            <Popover.Arrow className="fieldHelpArrow" />
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </span>
  );
}

function statusLabel(guidance: FieldGuidance): string {
  if (guidance.promptFacing === "never") {
    return "Validation only";
  }

  if (
    guidance.fieldPath.includes("current_cast_voice_pressure")
    || guidance.fieldPath.includes("cast_voice_overrides")
  ) {
    return "Current generation only";
  }

  return "Prompt";
}

function promptItems(guidance: FieldGuidance): string[] {
  if (guidance.promptFacing === "never") {
    return ["Not sent to the prose prompt."];
  }

  const destinationText = guidance.promptDestinations?.length
    ? `Destinations: ${guidance.promptDestinations.join(", ")}.`
    : undefined;

  return [
    guidance.promptFacing === "always"
      ? "Sent whenever this surface is compiled."
      : "Sent when the owning surface is active, selected, or non-empty.",
    destinationText
  ].filter((item): item is string => Boolean(item));
}

function GuidanceSection({ title, items }: { title: string; items: readonly (string | undefined)[] | undefined }) {
  const visibleItems = (items ?? []).filter((item): item is string => Boolean(item?.trim()));

  if (visibleItems.length === 0) {
    return null;
  }

  return (
    <section className="fieldHelpSection">
      <h4>{title}</h4>
      {visibleItems.length === 1 ? (
        <p>{visibleItems[0]}</p>
      ) : (
        <ul>
          {visibleItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
    </section>
  );
}

function EnumGuidance({ enumValues }: { enumValues: Record<string, EnumValueGuidance> | undefined }) {
  if (!enumValues || Object.keys(enumValues).length === 0) {
    return null;
  }

  return (
    <section className="fieldHelpSection">
      <h4>Values</h4>
      <dl className="fieldHelpEnumList">
        {Object.entries(enumValues).map(([value, guidance]) => (
          <div key={value}>
            <dt>{value}</dt>
            <dd>
              {guidance.short}
              {guidance.implications ? ` ${guidance.implications}` : ""}
              {guidance.useWhen ? ` Use when: ${guidance.useWhen}` : ""}
              {guidance.avoidWhen ? ` Avoid when: ${guidance.avoidWhen}` : ""}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
