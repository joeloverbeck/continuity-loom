import type { ValidationSnapshot } from "../validation/snapshot.js";
import type { PlaceholderResolver } from "./types.js";

type PlaceholderName =
  | "active_action_pressure"
  | "active_cast_voice_pressure_pins"
  | "active_clocks"
  | "active_consequences"
  | "active_intentions"
  | "active_knowledge_pressure"
  | "active_obligations"
  | "active_onstage_full_cast_dossiers"
  | "active_open_threads"
  | "active_plans"
  | "allowed_clues_and_surface_cues"
  | "allowed_content_scope"
  | "audience_does_not_know"
  | "audience_knows"
  | "available_time"
  | "begin_after"
  | "character_bias_handling"
  | "consent_or_force_conditions"
  | "content_intensity"
  | "current_location"
  | "current_locks"
  | "current_time"
  | "dialogue_density"
  | "dramatic_irony_permissions"
  | "entity_statuses"
  | "environmental_conditions"
  | "explicitness"
  | "forbidden_reveals"
  | "genre_mode"
  | "governing_policy_note"
  | "hard_canon_bullets"
  | "interiority_mode"
  | "language_output"
  | "language_register"
  | "last_visible_moment"
  | "line_of_sight_and_visibility"
  | "locations"
  | "manual_do_not_force"
  | "manual_may_render_if_naturally_caused"
  | "manual_must_render"
  | "material_pressure"
  | "non_pov_behavior_shaping_beliefs"
  | "objects"
  | "offstage_or_withheld_events"
  | "offstage_pressuring_entities"
  | "offstage_relevance_notes"
  | "onstage_entities"
  | "paragraphing"
  | "person"
  | "physical_continuity"
  | "positions"
  | "possessions"
  | "pov_accessible_facts"
  | "pov_believes_suspects_misreads"
  | "pov_cannot_perceive_now"
  | "pov_character"
  | "pov_does_not_know"
  | "pov_knows"
  | "pov_relevant_beliefs"
  | "premise"
  | "present_minor_cast_notes"
  | "prior_accepted_prose_status_or_handoff_note"
  | "psychic_distance"
  | "rating_label"
  | "recent_causal_context"
  | "recent_events"
  | "relationship_emotion_pressure"
  | "relevant_backstory"
  | "reveal_permissions"
  | "routes_and_exits"
  | "secret_holders"
  | "secret_non_holders_to_protect"
  | "setting_baseline"
  | "soft_unit_guidance"
  | "special_style_constraints"
  | "tense"
  | "title"
  | "tonal_handling"
  | "tone"
  | "unavailable_or_impossible_actions"
  | "visible_affordances"
  | "visible_conditions"
  | "voice_pressure"
  | "writer_visible_hidden_truths"
  | "writer_visible_or_non_pov_facts";

export const EMPTY_STATE_CONSTANTS: Readonly<Record<PlaceholderName, string>> = Object.freeze({
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
  governing_policy_note: "None specified",
  hard_canon_bullets: "None selected for this generation",
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
  offstage_relevance_notes: "None",
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
  prior_accepted_prose_status_or_handoff_note: "None. No accepted prose is included.",
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
  soft_unit_guidance: "None specified",
  special_style_constraints: "None specified",
  tense: "None specified",
  title: "None specified",
  tonal_handling: "None specified",
  tone: "None specified",
  unavailable_or_impossible_actions: "None specified",
  visible_affordances: "None specified",
  visible_conditions: "None currently specified",
  voice_pressure: "None beyond detailed records below",
  writer_visible_hidden_truths: "No active secrets or reveal locks selected",
  writer_visible_or_non_pov_facts: "None"
});

function emptyResolver(placeholder: PlaceholderName): (snapshot: ValidationSnapshot) => string {
  return () => EMPTY_STATE_CONSTANTS[placeholder];
}

export const PLACEHOLDER_MAP: Readonly<Record<PlaceholderName, PlaceholderResolver>> = Object.freeze(
  Object.fromEntries(
    (Object.keys(EMPTY_STATE_CONSTANTS) as PlaceholderName[]).map((placeholder) => [
      placeholder,
      {
        placeholder,
        required: true,
        missingBehavior: "block",
        emptyState: EMPTY_STATE_CONSTANTS[placeholder],
        resolve: emptyResolver(placeholder)
      }
    ])
  ) as Record<PlaceholderName, PlaceholderResolver>
);

export function resolvePlaceholder(placeholder: string, snapshot: ValidationSnapshot): string {
  const resolver = PLACEHOLDER_MAP[placeholder as PlaceholderName];

  if (!resolver) {
    throw new Error(`Compiler placeholder is not registered: ${placeholder}`);
  }

  return resolver.resolve(snapshot);
}
