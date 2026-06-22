import type { StoryNote } from "@loom/core";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  captureNoteClips,
  createNote,
  deleteNoteClip,
  deleteNotesBatch,
  getNote,
  listNoteClips,
  listNotes,
  reorderNoteClips,
  updateNote,
  type ClipCaptureInput,
  type NoteListQuery,
  type StoryNoteClipRead,
  type StoryNoteSummary
} from "../api.js";
import { NoteEditor, type NoteEditorHandle } from "./NoteEditor.js";
import { NoteSourcePane } from "./NoteSourcePane.js";
import { NotesSearchPane } from "./NotesSearchPane.js";
import { PermanentDeleteDialog } from "./PermanentDeleteDialog.js";
import { ScenePrepPane } from "./ScenePrepPane.js";

type NotesFilters = {
  q: string;
  tag: string[];
  mode: NonNullable<NoteListQuery["mode"]>;
  pinned: NonNullable<NoteListQuery["pinned"]>;
  sort: NonNullable<NoteListQuery["sort"]>;
};

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function noteToDeleteItem(note: StoryNote | StoryNoteSummary): Pick<StoryNote, "id" | "title" | "mode"> {
  return { id: note.id, title: note.title, mode: note.mode };
}

export function NotesView(): React.JSX.Element {
  const [notes, setNotes] = useState<StoryNoteSummary[]>([]);
  const [prepNotes, setPrepNotes] = useState<StoryNoteSummary[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [sourceNote, setSourceNote] = useState<StoryNote | null>(null);
  const [editingSource, setEditingSource] = useState<StoryNote | null | "new">(null);
  const [selectedPrep, setSelectedPrep] = useState<StoryNote | null>(null);
  const [clips, setClips] = useState<StoryNoteClipRead[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteCandidates, setDeleteCandidates] = useState<Array<Pick<StoryNote, "id" | "title" | "mode">>>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const sourceEditorRef = useRef<NoteEditorHandle | null>(null);
  const prepEditorRef = useRef<NoteEditorHandle | null>(null);
  const [filters, setFilters] = useState<NotesFilters>({
    q: "",
    tag: [],
    mode: "all",
    pinned: "all",
    sort: "updated-desc"
  });

  const query = useMemo<NoteListQuery>(
    () => ({
      ...(filters.q ? { q: filters.q } : {}),
      ...(filters.tag.length ? { tag: filters.tag } : {}),
      mode: filters.mode,
      pinned: filters.pinned,
      sort: filters.q && filters.sort === "relevance" ? "relevance" : filters.sort === "relevance" ? "updated-desc" : filters.sort
    }),
    [filters]
  );

  const loadNotes = useCallback(() => {
    let active = true;

    void Promise.all([
      listNotes(query),
      listNotes({ mode: "scene-prep", sort: "updated-desc" })
    ])
      .then(([listResponse, prepResponse]) => {
        if (!active) {
          return;
        }

        if (!listResponse.ok) {
          setNotice(listResponse.message);
          setNotes([]);
          setTags([]);
          return;
        }

        setNotice(null);
        setNotes(listResponse.notes);
        setTags(listResponse.tags);
        setPrepNotes(prepResponse.ok ? prepResponse.notes : []);
        setSelectedIds((current) => new Set([...current].filter((id) => listResponse.notes.some((note) => note.id === id))));
      })
      .catch(() => {
        if (active) {
          setNotice("Could not load private notes.");
          setNotes([]);
          setTags([]);
        }
      });

    return () => {
      active = false;
    };
  }, [query]);

  useEffect(() => loadNotes(), [loadNotes]);

  useEffect(() => {
    if (sourceNote || editingSource || notes.length === 0) {
      return;
    }

    void selectSource(notes[0]!);
  }, [notes, sourceNote, editingSource]);

  useEffect(() => {
    if (!selectedPrep) {
      setClips([]);
      return;
    }

    void loadClips(selectedPrep.id);
  }, [selectedPrep?.id]);

  async function flushEditors(): Promise<boolean> {
    for (const editor of [sourceEditorRef.current, prepEditorRef.current]) {
      if (editor?.hasDirtyChanges()) {
        const saved = await editor.flush();
        if (!saved) {
          setNotice("Save failed. Your private note edits are still open.");
          return false;
        }
      }
    }

    return true;
  }

  async function selectSource(summaryOrId: StoryNoteSummary | string): Promise<void> {
    if (!(await flushEditors())) {
      return;
    }

    const id = typeof summaryOrId === "string" ? summaryOrId : summaryOrId.id;
    setEditingSource(null);
    const response = await getNote(id);
    if (response.ok) {
      setSourceNote(response.note);
      return;
    }

    setNotice(response.message);
  }

  async function selectPrep(id: string): Promise<void> {
    if (!id || !(await flushEditors())) {
      if (!id) {
        setSelectedPrep(null);
      }
      return;
    }

    const response = await getNote(id);
    if (response.ok) {
      setSelectedPrep(response.note);
      return;
    }

    setNotice(response.message);
  }

  async function loadClips(prepNoteId: string): Promise<void> {
    const response = await listNoteClips(prepNoteId);
    if (response.ok) {
      setClips(response.clips);
    } else {
      setNotice(response.message);
      setClips([]);
    }
  }

  function handleSaved(note: StoryNote): void {
    if (note.mode === "scene-prep") {
      setSelectedPrep(note);
    } else {
      setSourceNote(note);
    }
    setNotice(null);
    loadNotes();
  }

  function handleDeleted(id: string): void {
    setNotes((current) => current.filter((note) => note.id !== id));
    setPrepNotes((current) => current.filter((note) => note.id !== id));
    setSourceNote((current) => (current?.id === id ? null : current));
    setSelectedPrep((current) => (current?.id === id ? null : current));
    setSelectedIds((current) => {
      const next = new Set(current);
      next.delete(id);
      return next;
    });
    setEditingSource(null);
    setDeleteCandidates([]);
    setNotice(null);
    if (selectedPrep && selectedPrep.id !== id) {
      void loadClips(selectedPrep.id);
    }
    loadNotes();
  }

  function toggleSelected(id: string): void {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  async function capture(prepNoteId: string, captures: ClipCaptureInput[]): Promise<void> {
    if (!(await flushEditors())) {
      return;
    }

    const response = await captureNoteClips(prepNoteId, captures);
    if (!response.ok) {
      setNotice(response.message);
      return;
    }

    await loadClips(prepNoteId);
    setSelectedIds(new Set());
  }

  async function collectWhole(note: StoryNote): Promise<void> {
    if (!selectedPrep) {
      setNotice("Choose a scene-prep sheet before collecting source material.");
      return;
    }

    await capture(selectedPrep.id, [{ captureKind: "whole-note", sourceNoteId: note.id }]);
  }

  async function collectSelection(note: StoryNote, selectedText: string): Promise<void> {
    if (!selectedPrep) {
      setNotice("Choose a scene-prep sheet before collecting source material.");
      return;
    }

    await capture(selectedPrep.id, [
      {
        captureKind: "excerpt",
        sourceNoteId: note.id,
        selectedText,
        sourceUpdatedAt: note.updatedAt
      }
    ]);
  }

  async function collectSelected(): Promise<void> {
    if (!selectedPrep) {
      setNotice("Choose a scene-prep sheet before collecting source material.");
      return;
    }

    const captures = [...selectedIds].map((sourceNoteId) => ({ captureKind: "whole-note" as const, sourceNoteId }));
    await capture(selectedPrep.id, captures);
  }

  async function newPrepSheet(): Promise<void> {
    const response = await createNote({
      title: "Scene Prep",
      body: "",
      tags: ["scene-prep"],
      pinned: false,
      mode: "scene-prep"
    });

    if (response.ok) {
      setSelectedPrep(response.note);
      loadNotes();
    } else {
      setNotice(response.message);
    }
  }

  async function useSourceAsPrep(): Promise<void> {
    if (!sourceNote) {
      setNotice("Select a source note first.");
      return;
    }

    const response = await updateNote(sourceNote.id, {
      title: sourceNote.title,
      body: sourceNote.body,
      tags: sourceNote.tags,
      pinned: sourceNote.pinned,
      mode: "scene-prep"
    });

    if (response.ok) {
      setSelectedPrep(response.note);
      setSourceNote(response.note);
      loadNotes();
    } else {
      setNotice(response.message);
    }
  }

  async function appendClipToPrep(clip: StoryNoteClipRead): Promise<void> {
    if (!selectedPrep || !(await flushEditors())) {
      return;
    }

    const separator = selectedPrep.body.trim().length > 0 ? "\n\n" : "";
    const response = await updateNote(selectedPrep.id, {
      title: selectedPrep.title,
      body: `${selectedPrep.body}${separator}${clip.content}`,
      tags: selectedPrep.tags,
      pinned: selectedPrep.pinned,
      mode: "scene-prep"
    });

    if (response.ok) {
      setSelectedPrep(response.note);
    } else {
      setNotice(response.message);
    }
  }

  async function moveClip(clipId: string, direction: -1 | 1): Promise<void> {
    if (!selectedPrep) {
      return;
    }

    const index = clips.findIndex((clip) => clip.id === clipId);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= clips.length) {
      return;
    }

    const ordered = [...clips];
    const [clip] = ordered.splice(index, 1);
    ordered.splice(target, 0, clip!);
    const response = await reorderNoteClips(selectedPrep.id, ordered.map((item) => item.id));
    if (response.ok) {
      setClips(response.clips);
    } else {
      setNotice(response.message);
    }
  }

  async function removeClip(clipId: string): Promise<void> {
    if (!selectedPrep) {
      return;
    }

    const response = await deleteNoteClip(selectedPrep.id, clipId);
    if (response.ok) {
      setClips((current) => current.filter((clip) => clip.id !== clipId));
    } else {
      setNotice(response.message);
    }
  }

  async function confirmDelete(): Promise<void> {
    const ids = deleteCandidates.map((note) => note.id);
    const response = await deleteNotesBatch(ids);
    if (response.ok) {
      for (const id of ids) {
        handleDeleted(id);
      }
      return;
    }

    setNotice(response.message);
  }

  const sourcePanel = editingSource ? (
    <section className="notesPane notesSourcePane" aria-label="Source editor">
      <NoteEditor
        ref={sourceEditorRef}
        note={editingSource === "new" ? null : editingSource}
        onSaved={handleSaved}
        onDeleted={handleDeleted}
        onCancel={() => setEditingSource(null)}
      />
    </section>
  ) : (
    <NoteSourcePane
      note={sourceNote}
      onEdit={(note) => setEditingSource(note)}
      onDelete={(note) => setDeleteCandidates([noteToDeleteItem(note)])}
      onCollectWhole={(note) => void collectWhole(note)}
      onCollectSelection={(note, selectedText) => void collectSelection(note, selectedText)}
      formatDate={formatDate}
    />
  );

  return (
    <section className="surface notesSurface" aria-labelledby="notes-title">
      <div className="projectHeader notesHeader">
        <div>
          <p className="eyebrow">Private Notes</p>
          <h2 id="notes-title">Private Notes</h2>
        </div>
        <div className="notesHeaderActions">
          <span className="notesBoundaryBadge">Author-private · never sent to prompts</span>
          <button type="button" onClick={() => setEditingSource("new")}>
            New Note
          </button>
        </div>
      </div>
      <p className="notesBoundaryCopy">
        Notes and prep sheets are inert scratch. They never affect records, readiness, generation, or accepted prose.
      </p>

      {notice ? (
        <p role="alert" className="status statusError">
          {notice}
        </p>
      ) : null}

      <div className="notesWorkspace">
        <NotesSearchPane
          notes={notes}
          tags={tags}
          filters={filters}
          selectedNoteId={sourceNote?.id ?? null}
          selectedIds={selectedIds}
          onFiltersChange={setFilters}
          onSelectNote={(note) => void selectSource(note)}
          onToggleSelected={toggleSelected}
          onCollectSelected={() => void collectSelected()}
          onDeleteSelected={() =>
            setDeleteCandidates(notes.filter((note) => selectedIds.has(note.id)).map(noteToDeleteItem))
          }
          formatDate={formatDate}
        />
        {sourcePanel}
        <ScenePrepPane
          prepNotes={prepNotes}
          selectedPrep={selectedPrep}
          clips={clips}
          editorRef={prepEditorRef}
          onSelectPrep={(id) => void selectPrep(id)}
          onNewPrep={() => void newPrepSheet()}
          onUseSourceAsPrep={() => void useSourceAsPrep()}
          onSaved={handleSaved}
          onDeleted={handleDeleted}
          onAppendClip={(clip) => void appendClipToPrep(clip)}
          onInsertClip={(clip) => void appendClipToPrep(clip)}
          onOpenSource={(id) => void selectSource(id)}
          onRemoveClip={(id) => void removeClip(id)}
          onMoveClip={(id, direction) => void moveClip(id, direction)}
          formatDate={formatDate}
        />
      </div>

      <PermanentDeleteDialog
        notes={deleteCandidates}
        onCancel={() => setDeleteCandidates([])}
        onConfirm={() => void confirmDelete()}
      />
    </section>
  );
}
