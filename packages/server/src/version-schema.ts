import { z } from "zod";

export const healthResponseSchema = z.object({
  status: z.literal("ok")
});

export const versionInfoSchema = z.object({
  app: z.object({
    name: z.literal("Continuity Loom"),
    version: z.string().min(1)
  }),
  templates: z.object({
    version: z.string().min(1),
    status: z.literal("placeholder")
  }),
  compiler: z.object({
    version: z.string().min(1),
    status: z.literal("placeholder")
  })
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;
