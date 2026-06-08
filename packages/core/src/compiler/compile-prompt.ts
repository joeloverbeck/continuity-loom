import type { ValidationSnapshot } from "../validation/snapshot.js";
import { estimatePromptTokens, fingerprintPrompt } from "./fingerprint.js";
import { resolvePlaceholder, type PlaceholderName } from "./placeholder-map.js";
import {
  COMPOSITE_SECTION_TEMPLATES,
  SECTION_ORDER,
  SECTION_TEMPLATES,
  type CompositeSectionId,
  type PromptSectionId
} from "./template-constants.js";
import type { CompileResult } from "./types.js";

const placeholderPattern = /\{([a-zA-Z0-9_]+)\}/g;

const currentAuthoritativeStateLines: readonly {
  label: string;
  placeholder: PlaceholderName;
  alwaysRender?: boolean;
}[] = [
  { label: "Time", placeholder: "current_time", alwaysRender: true },
  { label: "Location", placeholder: "current_location", alwaysRender: true },
  { label: "Onstage entities", placeholder: "onstage_entities", alwaysRender: true },
  { label: "Immediate situation", placeholder: "immediate_situation_summary", alwaysRender: true },
  { label: "Offstage but pressuring entities", placeholder: "offstage_pressuring_entities" },
  { label: "Current physical positions", placeholder: "positions" },
  { label: "Current agency/status", placeholder: "entity_statuses" },
  { label: "Current possessions", placeholder: "possessions" },
  { label: "Visible injuries/conditions", placeholder: "visible_conditions" },
  { label: "Environmental conditions", placeholder: "environmental_conditions" },
  { label: "Line of sight / visibility", placeholder: "line_of_sight_and_visibility" },
  { label: "Routes and exits", placeholder: "routes_and_exits" },
  { label: "Available time", placeholder: "available_time" },
  { label: "Consent or force conditions", placeholder: "consent_or_force_conditions" },
  { label: "Current continuity locks", placeholder: "current_locks" }
];

export { SECTION_ORDER };

export function compilePrompt(snapshot: ValidationSnapshot): CompileResult {
  const prompt = renderPrompt(snapshot);

  return {
    prompt,
    metadata: {
      versions: snapshot.versions,
      fingerprint: fingerprintPrompt(prompt),
      lengthEstimate: prompt.length,
      tokenEstimate: estimatePromptTokens(prompt)
    }
  };
}

function renderPrompt(snapshot: ValidationSnapshot): string {
  return [
    "# Generated Prose Prompt",
    "",
    ...SECTION_ORDER.map((sectionId) => renderSection(sectionId, snapshot))
  ].join("\n\n");
}

function renderSection(sectionId: PromptSectionId, snapshot: ValidationSnapshot): string {
  if (isCompositeSectionId(sectionId)) {
    return renderCompositeSection(sectionId, snapshot);
  }

  if (sectionId === "current_authoritative_state") {
    return renderCurrentAuthoritativeStateSection(snapshot);
  }

  const template = SECTION_TEMPLATES[sectionId];
  return template.replace(placeholderPattern, (_match, placeholder: string) =>
    resolvePlaceholder(placeholder, snapshot)
  );
}

function renderCurrentAuthoritativeStateSection(snapshot: ValidationSnapshot): string {
  const renderedLines = currentAuthoritativeStateLines
    .filter((line) => line.alwaysRender || hasCurrentStateValue(snapshot, line.placeholder))
    .map((line) => `${line.label}: ${resolvePlaceholder(line.placeholder, snapshot)}`);

  return `<current_authoritative_state>\n${renderedLines.join("\n")}\n</current_authoritative_state>`;
}

function hasCurrentStateValue(snapshot: ValidationSnapshot, placeholder: PlaceholderName): boolean {
  const state = snapshot.generationSession.current_authoritative_state;

  switch (placeholder) {
    case "offstage_pressuring_entities":
      return hasValue(state?.offstage_pressuring_entities);
    case "positions":
      return hasValue(state?.positions);
    case "entity_statuses":
      return hasValue(state?.entity_statuses);
    case "possessions":
      return hasValue(state?.possessions);
    case "visible_conditions":
      return hasValue(state?.visible_conditions);
    case "environmental_conditions":
      return hasValue(state?.environmental_conditions);
    case "line_of_sight_and_visibility":
      return hasValue(state?.line_of_sight_and_visibility);
    case "routes_and_exits":
      return hasValue(state?.routes_and_exits);
    case "available_time":
      return hasValue(state?.available_time);
    case "consent_or_force_conditions":
      return hasValue(state?.consent_or_force_conditions) && state?.consent_or_force_conditions !== "none";
    case "current_locks":
      return hasValue(state?.current_locks);
    default:
      return true;
  }
}

function hasValue(value: unknown): boolean {
  if (Array.isArray(value)) {
    return value.some(hasValue);
  }

  return typeof value === "string" && value.trim().length > 0;
}

function renderCompositeSection(sectionId: CompositeSectionId, snapshot: ValidationSnapshot): string {
  const template = COMPOSITE_SECTION_TEMPLATES[sectionId];
  const blocks = template.subBlocks
    .map((block) => {
      const content = resolvePlaceholder(block.placeholder, snapshot).trim();
      return content ? `${block.label}:\n${content}` : "";
    })
    .filter(Boolean);
  const body = blocks.join("\n\n") || template.emptyState;

  return `<${sectionId}>\n${body}\n</${sectionId}>`;
}

function isCompositeSectionId(sectionId: PromptSectionId): sectionId is CompositeSectionId {
  return Object.hasOwn(COMPOSITE_SECTION_TEMPLATES, sectionId);
}
