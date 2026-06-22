// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  captureNoteClips,
  createNote,
  deleteNoteClip,
  deleteNotesBatch,
  getNote,
  listNoteClips,
  listNotes,
  reorderNoteClips,
  updateNote,
  type StoryNoteSummary
} from "../api.js";
import { NotesView } from "./NotesView.js";

vi.mock("../api.js", () => ({
  captureNoteClips: vi.fn(),
  createNote: vi.fn(),
  deleteNoteClip: vi.fn(),
  deleteNotesBatch: vi.fn(),
  getNote: vi.fn(),
  listNoteClips: vi.fn(),
  listNotes: vi.fn(),
  reorderNoteClips: vi.fn(),
  updateNote: vi.fn()
}));

const summaries: StoryNoteSummary[] = [
  {
    id: "note-1",
    title: "Pinned reminder",
    bodyPreview: "Remember the bridge toll.",
    tags: ["todo", "worldbuilding"],
    pinned: true,
    mode: "scratch",
    createdAt: "2026-06-15T10:00:00.000Z",
    updatedAt: "2026-06-15T10:05:00.000Z"
  },
  {
    id: "note-2",
    title: "Research scrap",
    bodyPreview: "Archive fragment.",
    tags: ["research"],
    pinned: false,
    mode: "scratch",
    createdAt: "2026-06-15T09:00:00.000Z",
    updatedAt: "2026-06-15T09:15:00.000Z"
  }
];

beforeEach(() => {
  vi.mocked(listNotes).mockResolvedValue({ ok: true, notes: summaries, tags: ["research", "todo", "worldbuilding"] });
  vi.mocked(createNote).mockResolvedValue({
    ok: true,
    note: {
      id: "note-new",
      title: "New note",
      body: "",
      tags: [],
      pinned: false,
      mode: "scratch",
      createdAt: "2026-06-15T10:30:00.000Z",
      updatedAt: "2026-06-15T10:30:00.000Z"
    }
  });
  vi.mocked(updateNote).mockResolvedValue({
    ok: true,
    note: {
      id: "note-1",
      title: "Pinned reminder",
      body: "Updated body.",
      tags: ["todo"],
      pinned: true,
      mode: "scratch",
      createdAt: "2026-06-15T10:00:00.000Z",
      updatedAt: "2026-06-15T10:30:00.000Z"
    }
  });
  vi.mocked(deleteNotesBatch).mockResolvedValue({
    ok: true,
    deleted: true,
    cascadedClipCount: 0,
    detachedSourceClipCount: 0
  });
  vi.mocked(listNoteClips).mockResolvedValue({ ok: true, clips: [] });
  vi.mocked(captureNoteClips).mockResolvedValue({ ok: true, clips: [] });
  vi.mocked(reorderNoteClips).mockResolvedValue({ ok: true, clips: [] });
  vi.mocked(deleteNoteClip).mockResolvedValue({ ok: true });
  vi.mocked(getNote).mockResolvedValue({
    ok: true,
    note: {
      id: "note-1",
      title: "Pinned reminder",
      body: "# Heading\n\nRemember **the bridge toll**.\n\n<script>bad()</script>\n\n![remote](https://example.invalid/x.png)",
      tags: ["todo", "worldbuilding"],
      pinned: true,
      mode: "scratch",
      createdAt: "2026-06-15T10:00:00.000Z",
      updatedAt: "2026-06-15T10:05:00.000Z"
    }
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("NotesView", () => {
  it("renders the private notes read surface, summaries, and selected detail", async () => {
    render(<NotesView />);

    expect(screen.getByRole("heading", { name: "Private Notes" })).toBeTruthy();
    expect(screen.getByText("Author-private · never sent to prompts")).toBeTruthy();
    expect(screen.getByText(/never affect records, readiness, generation, or accepted prose/i)).toBeTruthy();
    expect(await screen.findByRole("button", { name: /Pinned reminder/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Research scrap/ })).toBeTruthy();

    await waitFor(() => expect(getNote).toHaveBeenCalledWith("note-1"));
    const detail = screen.getByRole("heading", { name: "Pinned reminder" }).closest<HTMLElement>(".notesSourcePane");
    expect(detail).not.toBeNull();
    if (!detail) {
      return;
    }
    expect(within(detail).getByRole("heading", { name: "Pinned reminder" })).toBeTruthy();
    expect(within(detail).getByText("Heading")).toBeTruthy();
    expect(within(detail).getByText("the bridge toll")).toBeTruthy();
    expect(detail.querySelector("script")).toBeNull();
    expect(detail.querySelector("img")).toBeNull();
    expect(screen.queryByText(/prompt preview/i)).toBeNull();
    expect(screen.queryByText(/promote/i)).toBeNull();
  });

  it("threads search, tag, pinned, and sort controls into listNotes", async () => {
    render(<NotesView />);

    await screen.findByRole("button", { name: /Pinned reminder/ });
    fireEvent.change(screen.getByLabelText("Search"), { target: { value: "bridge" } });
    fireEvent.click(screen.getByRole("button", { name: "research" }));
    fireEvent.change(screen.getByLabelText("Pinned"), { target: { value: "only" } });
    fireEvent.change(screen.getByLabelText("Sort"), { target: { value: "title-asc" } });

    await waitFor(() => {
      expect(vi.mocked(listNotes).mock.calls).toContainEqual([{
        q: "bridge",
        tag: ["research"],
        mode: "all",
        pinned: "only",
        sort: "title-asc"
      }]);
    });
  });

  it("loads a clicked note detail", async () => {
    vi.mocked(getNote).mockResolvedValueOnce({
      ok: true,
      note: {
        id: "note-1",
        title: "Pinned reminder",
        body: "First body.",
        tags: ["todo"],
        pinned: true,
        mode: "scratch",
        createdAt: "2026-06-15T10:00:00.000Z",
        updatedAt: "2026-06-15T10:05:00.000Z"
      }
    }).mockResolvedValueOnce({
      ok: true,
      note: {
        id: "note-2",
        title: "Research scrap",
        body: "Second body.",
        tags: ["research"],
        pinned: false,
        mode: "scratch",
        createdAt: "2026-06-15T09:00:00.000Z",
        updatedAt: "2026-06-15T09:15:00.000Z"
      }
    });

    render(<NotesView />);

    fireEvent.click(await screen.findByRole("button", { name: /Research scrap/ }));

    await waitFor(() => expect(getNote).toHaveBeenLastCalledWith("note-2"));
    expect(await screen.findByRole("heading", { name: "Research scrap" })).toBeTruthy();
    expect(screen.getByText("Second body.")).toBeTruthy();
  });

  it("opens a blank editor on New Note even when a note is already recorded", async () => {
    render(<NotesView />);

    // Let the initial auto-select fully settle on the existing note first.
    await screen.findByRole("heading", { name: "Pinned reminder" });
    const getNoteCallsBeforeNew = vi.mocked(getNote).mock.calls.length;

    fireEvent.click(screen.getByRole("button", { name: "New Note" }));

    // The new-note editor opens with its "New private note" eyebrow and heading...
    expect(await screen.findByText("New private note")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "New Note" })).toBeTruthy();
    // ...and the auto-select effect must not reopen the existing note over it.
    expect(screen.queryByText("Edit private note")).toBeNull();
    await waitFor(() => expect(getNote).toHaveBeenCalledTimes(getNoteCallsBeforeNew));
  });

  it("removes a deleted note locally before auto-select can refetch it", async () => {
    vi.mocked(listNotes)
      .mockResolvedValueOnce({ ok: true, notes: [summaries[0]!], tags: ["todo"] })
      .mockResolvedValueOnce({ ok: true, notes: [], tags: [] })
      .mockResolvedValueOnce({ ok: true, notes: [], tags: [] })
      .mockResolvedValueOnce({ ok: true, notes: [], tags: [] });

    render(<NotesView />);

    await screen.findByRole("heading", { name: "Pinned reminder" });
    const getNoteCallsAfterSelection = vi.mocked(getNote).mock.calls.length;
    fireEvent.click(await screen.findByRole("button", { name: "Delete" }));
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Delete note" }));

    await waitFor(() => expect(deleteNotesBatch).toHaveBeenCalledWith(["note-1"]));
    await waitFor(() => expect(screen.getByText("No private notes.")).toBeTruthy());
    expect(getNote).toHaveBeenCalledTimes(getNoteCallsAfterSelection);
  });
});
