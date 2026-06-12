import type { IdeationOperatorId } from "./types.js";

export interface IdeationOperator {
  id: IdeationOperatorId;
  name: string;
  definition: string;
  feedingTypes: readonly string[];
  minimumRecords?: number;
  requiredTypeGroups?: readonly (readonly string[])[];
}

export const IDEATION_OPERATORS: readonly IdeationOperator[] = Object.freeze([
  {
    id: "reveal",
    name: "Reveal",
    definition:
      "Bring a selected secret closer to the surface while respecting reveal permission and POV knowledge constraints.",
    feedingTypes: Object.freeze(["SECRET"])
  },
  {
    id: "falsify_belief",
    name: "Falsify a Belief",
    definition: "Make a selected belief collide with a selected fact or event that can expose its limits.",
    feedingTypes: Object.freeze(["BELIEF", "FACT", "EVENT"]),
    requiredTypeGroups: Object.freeze([Object.freeze(["BELIEF"]), Object.freeze(["FACT", "EVENT"])])
  },
  {
    id: "clock_advances",
    name: "Clock Advances",
    definition: "Advance a selected clock in a way that changes immediate pressure without inventing unsupported facts.",
    feedingTypes: Object.freeze(["CLOCK"])
  },
  {
    id: "plan_meets_friction",
    name: "Plan Meets Friction",
    definition: "Turn a selected plan or intention into a yes-but or no-and complication.",
    feedingTypes: Object.freeze(["PLAN", "INTENTION"])
  },
  {
    id: "debt_comes_due",
    name: "Debt Comes Due",
    definition: "Make a selected obligation or consequence demand action now.",
    feedingTypes: Object.freeze(["OBLIGATION", "CONSEQUENCE"])
  },
  {
    id: "relationship_reversal",
    name: "Relationship Reversal",
    definition: "Invert, stress, or reframe a selected relationship pressure in the current moment.",
    feedingTypes: Object.freeze(["RELATIONSHIP"])
  },
  {
    id: "close_escape_route",
    name: "Close the Escape Route",
    definition: "Use a selected affordance, object, or location to remove an easy path forward.",
    feedingTypes: Object.freeze(["VISIBLE AFFORDANCE", "OBJECT", "LOCATION"])
  },
  {
    id: "collide_two_threads",
    name: "Collide Two Threads",
    definition: "Make two selected pressures interfere with each other instead of resolving cleanly.",
    feedingTypes: Object.freeze(["OPEN THREAD", "PLAN", "SECRET", "EVENT"]),
    minimumRecords: 2
  },
  {
    id: "reincorporate_dormant",
    name: "Reincorporate the Dormant",
    definition: "Bring back the least-recently-updated selected pressure record as fresh causal pressure.",
    feedingTypes: Object.freeze([
      "SECRET",
      "BELIEF",
      "FACT",
      "EVENT",
      "CLOCK",
      "PLAN",
      "INTENTION",
      "OBLIGATION",
      "CONSEQUENCE",
      "RELATIONSHIP",
      "OPEN THREAD",
      "VISIBLE AFFORDANCE",
      "OBJECT",
      "LOCATION"
    ])
  }
]);

export const REINCORPORATE_DORMANT_OPERATOR = IDEATION_OPERATORS.find(
  (operator) => operator.id === "reincorporate_dormant"
);
