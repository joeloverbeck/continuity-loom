# Frozen discussion transcript

- Goal: add an export bundle for a project so the owner can make an offline backup.
- Decided: export is manual, local-only, and never scheduled or uploaded.
- Decided: the bundle contains story records, generation-time brief state, accepted-segment archive, and private notes.
- Decided: API keys, logs, generated candidates, rejected candidates, and prompt previews are excluded.
- Decided: export must be initiated from an open project and written through a user-selected local path.
- Constraint: import and restore are explicitly out of scope for this change.
- Constraint: the server remains bound to `127.0.0.1`.
- Open statement A: “We could use a plain directory or one compressed file; either seems fine.”
- Open statement B: “Private notes might be plaintext inside the bundle, or the bundle might need local encryption.”
- Verification discussed: round-trip import tests were mentioned even though import is out of scope; no alternative export-integrity oracle was selected.
- No migration, overwrite, naming-collision, partial-write, cancellation, or cleanup behavior has been decided.
