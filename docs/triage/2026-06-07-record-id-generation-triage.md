# Triage — Record `id` field forces hand-typed UUIDs

**Date**: 2026-06-07
**Trigger**: Creating the first ENTITY record at `/records` failed with "Invalid UUID" when the author typed `ent-ane-arrieta` into the `id` field. Question raised: is the app literally expecting a manually-entered UUID for every record? If so, analyze all story record types' requirements and how they interact with the web interface, and fix.
**Classification**: product-behavior (validation gate + UI/workflow over story records; governed by `docs/FOUNDATIONS.md`).
**Method**: Live reproduction (Puppeteer at `http://127.0.0.1:5173/records`) + codebase trace (web → server → core schema).

## Reproduction (confirmed)

`/records` → **Create ENTITY** renders `id *` as the first field, a **required free-text input**. Typing `ent-ane-arrieta` → **"Invalid UUID"** on submit. The field's own help tooltip: *"Validation only… Not sent to the prose prompt… Operational metadata for filtering or UI state."* No records existed at triage time (`GET /api/records` → `{"ok":true,"records":[]}`), because the bug blocks creating the first record.

## Findings

| ID | Finding | Evidence |
|---|---|---|
| O1 | The record's own `id` is modeled as a required, user-authored field. The editor-descriptor builder emits **every** schema field; the `STATUS_OR_VALIDATION_FIELDS` set containing `"id"` only sets `promptFacing: false`, it does **not** exclude `id` from rendering. | `editor-descriptors.ts:69-83,176-182,189`; `RecordEditor.tsx:411-412,465-475`; `common.ts:7` (`recordId = z.uuid()`). |
| O2 | Blast radius: **16 of 18** record types declare a required own `id: recordId`. ENTITY STATUS and CAST MEMBER instead key on `entity_id` (a reference picker), so they don't force typing. | `entity.ts:9`; `knowledge.ts:13,26,64`; `space-material.ts:35,49,65`; `causal-pressure.ts:21,39,50,74,102,116,130`; `relationship-emotion.ts:11,47`. |
| O3 | The intended auto-generation path is effectively dead. `recordIdFromPayload` does `payloadRecordId(payload) ?? generateRecordId()` but runs **after** `parseRecordPayload` (which already requires a valid UUID `id`), so the fallback never fires for id-bearing types. UUIDv7 infra exists and is unreachable. | `record-repository.ts:101-102,149-150`; `uuidv7.ts`. |
| O4 | References are **not** affected and constrain the fix. Reference pickers render `<option value={record.id}>{record.displayLabel}</option>` — UUID is the hidden value, the visible text is the display label. Reference detection keys off `format === "uuid"`. | `RecordEditor.tsx:240-247`; `CastMemberEditor.tsx:161`; `editor-descriptors.ts:85-104,302`; `common.ts:14-23`. |

## Decision

**Recommended fix (accepted by author):** make the record's own `id` a **system-managed** field — never rendered, server-generated (UUIDv7) on create, preserved on update. Reuses existing infra; keeps references and deterministic compilation intact; storage schema stays strict (`id` required, server-injected) so no validation weakening.

**Author decisions (AskUserQuestion, 2026-06-07):**
- id strategy: **server-generated, hidden** (UUIDv7). The author never sees or types an id.
- ticket slicing: **layered** — one ticket per package boundary / reviewable diff.
- Reference-picker concern explicitly resolved: pickers already show `displayLabel`, not UUIDs, today and after the fix; locked with a regression test.

**Rejected alternatives:**
- **Author-supplied human-readable slugs** (relax `z.uuid()`): would require rewriting reference detection (`isReferenceSchema`, `referenceIfId`), uniqueness/collision enforcement, and touches FOUNDATIONS reference-integrity surfaces. Pickers already hide raw ids, so slugs buy little. Rejected.
- **Client-side UUID prefill** (visible/readonly id field): leaks an opaque key into the UI and moves id authority into the web layer. Rejected.

## FOUNDATIONS alignment

| Principle | Stance | Rationale |
|---|---|---|
| §27 / §29.11 — faster atomic record creation | aligns | Removes a hand-authored UUID from every create form. |
| §4.4 / §29.4 — deterministic compilation | aligns | `id` is non-prompt-facing; `generateRecordId` runs once at create time, not at compile time; identical stored state → identical prompt. |
| §11 / §29.5 — validation hard fails | aligns | The own `id` is operational metadata, not a continuity gate; storage schema stays strict (server-injected valid UUID), so no validation is weakened. |
| §15 / §8 — secret firewall, deterministic compilation | N/A (unaffected) | Change relocates *when* the id is assigned (server, pre-parse), not *whether* it is validated; no prompt/secret surface touched. |

## Deliverables (finding → ticket map)

| Finding(s) | Ticket | Scope |
|---|---|---|
| O1 | `archive/tickets/RECIDGEN-001.md` | Core: drop own `id` from editor descriptor; expose id-free `getEditorFormSchema`. |
| O3 | `archive/tickets/RECIDGEN-002.md` | Server: generate UUIDv7 on create / preserve row id on update; inject before validation; honor client-supplied ids. |
| O1, O4 | `archive/tickets/RECIDGEN-003.md` | Web: resolver uses id-free schema; reference-picker label regression test. |

Dependency order: RECIDGEN-001 → RECIDGEN-002, RECIDGEN-003. End-to-end create requires all three.

Status: completed and archived on 2026-06-07.
