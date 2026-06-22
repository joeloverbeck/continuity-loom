import type { StoryNote } from "@loom/core";
import type { NoteEditorHandle } from "./NoteEditor.js";
import type { StoryNoteClipRead, StoryNoteSummary } from "../api.js";
import { NoteClipTray } from "./NoteClipTray.js";
import { NoteEditor } from "./NoteEditor.js";

interface ScenePrepPaneProps {
  prepNotes: StoryNoteSummary[];
  selectedPrep: StoryNote | null;
  clips: StoryNoteClipRead[];
  editorRef: React.RefObject<NoteEditorHandle | null>;
  onSelectPrep: (id: string) => void;
  onNewPrep: () => void;
  onUseSourceAsPrep: () => void;
  onSaved: (note: StoryNote) => void;
  onDeleted: (id: string) => void;
  onAppendClip: (clip: StoryNoteClipRead) => void;
  onInsertClip: (clip: StoryNoteClipRead) => void;
  onOpenSource: (sourceNoteId: string) => void;
  onRemoveClip: (clipId: string) => void;
  onMoveClip: (clipId: string, direction: -1 | 1) => void;
  formatDate: (value: string) => string;
}

export function ScenePrepPane({
  prepNotes,
  selectedPrep,
  clips,
  editorRef,
  onSelectPrep,
  onNewPrep,
  onUseSourceAsPrep,
  onSaved,
  onDeleted,
  onAppendClip,
  onInsertClip,
  onOpenSource,
  onRemoveClip,
  onMoveClip,
  formatDate
}: ScenePrepPaneProps): React.JSX.Element {
  return (
    <section className="notesPane scenePrepPane" aria-labelledby="scene-prep-title">
      <div className="notesPaneHeader">
        <div>
          <p className="eyebrow">Prep</p>
          <h3 id="scene-prep-title">Scene Prep</h3>
        </div>
        <div className="notesDetailActions">
          <button type="button" onClick={onNewPrep}>
            New prep sheet
          </button>
          <button type="button" onClick={onUseSourceAsPrep}>
            Use source as prep
          </button>
        </div>
      </div>

      <label>
        Prep sheet
        <select value={selectedPrep?.id ?? ""} onChange={(event) => onSelectPrep(event.target.value)}>
          <option value="">No prep sheet selected</option>
          {prepNotes.map((note) => (
            <option key={note.id} value={note.id}>
              {note.title}
            </option>
          ))}
        </select>
      </label>

      {selectedPrep ? (
        <>
          <NoteEditor
            ref={editorRef}
            note={selectedPrep}
            onSaved={onSaved}
            onDeleted={onDeleted}
            onCancel={() => undefined}
          />
          <NoteClipTray
            clips={clips}
            onAppend={onAppendClip}
            onInsert={onInsertClip}
            onOpenSource={onOpenSource}
            onRemove={onRemoveClip}
            onMove={onMoveClip}
            formatDate={formatDate}
          />
        </>
      ) : (
        <div className="emptyState">
          <p className="status">Choose or create a scene-prep sheet.</p>
        </div>
      )}
    </section>
  );
}
