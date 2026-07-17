import fc from "fast-check";
import {
  buildValidationSnapshot,
  compilePrompt
} from "../src/index.js";
import type {
  BuildValidationSnapshotInput,
  ValidationRecord
} from "../src/index.js";
import { renderCastPlaceholder } from "../src/compiler/sections/cast.js";
import { FRONT_PLACEHOLDER_RESOLVERS, renderFrontPlaceholder } from "../src/compiler/sections/front.js";
import {
  PRESSURE_PLACEHOLDER_RESOLVERS,
  renderPressurePlaceholder
} from "../src/compiler/sections/pressure.js";
import { renderTailPlaceholder } from "../src/compiler/sections/records-tail.js";
import type { PlaceholderName } from "../src/compiler/placeholder-map.js";
import {
  emptySectionInput,
  populatedSectionInput,
  sectionFixtureVariantArbitrary
} from "./support/arbitraries/section-records.js";
import { describe, expect, it } from "vitest";

function compiledPrompt(variant: "empty" | "populated"): string {
  const input = variant === "empty" ? emptySectionInput() : populatedSectionInput();
  return compilePrompt(buildValidationSnapshot(input)).prompt;
}

function populatedSnapshot() {
  return buildValidationSnapshot(populatedSectionInput());
}

function variedSnapshot(mutator: (input: BuildValidationSnapshotInput) => void) {
  const input = structuredClone(populatedSectionInput());
  mutator(input);
  return buildValidationSnapshot(input);
}

function recordOf(input: BuildValidationSnapshotInput, type: string, label?: string): ValidationRecord {
  const record = input.records.find(
    (candidate) => candidate.type === type && (!label || candidate.metadata?.displayLabel === label)
  );

  if (!record) {
    throw new Error(`Missing test record: ${type}${label ? ` ${label}` : ""}`);
  }

  return record;
}

function activeCastId(input: BuildValidationSnapshotInput): string {
  return recordOf(input, "CAST MEMBER", "Mara").id;
}

function payloadOf(record: ValidationRecord): Record<string, unknown> {
  return record.payload && typeof record.payload === "object" ? (record.payload as Record<string, unknown>) : {};
}

function testRecord(
  id: string,
  type: string,
  label: string,
  payload: Record<string, unknown>,
  metadata: Record<string, unknown> = {}
): ValidationRecord {
  return {
    id,
    type,
    metadata: {
      id,
      type: "test",
      displayLabel: label,
      createdAt: "2026-06-20T00:00:00.000Z",
      updatedAt: "2026-06-20T00:00:00.000Z",
      archived: false,
      ...metadata
    },
    payload
  };
}

function sectionBody(prompt: string, section: string): string {
  const match = prompt.match(new RegExp(`<${section}(?:\\s[^>]*)?>([\\s\\S]*?)</${section}>`));
  return match?.[1] ?? "";
}

function sectionOrder(prompt: string): string[] {
  return Array.from(prompt.matchAll(/^<([a-z_]+)(?:\s[^>]*)?>$/gm), (match) => match[1] ?? "");
}

function runProperty<T>(property: fc.IProperty<T>, seed: number, runs: number): void {
  fc.assert(property, { seed, numRuns: runs, verbose: true });
}

describe("compiler section renderer contract", () => {
  it("renders front resolver placeholders exactly for populated inputs", () => {
    const snapshot = populatedSnapshot();
    const expected: readonly [PlaceholderName, string][] = [
      ["rating_label", "Mature"],
      ["allowed_content_scope", "suspense and coercion"],
      ["tonal_handling", "restrained"],
      ["character_bias_handling", "character claims are not narrator fact"],
      ["title", "Section Contract"],
      ["premise", "An archivist protects a ledger."],
      ["genre_mode", "mystery"],
      ["tone", "tense"],
      ["content_intensity", "mature"],
      ["explicitness", "non-graphic"],
      ["language_register", "literary"],
      ["setting_baseline", "archive tower"],
      ["pov_character", "Mara guards the archive."],
      ["person", "third"],
      ["tense", "past"],
      ["psychic_distance", "close"],
      ["interiority_mode", "filtered"],
      ["dialogue_density", "balanced"],
      ["paragraphing", "mixed"],
      ["language_output", "English"],
      ["special_style_constraints", "concrete sensory detail"],
      ["hard_canon_bullets", "- The archive key is unique."],
      ["current_time", "Dawn."],
      ["current_location", "Archive"],
      ["onstage_entities", "guarding the ledger"],
      ["offstage_pressuring_entities", "The guard may return soon."],
      ["positions", "Mara stands by the locked desk."],
      ["entity_statuses", "guarding the ledger"],
      ["possessions", "The ledger is under Mara's hand."],
      ["visible_conditions", "Mara has ink on one cuff."],
      ["environmental_conditions", "Rain taps the windows."],
      ["line_of_sight_and_visibility", "The stair is visible from the desk."],
      ["routes_and_exits", "stair\nrear door"],
      ["available_time", "One exchange."],
      ["consent_or_force_conditions", "none"],
      ["current_locks", "The desk drawer is locked."],
      ["recent_causal_context", "The guard left to fetch the clerk."],
      ["last_visible_moment", "Mara touched the key."],
      ["begin_after", "Begin with Mara at the desk."],
      ["manual_must_render", "Mara refuses to surrender the ledger."],
      ["manual_may_render_if_naturally_caused", "The guard may knock from the stair."],
      ["manual_do_not_force", "Do not reveal the copied key."],
      ["pov_knows", "- The archive key is unique."],
      ["pov_believes_suspects_misreads", "- Jon may be stalling for the guard."],
      ["pov_does_not_know", "- The clerk copied the archive key."],
      ["pov_cannot_perceive_now", "None specified"],
      ["audience_knows", "- The clerk copied the archive key."],
      ["audience_does_not_know", "None specified"],
      ["dramatic_irony_permissions", "- The clerk copied the archive key."],
      ["audience_perception_ambiguous", "None specified"],
      ["writer_visible_hidden_truths", "- Secret 1 [security] The clerk copied the archive key."],
      ["secret_holders", "- Secret 1: The guard may return soon."],
      ["secret_non_holders_to_protect", "- Secret 1: Everyone except the secret holders"],
      ["allowed_clues_and_surface_cues", "- Secret 1: Mara notices wax on the key ring., A wax smear marks the copied key."],
      ["forbidden_reveals", "- Secret 1: No reveals are forbidden beyond the stated reveal permission."],
      ["reveal_permissions", "- Secret 1: clue_only; triggers: Mara studies the key."],
      ["soft_unit_guidance", ""]
    ];

    for (const [placeholder, value] of expected) {
      expect(FRONT_PLACEHOLDER_RESOLVERS[placeholder]?.resolve(snapshot), placeholder).toBe(value);
    }
  });

  it("renders cast, pressure, and tail placeholders exactly for populated inputs", () => {
    const snapshot = populatedSnapshot();
    const castExpected: readonly [PlaceholderName, string][] = [
      [
        "active_cast_voice_pressure_pins",
        "- Mara guards the archive.; local function: active_speaker; voice anchor: Measured and clipped.; current generation voice pressure: Keep Mara clipped and procedural.; dialogue pressure: Use precise deflection.; POV narration pressure: Let narration stay close and guarded.; nonverbal/silence pressure: Use stillness before speech.; must preserve: precision; must avoid: warm banter; Current generation voice override; applies to: dialogue, silence; Make responses shorter than usual."
      ],
      [
        "active_onstage_full_cast_dossiers",
        "## Mara guards the archive.\nidentity:\n  one_line: Mara guards the archive.\n  public_face: calm\n  private_pressure: afraid\nvoice_anchor:\n  core_voice: Measured and clipped.\n  rhythm_and_syntax: Short clauses.\n  register_and_diction: formal\npressure_behavior_core:\n  cornered: answers narrowly\nbody_presence_core:\n  physicality: still hands\nagency_core:\n  default_strategy: delay\nsample_utterances:\n  - Look at the index.; situation: deflection; function: refusal; copy policy: never_copy_verbatim; pressure tags: control\n  - The key is logged.; situation: boundary; function: refusal; copy policy: never_copy_verbatim; pressure tags: control\n  - Protocol decides this.; situation: refusal; function: refusal; copy policy: never_copy_verbatim; pressure tags: control\nCurrent generation voice override:\n  Current generation voice override; applies to: dialogue, silence; Make responses shorter than usual."
      ],
      [
        "present_minor_cast_notes",
        "- Jon watches from the stair.; voice: Plainspoken and wary.; current generation voice pressure: Keep Jon reluctant.; dialogue pressure: Only answer if addressed.; nonverbal/silence pressure: Prefer silence.; must avoid: exposition; Current generation voice override; applies to: dialogue; Keep him terse."
      ],
      ["offstage_relevance_notes", "- The guard may return soon.; voice: Plainspoken and wary."]
    ];
    const pressureExpected: readonly [PlaceholderName, string][] = [
      ["relationship_emotion_pressure", "- Mara distrusts Jon; Trust is thin.; They speak around the ledger.\n- Mara is afraid; Her hands stay still."],
      ["active_intentions", "- Keep the ledger on the desk.; holder: Mara guards the archive.; urgency: high; Answers only what is asked."],
      ["active_plans", "- Delay the guard.; holder: Mara guards the archive.; current step: stand between guard and desk; resources: archive rules; blockers: Jon is watching; visibility: visible"],
      ["active_clocks", "- Audit round; pressure: The guard may return soon.; tick trigger: The bell rings.; next threshold: Someone reaches the stair.; possible effects: Mara must hide the ledger."],
      ["active_obligations", "- Protect archive records.; owed by: Mara guards the archive.; owed to: institution; urgency: high; if broken: Mara loses authority."],
      ["active_consequences", "- The copied key could expose Mara.; target: Mara guards the archive.; cause: public; urgency: medium; possible next effect: Jon may suspect her."],
      ["active_open_threads", "- Missing page; A ledger page is gone.; urgency: high; pressure now: The scene may hint at the gap."]
    ];
    const pressureResolverExpected: readonly [PlaceholderName, string][] = [
      [
        "active_action_pressure",
        "- Mara guards the archive.: Delay the guard.; stand between guard and desk\n- Mara guards the archive.: Keep the ledger on the desk.; Answers only what is asked.\n- Missing page; The scene may hint at the gap.\n- The copied key could expose Mara.; Jon may suspect her.\n- Hide ledger; Mara can slide the ledger under papers.\n- Open drawer [affordance blocked]; The locked drawer cannot open."
      ],
      [
        "active_knowledge_pressure",
        "- The clerk copied the archive key.\n- Mara keeps answers short.; Jon may be stalling for the guard.\n- The archive key is unique.\n- The guard knocked once."
      ],
      ["material_pressure", "- Archive; one narrow aisle\n- Ledger; A brass-bound ledger."]
    ];
    const tailExpected: readonly [PlaceholderName, string][] = [
      ["pov_accessible_facts", "- The archive key is unique."],
      ["writer_visible_or_non_pov_facts", ""],
      ["pov_relevant_beliefs", "- Jon may be stalling for the guard.; truth: uncertain; mode: suspects; confidence: medium; access: tone; behavior: Mara keeps answers short.; visibility: private"],
      ["non_pov_behavior_shaping_beliefs", ""],
      ["recent_events", "- The guard knocked once.; visibility: seen"],
      ["relevant_backstory", "- Mara hid the ledger last winter.; current relevance: high"],
      ["offstage_or_withheld_events", "- The clerk already copied the key.; visibility: withheld"],
      ["locations", "- Archive; Tall shelves.; layout: one narrow aisle; routes: stair; visibility/sound: echoing; hazards or shelters: loose paper; social rules: quiet"],
      ["objects", "- Ledger; A brass-bound ledger.; owner: Mara guards the archive.; carried by: Mara guards the archive.; location: Archive; visibility: visible; affordances: read, hide; constraints: too large for a pocket"],
      ["visible_affordances", "- Hide ledger; Mara can slide the ledger under papers.; available to: Mara guards the archive.; actions: conceal; requires: free hand; risk: paper noise; durability: temporary"],
      ["unavailable_or_impossible_actions", "- Current lock: The desk drawer is locked.\n- Open drawer; status: blocked; The locked drawer cannot open.; requires: free hand"],
      [
        "physical_continuity",
        "- time: Dawn.\n- location: Archive\n- positions: Mara stands by the locked desk.\n- statuses: guarding the ledger\n- possessions: The ledger is under Mara's hand.\n- visibility: The stair is visible from the desk.\n- routes/exits: stair, rear door\n- available time: One exchange.\n- locks: The desk drawer is locked.\n- Archive; Tall shelves.; status: active\n- entity: Mara guards the archive.; life: alive; agency: mobile; location: Archive; visibility: visible; activity: guarding the ledger\n- Hide ledger; Mara can slide the ledger under papers.; status: available\n- Ledger; A brass-bound ledger.; status: active\n- Open drawer; The locked drawer cannot open.; status: blocked"
      ]
    ];

    for (const [placeholder, value] of castExpected) {
      expect(renderCastPlaceholder(placeholder, snapshot), placeholder).toBe(value);
    }

    for (const [placeholder, value] of pressureExpected) {
      expect(renderPressurePlaceholder(placeholder, snapshot), placeholder).toBe(value);
    }

    for (const [placeholder, value] of pressureResolverExpected) {
      expect(PRESSURE_PLACEHOLDER_RESOLVERS[placeholder]?.resolve(snapshot), placeholder).toBe(value);
    }

    for (const [placeholder, value] of tailExpected) {
      expect(renderTailPlaceholder(placeholder, snapshot), placeholder).toBe(value);
    }
  });

  it("leaves unrelated placeholders undefined in direct section renderers", () => {
    const snapshot = populatedSnapshot();

    expect(renderFrontPlaceholder("rating_label", snapshot)).toBeUndefined();
    expect(renderCastPlaceholder("rating_label", snapshot)).toBeUndefined();
    expect(renderPressurePlaceholder("rating_label", snapshot)).toBeUndefined();
    expect(renderTailPlaceholder("rating_label", snapshot)).toBeUndefined();
  });

  it("renders alternate secret, guidance, and keyed front branches exactly", () => {
    let secretId = "";
    const snapshot = variedSnapshot((input) => {
      const activeId = activeCastId(input);
      const secret = recordOf(input, "SECRET", "Copied key");
      const payload = payloadOf(secret);
      secretId = secret.id;

      payload.secret_kind = "";
      payload.audience_visibility = "ambiguous";
      payload.non_holders_to_protect = [activeId];
      payload.holders = [activeId, "missing-holder"];
      payload.reveal_permission = "";
      payload.reveal_triggers = [];
      input.generationSession.stop_guidance = { soft_unit_guidance: "  Stop at the next touch.  " };
    });

    expect(FRONT_PLACEHOLDER_RESOLVERS.soft_unit_guidance?.resolve(snapshot)).toBe("Stop at the next touch.");
    expect(FRONT_PLACEHOLDER_RESOLVERS.secret_holders?.resolve(snapshot)).toBe(
      "- Secret 1: Mara guards the archive., missing-holder"
    );
    expect(FRONT_PLACEHOLDER_RESOLVERS.secret_non_holders_to_protect?.resolve(snapshot)).toBe(
      "- Secret 1: Mara guards the archive."
    );
    expect(FRONT_PLACEHOLDER_RESOLVERS.reveal_permissions?.resolve(snapshot)).toBe("No active secrets or reveal locks selected");
    expect(FRONT_PLACEHOLDER_RESOLVERS.audience_perception_ambiguous?.resolve(snapshot)).toBe("- The clerk copied the archive key.");
    expect(renderFrontPlaceholder("writer_visible_hidden_truths", snapshot, { citationKeys: new Map([[secretId, "[S1]"]]) })).toBe(
      "- [S1] The clerk copied the archive key."
    );
  });

  it("renders alternate pressure predicates, statuses, references, and material entities exactly", () => {
    const snapshot = variedSnapshot((input) => {
      const activeId = activeCastId(input);

      input.records = [
        ...input.records,
        testRecord("019b0298-5c00-7000-8000-000000000830", "ENTITY", "Signal bell", {
          entity_kind: "cursed_object",
          short_description: "Hangs above the stair."
        }),
        testRecord(
          "019b0298-5c00-7000-8000-000000000831",
          "FACT",
          "Segment fact",
          {
            fact_kind: "soft",
            scope: "current_segment",
            statement: "The ink is still wet.",
            known_by: [activeId]
          },
          { salience: "low" }
        ),
        testRecord("019b0298-5c00-7000-8000-000000000832", "BELIEF", "Mara knows lock", {
          holder: activeId,
          belief_mode: "knows",
          claim: "The stair lock is loose.",
          truth_relation: "true"
        })
      ];
      payloadOf(recordOf(input, "OBLIGATION", "Archive oath")).status = "escalated";
      payloadOf(recordOf(input, "CONSEQUENCE", "Exposure risk")).status = "pending";
    });

    expect(PRESSURE_PLACEHOLDER_RESOLVERS.active_knowledge_pressure?.resolve(snapshot)).toBe(
      "- The clerk copied the archive key.\n- The ink is still wet.\n- Mara keeps answers short.; Jon may be stalling for the guard.\n- The archive key is unique.\n- The guard knocked once.\n- The stair lock is loose."
    );
    expect(PRESSURE_PLACEHOLDER_RESOLVERS.material_pressure?.resolve(snapshot)).toBe(
      "- Archive; one narrow aisle\n- Entity; Entity - cursed object; Hangs above the stair.\n- Ledger; A brass-bound ledger."
    );
    expect(renderPressurePlaceholder("active_obligations", snapshot)).toBe(
      "- Protect archive records.; owed by: Mara guards the archive.; owed to: institution; urgency: high; if broken: Mara loses authority."
    );
    expect(renderPressurePlaceholder("active_consequences", snapshot)).toBe(
      "- The copied key could expose Mara.; target: Mara guards the archive.; cause: public; urgency: medium; possible next effect: Jon may suspect her."
    );
  });

  it("renders ideation physical continuity status summaries exactly", () => {
    expect(renderTailPlaceholder("physical_continuity", populatedSnapshot(), { ideation: true })).toBe(
      "- time: Dawn.\n- location: Archive\n- positions: Mara stands by the locked desk.\n- statuses: guarding the ledger\n- possessions: The ledger is under Mara's hand.\n- visibility: The stair is visible from the desk.\n- routes/exits: stair, rear door\n- available time: One exchange.\n- locks: The desk drawer is locked.\n- Archive; status: active\n- entity: Mara guards the archive.; life: alive; agency: mobile; location: Archive; visibility: visible; activity: guarding the ledger\n- Hide ledger; status: available\n- Ledger; status: active\n- Open drawer; status: blocked"
    );
  });

  it("renders front sections with exact labels for populated generation state", () => {
    const prompt = compiledPrompt("populated");

    expect(sectionBody(prompt, "content_policy")).toContain("RATING: Mature");
    expect(sectionBody(prompt, "story_contract")).toContain("Title: Section Contract");
    expect(sectionBody(prompt, "prose_mode")).toContain("POV: Mara");
    expect(sectionBody(prompt, "current_authoritative_state")).toContain("Time: Dawn.");
    expect(sectionBody(prompt, "current_authoritative_state")).toContain("Location: Archive");
    expect(sectionBody(prompt, "current_authoritative_state")).toContain("Onstage entities: guarding the ledger");
    expect(sectionBody(prompt, "current_authoritative_state")).toContain("Routes and exits: stair\nrear door");
    expect(sectionBody(prompt, "current_authoritative_state")).not.toContain("Consent or force conditions:");
    expect(sectionBody(prompt, "immediate_handoff")).toContain("Last visible moment:\nMara touched the key.");
    expect(sectionBody(prompt, "manual_directive")).toContain("Do not force:\nDo not reveal the copied key.");
  });

  it("distinguishes cast bands and caps active cast samples at three", () => {
    const prompt = compiledPrompt("populated");
    const active = sectionBody(prompt, "active_cast_full_dossiers");
    const present = sectionBody(prompt, "present_minor_cast");
    const offstage = sectionBody(prompt, "offstage_relevance");

    expect(active).toContain("## Mara guards the archive.");
    expect(active).toContain("identity:\n  one_line: Mara guards the archive.");
    expect(active).toContain("Current generation voice override:\n  Current generation voice override; applies to: dialogue, silence; Make responses shorter than usual.");
    expect(active).toContain("- Look at the index.; situation: deflection; function: refusal; copy policy: never_copy_verbatim; pressure tags: control");
    expect(active).toContain("- The key is logged.; situation: boundary; function: refusal; copy policy: never_copy_verbatim; pressure tags: control");
    expect(active).toContain("- Protocol decides this.; situation: refusal; function: refusal; copy policy: never_copy_verbatim; pressure tags: control");
    expect(active).not.toContain("Fourth sample must not render.");
    expect(present).toContain("Jon watches from the stair.; voice: Plainspoken and wary.");
    expect(present).toContain("Current generation voice override; applies to: dialogue; Keep him terse.");
    expect(offstage).toContain("The guard may return soon.; voice: Plainspoken and wary.");
    expect(offstage).not.toContain("Current generation voice override");
  });

  it("renders pressure sections with exact compact summary labels", () => {
    const prompt = compiledPrompt("populated");

    expect(sectionBody(prompt, "active_working_set")).toContain("Relationship and emotion pressure:\n- Mara distrusts Jon; Trust is thin.; They speak around the ledger.\n- Mara is afraid; Her hands stay still.");
    expect(sectionBody(prompt, "active_plans_and_intentions")).toContain("- Keep the ledger on the desk.; holder: Mara guards the archive.; urgency: high; Answers only what is asked.");
    expect(sectionBody(prompt, "active_plans_and_intentions")).toContain("- Delay the guard.; holder: Mara guards the archive.; current step: stand between guard and desk; resources: archive rules; blockers: Jon is watching; visibility: visible");
    expect(sectionBody(prompt, "active_clocks")).toContain("- Audit round; pressure: The guard may return soon.; tick trigger: The bell rings.; next threshold: Someone reaches the stair.; possible effects: Mara must hide the ledger.");
    expect(sectionBody(prompt, "active_obligations_and_consequences")).toContain("- Protect archive records.; owed by: Mara guards the archive.; owed to: institution; urgency: high; if broken: Mara loses authority.");
    expect(sectionBody(prompt, "active_obligations_and_consequences")).toContain("- The copied key could expose Mara.; target: Mara guards the archive.; cause: public; urgency: medium; possible next effect: Jon may suspect her.");
    expect(sectionBody(prompt, "active_open_threads")).toContain("- Missing page; A ledger page is gone.; urgency: high; pressure now: The scene may hint at the gap.");
  });

  it("renders record-tail sections with exact populated and unavailable-action branches", () => {
    const prompt = compiledPrompt("populated");
    const facts = sectionBody(prompt, "relevant_facts_beliefs_events");
    const material = sectionBody(prompt, "locations_objects_affordances");
    const physical = sectionBody(prompt, "physical_continuity");

    expect(facts).toContain("POV-accessible facts:\n- The archive key is unique.");
    expect(facts).toContain("Recent events:\n- The guard knocked once.; visibility: seen");
    expect(facts).toContain("Relevant backstory:\n- Mara hid the ledger last winter.; current relevance: high");
    expect(facts).toContain("Offstage or withheld events:\n- The clerk already copied the key.; visibility: withheld");
    expect(material).toContain("Locations:\n- Archive; Tall shelves.; layout: one narrow aisle; routes: stair; visibility/sound: echoing; hazards or shelters: loose paper; social rules: quiet");
    expect(material).toContain("Objects:\n- Ledger; A brass-bound ledger.; owner: Mara guards the archive.; carried by: Mara guards the archive.; location: Archive; visibility: visible; affordances: read, hide; constraints: too large for a pocket");
    expect(material).toContain("Visible affordances:\n- Hide ledger; Mara can slide the ledger under papers.; available to: Mara guards the archive.; actions: conceal; requires: free hand; risk: paper noise; durability: temporary");
    expect(material).toContain("Unavailable or impossible actions:\n- Current lock: The desk drawer is locked.\n- Open drawer; status: blocked; The locked drawer cannot open.; requires: free hand");
    expect(physical).toContain("- time: Dawn.");
    expect(physical).toContain("- Ledger; A brass-bound ledger.; status: active");
  });

  it("preserves empty branch section order and empty outputs", () => {
    const prompt = compiledPrompt("empty");

    expect(sectionOrder(prompt)).not.toContain("hard_canon");
    expect(sectionOrder(prompt)).not.toContain("present_minor_cast");
    expect(sectionOrder(prompt)).not.toContain("offstage_relevance");
    expect(sectionBody(prompt, "active_working_set")).toContain("Action pressure:\nNone beyond detailed records below");
    expect(sectionBody(prompt, "active_cast_full_dossiers")).toContain("None active");
    expect(sectionBody(prompt, "relevant_facts_beliefs_events").trim()).toBe("None specified");
    expect(sectionBody(prompt, "locations_objects_affordances").trim()).toBe("None specified");
    expect(sectionBody(prompt, "physical_continuity")).toContain("None currently specified");
  });

  it("compiles section fixture variants deterministically", () => {
    runProperty(
      fc.property(sectionFixtureVariantArbitrary, (variant) => {
        const first = compiledPrompt(variant);
        const second = compiledPrompt(variant);

        expect(second).toBe(first);
      }),
      0x26008,
      8
    );
  });
});
