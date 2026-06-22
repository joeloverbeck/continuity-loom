import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { extname, join } from "node:path";

import {
  generateStoryNoteId,
  generationSessionReadySchema,
  getRecordTypeDefinition,
  normalizeStoryNoteTags,
  recordTypes,
  storyNoteBatchDeleteInputSchema,
  storyNoteClipBatchCaptureInputSchema,
  storyNoteClipReorderInputSchema,
  storyNoteClipSchema,
  storyNoteCreateInputSchema,
  storyNoteSchema,
  storyNoteTagSchema,
  storyNoteTagsSchema,
  storyNoteUpdateInputSchema
} from "../src/index.js";

const noteId = "019b0298-5c00-7000-8000-000000000010";

function listTypeScriptFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);

    if (entry.isDirectory()) {
      return listTypeScriptFiles(path);
    }

    return extname(entry.name) === ".ts" ? [path] : [];
  });
}

describe("story note data model", () => {
  it("validates and normalizes story notes", () => {
    expect(
      storyNoteSchema.parse({
        id: noteId,
        title: "  Research scraps  ",
        body: "",
        tags: [" Worldbuilding ", "worldbuilding", "TODO", "two   words"],
        pinned: true,
        createdAt: "2026-06-15T00:00:00.000Z",
        updatedAt: "2026-06-15T00:05:00.000Z"
      })
    ).toEqual({
      id: noteId,
      title: "Research scraps",
      body: "",
      tags: ["Worldbuilding", "TODO", "two words"],
      pinned: true,
      mode: "scratch",
      createdAt: "2026-06-15T00:00:00.000Z",
      updatedAt: "2026-06-15T00:05:00.000Z"
    });
  });

  it("rejects invalid titles, bodies, tags, and unknown keys", () => {
    expect(() => storyNoteCreateInputSchema.parse({ title: "   " })).toThrow();
    expect(() => storyNoteCreateInputSchema.parse({ title: "x".repeat(161) })).toThrow();
    expect(() => storyNoteCreateInputSchema.parse({ title: "Valid", body: "x".repeat(200_001) })).toThrow();
    expect(() => storyNoteTagSchema.parse("bad\tcontrol")).toThrow();
    expect(() => storyNoteTagsSchema.parse(Array.from({ length: 13 }, (_, index) => `tag-${index}`))).toThrow();
    expect(() => storyNoteCreateInputSchema.parse({ title: "Valid", api_key: "not allowed" })).toThrow();
    expect(() =>
      storyNoteUpdateInputSchema.parse({
        title: "Valid",
        body: "",
        tags: [],
        pinned: false,
        extra: "not allowed"
      })
    ).toThrow();
  });

  it("applies create defaults and normalizes tags case-insensitively", () => {
    expect(storyNoteCreateInputSchema.parse({ title: "  Draft  " })).toEqual({
      title: "Draft",
      body: "",
      tags: [],
      pinned: false,
      mode: "scratch"
    });
    expect(storyNoteCreateInputSchema.parse({ title: "Prep", mode: "scene-prep" })).toMatchObject({
      mode: "scene-prep"
    });
    expect(normalizeStoryNoteTags(["todo", "TODO", "to-do", "two   words"])).toEqual([
      "todo",
      "to-do",
      "two words"
    ]);
  });

  it("generates sortable UUIDv7 story note ids", () => {
    const ids = [
      generateStoryNoteId(new Date("2026-06-15T00:00:00.000Z")),
      generateStoryNoteId(new Date("2026-06-15T00:00:00.001Z")),
      generateStoryNoteId(new Date("2026-06-15T00:00:00.002Z"))
    ];

    expect(ids).toEqual([...ids].sort());
    expect(ids[0]).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  it("validates story note clip snapshots and batch operation inputs", () => {
    const clip = {
      id: "019b0298-5c00-7000-8000-000000000011",
      prepNoteId: "019b0298-5c00-7000-8000-000000000012",
      sourceNoteId: "019b0298-5c00-7000-8000-000000000013",
      captureKind: "excerpt",
      sourceTitleSnapshot: "Source",
      content: "Captured paragraph.",
      sourceUpdatedAtAtCapture: "2026-06-15T00:05:00.000Z",
      position: 0,
      createdAt: "2026-06-15T00:06:00.000Z",
      updatedAt: "2026-06-15T00:06:00.000Z"
    };

    expect(storyNoteClipSchema.parse(clip)).toEqual(clip);
    expect(() => storyNoteClipSchema.parse({ ...clip, extra: "not allowed" })).toThrow();
    expect(() => storyNoteClipSchema.parse({ ...clip, content: "x".repeat(200_001) })).toThrow();
    expect(() => storyNoteClipSchema.parse({ ...clip, position: -1 })).toThrow();

    expect(
      storyNoteClipBatchCaptureInputSchema.parse([
        { captureKind: "whole-note", sourceNoteId: clip.sourceNoteId },
        {
          captureKind: "excerpt",
          sourceNoteId: clip.sourceNoteId,
          selectedText: "Captured paragraph.",
          sourceUpdatedAt: "2026-06-15T00:05:00.000Z"
        }
      ])
    ).toHaveLength(2);
    expect(() => storyNoteClipBatchCaptureInputSchema.parse([])).toThrow();
    expect(() =>
      storyNoteClipBatchCaptureInputSchema.parse(
        Array.from({ length: 101 }, () => ({ captureKind: "whole-note", sourceNoteId: clip.sourceNoteId }))
      )
    ).toThrow();
    expect(() => storyNoteClipReorderInputSchema.parse([clip.id, clip.id])).toThrow();
    expect(() => storyNoteBatchDeleteInputSchema.parse([clip.prepNoteId, clip.prepNoteId])).toThrow();
  });

  it("keeps story notes out of record registry and generation readiness", () => {
    expect(recordTypes).not.toContain("NOTE");
    expect(recordTypes).not.toContain("STORY_NOTE");
    expect(recordTypes).not.toContain("STORY NOTE");
    expect(getRecordTypeDefinition("STORY NOTE")).toBeUndefined();

    expect(() =>
      generationSessionReadySchema.parse({
        generation_validation_focus: {
          validation_focus_tags: {
            generation_context: ["first_segment"]
          }
        },
        stop_guidance: {
          soft_unit_guidance: ""
        },
        story_notes: [
          {
            id: noteId,
            title: "Private",
            body: "Never prompt this.",
            tags: [],
            pinned: false,
            mode: "scene-prep",
            createdAt: "2026-06-15T00:00:00.000Z",
            updatedAt: "2026-06-15T00:05:00.000Z"
          }
        ]
      })
    ).toThrow();
  });

  it("is not imported by production compiler source", () => {
    const compilerDir = new URL("../src/compiler", import.meta.url);
    const imports = listTypeScriptFiles(compilerDir.pathname).filter((file) =>
      readFileSync(file, "utf8").includes("story-notes")
    );

    expect(imports).toEqual([]);
  });
});
