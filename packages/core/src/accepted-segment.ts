import { z } from "zod";

export const acceptedSegmentVersionsSchema = z.strictObject({
  template: z.string().min(1),
  compiler: z.string().min(1),
  contract: z.string().min(1)
});

export const openRouterAcceptedSegmentProvenanceSchema = z.strictObject({
  source: z.literal("openrouter"),
  model: z.string().min(1),
  provider: z.literal("openrouter"),
  temperature: z.number(),
  maxOutputTokens: z.number().int(),
  topP: z.number().optional(),
  versions: acceptedSegmentVersionsSchema
});

export const userSuppliedAcceptedSegmentProvenanceSchema = z.strictObject({
  source: z.literal("user_supplied"),
  versions: acceptedSegmentVersionsSchema
});

export const acceptedSegmentProvenanceSchema = z.discriminatedUnion("source", [
  openRouterAcceptedSegmentProvenanceSchema,
  userSuppliedAcceptedSegmentProvenanceSchema
]);

export type AcceptedSegmentProvenance = z.infer<typeof acceptedSegmentProvenanceSchema>;
export type OpenRouterAcceptedSegmentProvenance = z.infer<typeof openRouterAcceptedSegmentProvenanceSchema>;
export type UserSuppliedAcceptedSegmentProvenance = z.infer<typeof userSuppliedAcceptedSegmentProvenanceSchema>;
