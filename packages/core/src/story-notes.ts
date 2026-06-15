import { z } from "zod";

const storyNoteTagPattern = /^[\p{L}\p{N} _.-]+$/u;

export type StoryNote = {
  id: string;
  title: string;
  body: string;
  tags: string[];
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
};

export type StoryNoteCreateInput = {
  title: string;
  body?: string;
  tags?: string[];
  pinned?: boolean;
};

export type StoryNoteUpdateInput = {
  title: string;
  body: string;
  tags: string[];
  pinned: boolean;
};

export const storyNoteIdSchema = z.uuid();
export const storyNoteTitleSchema = z.string().trim().min(1).max(160);
export const storyNoteBodySchema = z.string().max(200_000);
export const storyNoteTagSchema = z
  .string()
  .trim()
  .min(1)
  .max(32)
  .regex(storyNoteTagPattern)
  .transform((tag) => tag.replace(/\s+/g, " "));

export function normalizeStoryNoteTags(tags: readonly string[]): string[] {
  const normalizedTags: string[] = [];
  const seen = new Set<string>();

  for (const rawTag of tags) {
    const tag = storyNoteTagSchema.parse(rawTag);
    const key = tag.toLocaleLowerCase();

    if (!seen.has(key)) {
      seen.add(key);
      normalizedTags.push(tag);
    }
  }

  return normalizedTags;
}

export const storyNoteTagsSchema = z
  .array(storyNoteTagSchema)
  .default([])
  .transform((tags) => normalizeStoryNoteTags(tags))
  .pipe(z.array(storyNoteTagSchema).max(12));

export const storyNoteSchema = z
  .object({
    id: storyNoteIdSchema,
    title: storyNoteTitleSchema,
    body: storyNoteBodySchema,
    tags: storyNoteTagsSchema,
    pinned: z.boolean(),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime()
  })
  .strict();

export const storyNoteCreateInputSchema = z
  .object({
    title: storyNoteTitleSchema,
    body: storyNoteBodySchema.default(""),
    tags: storyNoteTagsSchema,
    pinned: z.boolean().default(false)
  })
  .strict();

export const storyNoteUpdateInputSchema = z
  .object({
    title: storyNoteTitleSchema,
    body: storyNoteBodySchema,
    tags: storyNoteTagsSchema,
    pinned: z.boolean()
  })
  .strict();

function randomBytes(length: number): Uint8Array {
  const crypto = globalThis.crypto;

  if (!crypto) {
    throw new Error("globalThis.crypto is required to generate story note ids.");
  }

  return crypto.getRandomValues(new Uint8Array(length));
}

export function generateStoryNoteId(date = new Date()): string {
  const timestamp = BigInt(date.getTime());
  const bytes = randomBytes(16);

  bytes[0] = Number((timestamp >> 40n) & 0xffn);
  bytes[1] = Number((timestamp >> 32n) & 0xffn);
  bytes[2] = Number((timestamp >> 24n) & 0xffn);
  bytes[3] = Number((timestamp >> 16n) & 0xffn);
  bytes[4] = Number((timestamp >> 8n) & 0xffn);
  bytes[5] = Number(timestamp & 0xffn);
  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x70;
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80;

  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
