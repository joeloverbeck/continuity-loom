# Triage — Web-app errors after the CONFIGDEDUP merge (2026-06-07)

Status: triaged → tickets created
Classification: product-behavior (active working set, validation/compile/generate path, stored project data; governed by `docs/FOUNDATIONS.md` §7, §4.5, §24)

## Source

No formal report. Diagnostic request: four web-app symptoms against the production project `/home/joeloverbeck/stories/red-bunny`, suspected to relate to the CONFIGDEDUP PR (#18) that moved STORY CONTRACT / UNIVERSAL CONTENT POLICY / PROSE MODE off the record path into `story_config` and deleted the orphan record rows.

Reproduced live before diagnosing: dev UI on `127.0.0.1:5173`, API on `127.0.0.1:5174`, plus direct read of `red-bunny/loom.sqlite`.

## Findings

### O1 — `/generation-brief`, `/preview`, `/generate` show `Record not found: 019e99c1-…` (issues 1–3)

**Root cause:** dangling active-working-set references. CONFIGDEDUP-001's migration deleted the two records the user had selected into the working set (STORY CONTRACT + UNIVERSAL CONTENT POLICY) without scrubbing their IDs from `generation_session.active_working_set.selected_records`. The session still holds `019e99c1-4157-79fc-a7f7-ea1d624471ba` and `019e99c4-64a1-7a2c-af39-fb58fbfece02`; the `records` table is now empty. `buildSnapshotFromOpenProject` → `resolveSelectedRecords` (`packages/server/src/snapshot-builder.ts:96-108`) hard-fails on the first missing ID, returning `422 malformed-validation-source`.

**Live evidence:** `POST /api/validate`, `POST /api/compile`, `POST /api/generate` all return `422 ... Record not found: 019e99c1-…`. `GET /api/working-set` returns both stranded IDs.

**Verdict:** real, HIGH. → **WSINTEGRITY-001** (repair-on-open data fix).

### O2 — latent: deleting any selected record bricks generation the same way

**Root cause:** neither `RecordRepository.deleteRecord` (`record-repository.ts:295-298`) nor `DELETE /api/records/:id` (`record-routes.ts:275-293`) scrubs the working set — they only check `record_references` (cross-record links). The migration was merely the first path to trip this; an ordinary user delete of a selected record produces an identical dangling reference and the same 422.

**Verdict:** real, HIGH (prevention). A repair-only fix would leave this trap open. → **WSINTEGRITY-002** (scrub at the delete boundary; reuses the WSINTEGRITY-001 core helper).

### O3 — `/story-config` console errors (issue 4)

**Root cause:** benign. red-bunny has no PROSE MODE authored, so `GET /api/story-config/PROSE MODE` returns `404`; the page handles it gracefully ("No saved PROSE MODE yet", no `role=alert`), but the browser logs a network 404 line. `requestJson` does not throw on non-2xx, so there is no JS exception. STORY CONTRACT and UNIVERSAL CONTENT POLICY both return `200`. This is the expected behavior CONFIGDEDUP-002's outcome note already documented — a **different cause** from O1/O2. The same 404 line also appears on `/generation-brief` (which fetches PROSE MODE).

**Verdict:** not a functional bug, but undesirable console noise for the normal "config not filled in yet" case (user explicitly asked to eliminate it). → **STORYCFGUX-001** (additive list route so no request 404s for unauthored kinds).

## FOUNDATIONS alignment

| Principle | Stance | Rationale |
|---|---|---|
| §24 / §4.10 local-first, user-owned | aligns | WSINTEGRITY-001 repairs project data left in a damaged, ungenerable state by the prior migration. |
| §7 / §29.3 active-working-set supremacy | aligns | Pruning a pointer to a *deleted* record is integrity maintenance, not silent removal of a *selected* record; WSINTEGRITY-001/002 never remove a reference whose record still exists. |
| §4.5 fail closed | aligns | `resolveSelectedRecords` stays strict as the last-resort guard; the tickets remove the *cause* of corruption, not the guard. |
| §8 deterministic compilation / §15 secret firewall | N/A | No compiler, validation-rule, or secret-handling surface is touched. |
| §27 UI/workflow, §29.11 quality | aligns | STORYCFGUX-001 removes spurious error noise from ordinary authoring without changing any storage authority. |

## Deliverables

- `archive/tickets/WSINTEGRITY-001.md` — completed repair of dangling working-set references on project open (fixes red-bunny). Deps: none.
- `tickets/WSINTEGRITY-002.md` — scrub deleted records from the working set at the delete boundary (prevents recurrence). Deps: WSINTEGRITY-001 (shared core helper).
- `archive/tickets/STORYCFGUX-001.md` — completed additive `GET /api/story-config` list route to stop 404 console noise for unauthored kinds. Deps: none.

## Out of scope (recorded, not ticketed)

- Pruning dangling IDs from `current_authoritative_state.*` and the top-level voice arrays (`current_cast_voice_pressure`, `cast_voice_overrides`). These are not the active working set, are not resolved by `resolveSelectedRecords`, and do not brick the snapshot. Future ticket only if a concrete failure is demonstrated.
