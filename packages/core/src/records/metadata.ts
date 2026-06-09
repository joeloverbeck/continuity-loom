import { z } from "zod";

export const recordMetadataSchema = z
  .object({
    id: z.uuid(),
    type: z.string().min(1),
    displayLabel: z.string().min(1),
    status: z.string().min(1).nullable().optional(),
    salience: z.string().min(1).nullable().optional(),
    urgency: z.string().min(1).nullable().optional(),
    displayValues: z.record(z.string(), z.string().nullable()).optional(),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
    archived: z.boolean(),
    userOrder: z.number().int().nullable().optional()
  })
  .strict();

export type RecordMetadata = z.infer<typeof recordMetadataSchema>;
