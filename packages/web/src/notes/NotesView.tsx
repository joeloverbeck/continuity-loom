import { useEffect, useMemo, useState } from "react";

import {
  getNote,
  listNotes,
  type NoteListQuery,
  type StoryNoteSummary
} from "../api.js";
import type { StoryNote } from "@loom/core";
import { NoteDetail } from "./NoteDetail.js";

const sortOptions: Array<{ value: NonNullable<NoteListQuery["sort"]>; label: string }> = [
  { value: "updated-desc", label: "Updated newest" },
  { value: "updated-asc", label: "Updated oldest" },
  { value: "created-desc", label: "Created newest" },
  { value: "created-asc", label: "Created oldest" },
  { value: "title-asc", label: "Title A-Z" }
];

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

export function NotesView(): React.JSX.Element {
  const [notes, setNotes] = useState<StoryNoteSummary[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [selectedNote, setSelectedNote] = useState<StoryNote | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [filters, setFilters] = useState<Required<Pick<NoteListQuery, "pinned" | "sort">> & Pick<NoteListQuery, "q" | "tag">>({
    q: "",
    tag: "",
    pinned: "all",
    sort: "updated-desc"
  });

  const query = useMemo<NoteListQuery>(
    () => ({
      ...(filters.q ? { q: filters.q } : {}),
      ...(filters.tag ? { tag: filters.tag } : {}),
      pinned: filters.pinned,
      sort: filters.sort
    }),
    [filters]
  );

  useEffect(() => {
    let active = true;

    void listNotes(query)
      .then((response) => {
        if (!active) {
          return;
        }

        if (!response.ok) {
          setNotice(response.message);
          setNotes([]);
          setTags([]);
          setSelectedNote(null);
          return;
        }

        setNotice(null);
        setNotes(response.notes);
        setTags(response.tags);
        if (response.notes.length === 0) {
          setSelectedNote(null);
        }
      })
      .catch(() => {
        if (active) {
          setNotice("Could not load private notes.");
          setNotes([]);
          setTags([]);
          setSelectedNote(null);
        }
      });

    return () => {
      active = false;
    };
  }, [query]);

  useEffect(() => {
    if (selectedNote || notes.length === 0) {
      return;
    }

    void selectNote(notes[0]!);
  }, [notes, selectedNote]);

  async function selectNote(summary: StoryNoteSummary): Promise<void> {
    setSelectedNote((current) => current ?? null);
    const response = await getNote(summary.id);

    if (response.ok) {
      setSelectedNote(response.note);
      return;
    }

    setNotice(response.message);
  }

  return (
    <section className="surface notesSurface" aria-labelledby="notes-title">
      <div className="projectHeader notesHeader">
        <div>
          <p className="eyebrow">Private Notes</p>
          <h2 id="notes-title">Private Notes</h2>
        </div>
        <span className="notesBoundaryBadge">Author-private · never sent to prompts</span>
      </div>
      <p className="notesBoundaryCopy">
        Per-story scratchpad. Notes are not records, not working set entries, and not prompt context.
      </p>

      <div className="notesToolbar" aria-label="Private note filters">
        <button type="button" disabled>
          New Note
        </button>
        <label>
          Search
          <input
            value={filters.q}
            onChange={(event) => setFilters((current) => ({ ...current, q: event.target.value }))}
          />
        </label>
        <label>
          Tag
          <select
            value={filters.tag}
            onChange={(event) => setFilters((current) => ({ ...current, tag: event.target.value }))}
          >
            <option value="">All tags</option>
            {tags.map((tag) => (
              <option key={tag} value={tag}>
                {tag}
              </option>
            ))}
          </select>
        </label>
        <label>
          Pinned
          <select
            value={filters.pinned}
            onChange={(event) =>
              setFilters((current) => ({ ...current, pinned: event.target.value as NonNullable<NoteListQuery["pinned"]> }))
            }
          >
            <option value="all">All</option>
            <option value="only">Pinned only</option>
            <option value="unpinned">Unpinned</option>
          </select>
        </label>
        <label>
          Sort
          <select
            value={filters.sort}
            onChange={(event) =>
              setFilters((current) => ({ ...current, sort: event.target.value as NonNullable<NoteListQuery["sort"]> }))
            }
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {notice ? (
        <p role="alert" className="status statusError">
          {notice}
        </p>
      ) : null}

      <div className="notesLayout">
        <div className="notesList" aria-label="Private notes">
          {notes.length === 0 ? (
            <div className="emptyState">
              <p className="status">No private notes.</p>
            </div>
          ) : (
            notes.map((note) => (
              <button
                key={note.id}
                type="button"
                className={`notesListItem${selectedNote?.id === note.id ? " selected" : ""}`}
                onClick={() => void selectNote(note)}
              >
                <span className="notesListTitle">
                  {note.pinned ? "Pinned · " : ""}
                  {note.title}
                </span>
                <span className="notesListPreview">{note.bodyPreview || "No body text."}</span>
                <span className="notesListMeta">
                  {note.tags.length ? note.tags.join(", ") : "No tags"} · {formatDate(note.updatedAt)}
                </span>
              </button>
            ))
          )}
        </div>
        <NoteDetail note={selectedNote} />
      </div>
    </section>
  );
}
