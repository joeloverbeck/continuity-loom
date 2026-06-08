import type { ValidationSnapshot } from "../validation/snapshot.js";
import { EMPTY_STATE_CONSTANTS } from "./empty-states.js";
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

const immediateHandoffBlocks: readonly {
  label: string;
  placeholder: PlaceholderName;
  alwaysRender?: boolean;
}[] = [
  {
    label: "Recent causal context (writer-visible; not automatically POV knowledge)",
    placeholder: "recent_causal_context",
    alwaysRender: true
  },
  { label: "Last visible moment", placeholder: "last_visible_moment" },
  {
    label: "Prior accepted prose status / user-authored continuity handoff",
    placeholder: "prior_accepted_prose_status_or_handoff_note",
    alwaysRender: true
  },
  { label: "Begin prose exactly after this point", placeholder: "begin_after" }
];

const manualDirectiveBlocks: readonly {
  label: string;
  placeholder: PlaceholderName;
  alwaysRender?: boolean;
}[] = [
  { label: "Must render", placeholder: "manual_must_render", alwaysRender: true },
  { label: "May render if naturally caused", placeholder: "manual_may_render_if_naturally_caused" },
  { label: "Do not force", placeholder: "manual_do_not_force" }
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
    ...SECTION_ORDER.map((sectionId) => renderSection(sectionId, snapshot)).filter((section) => section !== null)
  ].join("\n\n");
}

function renderSection(sectionId: PromptSectionId, snapshot: ValidationSnapshot): string | null {
  if (sectionId === "present_minor_cast" && !hasSelectedCastBand(snapshot, "present_minor_cast_compressed")) {
    return null;
  }

  if (sectionId === "offstage_relevance" && !shouldRenderOffstageRelevance(snapshot)) {
    return null;
  }

  if (isCompositeSectionId(sectionId)) {
    return renderCompositeSection(sectionId, snapshot);
  }

  if (sectionId === "current_authoritative_state") {
    return renderCurrentAuthoritativeStateSection(snapshot);
  }

  if (sectionId === "immediate_handoff") {
    return renderImmediateHandoffSection(snapshot);
  }

  if (sectionId === "manual_directive") {
    return renderManualDirectiveSection(snapshot);
  }

  if (sectionId === "audience_knowledge") {
    return renderAudienceKnowledgeSection(snapshot);
  }

  if (sectionId === "stop_rule") {
    return renderStopRuleSection(snapshot);
  }

  const template = SECTION_TEMPLATES[sectionId];
  return renderTemplate(template, snapshot);
}

function renderCurrentAuthoritativeStateSection(snapshot: ValidationSnapshot): string {
  const renderedLines = currentAuthoritativeStateLines
    .filter((line) => line.alwaysRender || hasCurrentStateValue(snapshot, line.placeholder))
    .map((line) => `${line.label}: ${resolvePlaceholder(line.placeholder, snapshot)}`);

  return `<current_authoritative_state>\n${renderedLines.join("\n")}\n</current_authoritative_state>`;
}

function renderImmediateHandoffSection(snapshot: ValidationSnapshot): string {
  const renderedBlocks = immediateHandoffBlocks
    .filter((block) => block.alwaysRender || hasImmediateHandoffValue(snapshot, block.placeholder))
    .map((block) => `${block.label}:\n${resolvePlaceholder(block.placeholder, snapshot)}`);
  const body = [
    ...renderedBlocks,
    "Do not include or quote accepted prose. Do not infer canon from archived prose. Use this handoff only as user-authored continuity context. Do not recap except through brief POV-colored perception or pressure."
  ].join("\n\n");

  return `<immediate_handoff>\n${body}\n</immediate_handoff>`;
}

function renderManualDirectiveSection(snapshot: ValidationSnapshot): string {
  const renderedBlocks = manualDirectiveBlocks
    .filter((block) => block.alwaysRender || hasManualDirectiveValue(snapshot, block.placeholder))
    .map((block) => `${block.label}:\n${resolvePlaceholder(block.placeholder, snapshot)}`);

  return `<manual_directive priority="high">\n${renderedBlocks.join("\n\n")}\n</manual_directive>`;
}

function renderStopRuleSection(snapshot: ValidationSnapshot): string {
  const guidance = resolvePlaceholder("soft_unit_guidance", snapshot).trim();
  const template = SECTION_TEMPLATES.stop_rule;

  if (!guidance) {
    return template;
  }

  return template.replace("\n\nStop as soon as one of these occurs:", `\n\nSoft unit: ${guidance}\n\nStop as soon as one of these occurs:`);
}

function renderAudienceKnowledgeSection(snapshot: ValidationSnapshot): string {
  const ambiguousAudiencePerception = resolvePlaceholder("audience_perception_ambiguous", snapshot).trim();
  const template = SECTION_TEMPLATES.audience_knowledge;

  if (
    !ambiguousAudiencePerception ||
    ambiguousAudiencePerception === EMPTY_STATE_CONSTANTS.audience_perception_ambiguous
  ) {
    return renderTemplate(template, snapshot);
  }

  const ambiguousBlock = [
    "Audience may be inferring (ambiguous - not established reader knowledge):",
    ambiguousAudiencePerception,
    "",
    "Treat these as unresolved: shape suspense and surface cues, but do not write as if the audience has confirmed them."
  ].join("\n");

  return renderTemplate(
    template.replace(
      "\n\nIf the audience knows something the POV does not,",
      `\n\n${ambiguousBlock}\n\nIf the audience knows something the POV does not,`
    ),
    snapshot
  );
}

function renderTemplate(template: string, snapshot: ValidationSnapshot): string {
  return template.replace(placeholderPattern, (_match, placeholder: string) =>
    resolvePlaceholder(placeholder, snapshot)
  );
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

function hasImmediateHandoffValue(snapshot: ValidationSnapshot, placeholder: PlaceholderName): boolean {
  const handoff = snapshot.generationSession.immediate_handoff;

  switch (placeholder) {
    case "last_visible_moment":
      return hasValue(handoff?.last_visible_moment);
    case "begin_after":
      return hasValue(handoff?.begin_after);
    default:
      return true;
  }
}

function hasManualDirectiveValue(snapshot: ValidationSnapshot, placeholder: PlaceholderName): boolean {
  const directive = snapshot.generationSession.manual_moment_directive;

  switch (placeholder) {
    case "manual_may_render_if_naturally_caused":
      return hasValue(directive?.may_render_if_naturally_caused);
    case "manual_do_not_force":
      return hasValue(directive?.do_not_force);
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

function hasSelectedCastBand(
  snapshot: ValidationSnapshot,
  castBand: "present_minor_cast_compressed" | "offstage_relevant_cast"
): boolean {
  return snapshot.records.some((record) => record.castBand === castBand);
}

function shouldRenderOffstageRelevance(snapshot: ValidationSnapshot): boolean {
  return (
    hasSelectedCastBand(snapshot, "offstage_relevant_cast") ||
    hasValue(snapshot.generationSession.current_authoritative_state?.offstage_pressuring_entities) ||
    snapshot.generationSession.generation_validation_focus?.validation_focus_tags.expected_local_modes?.includes(
      "offstage_interruption_possible"
    ) === true
  );
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
