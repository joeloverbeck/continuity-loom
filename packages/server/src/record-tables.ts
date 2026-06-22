import type { DatabaseSync } from "node:sqlite";

export function ensureRecordTables(database: DatabaseSync): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS records (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      display_label TEXT NOT NULL,
      status TEXT NULL,
      salience TEXT NULL,
      urgency TEXT NULL,
      archived INTEGER NOT NULL DEFAULT 0,
      user_order INTEGER NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      payload_json TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS records_type_archived_idx
      ON records (type, archived, user_order, created_at);

    CREATE TABLE IF NOT EXISTS record_references (
      from_record_id TEXT NOT NULL,
      ref_role TEXT NOT NULL,
      target_id TEXT NOT NULL,
      PRIMARY KEY (from_record_id, ref_role, target_id),
      FOREIGN KEY (from_record_id) REFERENCES records(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS record_references_target_idx
      ON record_references (target_id, ref_role);

    CREATE TABLE IF NOT EXISTS story_config (
      kind TEXT PRIMARY KEY,
      payload_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS generation_session (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      payload_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS reminder_state (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      acknowledged_through_sequence INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS accepted_segments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sequence INTEGER NOT NULL UNIQUE,
      text TEXT NOT NULL,
      metadata_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);

  ensureStoryNoteTables(database);
}

export function ensureStoryNoteTables(database: DatabaseSync): void {
  ensureStoryNoteBaseTable(database, true);
  ensureStoryNoteIndexes(database);
  ensureStoryNoteClipTables(database);
  ensureStoryNoteFtsTables(database);
}

export function ensureStoryNoteV2Tables(database: DatabaseSync): void {
  ensureStoryNoteBaseTable(database, false);
  ensureStoryNoteIndexes(database);
}

function ensureStoryNoteBaseTable(database: DatabaseSync, includeMode: boolean): void {
  const modeColumn = includeMode
    ? "\n      note_mode TEXT NOT NULL DEFAULT 'scratch' CHECK (note_mode IN ('scratch', 'scene-prep')),"
    : "";

  database.exec(`
    CREATE TABLE IF NOT EXISTS story_notes (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      tags_json TEXT NOT NULL DEFAULT '[]',
      pinned INTEGER NOT NULL DEFAULT 0 CHECK (pinned IN (0, 1)),
      ${modeColumn}
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  if (includeMode && !storyNoteColumnExists(database, "note_mode")) {
    database.exec(`
      ALTER TABLE story_notes
        ADD COLUMN note_mode TEXT NOT NULL DEFAULT 'scratch' CHECK (note_mode IN ('scratch', 'scene-prep'));
    `);
  }
}

function ensureStoryNoteIndexes(database: DatabaseSync): void {
  database.exec(`
    CREATE INDEX IF NOT EXISTS story_notes_pinned_updated_idx
      ON story_notes(pinned DESC, updated_at DESC, id ASC);

    CREATE INDEX IF NOT EXISTS story_notes_title_idx
      ON story_notes(title COLLATE NOCASE, id ASC);

    CREATE INDEX IF NOT EXISTS story_notes_updated_idx
      ON story_notes(updated_at DESC, id ASC);
  `);
}

function ensureStoryNoteClipTables(database: DatabaseSync): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS story_note_clips (
      id TEXT PRIMARY KEY,
      prep_note_id TEXT NOT NULL,
      source_note_id TEXT NULL,
      capture_kind TEXT NOT NULL CHECK (capture_kind IN ('whole-note', 'excerpt')),
      source_title_snapshot TEXT NOT NULL,
      content TEXT NOT NULL,
      source_updated_at_at_capture TEXT NOT NULL,
      position INTEGER NOT NULL CHECK (position >= 0),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (prep_note_id) REFERENCES story_notes(id) ON DELETE CASCADE,
      FOREIGN KEY (source_note_id) REFERENCES story_notes(id) ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS story_note_clips_prep_position_idx
      ON story_note_clips(prep_note_id, position, created_at);

    CREATE INDEX IF NOT EXISTS story_note_clips_source_idx
      ON story_note_clips(source_note_id);
  `);
}

function ensureStoryNoteFtsTables(database: DatabaseSync): void {
  database.exec(`
    CREATE VIRTUAL TABLE IF NOT EXISTS story_notes_fts
      USING fts5(note_id UNINDEXED, title, tags, body, tokenize = 'trigram');

    CREATE TRIGGER IF NOT EXISTS story_notes_fts_after_insert
      AFTER INSERT ON story_notes
      BEGIN
        INSERT INTO story_notes_fts (note_id, title, tags, body)
        VALUES (new.id, new.title, new.tags_json, new.body);
      END;

    CREATE TRIGGER IF NOT EXISTS story_notes_fts_after_update
      AFTER UPDATE ON story_notes
      BEGIN
        UPDATE story_notes_fts
           SET title = new.title,
               tags = new.tags_json,
               body = new.body
         WHERE note_id = new.id;
      END;

    CREATE TRIGGER IF NOT EXISTS story_notes_fts_after_delete
      AFTER DELETE ON story_notes
      BEGIN
        DELETE FROM story_notes_fts WHERE note_id = old.id;
      END;
  `);
}

function storyNoteColumnExists(database: DatabaseSync, columnName: string): boolean {
  const rows = database.prepare("PRAGMA table_info(story_notes)").all() as Array<{ name: string }>;
  return rows.some((row) => row.name === columnName);
}
