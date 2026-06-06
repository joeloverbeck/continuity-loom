# SPEC010CANEDIACC-006: Candidate lifecycle UI (edit / regenerate / discard / accept)

**Status**: PENDING
**Priority**: MEDIUM
**Effort**: Large
**Engine Changes**: Yes — `GenerateView` candidate lifecycle (editable candidate, Regenerate/Discard/Accept, post-accept notice); `styles.css` candidate-editor styling
**Deps**: SPEC010CANEDIACC-003, SPEC010CANEDIACC-005

## Problem

After SPEC010CANEDIACC-005, `/generate` shows a **read-only** candidate. SPEC-010 Deliverable 6
turns it into the editable candidate lifecycle: edit before acceptance (no edit-tracking),
Regenerate (replace, warn on unsaved edits), Discard (no durable write), Accept (persist the
**edited** text + metadata snapshot via `acceptCandidate()`), and a **minimal ephemeral**
post-accept notice. This is the human-gatekept core loop step (FOUNDATIONS §3/§20) — the candidate
becomes durable story output only by explicit user acceptance, and only the accepted text is stored.

## Assumption Reassessment (2026-06-06)

1. `GenerateView` exists after SPEC010CANEDIACC-005 with the read-only candidate display, Send button, and `GenerateState`/`generateCandidate` logic relocated from `PromptPreviewView.tsx:22-89`. This ticket upgrades that surface; it depends on -005 having created `packages/web/src/generate/GenerateView.tsx` (intra-batch create-then-modify).
2. `acceptCandidate({ text, generationMetadata }): Promise<AcceptResponse>` and `GenerationMetadata` come from SPEC010CANEDIACC-003 (`packages/web/src/api.ts`); the metadata to pass through is the snapshot from the `generate()` response that produced this candidate. `ApiFailure` models `no-open-project` and missing-key/blocked branches mirror SPEC-009 errors already handled in the relocated state machine.
3. Shared boundary under audit: the generate→accept hand-off — the candidate's editable text + the **unmodified** `GenerationMetadata` from its `generate()` response — must reach `acceptCandidate` so the persisted segment reflects what actually generated the text (SPEC-010 §Risks; the server still Zod-strict-validates).
4. FOUNDATIONS principles motivating this ticket: §3/§20/§29.2 (acceptance is the human gate; no record mutation, no canon inference); §21/§29.8 ("accepted text is the accepted text" — persist edited text verbatim, **no** edited flag; discarded/regenerated candidates never stored); §10/§29.4 (no accepted prose into prompts — no "include last segment" affordance); §22 (candidate lives only in session React state — never `localStorage`/`sessionStorage`/IndexedDB/disk, never logged); §29.8 #5 (post-accept reminder so acceptance is never silent).
5. Secret/firewall + persistence surface (§22/§23): the editable candidate is local React state only; the ticket must assert it is written to no web storage and not logged. Accept sends only `{ text, generationMetadata }` — no key. The **persistent** durable-change banner/checklist/quick-links + acknowledge/snooze remain Phase 12; this ships only the minimal ephemeral notice (do not let it grow into the Phase-12 surface — SPEC-010 §Risks).
6. Co-located styling (SPEC-010 Deliverable 7): the candidate-editor textarea, lifecycle buttons, and post-accept notice CSS land in `styles.css` here (distributed asset, not a separate ticket); consistent with existing surfaces, no new CSS framework.

## Architecture Check

1. Modeling the candidate as session-only React state with explicit lifecycle transitions (idle → sending → candidate(editable) → accepted-notice) keeps acceptance the sole durable write and makes "discarded/regenerated never persisted" structurally true — there is no store to leak into.
2. Passing the candidate's originating `GenerationMetadata` through verbatim (rather than re-reading current settings at accept time) records what actually produced the text, matching the server's strict-validated contract.
3. No backwards-compatibility shims: the read-only `<pre>` candidate from -005 is replaced by the editable control; no dual read-only/editable path is kept.

## Verification Layers

1. Editable candidate + edited text authoritative → `GenerateView.test.tsx`: success yields an editable control with a "draft — not accepted, not canon" notice; editing then Accept posts the **edited** text to `acceptCandidate`.
2. Accept lifecycle → test asserts Accept → post-accept ephemeral notice ("Accepted as segment N. Durable changes likely need manual record updates…") and the candidate clears.
3. Regenerate/Discard write nothing durable → test asserts Regenerate replaces the candidate and warns when edits are pending; Discard clears to pre-send with validation/compile intact; neither calls `acceptCandidate`.
4. No persistence / no leak of candidate → test asserts candidate text is in **no** `localStorage`/`sessionStorage` (§22); blocked/missing-key → Send disabled with actionable copy and no candidate (fail-closed, §29.5).
5. Phase boundary → test asserts **no** accepted-segment browser (Phase 11) and **no** persistent reminder/acknowledge/snooze (Phase 12) appear.

## What to Change

### 1. Editable candidate control

In `packages/web/src/generate/GenerateView.tsx`, replace the read-only candidate `<pre>` with an editable `<textarea>` bound to local React state, clearly labeled "draft candidate — not accepted, not canon". Track the originating `GenerationMetadata` from the `generate()` response alongside the text.

### 2. Lifecycle actions

Add **Regenerate** (re-call `generate()`, replace candidate; if the candidate has unsaved edits, warn before replacing — session-level only, persist nothing), **Discard** (clear candidate → pre-send, validation/compile intact, no durable write), and **Accept** (POST current edited text + the originating metadata via `acceptCandidate()`; on success show the ephemeral notice and clear the candidate).

### 3. Post-accept notice + disabled states

Render the minimal, non-modal, non-persistent confirmation on success. Keep Send disabled with clear copy when blocked or when the key is missing (mirror SPEC-009 errors). Add candidate-editor / lifecycle-button / notice CSS to `styles.css`.

### 4. Tests

Extend `packages/web/src/generate/GenerateView.test.tsx` to cover all Verification Layers, mocking `generate` and `acceptCandidate` from `api.ts`.

## Files to Touch

- `packages/web/src/generate/GenerateView.tsx` (modify — created by SPEC010CANEDIACC-005)
- `packages/web/src/generate/GenerateView.test.tsx` (modify — created by SPEC010CANEDIACC-005)
- `packages/web/src/styles.css` (modify)

## Out of Scope

- Accepted-segment browser / ordered reading view / deletion / export — Phase 11.
- Persistent durable-change reminder (banner/checklist, acknowledge/snooze, record quick-links, dashboard surfacing) — Phase 12; this ships only the ephemeral notice.
- Storing rejected/superseded candidates, an "edited" flag, or candidate history — forbidden (§21/§29.8).
- Any prose-to-canon extraction / record auto-creation — forbidden (§20/§29.2).
- Server/api changes (delivered by -001/-002/-003).

## Acceptance Criteria

### Tests That Must Pass

1. `npm test -- GenerateView` — success → editable candidate with "draft — not accepted" notice; editing then Accept posts the **edited** text; Accept → ephemeral post-accept notice + candidate cleared.
2. `npm test -- GenerateView` — Regenerate replaces the candidate and warns on pending edits; Discard clears with no `acceptCandidate` call; candidate text is in no `localStorage`/`sessionStorage`; blocked/missing-key → Send disabled, no candidate; no accepted-segment browser and no persistent reminder appear.
3. `npm run typecheck && npm run lint && npm test && npm run build` — all green.

### Invariants

1. Acceptance is the only durable write; regenerate/discard/edit persist nothing (§21/§29.8).
2. The candidate exists solely in session React state — never web storage, never logged (§22); accept payload carries no key (§23).

## Test Plan

### New/Modified Tests

1. `packages/web/src/generate/GenerateView.test.tsx` — full candidate lifecycle: edit, regenerate (with edit-warning), discard, accept (edited text + ephemeral notice), no-persistence assertions, fail-closed Send, phase-boundary absence checks.

### Commands

1. `npm test -- GenerateView`
2. `npm run typecheck && npm run lint && npm test && npm run build`
