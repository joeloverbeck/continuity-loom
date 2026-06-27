import type { StoryNote } from "@loom/core";
import { useEffect, useRef, useState } from "react";

import { SafeMarkdown } from "./safe-markdown.js";

interface NoteSourcePaneProps {
  note: StoryNote | null;
  onEdit: (note: StoryNote) => void;
  onDelete: (note: StoryNote) => void;
  onCollectWhole: (note: StoryNote) => void;
  onCollectSelection: (note: StoryNote, selectedText: string) => void;
  formatDate: (value: string) => string;
}

export function NoteSourcePane({
  note,
  onEdit,
  onDelete,
  onCollectWhole,
  onCollectSelection,
  formatDate
}: NoteSourcePaneProps): React.JSX.Element {
  const [sourceMode, setSourceMode] = useState<"preview" | "source">("preview");
  const [selectedText, setSelectedText] = useState("");
  const paneRef = useRef<HTMLElement | null>(null);
  const sourceRef = useRef<HTMLTextAreaElement | null>(null);

  function refreshSelection(): void {
    const textarea = sourceRef.current;
    if (!textarea) {
      setSelectedText("");
      return;
    }

    setSelectedText(textarea.value.slice(textarea.selectionStart, textarea.selectionEnd));
  }

  useEffect(() => {
    if (!note) {
      return;
    }

    paneRef.current?.scrollIntoView?.({
      block: "start",
      behavior: prefersReducedMotion() ? "auto" : "smooth"
    });
  }, [note?.id]);

  if (!note) {
    return (
      <section className="notesPane notesSourcePane notesDetailEmpty" aria-label="Source">
        <p className="status">Select a private note.</p>
      </section>
    );
  }

  return (
    <section ref={paneRef} className="notesPane notesSourcePane" aria-labelledby="note-source-title">
      <div className="notesPaneHeader">
        <div>
          <p className="eyebrow">Source</p>
          <h3 id="note-source-title">{note.title}</h3>
        </div>
        <div className="notesDetailActions">
          <button type="button" onClick={() => onCollectWhole(note)}>
            Collect whole
          </button>
          <button
            type="button"
            disabled={sourceMode !== "source" || selectedText.length === 0}
            onClick={() => onCollectSelection(note, selectedText)}
          >
            Collect selection
          </button>
          <button type="button" onClick={() => onEdit(note)}>
            Edit source
          </button>
          <button type="button" onClick={() => onDelete(note)}>
            Delete
          </button>
        </div>
      </div>

      <dl className="notesMeta" aria-label="Source metadata">
        <div>
          <dt>Mode</dt>
          <dd>{note.mode === "scene-prep" ? "Scene prep" : "Scratch"}</dd>
        </div>
        <div>
          <dt>Updated</dt>
          <dd>{formatDate(note.updatedAt)}</dd>
        </div>
        <div>
          <dt>Tags</dt>
          <dd>{note.tags.length ? note.tags.join(", ") : "None"}</dd>
        </div>
      </dl>

      <div className="notesSegmentedControl" aria-label="Source view">
        <button type="button" className={sourceMode === "preview" ? "selected" : ""} onClick={() => setSourceMode("preview")}>
          Preview
        </button>
        <button type="button" className={sourceMode === "source" ? "selected" : ""} onClick={() => setSourceMode("source")}>
          Markdown source
        </button>
      </div>

      {sourceMode === "preview" ? (
        <div className="notesPreviewPane" aria-label="Source preview">
          <SafeMarkdown markdown={note.body || "_No body text._"} />
        </div>
      ) : (
        <textarea
          ref={sourceRef}
          className="notesSourceTextarea"
          value={note.body}
          readOnly
          aria-label="Markdown source"
          onSelect={refreshSelection}
          onKeyUp={refreshSelection}
          onMouseUp={refreshSelection}
        />
      )}
    </section>
  );
}

function prefersReducedMotion(): boolean {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}
