import type { StoryNote, StoryNoteUpdateInput } from "@loom/core";
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";

import { createNote, deleteNote, updateNote } from "../api.js";
import { SafeMarkdown } from "./safe-markdown.js";

type EditorStatus = "idle" | "needs-title" | "saving" | "saved" | "failed" | "delete-failed";

interface NoteDraft {
  title: string;
  body: string;
  tagsText: string;
  pinned: boolean;
}

export interface NoteEditorHandle {
  hasDirtyChanges: () => boolean;
  flush: () => Promise<boolean>;
}

interface NoteEditorProps {
  note: StoryNote | null;
  onSaved: (note: StoryNote) => void;
  onDeleted: (id: string) => void;
  onCancel: () => void;
}

function draftFromNote(note: StoryNote | null): NoteDraft {
  return {
    title: note?.title ?? "",
    body: note?.body ?? "",
    tagsText: note?.tags.join(", ") ?? "",
    pinned: note?.pinned ?? false
  };
}

function tagsFromText(value: string): string[] {
  const tags: string[] = [];
  const seen = new Set<string>();

  for (const rawTag of value.split(",")) {
    const tag = rawTag.trim().replace(/\s+/g, " ");
    const key = tag.toLocaleLowerCase();
    if (tag && !seen.has(key)) {
      seen.add(key);
      tags.push(tag);
    }
  }

  return tags;
}

function toUpdateInput(draft: NoteDraft): StoryNoteUpdateInput {
  return {
    title: draft.title.trim(),
    body: draft.body,
    tags: tagsFromText(draft.tagsText),
    pinned: draft.pinned
  };
}

function sameDraft(left: NoteDraft, right: NoteDraft): boolean {
  return left.title === right.title
    && left.body === right.body
    && left.tagsText === right.tagsText
    && left.pinned === right.pinned;
}

function statusLabel(status: EditorStatus): string {
  switch (status) {
    case "needs-title":
      return "Add a title to create.";
    case "saving":
      return "Saving...";
    case "saved":
      return "Saved";
    case "failed":
      return "Save failed - retry";
    case "delete-failed":
      return "Delete failed - try again.";
    case "idle":
      return "Unsaved changes";
  }
}

export const NoteEditor = forwardRef<NoteEditorHandle, NoteEditorProps>(function NoteEditor(
  { note, onSaved, onDeleted, onCancel },
  ref
): React.JSX.Element {
  const [draft, setDraft] = useState<NoteDraft>(() => draftFromNote(note));
  const [savedDraft, setSavedDraft] = useState<NoteDraft>(() => draftFromNote(note));
  const [savedNoteId, setSavedNoteId] = useState<string | null>(note?.id ?? null);
  const draftRef = useRef(draft);
  const savedNoteIdRef = useRef(savedNoteId);
  const [status, setStatus] = useState<EditorStatus>(note ? "saved" : "needs-title");
  const [showPreview, setShowPreview] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const savingRef = useRef<Promise<boolean> | null>(null);
  draftRef.current = draft;

  useEffect(() => {
    const nextDraft = draftFromNote(note);
    draftRef.current = nextDraft;
    savedNoteIdRef.current = note?.id ?? null;
    setDraft(nextDraft);
    setSavedDraft(nextDraft);
    setSavedNoteId(note?.id ?? null);
    setStatus(note ? "saved" : "needs-title");
    setConfirmingDelete(false);
  }, [note]);

  const titleIsValid = draft.title.trim().length > 0;
  const dirty = useMemo(() => !sameDraft(draft, savedDraft), [draft, savedDraft]);
  const canDelete = savedNoteId !== null;
  const saveActionLabel = status === "failed"
    ? "Retry Save"
    : savedNoteId
      ? "Save changes"
      : "Save note";

  async function saveNow(): Promise<boolean> {
    if (!dirty) {
      return true;
    }

    if (!titleIsValid) {
      setStatus("needs-title");
      return false;
    }

    if (savingRef.current) {
      return savingRef.current;
    }

    setStatus("saving");
    const input = toUpdateInput(draft);
    const request = (async () => {
      try {
        const currentNoteId = savedNoteIdRef.current;
        const response = currentNoteId
          ? await updateNote(currentNoteId, input)
          : await createNote(input);

        if (!response.ok) {
          setStatus("failed");
          return false;
        }

        const nextSavedDraft = draftFromNote(response.note);
        savedNoteIdRef.current = response.note.id;
        setSavedDraft(nextSavedDraft);
        setSavedNoteId(response.note.id);
        setStatus(sameDraft(draftRef.current, nextSavedDraft) ? "saved" : "idle");
        onSaved(response.note);
        return true;
      } catch {
        setStatus("failed");
        return false;
      } finally {
        savingRef.current = null;
      }
    })();

    savingRef.current = request;
    return request;
  }

  useImperativeHandle(ref, () => ({
    hasDirtyChanges: () => dirty,
    flush: saveNow
  }));

  useEffect(() => {
    if (!dirty) {
      return;
    }

    if (!titleIsValid) {
      setStatus("needs-title");
      return;
    }

    setStatus("idle");
    const handle = window.setTimeout(() => {
      void saveNow();
    }, 900);

    return () => window.clearTimeout(handle);
  }, [dirty, titleIsValid, draft]);

  async function confirmDelete(): Promise<void> {
    if (!savedNoteId) {
      return;
    }

    const response = await deleteNote(savedNoteId);
    if (response.ok) {
      setConfirmingDelete(false);
      onDeleted(savedNoteId);
      return;
    }

    setStatus("delete-failed");
  }

  return (
    <section className="notesEditor" aria-labelledby="note-editor-title">
      <div className="notesDetailHeader">
        <div>
          <p className="eyebrow">{savedNoteId ? "Edit private note" : "New private note"}</p>
          <h3 id="note-editor-title">{savedNoteId ? draft.title || "Untitled note" : "New Note"}</h3>
        </div>
        <div className="notesDetailActions">
          <button type="button" onClick={() => void saveNow()}>
            {saveActionLabel}
          </button>
          {canDelete ? (
            <button type="button" onClick={() => setConfirmingDelete(true)}>
              Delete
            </button>
          ) : null}
          <button type="button" onClick={onCancel}>
            Close
          </button>
        </div>
      </div>

      <p role="status" className={`status${status === "failed" || status === "delete-failed" ? " statusError" : ""}`}>
        {statusLabel(status)}
      </p>

      <div className="notesEditorGrid">
        <label>
          Title
          <input
            value={draft.title}
            onBlur={() => void saveNow()}
            onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
          />
        </label>
        <label className="notesCheckboxLabel">
          <input
            type="checkbox"
            checked={draft.pinned}
            onBlur={() => void saveNow()}
            onChange={(event) => setDraft((current) => ({ ...current, pinned: event.target.checked }))}
          />
          Pinned
        </label>
        <label>
          Tags
          <input
            value={draft.tagsText}
            placeholder="todo, research"
            onBlur={() => void saveNow()}
            onChange={(event) => setDraft((current) => ({ ...current, tagsText: event.target.value }))}
          />
        </label>
      </div>

      <div className="notesEditorToolbar">
        <label className="notesCheckboxLabel">
          <input
            type="checkbox"
            checked={showPreview}
            onChange={(event) => setShowPreview(event.target.checked)}
          />
          Preview
        </label>
      </div>

      {showPreview ? (
        <div className="notesPreviewPane" aria-label="Note preview">
          <SafeMarkdown markdown={draft.body || "_No body text._"} />
        </div>
      ) : (
        <label>
          Body
          <textarea
            className="notesBodyInput"
            value={draft.body}
            onBlur={() => void saveNow()}
            onChange={(event) => setDraft((current) => ({ ...current, body: event.target.value }))}
          />
        </label>
      )}

      {confirmingDelete && savedNoteId ? (
        <div role="dialog" aria-modal="true" aria-labelledby="note-delete-title" className="notesDialog">
          <div className="notesDialogPanel">
            <h4 id="note-delete-title">Delete "{draft.title}"?</h4>
            <p>This permanently removes the private note.</p>
            <div className="notesDetailActions">
              <button type="button" onClick={() => setConfirmingDelete(false)}>
                Cancel
              </button>
              <button type="button" onClick={() => void confirmDelete()}>
                Delete note
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
});
