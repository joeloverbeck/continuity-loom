import type { StoryNoteClipRead } from "../api.js";

interface NoteClipTrayProps {
  clips: StoryNoteClipRead[];
  onAppend: (clip: StoryNoteClipRead) => void;
  onInsert: (clip: StoryNoteClipRead) => void;
  onOpenSource: (sourceNoteId: string) => void;
  onRemove: (clipId: string) => void;
  onMove: (clipId: string, direction: -1 | 1) => void;
  formatDate: (value: string) => string;
}

function statusLabel(status: StoryNoteClipRead["sourceStatus"]): string {
  switch (status) {
    case "current":
      return "Source current";
    case "edited":
      return "Source edited since capture";
    case "deleted":
      return "Source deleted; captured text preserved";
  }
}

export function NoteClipTray({
  clips,
  onAppend,
  onInsert,
  onOpenSource,
  onRemove,
  onMove,
  formatDate
}: NoteClipTrayProps): React.JSX.Element {
  return (
    <section className="noteClipTray" aria-labelledby="note-clip-tray-title">
      <div className="notesPaneHeader">
        <div>
          <p className="eyebrow">Source tray</p>
          <h4 id="note-clip-tray-title">Collected clips</h4>
        </div>
        <span className="notesCount">{clips.length}</span>
      </div>

      {clips.length === 0 ? (
        <p className="status">No collected clips.</p>
      ) : (
        <ol className="noteClipList">
          {clips.map((clip, index) => (
            <li key={clip.id} className="noteClipItem">
              <div>
                <span className="noteClipKind">{clip.captureKind === "whole-note" ? "Whole note" : "Excerpt"}</span>
                <span className="noteClipStatus">{statusLabel(clip.sourceStatus)}</span>
              </div>
              <p className="noteClipTitle">{clip.sourceTitleSnapshot}</p>
              <p className="noteClipPreview">{clip.content.slice(0, 180) || "Empty captured text."}</p>
              <p className="notesListMeta">Captured {formatDate(clip.createdAt)}</p>
              <div className="notesDetailActions">
                <button type="button" onClick={() => onInsert(clip)}>
                  Insert
                </button>
                <button type="button" onClick={() => onAppend(clip)}>
                  Append
                </button>
                <button type="button" disabled={index === 0} onClick={() => onMove(clip.id, -1)}>
                  Move up
                </button>
                <button type="button" disabled={index === clips.length - 1} onClick={() => onMove(clip.id, 1)}>
                  Move down
                </button>
                {clip.sourceNoteId ? (
                  <button type="button" onClick={() => onOpenSource(clip.sourceNoteId!)}>
                    Open source
                  </button>
                ) : null}
                <button type="button" onClick={() => onRemove(clip.id)}>
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
