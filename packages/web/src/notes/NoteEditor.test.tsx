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

    expect(screen.getByRole("button", { name: "Save note" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Retry Save" })).toBeNull();

    fireEvent.change(screen.getByLabelText("Body"), { target: { value: "Loose scratch." } });
    await advanceAutosave();

    expect(createNote).not.toHaveBeenCalled();
    expect(screen.getByRole("status").textContent).toBe("Add a title to create.");
    expect(screen.getByRole("button", { name: "Save note" })).toBeTruthy();

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

  it("uses Save note through a new-note save and Save changes after identity exists", async () => {
    let resolveSave: (value: Awaited<ReturnType<typeof createNote>>) => void = () => undefined;
    vi.mocked(createNote).mockReturnValue(new Promise((resolve) => {
      resolveSave = resolve;
    }));

    render(<NoteEditor note={null} onSaved={vi.fn()} onDeleted={vi.fn()} onCancel={vi.fn()} />);

    fireEvent.change(screen.getByLabelText("Title"), { target: { value: "Fresh note" } });
    fireEvent.change(screen.getByLabelText("Body"), { target: { value: "Loose scratch." } });

    expect(screen.getByRole("button", { name: "Save note" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Retry Save" })).toBeNull();

    await advanceAutosave();

    expect(screen.getByRole("status").textContent).toBe("Saving...");
    expect(screen.getByRole("button", { name: "Save note" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Retry Save" })).toBeNull();

    resolveSave({
      ok: true,
      note: savedNote({
        id: "note-new",
        title: "Fresh note",
        body: "Loose scratch.",
        tags: [],
        pinned: false
      })
    });
    await flushPromises();

    expect(screen.getByRole("status").textContent).toBe("Saved");
    expect(screen.getByRole("button", { name: "Save changes" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Retry Save" })).toBeNull();
  });

  it("autosaves existing notes and reports saving then saved", async () => {
    let resolveSave: (value: Awaited<ReturnType<typeof updateNote>>) => void = () => undefined;
    vi.mocked(updateNote).mockReturnValue(new Promise((resolve) => {
      resolveSave = resolve;
    }));

    render(<NoteEditor note={existingNote} onSaved={vi.fn()} onDeleted={vi.fn()} onCancel={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Save changes" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Retry Save" })).toBeNull();

    fireEvent.change(screen.getByLabelText("Body"), { target: { value: "Changed body." } });
    expect(screen.getByRole("button", { name: "Save changes" })).toBeTruthy();
    await advanceAutosave();

    expect(screen.getByRole("status").textContent).toBe("Saving...");
    expect(screen.getByRole("button", { name: "Save changes" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Retry Save" })).toBeNull();
    expect(updateNote).toHaveBeenCalledWith("note-1", {
      title: "Pinned reminder",
      body: "Changed body.",
      tags: ["todo"],
      pinned: true
    });

    resolveSave({ ok: true, note: savedNote({ body: "Changed body." }) });
    await flushPromises();
    expect(screen.getByRole("status").textContent).toBe("Saved");
    expect(screen.getByRole("button", { name: "Save changes" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Retry Save" })).toBeNull();
  });

  it("retains the local buffer when save fails", async () => {
    vi.mocked(updateNote).mockResolvedValue({ ok: false, kind: "bad-request", message: "Nope" });

    render(<NoteEditor note={existingNote} onSaved={vi.fn()} onDeleted={vi.fn()} onCancel={vi.fn()} />);

    fireEvent.change(screen.getByLabelText("Body"), { target: { value: "Unsaved local body." } });
    await advanceAutosave();

    expect(screen.getByRole("status").textContent).toBe("Save failed - retry");
    expect(screen.getByLabelText<HTMLTextAreaElement>("Body").value).toBe("Unsaved local body.");
    expect(screen.getAllByRole("button", { name: "Retry Save" })).toHaveLength(1);
    expect(screen.queryByRole("button", { name: "Save changes" })).toBeNull();

    vi.mocked(updateNote).mockResolvedValue({ ok: true, note: savedNote({ body: "Unsaved local body." }) });
    fireEvent.click(screen.getByRole("button", { name: "Retry Save" }));
    await flushPromises();

    expect(screen.getByRole("status").textContent).toBe("Saved");
    expect(screen.getByRole("button", { name: "Save changes" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Retry Save" })).toBeNull();
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

  it("keeps delete failures separate from save retry state", async () => {
    vi.mocked(deleteNote).mockResolvedValue({ ok: false, kind: "bad-request", message: "Nope" });
    render(<NoteEditor note={existingNote} onSaved={vi.fn()} onDeleted={vi.fn()} onCancel={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Delete note" }));
    await flushPromises();

    expect(screen.getByRole("status").textContent).toBe("Delete failed - try again.");
    expect(screen.getByRole("button", { name: "Save changes" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Retry Save" })).toBeNull();
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
