import type { StoryNote } from "@loom/core";

import { SafeMarkdown } from "./safe-markdown.js";

interface NoteDetailProps {
  note: StoryNote | null;
  onEdit: (note: StoryNote) => void;
  onDelete: (note: StoryNote) => void;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export function NoteDetail({ note, onEdit, onDelete }: NoteDetailProps): React.JSX.Element {
  if (!note) {
    return (
      <section className="notesDetail notesDetailEmpty" aria-label="Note detail">
        <p className="status">Select a private note.</p>
      </section>
    );
  }

  return (
    <section className="notesDetail" aria-labelledby="note-detail-title">
      <div className="notesDetailHeader">
        <div>
          <p className="eyebrow">{note.pinned ? "Pinned private note" : "Private note"}</p>
          <h3 id="note-detail-title">{note.title}</h3>
        </div>
        <div className="notesDetailActions">
          <button type="button" onClick={() => onEdit(note)}>
            Edit
          </button>
          <button type="button" onClick={() => onDelete(note)}>
            Delete
          </button>
        </div>
      </div>
      <dl className="notesMeta" aria-label="Note metadata">
        <div>
          <dt>Updated</dt>
          <dd>{formatDate(note.updatedAt)}</dd>
        </div>
        <div>
          <dt>Created</dt>
          <dd>{formatDate(note.createdAt)}</dd>
        </div>
        <div>
          <dt>Tags</dt>
          <dd>{note.tags.length ? note.tags.join(", ") : "None"}</dd>
        </div>
      </dl>
      <SafeMarkdown markdown={note.body || "_No body text._"} />
    </section>
  );
}
