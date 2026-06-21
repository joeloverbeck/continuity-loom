import { z } from "zod";

export const promptKindSchema = z.enum(["prose", "ideation"]).default("prose");
export type PromptKind = z.infer<typeof promptKindSchema>;

export const ideationModeSchema = z.enum(["ideas", "questions"]);
export type IdeationMode = z.infer<typeof ideationModeSchema>;

export const ideationRequestSchema = z
  .object({
    mode: ideationModeSchema.default("ideas"),
    count: z.number().int().min(3).max(6).default(5),
    dormantSlot: z.boolean().default(true),
    avoidList: z.array(z.string().trim().min(1)).default([])
  })
  .strict();

export type IdeationRequest = z.infer<typeof ideationRequestSchema>;

export type IdeationOperatorId =
  | "reveal"
  | "plan_meets_friction"
  | "emotion_becomes_action"
  | "shift_option_set"
  | "falsify_belief"
  | "clock_advances"
  | "debt_comes_due"
  | "relationship_turns"
  | "commit_at_a_cost";

export interface IdeationSlot {
  operator: IdeationOperatorId;
  operatorName: string;
  definition: string;
  recordKeys: readonly string[];
  dormantRecordKey?: string;
}

export interface IdeationAssignment {
  slots: readonly IdeationSlot[];
  requestedCount: number;
  assignedCount: number;
  shrunk: boolean;
}
