import type { NoteListQuery, StoryNoteSummary } from "../api.js";

const highlightStart = "\u0002LOOM_NOTE_HIGHLIGHT_START\u0002";
const highlightEnd = "\u0002LOOM_NOTE_HIGHLIGHT_END\u0002";

interface NotesSearchPaneProps {
  notes: StoryNoteSummary[];
  tags: string[];
  filters: {
    q: string;
    tag: string[];
    mode: NonNullable<NoteListQuery["mode"]>;
    pinned: NonNullable<NoteListQuery["pinned"]>;
    sort: NonNullable<NoteListQuery["sort"]>;
  };
  selectedNoteId: string | null;
  selectedIds: Set<string>;
  onFiltersChange: (filters: NotesSearchPaneProps["filters"]) => void;
  onSelectNote: (note: StoryNoteSummary) => void;
  onToggleSelected: (id: string) => void;
  onCollectSelected: () => void;
  onDeleteSelected: () => void;
  formatDate: (value: string) => string;
}

const sortOptions: Array<{ value: NonNullable<NoteListQuery["sort"]>; label: string }> = [
  { value: "relevance", label: "Relevance" },
  { value: "updated-desc", label: "Updated newest" },
  { value: "updated-asc", label: "Updated oldest" },
  { value: "created-desc", label: "Created newest" },
  { value: "created-asc", label: "Created oldest" },
  { value: "title-asc", label: "Title A-Z" }
];

export function HighlightedText({ text }: { text: string }): React.JSX.Element {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.includes(highlightStart)) {
    const start = remaining.indexOf(highlightStart);
    const before = remaining.slice(0, start);
    const afterStart = remaining.slice(start + highlightStart.length);
    const end = afterStart.indexOf(highlightEnd);

    if (before) {
      parts.push(<span key={key++}>{before}</span>);
    }

    if (end < 0) {
      parts.push(<span key={key++}>{afterStart}</span>);
      remaining = "";
      break;
    }

    parts.push(<mark key={key++}>{afterStart.slice(0, end)}</mark>);
    remaining = afterStart.slice(end + highlightEnd.length);
  }

  if (remaining) {
    parts.push(<span key={key++}>{remaining}</span>);
  }

  return <>{parts}</>;
}

export function NotesSearchPane({
  notes,
  tags,
  filters,
  selectedNoteId,
  selectedIds,
  onFiltersChange,
  onSelectNote,
  onToggleSelected,
  onCollectSelected,
  onDeleteSelected,
  formatDate
}: NotesSearchPaneProps): React.JSX.Element {
  function toggleTag(tag: string): void {
    const nextTags = filters.tag.includes(tag)
      ? filters.tag.filter((current) => current !== tag)
      : [...filters.tag, tag];
    onFiltersChange({ ...filters, tag: nextTags });
  }

  return (
    <section className="notesPane notesSearchPane" aria-labelledby="notes-find-title">
      <div className="notesPaneHeader">
        <div>
          <p className="eyebrow">Find</p>
          <h3 id="notes-find-title">Find</h3>
        </div>
        <span className="notesCount">{notes.length}</span>
      </div>

      <div className="notesToolbar" aria-label="Private note filters">
        <label>
          Search
          <input
            value={filters.q}
            onChange={(event) => onFiltersChange({ ...filters, q: event.target.value })}
          />
        </label>
        <label>
          Mode
          <select
            value={filters.mode}
            onChange={(event) =>
              onFiltersChange({ ...filters, mode: event.target.value as NonNullable<NoteListQuery["mode"]> })
            }
          >
            <option value="all">All notes</option>
            <option value="scratch">Scratch</option>
            <option value="scene-prep">Scene prep</option>
          </select>
        </label>
        <label>
          Pinned
          <select
            value={filters.pinned}
            onChange={(event) =>
              onFiltersChange({ ...filters, pinned: event.target.value as NonNullable<NoteListQuery["pinned"]> })
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
              onFiltersChange({ ...filters, sort: event.target.value as NonNullable<NoteListQuery["sort"]> })
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

      <div className="notesTagChips" aria-label="Tag filters">
        {tags.map((tag) => (
          <button
            key={tag}
            type="button"
            className={filters.tag.includes(tag) ? "selected" : ""}
            onClick={() => toggleTag(tag)}
          >
            {tag}
          </button>
        ))}
      </div>

      <div className="notesBulkActions">
        <button type="button" disabled={selectedIds.size === 0} onClick={onCollectSelected}>
          Collect selected
        </button>
        <button type="button" disabled={selectedIds.size === 0} onClick={onDeleteSelected}>
          Permanently delete selected
        </button>
      </div>

      <div className="notesList" aria-label="Private notes">
        {notes.length === 0 ? (
          <div className="emptyState">
            <p className="status">No private notes.</p>
          </div>
        ) : (
          notes.map((note) => (
            <article key={note.id} className={`notesListItem${selectedNoteId === note.id ? " selected" : ""}`}>
              <label className="notesCheckboxLabel">
                <input
                  type="checkbox"
                  checked={selectedIds.has(note.id)}
                  onChange={() => onToggleSelected(note.id)}
                />
                <span className="srOnly">Select {note.title}</span>
              </label>
              <button type="button" onClick={() => onSelectNote(note)}>
                <span className="notesListTitle">
                  {note.pinned ? "Pinned · " : ""}
                  <HighlightedText text={note.titleHighlight ?? note.title} />
                </span>
                <span className="notesListPreview">
                  <HighlightedText text={note.bodySnippet ?? (note.bodyPreview || "No body text.")} />
                </span>
                <span className="notesListMeta">
                  {note.mode === "scene-prep" ? "Scene prep" : "Scratch"} ·{" "}
                  {note.tags.length ? note.tags.join(", ") : "No tags"} · {formatDate(note.updatedAt)}
                </span>
              </button>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
