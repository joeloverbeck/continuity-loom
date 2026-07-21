import { readFileSync } from "node:fs";
import fc from "fast-check";
import {
  buildValidationSnapshot,
  compilePrompt,
  EMPTY_STATE_CONSTANTS
} from "../src/index.js";
import { resolvePlaceholder } from "../src/compiler/placeholder-map.js";
import { SECTION_TEMPLATES } from "../src/compiler/template-constants.js";
import {
  emptyCategoryArbitrary,
  emptyPromptInput,
  inputWithOneCategoryRecord,
  type EmptyCategoryId
} from "./support/arbitraries/empty-categories.js";
import { describe, expect, it } from "vitest";

const templateDoc = readFileSync(new URL("../../../docs/specs/prompt-template.md", import.meta.url), "utf8");
const sectionTemplates = SECTION_TEMPLATES as Readonly<Record<string, string>>;

const promptSectionOrder = [
  "role",
  "authority_hierarchy",
  "content_policy",
  "story_contract",
  "prose_mode",
  "current_authoritative_state",
  "immediate_handoff",
  "manual_directive",
  "pov_knowledge_constraints",
  "audience_knowledge",
  "secrets_and_reveal_constraints",
  "active_working_set",
  "active_plans_and_intentions",
  "active_clocks",
  "active_obligations_and_consequences",
  "active_open_threads",
  "active_cast_full_dossiers",
  "relevant_facts_beliefs_events",
  "locations_objects_affordances",
  "physical_continuity",
  "invention_permissions",
  "contradiction_prohibitions",
  "prose_craft",
  "stop_rule",
  "final_output_instruction"
] as const;

const optionalSectionByCategory: Readonly<Record<EmptyCategoryId, EmptyCategoryId>> = {
  hard_canon: "hard_canon",
  present_minor_cast: "present_minor_cast",
  offstage_relevance: "offstage_relevance"
};

const expectedPlaceholderNames = [
  "active_action_pressure",
  "active_cast_voice_pressure_pins",
  "active_clocks",
  "active_consequences",
  "active_intentions",
  "active_knowledge_pressure",
  "active_obligations",
  "active_onstage_full_cast_dossiers",
  "active_open_threads",
  "active_plans",
  "allowed_clues_and_surface_cues",
  "allowed_content_scope",
  "audience_does_not_know",
  "audience_knows",
  "audience_perception_ambiguous",
  "available_time",
  "begin_after",
  "character_bias_handling",
  "consent_or_force_conditions",
  "content_intensity",
  "current_location",
  "current_locks",
  "current_time",
  "dialogue_density",
  "dramatic_irony_permissions",
  "entity_statuses",
  "environmental_conditions",
  "explicitness",
  "forbidden_reveals",
  "genre_mode",
  "hard_canon_bullets",
  "immediate_situation_summary",
  "interiority_mode",
  "language_output",
  "language_register",
  "last_visible_moment",
  "line_of_sight_and_visibility",
  "locations",
  "manual_do_not_force",
  "manual_may_render_if_naturally_caused",
  "manual_must_render",
  "material_pressure",
  "non_pov_behavior_shaping_beliefs",
  "objects",
  "offstage_or_withheld_events",
  "offstage_pressuring_entities",
  "offstage_relevance_notes",
  "onstage_entities",
  "paragraphing",
  "person",
  "physical_continuity",
  "positions",
  "possessions",
  "pov_accessible_facts",
  "pov_believes_suspects_misreads",
  "pov_cannot_perceive_now",
  "pov_character",
  "pov_does_not_know",
  "pov_knows",
  "pov_relevant_beliefs",
  "premise",
  "present_minor_cast_notes",
  "psychic_distance",
  "rating_label",
  "recent_causal_context",
  "recent_events",
  "relationship_emotion_pressure",
  "relevant_backstory",
  "reveal_permissions",
  "routes_and_exits",
  "secret_holders",
  "secret_non_holders_to_protect",
  "setting_baseline",
  "soft_unit_guidance",
  "special_style_constraints",
  "tense",
  "title",
  "tonal_handling",
  "tone",
  "unavailable_or_impossible_actions",
  "visible_affordances",
  "visible_conditions",
  "writer_visible_hidden_truths",
  "writer_visible_or_non_pov_facts"
] as const;

const expectedEmptyStates: Readonly<Record<(typeof expectedPlaceholderNames)[number], string>> = {
  active_action_pressure: "None beyond detailed records below",
  active_cast_voice_pressure_pins: "None active",
  active_clocks: "None active",
  active_consequences: "None active",
  active_intentions: "None active",
  active_knowledge_pressure: "None beyond detailed records below",
  active_obligations: "None active",
  active_onstage_full_cast_dossiers: "None active",
  active_open_threads: "None active",
  active_plans: "None active",
  allowed_clues_and_surface_cues: "None specified",
  allowed_content_scope: "None specified",
  audience_does_not_know: "None specified",
  audience_knows: "No audience knowledge distinct from POV specified",
  audience_perception_ambiguous: "None specified",
  available_time: "None currently specified",
  begin_after: "None specified",
  character_bias_handling: "None specified",
  consent_or_force_conditions: "None currently specified",
  content_intensity: "None specified",
  current_location: "None currently specified",
  current_locks: "None currently specified",
  current_time: "None currently specified",
  dialogue_density: "None specified",
  dramatic_irony_permissions: "None specified",
  entity_statuses: "None currently specified",
  environmental_conditions: "None currently specified",
  explicitness: "None specified",
  forbidden_reveals: "None specified",
  genre_mode: "None specified",
  hard_canon_bullets: "None selected for this generation",
  immediate_situation_summary: "None currently specified",
  interiority_mode: "None specified",
  language_output: "None specified",
  language_register: "None specified",
  last_visible_moment: "None specified",
  line_of_sight_and_visibility: "None currently specified",
  locations: "None specified",
  manual_do_not_force: "None specified",
  manual_may_render_if_naturally_caused: "None specified",
  manual_must_render: "None specified",
  material_pressure: "None beyond detailed records below",
  non_pov_behavior_shaping_beliefs: "None specified",
  objects: "None specified",
  offstage_or_withheld_events: "None selected",
  offstage_pressuring_entities: "None specified",
  offstage_relevance_notes:
    "Offstage pressure or interruption is active, but no offstage cast slice has been authored. Establish why the offstage party matters now, whether and how it can interrupt (entrance, communication, timing, or route), and what must not be revealed or assumed.",
  onstage_entities: "None onstage",
  paragraphing: "None specified",
  person: "None specified",
  physical_continuity: "None currently specified",
  positions: "None currently specified",
  possessions: "None currently specified",
  pov_accessible_facts: "None beyond current state and hard canon",
  pov_believes_suspects_misreads: "None specified",
  pov_cannot_perceive_now: "None specified",
  pov_character: "None specified",
  pov_does_not_know: "None specified",
  pov_knows: "None specified",
  pov_relevant_beliefs: "None specified",
  premise: "None specified",
  present_minor_cast_notes: "None",
  psychic_distance: "None specified",
  rating_label: "None specified",
  recent_causal_context: "None; first local unit begins from current state",
  recent_events: "None selected",
  relationship_emotion_pressure: "None beyond detailed records below",
  relevant_backstory: "None selected",
  reveal_permissions: "No active secrets or reveal locks selected",
  routes_and_exits: "None currently specified",
  secret_holders: "No active secrets or reveal locks selected",
  secret_non_holders_to_protect: "No active secrets or reveal locks selected",
  setting_baseline: "None specified",
  soft_unit_guidance: "No additional user narrowing; use the universal local stop rule above.",
  special_style_constraints: "None specified",
  tense: "None specified",
  title: "None specified",
  tonal_handling: "None specified",
  tone: "None specified",
  unavailable_or_impossible_actions: "None specified",
  visible_affordances: "None specified",
  visible_conditions: "None currently specified",
  writer_visible_hidden_truths: "No active secrets or reveal locks selected",
  writer_visible_or_non_pov_facts: "None"
};

function renderedSectionOrder(prompt: string): string[] {
  return Array.from(prompt.matchAll(/^<([a-z_]+)(?:\s[^>]*)?>$/gm), (match) => match[1] ?? "");
}

function sectionBody(prompt: string, section: string): string {
  const match = prompt.match(new RegExp(`<${section}(?:\\s[^>]*)?>([\\s\\S]*?)</${section}>`));
  return match?.[1] ?? "";
}

function sectionBodies(prompt: string): Map<string, string> {
  return new Map(
    renderedSectionOrder(prompt).map((sectionId) => [sectionId, sectionBody(prompt, sectionId)])
  );
}

function promptTemplatePlaceholders(): string[] {
  return Array.from(new Set(Array.from(templateDoc.matchAll(/\{([a-z_]+)\}/g), (match) => match[1] ?? ""))).sort();
}

function assertOnlySectionChanged(emptyPrompt: string, populatedPrompt: string, changedSection: string): void {
  const emptySections = sectionBodies(emptyPrompt);
  const populatedSections = sectionBodies(populatedPrompt);
  const stableSections = new Set([...emptySections.keys(), ...populatedSections.keys()]);
  stableSections.delete(changedSection);

  for (const sectionId of stableSections) {
    expect(populatedSections.get(sectionId), sectionId).toBe(emptySections.get(sectionId));
  }
}

function runProperty<T>(property: fc.IProperty<T>, seed: number, runs: number): void {
  fc.assert(property, { seed, numRuns: runs, verbose: true });
}

describe("compiler placeholder and empty-state contract", () => {
  it("keeps the doc-derived placeholder table exhaustive with prompt-template.md", () => {
    expect([...expectedPlaceholderNames].sort()).toEqual(promptTemplatePlaceholders());
    expect(Object.keys(expectedEmptyStates).sort()).toEqual([...expectedPlaceholderNames].sort());
    expect(Object.keys(EMPTY_STATE_CONSTANTS).sort()).toEqual([...expectedPlaceholderNames].sort());
    expect(EMPTY_STATE_CONSTANTS).toEqual(expectedEmptyStates);
  });

  it("keeps exported composite template constants wired to their documented placeholder blocks", () => {
    expect(sectionTemplates.relevant_facts_beliefs_events).toContain("<relevant_facts_beliefs_events>");
    expect(sectionTemplates.relevant_facts_beliefs_events).toContain("{writer_visible_or_non_pov_facts}");
    expect(sectionTemplates.relevant_facts_beliefs_events).toContain("</relevant_facts_beliefs_events>");
    expect(sectionTemplates.locations_objects_affordances).toContain("<locations_objects_affordances>");
    expect(sectionTemplates.locations_objects_affordances).toContain("{unavailable_or_impossible_actions}");
    expect(sectionTemplates.locations_objects_affordances).toContain("</locations_objects_affordances>");
  });

  it("fails closed for unknown placeholder tokens", () => {
    expect(() => resolvePlaceholder("unknown_contract_placeholder", buildValidationSnapshot(emptyPromptInput()))).toThrow(
      "Compiler placeholder is not registered: unknown_contract_placeholder"
    );
  });

  it("resolves every documented placeholder token out of the emitted prompt", () => {
    const { prompt } = compilePrompt(buildValidationSnapshot(emptyPromptInput()));

    for (const placeholder of expectedPlaceholderNames) {
      expect(prompt, placeholder).not.toContain(`{${placeholder}}`);
    }

    expect(prompt).not.toMatch(/\{[a-z_]+\}/);
  });

  it("renders required sections in documented order and omits empty optional sections", () => {
    const { prompt } = compilePrompt(buildValidationSnapshot(emptyPromptInput()));

    expect(renderedSectionOrder(prompt)).toEqual(promptSectionOrder);
    expect(prompt).not.toContain("<hard_canon>");
    expect(prompt).not.toContain("<present_minor_cast>");
    expect(prompt).not.toContain("<offstage_relevance>");
  });

  it("renders documented empty states and documented omissions for an empty prompt", () => {
    const { prompt } = compilePrompt(buildValidationSnapshot(emptyPromptInput()));

    expect(sectionBody(prompt, "content_policy")).toContain(`RATING: ${expectedEmptyStates.rating_label}`);
    expect(sectionBody(prompt, "story_contract")).toContain(`Title: ${expectedEmptyStates.title}`);
    expect(sectionBody(prompt, "prose_mode")).toContain(`POV: ${expectedEmptyStates.pov_character}`);
    expect(sectionBody(prompt, "prose_mode")).toContain(`Interiority mode: ${expectedEmptyStates.interiority_mode}`);
    expect(sectionBody(prompt, "current_authoritative_state")).toContain(`Time: ${expectedEmptyStates.current_time}`);
    expect(sectionBody(prompt, "current_authoritative_state")).not.toContain("Current physical positions:");
    expect(sectionBody(prompt, "immediate_handoff")).toContain(
      `Recent causal context (writer-visible; not automatically POV knowledge):\n${expectedEmptyStates.recent_causal_context}`
    );
    expect(sectionBody(prompt, "immediate_handoff")).not.toContain("Last visible moment:");
    expect(sectionBody(prompt, "manual_directive")).toContain(`Must render:\n${expectedEmptyStates.manual_must_render}`);
    expect(sectionBody(prompt, "manual_directive")).not.toContain("May render if naturally caused:");
    expect(sectionBody(prompt, "pov_knowledge_constraints")).not.toContain(`POV knows:\n${expectedEmptyStates.pov_knows}`);
    expect(sectionBody(prompt, "audience_knowledge")).toContain(`Audience already knows:\n${expectedEmptyStates.audience_knows}`);
    expect(sectionBody(prompt, "secrets_and_reveal_constraints")).not.toContain(
      `Writer-visible hidden truths:\n${expectedEmptyStates.writer_visible_hidden_truths}`
    );
    expect(sectionBody(prompt, "active_working_set")).toContain(`Action pressure:\n${expectedEmptyStates.active_action_pressure}`);
    expect(sectionBody(prompt, "active_working_set")).toContain(
      `Active cast voice pressure pins:\n${expectedEmptyStates.active_cast_voice_pressure_pins}`
    );
    expect(sectionBody(prompt, "active_plans_and_intentions")).toContain(`Intentions:\n${expectedEmptyStates.active_intentions}`);
    expect(sectionBody(prompt, "active_clocks").trim()).toContain(expectedEmptyStates.active_clocks);
    expect(sectionBody(prompt, "active_obligations_and_consequences")).toContain(`Obligations:\n${expectedEmptyStates.active_obligations}`);
    expect(sectionBody(prompt, "active_open_threads")).toContain(expectedEmptyStates.active_open_threads);
    expect(sectionBody(prompt, "active_cast_full_dossiers")).toContain(expectedEmptyStates.active_onstage_full_cast_dossiers);
    expect(sectionBody(prompt, "relevant_facts_beliefs_events").trim()).toBe("None specified");
    expect(sectionBody(prompt, "locations_objects_affordances").trim()).toBe("None specified");
    expect(sectionBody(prompt, "physical_continuity")).toContain(expectedEmptyStates.physical_continuity);
    expect(sectionBody(prompt, "stop_rule")).not.toContain(expectedEmptyStates.soft_unit_guidance);
  });

  it("renders optional sections exactly when their documented source category becomes non-empty", () => {
    runProperty(
      fc.property(emptyCategoryArbitrary, (category) => {
        const empty = compilePrompt(buildValidationSnapshot(emptyPromptInput()));
        const populated = compilePrompt(buildValidationSnapshot(inputWithOneCategoryRecord(category)));
        const sectionId = optionalSectionByCategory[category];

        expect(renderedSectionOrder(populated.prompt)).toEqual(insertOptionalSection(promptSectionOrder, sectionId));
        expect(populated.prompt).toContain(`<${sectionId}>`);
        expect(populated.metadata.fingerprint).not.toBe(empty.metadata.fingerprint);
        expect(populated.metadata.lengthEstimate).toBe(populated.prompt.length);
      }),
      0x26007,
      12
    );
  });

  it("limits one-record optional cast-category changes to the documented optional section plus metadata", () => {
    runProperty(
      fc.property(fc.constantFrom("present_minor_cast", "offstage_relevance" as const), (category) => {
        const empty = compilePrompt(buildValidationSnapshot(emptyPromptInput()));
        const populated = compilePrompt(buildValidationSnapshot(inputWithOneCategoryRecord(category)));

        assertOnlySectionChanged(empty.prompt, populated.prompt, optionalSectionByCategory[category]);
        expect(populated.metadata.fingerprint).not.toBe(empty.metadata.fingerprint);
      }),
      0x260070,
      8
    );
  });
});

function insertOptionalSection(requiredSections: readonly string[], optionalSection: EmptyCategoryId): string[] {
  const insertionBefore: Readonly<Record<EmptyCategoryId, string>> = {
    hard_canon: "current_authoritative_state",
    present_minor_cast: "relevant_facts_beliefs_events",
    offstage_relevance: "relevant_facts_beliefs_events"
  };
  const before = insertionBefore[optionalSection];
  const index = requiredSections.indexOf(before);
  const copy = [...requiredSections];

  copy.splice(index, 0, optionalSection);
  return copy;
}
