import type { ValidationSnapshot } from "../validation/snapshot.js";
export { EMPTY_STATE_CONSTANTS } from "./empty-states.js";
import { EMPTY_STATE_CONSTANTS } from "./empty-states.js";
import { CAST_PLACEHOLDER_RESOLVERS } from "./sections/cast.js";
import { FRONT_PLACEHOLDER_RESOLVERS } from "./sections/front.js";
import { PRESSURE_PLACEHOLDER_RESOLVERS } from "./sections/pressure.js";
import { TAIL_PLACEHOLDER_RESOLVERS } from "./sections/records-tail.js";
import type { PlaceholderResolver } from "./types.js";

export type PlaceholderName =
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
  | "audience_perception_ambiguous"
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
  | "immediate_situation_summary"
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
  | "writer_visible_hidden_truths"
  | "writer_visible_or_non_pov_facts";

function emptyResolver(placeholder: PlaceholderName): (snapshot: ValidationSnapshot) => string {
  return () => EMPTY_STATE_CONSTANTS[placeholder];
}

export const PLACEHOLDER_MAP: Readonly<Record<PlaceholderName, PlaceholderResolver>> = Object.freeze(
  {
    ...(Object.fromEntries(
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
    ) as Record<PlaceholderName, PlaceholderResolver>),
    ...FRONT_PLACEHOLDER_RESOLVERS,
    ...PRESSURE_PLACEHOLDER_RESOLVERS,
    ...CAST_PLACEHOLDER_RESOLVERS,
    ...TAIL_PLACEHOLDER_RESOLVERS
  }
);

export function resolvePlaceholder(placeholder: string, snapshot: ValidationSnapshot): string {
  const resolver = PLACEHOLDER_MAP[placeholder as PlaceholderName];

  if (!resolver) {
    throw new Error(`Compiler placeholder is not registered: ${placeholder}`);
  }

  return resolver.resolve(snapshot);
}
