import type { IdeationOperatorId } from "./types.js";

export interface IdeationOperator {
  id: IdeationOperatorId;
  name: string;
  definition: string;
  feedingTypes: readonly string[];
}

export const IDEATION_OPERATORS: readonly IdeationOperator[] = Object.freeze([
  {
    id: "reveal",
    name: "Reveal",
    definition:
      "Change information access by bringing one selected secret closer to the surface through an authored legal cue or reveal permission.",
    feedingTypes: Object.freeze(["SECRET"])
  },
  {
    id: "plan_meets_friction",
    name: "Plan Meets Friction",
    definition: "Change attempt state by making one selected plan or intention meet local resistance, cost, or interruption.",
    feedingTypes: Object.freeze(["PLAN", "INTENTION"])
  },
  {
    id: "emotion_becomes_action",
    name: "Emotion Becomes Action",
    definition:
      "Change observable tactics by making one selected emotion produce a concrete action, refusal, concealment, or control shift.",
    feedingTypes: Object.freeze(["EMOTION"])
  },
  {
    id: "shift_option_set",
    name: "Shift the Option Set",
    definition:
      "Change the immediate feasible-action set through one selected affordance, object, location, or entity status.",
    feedingTypes: Object.freeze(["VISIBLE AFFORDANCE", "OBJECT", "LOCATION", "ENTITY STATUS"])
  },
  {
    id: "falsify_belief",
    name: "Falsify a Belief",
    definition: "Change operative interpretation by making one selected active belief collide with one selected fact or event.",
    feedingTypes: Object.freeze(["BELIEF", "FACT", "EVENT"])
  },
  {
    id: "clock_advances",
    name: "Clock Advances",
    definition: "Change temporal pressure by advancing one selected active clock without inventing unsupported facts.",
    feedingTypes: Object.freeze(["CLOCK"])
  },
  {
    id: "debt_comes_due",
    name: "Debt Comes Due",
    definition: "Change duty or effect pressure by making one selected obligation or consequence demand action now.",
    feedingTypes: Object.freeze(["OBLIGATION", "CONSEQUENCE"])
  },
  {
    id: "relationship_turns",
    name: "Relationship Turns",
    definition:
      "Change relational pressure by making one selected relationship turn, tighten, invert, or demand a new response.",
    feedingTypes: Object.freeze(["RELATIONSHIP"])
  },
  {
    id: "commit_at_a_cost",
    name: "Commit at a Cost",
    definition:
      "Change commitment under pressure by forcing one selected costly move from two different active pressure families; never render an A/B menu or branch list.",
    feedingTypes: Object.freeze([
      "SECRET",
      "BELIEF",
      "EVENT",
      "PLAN",
      "INTENTION",
      "CLOCK",
      "OBLIGATION",
      "CONSEQUENCE",
      "RELATIONSHIP",
      "EMOTION",
      "OPEN THREAD",
      "VISIBLE AFFORDANCE",
      "OBJECT",
      "LOCATION",
      "ENTITY STATUS"
    ])
  }
]);
