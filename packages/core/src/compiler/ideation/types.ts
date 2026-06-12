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
  | "falsify_belief"
  | "clock_advances"
  | "plan_meets_friction"
  | "debt_comes_due"
  | "relationship_reversal"
  | "close_escape_route"
  | "collide_two_threads"
  | "reincorporate_dormant";

export interface IdeationSlot {
  operator: IdeationOperatorId;
  operatorName: string;
  definition: string;
  recordKeys: readonly string[];
}

export interface IdeationAssignment {
  slots: readonly IdeationSlot[];
  requestedCount: number;
  assignedCount: number;
  shrunk: boolean;
}
