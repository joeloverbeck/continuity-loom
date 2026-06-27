// @vitest-environment jsdom

import type { StoryNote } from "@loom/core";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { NoteSourcePane } from "./NoteSourcePane.js";

let scrollMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  scrollMock = vi.fn();
  Element.prototype.scrollIntoView = scrollMock as unknown as Element["scrollIntoView"];
  vi.stubGlobal("matchMedia", vi.fn(() => mediaQueryList(false)));
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("NoteSourcePane", () => {
  it("scrolls the source pane into view when the selected note id changes", () => {
    const { rerender } = render(notePane({ note: note({ id: "note-1", title: "First note" }) }));
    scrollMock.mockClear();

    rerender(notePane({ note: note({ id: "note-2", title: "Second note" }) }));

    expect(screen.getByRole("heading", { name: "Second note" })).toBeTruthy();
    expect(scrollMock).toHaveBeenCalledTimes(1);
    expect(scrollMock).toHaveBeenCalledWith({ block: "start", behavior: "smooth" });
  });

  it("uses instant scroll when reduced motion is preferred", () => {
    vi.mocked(window.matchMedia).mockImplementation(() => mediaQueryList(true));

    render(notePane({ note: note({ id: "note-1" }) }));

    expect(scrollMock).toHaveBeenCalledWith({ block: "start", behavior: "auto" });
  });

  it("does not scroll again when the selected note id stays the same", () => {
    const { rerender } = render(notePane({ note: note({ id: "note-1", title: "Original title" }) }));
    const callCount = scrollMock.mock.calls.length;

    rerender(notePane({ note: note({ id: "note-1", title: "Updated title", updatedAt: "2026-06-15T10:30:00.000Z" }) }));

    expect(screen.getByRole("heading", { name: "Updated title" })).toBeTruthy();
    expect(scrollMock).toHaveBeenCalledTimes(callCount);
  });
});

function notePane({ note }: { note: StoryNote | null }): React.JSX.Element {
  return (
    <NoteSourcePane
      note={note}
      onEdit={vi.fn()}
      onDelete={vi.fn()}
      onCollectWhole={vi.fn()}
      onCollectSelection={vi.fn()}
      formatDate={(value) => value}
    />
  );
}

function note(overrides: Partial<StoryNote> = {}): StoryNote {
  return {
    id: "note-1",
    title: "Source note",
    body: "Private note body.",
    tags: ["scratch"],
    pinned: false,
    mode: "scratch",
    createdAt: "2026-06-15T10:00:00.000Z",
    updatedAt: "2026-06-15T10:05:00.000Z",
    ...overrides
  };
}

function mediaQueryList(matches: boolean): MediaQueryList {
  return {
    matches,
    media: "(prefers-reduced-motion: reduce)",
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn()
  };
}
