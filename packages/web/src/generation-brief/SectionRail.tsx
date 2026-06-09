import { useEffect, useState } from "react";
import type { GenerationSessionDraft } from "@loom/core";

import {
  computeSectionFill,
  sectionFillLabel,
  type BriefSectionId,
  type SectionFill
} from "./section-fill.js";
import type { GenerationContext } from "./requiredness-now.js";

interface SectionRailProps {
  draft: GenerationSessionDraft;
  generationContext: GenerationContext;
}

interface SectionRailEntry {
  id: "validation" | BriefSectionId;
  targetId: string;
  label: string;
}

export const sectionRailEntries: readonly SectionRailEntry[] = [
  { id: "validation", targetId: "validation-panel-title", label: "Validation" },
  { id: "active-working-set", targetId: "active-working-set-brief", label: "Active working set" },
  { id: "current-state", targetId: "current-state-brief", label: "Current state" },
  { id: "handoff", targetId: "handoff-brief", label: "Handoff" },
  { id: "directive", targetId: "directive-brief", label: "Directive" },
  { id: "voice-pressure", targetId: "voice-pressure-brief", label: "Voice pressure" },
  { id: "override", targetId: "override-brief", label: "Overrides" },
  { id: "validation-focus", targetId: "validation-focus-brief", label: "Validation focus" },
  { id: "stop-guidance", targetId: "stop-guidance-brief", label: "Stop guidance" }
];

export function SectionRail({ draft, generationContext }: SectionRailProps): React.JSX.Element {
  const [activeTargetId, setActiveTargetId] = useState(sectionRailEntries[0]?.targetId ?? "");
  const fillsBySection = new Map(
    computeSectionFill(draft, generationContext).map((fill) => [fill.sectionId, fill])
  );

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") {
      return;
    }

    const headings = sectionRailEntries
      .map((entry) => document.getElementById(entry.targetId))
      .filter((heading): heading is HTMLElement => Boolean(heading));

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((left, right) => left.boundingClientRect.top - right.boundingClientRect.top)[0];

        if (visible?.target instanceof HTMLElement) {
          setActiveTargetId(visible.target.id);
        }
      },
      { rootMargin: "-20% 0px -65% 0px", threshold: [0, 1] }
    );

    for (const heading of headings) {
      observer.observe(heading);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <nav className="briefSectionRail" aria-label="Generation brief sections">
      <ul>
        {sectionRailEntries.map((entry) => {
          const fill = entry.id === "validation" ? undefined : fillsBySection.get(entry.id);

          return (
            <li key={entry.id}>
              <a
                className={[
                  "briefSectionRailLink",
                  activeTargetId === entry.targetId ? "briefSectionRailLink-active" : ""
                ].filter(Boolean).join(" ")}
                href={`#${entry.targetId}`}
              >
                <span>{entry.label}</span>
                {fill ? <FillChip fill={fill} /> : null}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function FillChip({ fill }: { fill: SectionFill }): React.JSX.Element {
  return (
    <span className={`briefFillChip briefFillChip-${fill.tone}`}>
      {sectionFillLabel(fill)}
    </span>
  );
}
