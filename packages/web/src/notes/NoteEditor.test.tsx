// @vitest-environment jsdom

import type { StoryNote } from "@loom/core";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createNote, deleteNote, updateNote } from "../api.js";
import { NoteEditor } from "./NoteEditor.js";

vi.mock("../api.js", () => ({
  createNote: vi.fn(),
  deleteNote: vi.fn(),
  updateNote: vi.fn()
}));

const existingNote: StoryNote = {
  id: "note-1",
  title: "Pinned reminder",
  body: "Remember the bridge toll.",
  tags: ["todo"],
  pinned: true,
  mode: "scratch",
  createdAt: "2026-06-15T10:00:00.000Z",
  updatedAt: "2026-06-15T10:05:00.000Z"
};

function savedNote(overrides: Partial<StoryNote> = {}): StoryNote {
  return {
    ...existingNote,
    updatedAt: "2026-06-15T10:10:00.000Z",
    ...overrides
  };
}

async function advanceAutosave(): Promise<void> {
  await act(async () => {
    vi.advanceTimersByTime(950);
    await Promise.resolve();
  });
}

async function flushPromises(): Promise<void> {
  await act(async () => {
    await Promise.resolve();
  });
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.mocked(createNote).mockResolvedValue({ ok: true, note: savedNote({ id: "note-new", title: "Fresh note", pinned: false }) });
  vi.mocked(updateNote).mockResolvedValue({ ok: true, note: savedNote() });
  vi.mocked(deleteNote).mockResolvedValue({
    ok: true,
    deleted: true,
    cascadedClipCount: 0,
    detachedSourceClipCount: 0
  });
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("NoteEditor", () => {
  it("keeps new notes title-first and does not create before the title validates", async () => {
    const onSaved = vi.fn();
    render(<NoteEditor note={null} onSaved={onSaved} onDeleted={vi.fn()} onCancel={vi.fn()} />);

    fireEvent.change(screen.getByLabelText("Body"), { target: { value: "Loose scratch." } });
    await advanceAutosave();

    expect(createNote).not.toHaveBeenCalled();
    expect(screen.getByRole("status").textContent).toBe("Add a title to create.");

    fireEvent.change(screen.getByLabelText("Title"), { target: { value: "Fresh note" } });
    await advanceAutosave();

    expect(createNote).toHaveBeenCalledWith({
      title: "Fresh note",
      body: "Loose scratch.",
      tags: [],
      pinned: false
    });
    expect(onSaved).toHaveBeenCalled();
  });

  it("autosaves existing notes and reports saving then saved", async () => {
    let resolveSave: (value: Awaited<ReturnType<typeof updateNote>>) => void = () => undefined;
    vi.mocked(updateNote).mockReturnValue(new Promise((resolve) => {
      resolveSave = resolve;
    }));

    render(<NoteEditor note={existingNote} onSaved={vi.fn()} onDeleted={vi.fn()} onCancel={vi.fn()} />);

    fireEvent.change(screen.getByLabelText("Body"), { target: { value: "Changed body." } });
    await advanceAutosave();

    expect(screen.getByRole("status").textContent).toBe("Saving...");
    expect(updateNote).toHaveBeenCalledWith("note-1", {
      title: "Pinned reminder",
      body: "Changed body.",
      tags: ["todo"],
      pinned: true
    });

    resolveSave({ ok: true, note: savedNote({ body: "Changed body." }) });
    await flushPromises();
    expect(screen.getByRole("status").textContent).toBe("Saved");
  });

  it("retains the local buffer when save fails", async () => {
    vi.mocked(updateNote).mockResolvedValue({ ok: false, kind: "bad-request", message: "Nope" });

    render(<NoteEditor note={existingNote} onSaved={vi.fn()} onDeleted={vi.fn()} onCancel={vi.fn()} />);

    fireEvent.change(screen.getByLabelText("Body"), { target: { value: "Unsaved local body." } });
    await advanceAutosave();

    expect(screen.getByRole("status").textContent).toBe("Save failed - retry");
    expect(screen.getByLabelText<HTMLTextAreaElement>("Body").value).toBe("Unsaved local body.");
  });

  it("requires title-bearing confirmation before deleting", async () => {
    const onDeleted = vi.fn();
    render(<NoteEditor note={existingNote} onSaved={vi.fn()} onDeleted={onDeleted} onCancel={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByRole("heading", { name: 'Delete "Pinned reminder"?' })).toBeTruthy();

    fireEvent.click(within(dialog).getByRole("button", { name: "Cancel" }));
    expect(deleteNote).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Delete note" }));

    await flushPromises();
    expect(deleteNote).toHaveBeenCalledWith("note-1");
    expect(onDeleted).toHaveBeenCalledWith("note-1");
  });

  it("renders safe preview without cross-surface actions", () => {
    render(<NoteEditor note={existingNote} onSaved={vi.fn()} onDeleted={vi.fn()} onCancel={vi.fn()} />);

    fireEvent.change(screen.getByLabelText("Body"), {
      target: { value: "# Preview\n\n<script>bad()</script>\n\n![remote](https://example.invalid/x.png)" }
    });
    fireEvent.click(screen.getByLabelText("Preview"));

    const preview = screen.getByLabelText("Note preview");
    expect(within(preview).getByRole("heading", { name: "Preview" })).toBeTruthy();
    expect(preview.querySelector("script")).toBeNull();
    expect(preview.querySelector("img")).toBeNull();
    expect(screen.queryByText(/promote/i)).toBeNull();
    expect(screen.queryByText(/working set/i)).toBeNull();
    expect(screen.queryByText(/include in prompt/i)).toBeNull();
    expect(screen.queryByText(/brief/i)).toBeNull();
  });
});
