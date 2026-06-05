import { z } from "zod";

export const stringList = z.array(z.string().min(1)).default([]);
export const optionalStringList = z.array(z.string().min(1)).optional();
export const nonemptyString = z.string().trim().min(1);
export const optionalString = z.string().optional();
export const recordId = z.uuid();
export const optionalRecordId = z.uuid().optional();

export function jsonObjectSchema(required: Record<string, z.ZodType>, optional = {} as Record<string, z.ZodType>) {
  return z.object({ ...required, ...optional }).strict();
}

export function referenceIfId(refRole: string, value: string | undefined) {
  if (
    !value ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
  ) {
    return undefined;
  }

  return { refRole, targetId: value };
}
