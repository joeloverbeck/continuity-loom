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
}
