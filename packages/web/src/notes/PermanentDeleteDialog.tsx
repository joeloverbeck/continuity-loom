import type { StoryNote } from "@loom/core";

interface PermanentDeleteDialogProps {
  notes: Array<Pick<StoryNote, "id" | "title" | "mode">>;
  onCancel: () => void;
  onConfirm: () => void;
}

export function PermanentDeleteDialog({
  notes,
  onCancel,
  onConfirm
}: PermanentDeleteDialogProps): React.JSX.Element | null {
  if (notes.length === 0) {
    return null;
  }

  const previewTitles = notes.slice(0, 5).map((note) => note.title);
  const prepCount = notes.filter((note) => note.mode === "scene-prep").length;

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="note-delete-title" className="notesDialog">
      <div className="notesDialogPanel">
        <h4 id="note-delete-title">
          Permanently delete {notes.length === 1 ? `"${notes[0]!.title}"` : `${notes.length} notes`}?
        </h4>
        <p>This cannot be undone.</p>
        <p>Collected copies already in a source tray are retained when a source note is deleted.</p>
        {prepCount > 0 ? <p>Deleting a prep sheet cascades its tray clips and leaves source notes untouched.</p> : null}
        <ul>
          {previewTitles.map((title) => (
            <li key={title}>{title}</li>
          ))}
        </ul>
        {notes.length > previewTitles.length ? <p>And {notes.length - previewTitles.length} more.</p> : null}
        <div className="notesDetailActions">
          <button type="button" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" onClick={onConfirm}>
            Delete note{notes.length === 1 ? "" : "s"}
          </button>
        </div>
      </div>
    </div>
  );
}
