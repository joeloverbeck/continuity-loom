// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getNote, listNotes, type StoryNoteSummary } from "../api.js";
import { NotesView } from "./NotesView.js";

vi.mock("../api.js", () => ({
  getNote: vi.fn(),
  listNotes: vi.fn()
}));

const summaries: StoryNoteSummary[] = [
  {
    id: "note-1",
    title: "Pinned reminder",
    bodyPreview: "Remember the bridge toll.",
    tags: ["todo", "worldbuilding"],
    pinned: true,
    createdAt: "2026-06-15T10:00:00.000Z",
    updatedAt: "2026-06-15T10:05:00.000Z"
  },
  {
    id: "note-2",
    title: "Research scrap",
    bodyPreview: "Archive fragment.",
    tags: ["research"],
    pinned: false,
    createdAt: "2026-06-15T09:00:00.000Z",
    updatedAt: "2026-06-15T09:15:00.000Z"
  }
];

beforeEach(() => {
  vi.mocked(listNotes).mockResolvedValue({ ok: true, notes: summaries, tags: ["research", "todo", "worldbuilding"] });
  vi.mocked(getNote).mockResolvedValue({
    ok: true,
    note: {
      id: "note-1",
      title: "Pinned reminder",
      body: "# Heading\n\nRemember **the bridge toll**.\n\n<script>bad()</script>\n\n![remote](https://example.invalid/x.png)",
      tags: ["todo", "worldbuilding"],
      pinned: true,
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
    expect(screen.getByText(/not prompt context/i)).toBeTruthy();
    expect(await screen.findByRole("button", { name: /Pinned reminder/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Research scrap/ })).toBeTruthy();

    await waitFor(() => expect(getNote).toHaveBeenCalledWith("note-1"));
    const detail = screen.getByRole("heading", { name: "Pinned reminder" }).closest<HTMLElement>(".notesDetail");
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
    fireEvent.change(screen.getByLabelText("Tag"), { target: { value: "research" } });
    fireEvent.change(screen.getByLabelText("Pinned"), { target: { value: "only" } });
    fireEvent.change(screen.getByLabelText("Sort"), { target: { value: "title-asc" } });

    await waitFor(() => {
      expect(listNotes).toHaveBeenLastCalledWith({
        q: "bridge",
        tag: "research",
        pinned: "only",
        sort: "title-asc"
      });
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
});
