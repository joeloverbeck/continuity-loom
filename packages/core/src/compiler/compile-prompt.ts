import type { ValidationSnapshot } from "../validation/snapshot.js";
import { EMPTY_STATE_CONSTANTS } from "./empty-states.js";
import { estimatePromptTokens, fingerprintPrompt } from "./fingerprint.js";
import { citationKeysFor } from "./ideation/citation-keys.js";
import type { IdeationRequest, PromptKind } from "./ideation/types.js";
import { resolvePlaceholder, type PlaceholderName } from "./placeholder-map.js";
import { renderCastPlaceholder } from "./sections/cast.js";
import { renderFrontPlaceholder } from "./sections/front.js";
import { renderIdeationSlotsSection } from "./sections/ideation.js";
import { renderPressurePlaceholder } from "./sections/pressure.js";
import { renderTailPlaceholder } from "./sections/records-tail.js";
import {
  COMPOSITE_SECTION_TEMPLATES,
  IDEATION_CONTENT_POLICY_TEMPLATE,
  IDEATION_SECTION_ORDER,
  IDEATION_SECTION_TEMPLATES,
  SECTION_ORDER,
  SECTION_TEMPLATES,
  type CompositeSectionId,
  type IdeationSectionId,
  type PromptSectionId
} from "./template-constants.js";
import type { CompileResult } from "./types.js";

const placeholderPattern = /\{([a-zA-Z0-9_]+)\}/g;

interface RenderContext {
  isIdeationPrompt: boolean;
  citationKeys?: ReadonlyMap<string, string>;
}

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

const povKnowledgeConstraintBlocks: readonly {
  label: string;
  placeholder: PlaceholderName;
}[] = [
  { label: "POV knows", placeholder: "pov_knows" },
  { label: "POV believes, suspects, or misreads", placeholder: "pov_believes_suspects_misreads" },
  { label: "POV does not know", placeholder: "pov_does_not_know" },
  { label: "POV cannot perceive right now", placeholder: "pov_cannot_perceive_now" }
];

const secretsAndRevealConstraintBlocks: readonly {
  label: string;
  placeholder: PlaceholderName;
}[] = [
  { label: "Writer-visible hidden truths", placeholder: "writer_visible_hidden_truths" },
  { label: "Secret holders", placeholder: "secret_holders" },
  { label: "Characters who must not know yet", placeholder: "secret_non_holders_to_protect" },
  { label: "Allowed clues and surface cues now", placeholder: "allowed_clues_and_surface_cues" },
  { label: "Forbidden reveals now", placeholder: "forbidden_reveals" },
  { label: "Reveal permission", placeholder: "reveal_permissions" }
];

export { SECTION_ORDER };

export interface CompilePromptOptions {
  promptKind?: PromptKind;
  ideationRequest?: Partial<IdeationRequest>;
}

export function compilePrompt(snapshot: ValidationSnapshot, options: CompilePromptOptions = {}): CompileResult {
  const prompt = renderPrompt(snapshot, options);

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

function renderPrompt(snapshot: ValidationSnapshot, options: CompilePromptOptions): string {
  if (options.promptKind === "ideation") {
    return renderIdeationPrompt(snapshot, options.ideationRequest ?? {});
  }

  return [
    "# Generated Prose Prompt",
    "",
    ...SECTION_ORDER.map((sectionId) =>
      renderSection(sectionId, snapshot, {}, { isIdeationPrompt: false })
    ).filter((section) => section !== null)
  ].join("\n\n");
}

function renderIdeationPrompt(snapshot: ValidationSnapshot, ideationRequest: Partial<IdeationRequest>): string {
  const context: RenderContext = {
    isIdeationPrompt: true,
    citationKeys: citationKeysFor(snapshot.records)
  };

  return [
    "# Grounded Ideation Prompt",
    "",
    ...IDEATION_SECTION_ORDER.map((sectionId) => renderSection(sectionId, snapshot, ideationRequest, context)).filter(
      (section) => section !== null
    )
  ].join("\n\n");
}

function renderSection(
  sectionId: PromptSectionId | IdeationSectionId,
  snapshot: ValidationSnapshot,
  ideationRequest: Partial<IdeationRequest> = {},
  context: RenderContext
): string | null {
  if (sectionId === "hard_canon" && !hasHardCanon(snapshot)) {
    return null;
  }

  if (sectionId === "present_minor_cast" && !hasSelectedCastBand(snapshot, "present_minor_cast_compressed")) {
    return null;
  }

  if (sectionId === "offstage_relevance" && !shouldRenderOffstageRelevance(snapshot)) {
    return null;
  }

  if (isPromptSectionId(sectionId) && isCompositeSectionId(sectionId)) {
    return renderCompositeSection(sectionId, snapshot, context);
  }

  if (sectionId === "current_authoritative_state") {
    return renderCurrentAuthoritativeStateSection(snapshot);
  }

  if (sectionId === "immediate_handoff") {
    return renderImmediateHandoffSection(snapshot, context);
  }

  if (sectionId === "manual_directive") {
    if (context.isIdeationPrompt && !hasAnyManualDirectiveValue(snapshot)) {
      return null;
    }

    return renderManualDirectiveSection(snapshot, context);
  }

  if (sectionId === "pov_knowledge_constraints") {
    return renderPovKnowledgeConstraintsSection(snapshot);
  }

  if (sectionId === "secrets_and_reveal_constraints") {
    return renderSecretsAndRevealConstraintsSection(snapshot, context);
  }

  if (sectionId === "audience_knowledge") {
    return renderAudienceKnowledgeSection(snapshot);
  }

  if (sectionId === "stop_rule") {
    return renderStopRuleSection(snapshot);
  }

  if (sectionId === "ideation_slots") {
    return renderIdeationSlotsSection(snapshot, ideationRequest);
  }

  if (sectionId === "content_policy" && context.isIdeationPrompt) {
    return renderTemplate(IDEATION_CONTENT_POLICY_TEMPLATE, snapshot, context);
  }

  if (sectionId === "relationship_and_emotion_pressure") {
    return renderTemplate(IDEATION_SECTION_TEMPLATES.relationship_and_emotion_pressure, snapshot, context);
  }

  if (isStaticIdeationSectionId(sectionId)) {
    return IDEATION_SECTION_TEMPLATES[sectionId];
  }

  if (!isPromptSectionId(sectionId)) {
    return null;
  }

  const template = SECTION_TEMPLATES[sectionId];
  return renderTemplate(template, snapshot, context);
}

function renderCurrentAuthoritativeStateSection(snapshot: ValidationSnapshot): string {
  const renderedLines = currentAuthoritativeStateLines
    .filter((line) => line.alwaysRender || hasCurrentStateValue(snapshot, line.placeholder))
    .map((line) => `${line.label}: ${resolvePlaceholder(line.placeholder, snapshot)}`);

  return `<current_authoritative_state>\n${renderedLines.join("\n")}\n</current_authoritative_state>`;
}

function renderImmediateHandoffSection(snapshot: ValidationSnapshot, context: RenderContext): string {
  const renderedBlocks = immediateHandoffBlocks
    .filter((block) => block.alwaysRender || hasImmediateHandoffValue(snapshot, block.placeholder))
    .map((block) => `${immediateHandoffLabel(block, context)}:\n${resolvePlaceholder(block.placeholder, snapshot)}`);
  const trailer = context.isIdeationPrompt
    ? "Use this handoff only as user-authored continuity context. Ideas must continue from this point; do not treat archived prose as canon."
    : "Do not include or quote accepted prose. Do not infer canon from archived prose. Use this handoff only as user-authored continuity context. Do not recap except through brief POV-colored perception or pressure.";
  const body = [
    ...renderedBlocks,
    trailer
  ].join("\n\n");

  return `<immediate_handoff>\n${body}\n</immediate_handoff>`;
}

function renderManualDirectiveSection(snapshot: ValidationSnapshot, context: RenderContext): string {
  const renderedBlocks = manualDirectiveBlocks
    .filter((block) => block.alwaysRender || hasManualDirectiveValue(snapshot, block.placeholder))
    .map((block) => `${manualDirectiveLabel(block, context)}:\n${resolvePlaceholder(block.placeholder, snapshot)}`);

  return `<manual_directive priority="high">\n${renderedBlocks.join("\n\n")}\n</manual_directive>`;
}

function immediateHandoffLabel(block: (typeof immediateHandoffBlocks)[number], context: RenderContext): string {
  if (context.isIdeationPrompt && block.placeholder === "begin_after") {
    return "The next prose segment will begin after this point";
  }

  return block.label;
}

function manualDirectiveLabel(block: (typeof manualDirectiveBlocks)[number], context: RenderContext): string {
  if (context.isIdeationPrompt && block.placeholder === "manual_must_render") {
    return "The author's directive for the next segment (binding context: ideas must be compatible with it)";
  }

  return block.label;
}

function renderPovKnowledgeConstraintsSection(snapshot: ValidationSnapshot): string {
  const renderedBlocks = povKnowledgeConstraintBlocks
    .map((block) => {
      const value = resolvePlaceholder(block.placeholder, snapshot).trim();
      return value && value !== EMPTY_STATE_CONSTANTS[block.placeholder] ? `${block.label}:\n${value}` : "";
    })
    .filter(Boolean);
  const staticRules = SECTION_TEMPLATES.pov_knowledge_constraints
    .replace("<pov_knowledge_constraints>\n", "")
    .replace("\n</pov_knowledge_constraints>", "");
  const body = [...renderedBlocks, staticRules].join("\n\n");

  return `<pov_knowledge_constraints>\n${body}\n</pov_knowledge_constraints>`;
}

function renderSecretsAndRevealConstraintsSection(snapshot: ValidationSnapshot, context: RenderContext): string {
  const renderedBlocks = secretsAndRevealConstraintBlocks
    .map((block) => {
      const value = resolveTemplatePlaceholder(block.placeholder, snapshot, context).trim();
      return value && value !== EMPTY_STATE_CONSTANTS[block.placeholder] ? `${block.label}:\n${value}` : "";
    })
    .filter(Boolean);
  const staticRules = SECTION_TEMPLATES.secrets_and_reveal_constraints
    .split("\n\n")
    .find((block) => block.startsWith("A secret may be revealed only if"))
    ?.replace("\n</secrets_and_reveal_constraints>", "");
  const body = [...renderedBlocks, staticRules].filter(Boolean).join("\n\n");

  return `<secrets_and_reveal_constraints>\n${body}\n</secrets_and_reveal_constraints>`;
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

function renderTemplate(
  template: string,
  snapshot: ValidationSnapshot,
  context: RenderContext = { isIdeationPrompt: false }
): string {
  return template.replace(placeholderPattern, (_match, placeholder: string) =>
    resolveTemplatePlaceholder(placeholder, snapshot, context)
  );
}

function resolveTemplatePlaceholder(placeholder: string, snapshot: ValidationSnapshot, context: RenderContext): string {
  if (!context.isIdeationPrompt) {
    return resolvePlaceholder(placeholder, snapshot);
  }

  const placeholderName = placeholder as PlaceholderName;
  const frontValue = renderFrontPlaceholder(placeholderName, snapshot, { citationKeys: context.citationKeys });
  if (frontValue !== undefined) {
    return frontValue;
  }

  const pressureValue = renderPressurePlaceholder(placeholderName, snapshot, { citationKeys: context.citationKeys });
  if (pressureValue !== undefined) {
    return pressureValue;
  }

  const castValue = renderCastPlaceholder(placeholderName, snapshot, { ideation: true });
  if (castValue !== undefined) {
    return castValue;
  }

  const tailValue = renderTailPlaceholder(placeholderName, snapshot, {
    ideation: true,
    citationKeys: context.citationKeys
  });
  if (tailValue !== undefined) {
    return tailValue;
  }

  return resolvePlaceholder(placeholder, snapshot);
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

function hasAnyManualDirectiveValue(snapshot: ValidationSnapshot): boolean {
  return (
    hasValue(snapshot.generationSession.manual_moment_directive?.must_render) ||
    hasValue(snapshot.generationSession.manual_moment_directive?.may_render_if_naturally_caused) ||
    hasValue(snapshot.generationSession.manual_moment_directive?.do_not_force)
  );
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

function hasHardCanon(snapshot: ValidationSnapshot): boolean {
  return resolvePlaceholder("hard_canon_bullets", snapshot).trim() !== EMPTY_STATE_CONSTANTS.hard_canon_bullets;
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

function renderCompositeSection(sectionId: CompositeSectionId, snapshot: ValidationSnapshot, context: RenderContext): string {
  const template = COMPOSITE_SECTION_TEMPLATES[sectionId];
  const blocks = template.subBlocks
    .map((block) => {
      const content = resolveTemplatePlaceholder(block.placeholder, snapshot, context).trim();
      return content ? `${block.label}:\n${content}` : "";
    })
    .filter(Boolean);
  const body = blocks.join("\n\n") || template.emptyState;

  return `<${sectionId}>\n${body}\n</${sectionId}>`;
}

function isCompositeSectionId(sectionId: PromptSectionId): sectionId is CompositeSectionId {
  return Object.hasOwn(COMPOSITE_SECTION_TEMPLATES, sectionId);
}

function isPromptSectionId(sectionId: PromptSectionId | IdeationSectionId): sectionId is PromptSectionId {
  return (SECTION_ORDER as readonly string[]).includes(sectionId);
}

function isStaticIdeationSectionId(
  sectionId: PromptSectionId | IdeationSectionId
): sectionId is Exclude<IdeationSectionId, PromptSectionId | "ideation_slots"> {
  return Object.hasOwn(IDEATION_SECTION_TEMPLATES, sectionId);
}
