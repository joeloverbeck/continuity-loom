import type { GenerationSession } from "../records/generation-brief.js";
import type {
  ProseMode,
  StoryContract,
  UniversalContentPolicy
} from "../records/global-config.js";

export const LETTER_UNDER_FLOUR_BIN_TITLE = "The Letter Under the Flour Bin";

export const demoRecordIds = {
  elinEntity: "019b0298-5c00-7000-8000-013000000001",
  nikoEntity: "019b0298-5c00-7000-8000-013000000002",
  maraEntity: "019b0298-5c00-7000-8000-013000000003",
  orinEntity: "019b0298-5c00-7000-8000-013000000004",
  elinCast: "019b0298-5c00-7000-8000-013000000005",
  nikoCast: "019b0298-5c00-7000-8000-013000000006",
  hiddenLetterSecret: "019b0298-5c00-7000-8000-013000000007",
  sealedLetter: "019b0298-5c00-7000-8000-013000000008",
  shutteredLantern: "019b0298-5c00-7000-8000-013000000009",
  flourBin: "019b0298-5c00-7000-8000-013000000010",
  cellarLatch: "019b0298-5c00-7000-8000-013000000011",
  bakeryCellar: "019b0298-5c00-7000-8000-013000000012",
  listenAtStair: "019b0298-5c00-7000-8000-013000000013",
  marketBell: "019b0298-5c00-7000-8000-013000000014",
  nikoArrives: "019b0298-5c00-7000-8000-013000000015",
  elinBelief: "019b0298-5c00-7000-8000-013000000016",
  nikoBelief: "019b0298-5c00-7000-8000-013000000017",
  elinEmotion: "019b0298-5c00-7000-8000-013000000018",
  nikoEmotion: "019b0298-5c00-7000-8000-013000000019",
  elinNikoTrust: "019b0298-5c00-7000-8000-013000000020",
  elinIntention: "019b0298-5c00-7000-8000-013000000021",
  nikoIntention: "019b0298-5c00-7000-8000-013000000022",
  missingLedgerThread: "019b0298-5c00-7000-8000-013000000023",
  bellClock: "019b0298-5c00-7000-8000-013000000024",
  possibleExposure: "019b0298-5c00-7000-8000-013000000025"
} as const;

export type DemoRecordType =
  | "ENTITY"
  | "CAST MEMBER"
  | "SECRET"
  | "OBJECT"
  | "LOCATION"
  | "VISIBLE AFFORDANCE"
  | "EVENT"
  | "BELIEF"
  | "EMOTION"
  | "RELATIONSHIP"
  | "INTENTION"
  | "OPEN THREAD"
  | "CLOCK"
  | "CONSEQUENCE";

export interface DemoRecord {
  readonly id: string;
  readonly type: DemoRecordType;
  readonly displayLabel: string;
  readonly payload: unknown;
}

export const demoStoryConfig = {
  storyContract: {
    title: LETTER_UNDER_FLOUR_BIN_TITLE,
    premise: "A careful baker hides a stolen letter before a friend can decide whether to trust her.",
    genre_mode: ["cozy mystery", "mild suspense"],
    tone: ["quietly tense", "warm but wary"],
    continuity_philosophy: "continuity_first",
    setting_baseline: "A rain-wet market town where tradespeople share narrow cellars and sharper rumors.",
    content_intensity: "general",
    explicitness: "Keep danger mild and non-graphic; focus on secrecy, trust, and practical choices.",
    language_register: "clear literary prose with grounded sensory detail",
    prose_preferences: {
      psychic_distance: "close",
      dialogue_density: "moment_led",
      interiority: "filtered",
      paragraphing: "mixed"
    }
  } satisfies StoryContract,
  universalContentPolicy: {
    rating_label: "General audience / mild suspense",
    allowed_content_scope: "Permits worry, secrecy, and brief non-graphic peril; excludes mature or graphic material.",
    tonal_handling: "Render tension through caution, timing, and small physical actions rather than shock.",
    governing_policy_note: "Follow the universal output contract and stop before major reveals or irreversible outcomes.",
    character_bias_handling: "Show character fears as limited perspectives, not authorial truth."
  } satisfies UniversalContentPolicy,
  proseMode: {
    pov_character: demoRecordIds.elinEntity,
    person: "third",
    tense: "past",
    psychic_distance: "close",
    interiority_mode: "filtered",
    dialogue_density: "moment_led",
    paragraphing: "mixed",
    language_output: "English",
    special_style_constraints: [
      "Keep the prose local to the cellar exchange.",
      "Do not reveal the letter's contents."
    ]
  } satisfies ProseMode
} as const;

export const demoRecords = [
  {
    id: demoRecordIds.elinEntity,
    type: "ENTITY",
    displayLabel: "Elin Vale",
    payload: {
      id: demoRecordIds.elinEntity,
      display_name: "Elin Vale",
      entity_kind: "person",
      roles_in_story: ["viewpoint", "primary_actor"],
      short_description: "A market baker who has hidden a sealed letter to keep it from the wrong hands."
    }
  },
  {
    id: demoRecordIds.nikoEntity,
    type: "ENTITY",
    displayLabel: "Niko Bram",
    payload: {
      id: demoRecordIds.nikoEntity,
      display_name: "Niko Bram",
      entity_kind: "person",
      roles_in_story: ["primary_actor", "witness", "allied_actor"],
      short_description: "Elin's friend, a candlemaker's apprentice who notices details and hates being managed."
    }
  },
  {
    id: demoRecordIds.maraEntity,
    type: "ENTITY",
    displayLabel: "Mara Venn",
    payload: {
      id: demoRecordIds.maraEntity,
      display_name: "Mara Venn",
      entity_kind: "person",
      roles_in_story: ["opposing_actor", "pressure_source"],
      short_description: "A polite tax clerk whose missing ledger page may connect to the sealed letter."
    }
  },
  {
    id: demoRecordIds.orinEntity,
    type: "ENTITY",
    displayLabel: "Orin Ward",
    payload: {
      id: demoRecordIds.orinEntity,
      display_name: "Orin Ward",
      entity_kind: "person",
      roles_in_story: ["authority", "pressure_source", "background"],
      short_description: "The market warden, due at the bakery after the noon bell."
    }
  },
  {
    id: demoRecordIds.elinCast,
    type: "CAST MEMBER",
    displayLabel: "Elin Vale - POV",
    payload: {
      entity_id: demoRecordIds.elinEntity,
      identity: {
        one_line: "A practical baker carrying a secret she has not decided how to share.",
        public_face: "Calm, brisk, and hospitable even when startled.",
        private_pressure: "Afraid that trust will cost Niko safety and cost her the truth."
      },
      voice_anchor: {
        core_voice: "Plainspoken, precise, and sensory; she reaches for kitchen and weather language.",
        rhythm_and_syntax: "Short when guarded, longer when explaining a practical sequence.",
        register_and_diction: "Working-market directness with occasional dry formality.",
        vocabulary_and_metaphor_pools: "Dough, heat, flour, rain, hinges, ledgers, and small measured quantities.",
        profanity_and_intensity: "No profanity; intensity comes through clipped corrections and withheld softness.",
        taboo_and_avoidance_patterns: "Avoids naming fear directly until a concrete task forces it.",
        dialogue_tactics_and_speech_functions: "Redirects with practical instructions, asks pointed questions, bargains with facts.",
        address_terms_and_naming: "Uses 'Niko' when serious and no pet names.",
        silence_interruption_and_turntaking: "Lets silence stretch while she works with her hands, then interrupts to prevent guessing.",
        under_pressure_voice: "Becomes more exact and less explanatory.",
        suppression_or_evasion_rule: "Substitutes object handling for confession until trust is unavoidable.",
        must_preserve: ["practical specificity", "guarded care for Niko"],
        must_avoid: ["grand mystery narration", "omniscient explanation of the letter"],
        anti_repetition_warnings: ["Do not repeat flour imagery in every paragraph."]
      },
      pressure_behavior_core: {
        cornered: "narrows the choices to one immediate, manageable action.",
        tempted_or_offered_power: "Refuses dramatic leverage and asks what can be proven.",
        protecting_attachment: "Keeps Niko physically away from the hidden letter unless she decides he needs it."
      },
      body_presence_core: {
        physicality: "Compact, efficient movements shaped by bakery work.",
        habitual_gestures_or_presence: "Wipes flour from her thumb, checks latches, squares objects on tables.",
        social_presentation: "Neighborly competence with a locked inwardness."
      },
      agency_core: {
        default_strategy: "Delay exposure while gathering one more concrete fact.",
        risk_style: "Accepts small immediate risks to prevent larger public ones."
      },
      relational_charge: "Trusts Niko's heart more than his restraint.",
      moral_psychological_edge: "Believes withholding truth can be care, and worries that belief is cowardice.",
      sample_utterances: [
        {
          text: "Not yet. If you touch it now, you become part of the lie.",
          situation: "Niko reaches for the hidden letter.",
          speech_function: "refusal",
          pressure_tags: ["protection", "secrecy"],
          copy_policy: "may_reuse_cadence_not_text"
        }
      ]
    }
  },
  {
    id: demoRecordIds.nikoCast,
    type: "CAST MEMBER",
    displayLabel: "Niko Bram - active speaker",
    payload: {
      entity_id: demoRecordIds.nikoEntity,
      identity: {
        one_line: "A quick-eyed apprentice who wants Elin to trust him before she decides for both of them.",
        public_face: "Light, helpful, and a little too ready with a joke.",
        private_pressure: "Hurt that Elin hides danger from him, but afraid she has reason."
      },
      voice_anchor: {
        core_voice: "Warm, quick, observant, and indirect when wounded.",
        rhythm_and_syntax: "Begins lightly, then lands on a blunt final phrase.",
        register_and_diction: "Market-town familiar; uses concrete observations more than abstractions.",
        vocabulary_and_metaphor_pools: "Candles, smoke, wax, rainwater, shop bells, errands, and debts.",
        profanity_and_intensity: "No profanity; pressure sharpens into short questions.",
        taboo_and_avoidance_patterns: "Avoids saying he feels excluded; turns it into a practical challenge.",
        dialogue_tactics_and_speech_functions: "Teases, tests contradictions, offers help with a sting under it.",
        address_terms_and_naming: "Uses 'Elin' plainly; drops titles quickly.",
        silence_interruption_and_turntaking: "Fills silence until he realizes she is frightened, then stops.",
        under_pressure_voice: "The jokes fall away and his questions get smaller.",
        suppression_or_evasion_rule: "Masks worry as annoyance until evidence forces honesty.",
        must_preserve: ["quick observational turns", "injured loyalty"],
        must_avoid: ["generic banter", "instant perfect trust"],
        anti_repetition_warnings: ["Do not make every line a joke."]
      },
      pressure_behavior_core: {
        cornered: "asks the question that makes evasion socially costly.",
        tempted_or_offered_power: "Wants to prove usefulness before asking permission.",
        protecting_attachment: "Steps between Elin and danger once he understands where danger is."
      },
      body_presence_core: {
        physicality: "Restless but careful, with candle-maker hands that notice residue and heat.",
        habitual_gestures_or_presence: "Touches doorframes, sniffs for smoke, rolls loose wax from his cuff.",
        social_presentation: "Friendly, quick, and easy to underestimate."
      },
      agency_core: {
        default_strategy: "Observe the contradiction, then make himself hard to dismiss.",
        risk_style: "Takes interpersonal risks faster than physical ones."
      },
      relational_charge: "Needs Elin's trust and resents needing it.",
      moral_psychological_edge: "Would rather be told a dangerous truth than protected by a comforting lie.",
      sample_utterances: [
        {
          text: "You hid it badly on purpose, or you wanted me to find the part that wasn't there.",
          situation: "Niko spots flour on the wrong hinge.",
          speech_function: "other",
          pressure_tags: ["suspicion", "trust"],
          copy_policy: "may_reuse_cadence_not_text"
        }
      ]
    }
  },
  {
    id: demoRecordIds.hiddenLetterSecret,
    type: "SECRET",
    displayLabel: "The letter names a ledger substitution",
    payload: {
      id: demoRecordIds.hiddenLetterSecret,
      status: "hidden",
      secret_kind: "artifact_truth",
      secret_claim: "The sealed letter says a market ledger page was replaced before Orin's audit.",
      holders: [demoRecordIds.elinEntity],
      non_holders_to_protect: [demoRecordIds.nikoEntity],
      audience_visibility: "implied",
      pov_access: "knows",
      salience: "critical",
      allowed_surface_cues: [
        "Elin guards the flour bin too carefully.",
        "Niko may notice the letter exists but not read or infer its contents."
      ],
      forbidden_reveals: [
        "Do not state the exact ledger page or culprit.",
        "Do not let Niko learn the letter's contents in this segment."
      ],
      reveal_permission: "clue_only",
      reveal_triggers: ["Elin may decide later to show Niko the seal, not the text."],
      clue_carriers: [
        {
          clue_text: "A clean scrape in flour dust around the rear hinge.",
          clue_strength: "suggestive",
          discovered_by: demoRecordIds.nikoEntity,
          audience_visible: "visible",
          status: "available"
        }
      ]
    }
  },
  {
    id: demoRecordIds.sealedLetter,
    type: "OBJECT",
    displayLabel: "Sealed letter",
    payload: {
      id: demoRecordIds.sealedLetter,
      status: "active",
      label: "sealed letter",
      description: "A narrow letter in blue-gray paper, sealed with plain wax and hidden in oilcloth.",
      owner: demoRecordIds.elinEntity,
      carried_by: "none",
      current_location: demoRecordIds.flourBin,
      visibility_to_pov: "hidden",
      usable_affordances: ["can be moved by Elin", "can be shown sealed without revealing contents"],
      constraints: ["Niko must not read it in the first segment.", "The wax seal is intact."],
      durability: "major"
    }
  },
  {
    id: demoRecordIds.shutteredLantern,
    type: "OBJECT",
    displayLabel: "Shuttered lantern",
    payload: {
      id: demoRecordIds.shutteredLantern,
      status: "active",
      label: "shuttered lantern",
      description: "A small tin lantern with a thumb shutter that narrows the light.",
      owner: demoRecordIds.elinEntity,
      carried_by: demoRecordIds.elinEntity,
      current_location: "carried_by_holder",
      visibility_to_pov: "visible",
      usable_affordances: ["reveal flour marks", "hide light from the stair"],
      constraints: ["Its oil is low."],
      durability: "continuity_relevant"
    }
  },
  {
    id: demoRecordIds.flourBin,
    type: "OBJECT",
    displayLabel: "Flour bin",
    payload: {
      id: demoRecordIds.flourBin,
      status: "active",
      label: "old flour bin",
      description: "A broad cedar bin with a rear hinge, enough flour dust to show any careless touch.",
      owner: demoRecordIds.elinEntity,
      carried_by: "none",
      current_location: demoRecordIds.bakeryCellar,
      visibility_to_pov: "visible",
      usable_affordances: ["conceal the letter", "show tampering traces"],
      constraints: ["Opening it too wide creaks toward the stair."],
      durability: "major"
    }
  },
  {
    id: demoRecordIds.cellarLatch,
    type: "OBJECT",
    displayLabel: "Cellar latch",
    payload: {
      id: demoRecordIds.cellarLatch,
      status: "active",
      label: "cellar latch",
      description: "An old iron latch at the stair door, sticky enough to announce anyone entering.",
      owner: "none",
      carried_by: "none",
      current_location: demoRecordIds.bakeryCellar,
      visibility_to_pov: "visible",
      usable_affordances: ["bar entry", "signal interruption"],
      constraints: ["It can be lifted from outside with effort."],
      durability: "continuity_relevant"
    }
  },
  {
    id: demoRecordIds.bakeryCellar,
    type: "LOCATION",
    displayLabel: "Bakery cellar",
    payload: {
      id: demoRecordIds.bakeryCellar,
      status: "active",
      label: "Vale bakery cellar",
      description: "A low cellar below Elin's bakery, smelling of flour, rain damp, and cooling brick.",
      layout_relevant_now: "The stair door is behind Niko; the flour bin is against the far wall near Elin.",
      access_routes: ["stair to bakery shop", "narrow delivery hatch too small for a person"],
      visibility_and_sound: "Lantern light reaches the bin and latch; shop voices above are muffled but audible.",
      hazards_or_shelters: ["low beam over the bin", "sacks that muffle footfalls"],
      social_rules: ["Customers should not be below stairs without Elin's invitation."]
    }
  },
  {
    id: demoRecordIds.listenAtStair,
    type: "VISIBLE AFFORDANCE",
    displayLabel: "Listen at the stair door",
    payload: {
      id: demoRecordIds.listenAtStair,
      status: "available",
      label: "listen at the stair door",
      available_to: "any_onstage",
      action_families: ["perceive", "protect", "decide"],
      requires: ["someone must stand near the latch"],
      risk: "secrecy",
      durability: "local",
      prompt_text: "Either onstage character can pause near the latch to check whether someone is coming."
    }
  },
  {
    id: demoRecordIds.marketBell,
    type: "EVENT",
    displayLabel: "The market bell rings early",
    payload: {
      id: demoRecordIds.marketBell,
      status: "active",
      event_kind: "immediate_previous",
      sequence_order: 1,
      description: "The market bell rang early, warning Elin that Orin's audit rounds may start before noon.",
      participants: [demoRecordIds.elinEntity, demoRecordIds.orinEntity],
      location: "offstage",
      pov_visibility: "inferred_from_trace",
      audience_visibility: "explicit",
      known_by: [demoRecordIds.elinEntity],
      causes: [],
      effects: [demoRecordIds.elinIntention, demoRecordIds.bellClock],
      current_relevance: "high"
    }
  },
  {
    id: demoRecordIds.nikoArrives,
    type: "EVENT",
    displayLabel: "Niko arrives at the cellar door",
    payload: {
      id: demoRecordIds.nikoArrives,
      status: "active",
      event_kind: "recent_causal",
      sequence_order: 2,
      description: "Niko followed flour smears to the cellar after seeing Elin close the shop early.",
      participants: [demoRecordIds.elinEntity, demoRecordIds.nikoEntity],
      location: demoRecordIds.bakeryCellar,
      pov_visibility: "perceived_directly",
      audience_visibility: "explicit",
      known_by: [demoRecordIds.elinEntity, demoRecordIds.nikoEntity],
      causes: [demoRecordIds.marketBell],
      effects: [demoRecordIds.nikoBelief, demoRecordIds.elinEmotion],
      current_relevance: "critical"
    }
  },
  {
    id: demoRecordIds.elinBelief,
    type: "BELIEF",
    displayLabel: "Elin believes Niko is safer ignorant",
    payload: {
      id: demoRecordIds.elinBelief,
      status: "active",
      holder: demoRecordIds.elinEntity,
      claim: "Niko will be safer if he knows a letter exists but not what it says.",
      belief_mode: "believes",
      truth_relation: "contested",
      confidence: "medium",
      visibility: "private",
      access_route: "authorial_initialization",
      behavioral_effect: "Elin blocks Niko from touching the flour bin while trying not to lie outright.",
      salience: "high"
    }
  },
  {
    id: demoRecordIds.nikoBelief,
    type: "BELIEF",
    displayLabel: "Niko suspects Elin hid evidence",
    payload: {
      id: demoRecordIds.nikoBelief,
      status: "active",
      holder: demoRecordIds.nikoEntity,
      claim: "Elin hid something connected to the audit, but he does not know it is a letter.",
      belief_mode: "suspects",
      truth_relation: "partly_true",
      confidence: "medium",
      visibility: "shared",
      access_route: "object_trace",
      behavioral_effect: "Niko challenges her evasions and watches the flour bin.",
      salience: "high"
    }
  },
  {
    id: demoRecordIds.elinEmotion,
    type: "EMOTION",
    displayLabel: "Elin's guarded fear",
    payload: {
      id: demoRecordIds.elinEmotion,
      status: "active",
      holder: demoRecordIds.elinEntity,
      description: "Elin is afraid of exposing Niko and ashamed that secrecy now looks like distrust.",
      affect_kind: "mixed",
      intensity: "high",
      behavioral_pressure: ["conceal", "protect_other", "plan"],
      visibility: "inferred",
      surface_expression: "She keeps one hand near the lantern shutter and answers too precisely."
    }
  },
  {
    id: demoRecordIds.nikoEmotion,
    type: "EMOTION",
    displayLabel: "Niko's wounded curiosity",
    payload: {
      id: demoRecordIds.nikoEmotion,
      status: "active",
      holder: demoRecordIds.nikoEntity,
      description: "Niko feels excluded, worried, and unwilling to be sent away with a polite lie.",
      affect_kind: "mixed",
      intensity: "medium",
      behavioral_pressure: ["approach", "seek_help", "ruminate"],
      visibility: "visible",
      surface_expression: "He jokes once, then watches Elin's hands instead of her face."
    }
  },
  {
    id: demoRecordIds.elinNikoTrust,
    type: "RELATIONSHIP",
    displayLabel: "Elin and Niko's strained trust",
    payload: {
      id: demoRecordIds.elinNikoTrust,
      status: "active",
      axis: "trust",
      direction_kind: "bidirectional",
      from: demoRecordIds.elinEntity,
      to: demoRecordIds.nikoEntity,
      value: "high",
      valence: "unstable",
      visibility: "shared",
      description: "They trust each other's decency but disagree over whether protection justifies concealment.",
      pressure_text: "Their affection makes every evasion feel personal.",
      current_expression: "Niko asks to be trusted; Elin tries to protect him by withholding the worst fact."
    }
  },
  {
    id: demoRecordIds.elinIntention,
    type: "INTENTION",
    displayLabel: "Elin keeps the letter hidden",
    payload: {
      id: demoRecordIds.elinIntention,
      status: "active",
      holder: demoRecordIds.elinEntity,
      intent: "Keep the sealed letter hidden until she knows whether Orin is already on the stair.",
      urgency: "critical",
      behavioral_pressure: "She delays Niko's reach and tries to move the conversation toward listening at the latch."
    }
  },
  {
    id: demoRecordIds.nikoIntention,
    type: "INTENTION",
    displayLabel: "Niko gets a straight answer",
    payload: {
      id: demoRecordIds.nikoIntention,
      status: "active",
      holder: demoRecordIds.nikoEntity,
      intent: "Make Elin admit what kind of danger she has pulled him near.",
      urgency: "high",
      behavioral_pressure: "He presses for truth without grabbing the hidden object."
    }
  },
  {
    id: demoRecordIds.missingLedgerThread,
    type: "OPEN THREAD",
    displayLabel: "Who replaced the ledger page?",
    payload: {
      id: demoRecordIds.missingLedgerThread,
      type: "mystery",
      status: "active",
      title: "Missing ledger page",
      summary: "Someone replaced a ledger page before Orin's audit; the sealed letter points toward the substitution.",
      audience_visibility: "implied",
      urgency: "high",
      current_relevance: "high",
      possible_pressure_now: "The scene may hint at the ledger without naming the culprit or page.",
      answer_if_known: "none"
    }
  },
  {
    id: demoRecordIds.bellClock,
    type: "CLOCK",
    displayLabel: "Orin's audit round",
    payload: {
      id: demoRecordIds.bellClock,
      status: "active",
      title: "Orin's audit round",
      clock_kind: "deadline",
      salience: "medium",
      visibility: "holder_specific",
      current_pressure: "Orin may reach the bakery soon because the bell rang early.",
      tick_trigger: "The shop door bell rings or footsteps sound above.",
      next_threshold: "Someone reaches the cellar stair.",
      possible_effects: ["Elin must hide the letter more securely or decide whether to trust Niko."],
      tick_history: []
    }
  },
  {
    id: demoRecordIds.possibleExposure,
    type: "CONSEQUENCE",
    displayLabel: "Niko may become implicated",
    payload: {
      id: demoRecordIds.possibleExposure,
      status: "pending",
      consequence_kind: "reputational",
      holder_or_target: demoRecordIds.nikoEntity,
      cause: demoRecordIds.hiddenLetterSecret,
      urgency: "medium",
      current_effect: "If Niko reads or carries the letter, he becomes harder to shield from the audit.",
      possible_next_effect: "Orin could treat him as a participant rather than a witness.",
      visibility: "holder_specific"
    }
  }
] as const satisfies readonly DemoRecord[];

export const demoGenerationSession = {
  active_working_set: {
    selected_records: demoRecords.map((record) => record.id),
    active_onstage_cast_full: [
      { cast_member_id: demoRecordIds.elinCast, local_function: "pov_narrator" },
      { cast_member_id: demoRecordIds.nikoCast, local_function: "active_speaker" }
    ],
    present_minor_cast_compressed: [],
    offstage_relevant_cast: [demoRecordIds.maraEntity, demoRecordIds.orinEntity],
    selected_pov: demoRecordIds.elinEntity,
    manual_directive_id: demoRecordIds.elinIntention
  },
  current_authoritative_state: {
    current_time: "Late morning, minutes after the market bell rang early.",
    current_location: demoRecordIds.bakeryCellar,
    onstage_entities: [demoRecordIds.elinEntity, demoRecordIds.nikoEntity],
    offstage_pressuring_entities: [demoRecordIds.maraEntity, demoRecordIds.orinEntity],
    positions: [
      "Elin stands beside the flour bin with the shuttered lantern in hand.",
      "Niko stands near the stair door and can see Elin, the latch, and the flour dust."
    ],
    possessions: [
      "Elin carries the shuttered lantern.",
      "The sealed letter is hidden inside the flour bin.",
      "Niko carries no object that gives him access to the letter."
    ],
    visible_conditions: ["lantern light", "flour dust near the bin hinge", "rainwater on Niko's cuffs"],
    environmental_conditions: "The cellar is dry but cold; muffled market noise filters down from above.",
    entity_statuses: [demoRecordIds.elinEntity, demoRecordIds.nikoEntity, demoRecordIds.maraEntity, demoRecordIds.orinEntity],
    line_of_sight_and_visibility: "Elin and Niko can see each other; the letter itself is not visible.",
    routes_and_exits: ["stair to the bakery shop", "delivery hatch too small for entry"],
    available_time: "One short exchange before footsteps or the shop bell may interrupt.",
    consent_or_force_conditions: "No one is restrained; Elin can block access by position and refusal, not force.",
    current_locks: ["cellar latch is closed but not barred", "letter seal is intact"]
  },
  immediate_handoff: {
    recent_causal_context: "Elin has just closed the bakery early after hearing the market bell. Niko followed flour smears downstairs and knows she is hiding something, but not what.",
    last_visible_moment: "Niko notices the clean scrape near the flour-bin hinge as Elin lowers the lantern shutter.",
    prior_accepted_prose_status_or_handoff_note: "None. No accepted prose is included.",
    begin_after: "Begin with Niko at the cellar stair noticing the hinge mark while Elin decides whether to redirect him."
  },
  manual_moment_directive: {
    must_render: [
      "Render Elin trying to keep Niko from touching or reading the hidden letter.",
      "Let Niko press for a truthful answer without learning the letter's contents.",
      "Use the flour bin, lantern, latch, and stair as concrete pressures."
    ],
    may_render_if_naturally_caused: [
      "A muffled sound above may make both characters listen at the latch.",
      "Elin may show enough softness to make the withholding painful."
    ],
    do_not_force: [
      "Do not reveal the letter's text or culprit.",
      "Do not bring Mara into the cellar without a route and timing mechanism.",
      "Do not resolve the ledger mystery."
    ]
  },
  current_cast_voice_pressure: [
    {
      cast_member_id: demoRecordIds.elinCast,
      local_function: "pov_narrator",
      current_voice_pressure: "Elin narrates through practical details and controlled evasions.",
      dialogue_pressure: "She answers precisely and redirects Niko toward immediate safety.",
      pov_narration_pressure: "Keep close to Elin's guarded calculations without exposing facts Niko lacks.",
      nonverbal_or_silence_pressure: "Her hand keeps returning to the lantern shutter and the bin lid.",
      current_must_preserve: ["guarded care", "practical specificity"],
      current_must_avoid: ["full confession", "abstract guilt monologue"]
    },
    {
      cast_member_id: demoRecordIds.nikoCast,
      local_function: "active_speaker",
      current_voice_pressure: "Niko starts lightly but presses with hurt precision.",
      dialogue_pressure: "He should ask small concrete questions that expose the evasion.",
      pov_narration_pressure: "none",
      nonverbal_or_silence_pressure: "His silence matters once he recognizes Elin is frightened.",
      current_must_preserve: ["observational sharpness", "wounded loyalty"],
      current_must_avoid: ["generic comic relief", "reading the letter"]
    }
  ],
  cast_voice_overrides: [],
  generation_validation_focus: {
    validation_focus_tags: {
      generation_context: ["first_segment"],
      expected_local_modes: [
        "dialogue_expected",
        "introspection_expected",
        "secret_or_clue_pressure",
        "physical_interaction_expected"
      ],
      possible_durable_changes: ["object_use_possible"]
    }
  },
  stop_guidance: {
    soft_unit_guidance: "Stop at the first new response point: a sound above, Niko's unanswered direct question, or Elin's decision to show only the sealed outside."
  }
} as const satisfies GenerationSession;

