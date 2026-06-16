import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  deleteNote,
  getNote,
  listNotes,
  type NoteListQuery,
  type StoryNoteSummary
} from "../api.js";
import type { StoryNote } from "@loom/core";
import { NoteDetail } from "./NoteDetail.js";
import { NoteEditor, type NoteEditorHandle } from "./NoteEditor.js";

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
  const [editingNote, setEditingNote] = useState<StoryNote | null | "new">(null);
  const [deleteCandidate, setDeleteCandidate] = useState<StoryNote | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const editorRef = useRef<NoteEditorHandle | null>(null);
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

  const loadNotes = useCallback(() => {
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

  useEffect(() => loadNotes(), [loadNotes]);

  useEffect(() => {
    if (selectedNote || editingNote || notes.length === 0) {
      return;
    }

    void selectNote(notes[0]!);
  }, [notes, selectedNote, editingNote]);

  async function flushEditorBeforeLeaving(): Promise<boolean> {
    if (!editorRef.current?.hasDirtyChanges()) {
      return true;
    }

    const saved = await editorRef.current.flush();
    if (!saved) {
      setNotice("Save failed. Your private note edits are still open.");
    }
    return saved;
  }

  async function selectNote(summary: StoryNoteSummary): Promise<void> {
    if (!(await flushEditorBeforeLeaving())) {
      return;
    }

    setEditingNote(null);
    setSelectedNote((current) => current ?? null);
    const response = await getNote(summary.id);

    if (response.ok) {
      setSelectedNote(response.note);
      return;
    }

    setNotice(response.message);
  }

  function handleSaved(note: StoryNote): void {
    setSelectedNote(note);
    setNotice(null);
    loadNotes();
  }

  function handleDeleted(id: string): void {
    setNotes((current) => current.filter((note) => note.id !== id));
    setSelectedNote((current) => (current?.id === id ? null : current));
    setEditingNote(null);
    setDeleteCandidate(null);
    setNotice(null);
    loadNotes();
  }

  async function confirmDetailDelete(): Promise<void> {
    if (!deleteCandidate) {
      return;
    }

    const response = await deleteNote(deleteCandidate.id);
    if (response.ok) {
      handleDeleted(deleteCandidate.id);
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
        <button
          type="button"
          onClick={() => {
            setEditingNote("new");
            setSelectedNote(null);
            setNotice(null);
          }}
        >
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
        {editingNote ? (
          <NoteEditor
            ref={editorRef}
            note={editingNote === "new" ? null : editingNote}
            onSaved={handleSaved}
            onDeleted={handleDeleted}
            onCancel={() => setEditingNote(null)}
          />
        ) : (
          <NoteDetail
            note={selectedNote}
            onEdit={(note) => setEditingNote(note)}
            onDelete={(note) => setDeleteCandidate(note)}
          />
        )}
      </div>

      {deleteCandidate ? (
        <div role="dialog" aria-modal="true" aria-labelledby="note-detail-delete-title" className="notesDialog">
          <div className="notesDialogPanel">
            <h4 id="note-detail-delete-title">Delete "{deleteCandidate.title}"?</h4>
            <p>This permanently removes the private note.</p>
            <div className="notesDetailActions">
              <button type="button" onClick={() => setDeleteCandidate(null)}>
                Cancel
              </button>
              <button type="button" onClick={() => void confirmDetailDelete()}>
                Delete note
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
