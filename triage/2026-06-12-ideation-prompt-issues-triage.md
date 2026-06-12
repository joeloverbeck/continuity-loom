# Triage — Ideation (Ideate page) prompt-generation issues (2026-06-12)

Source: user diagnostic request (no formal report). Six symptoms observed in a compiled production ideation prompt (`red-bunny` project); request was to follow the lifecycle of each, check whether the original prose pipeline shares the failure, align with `docs/**`, and create tickets.

Classification: product-behavior (deterministic prompt compilation, `@loom/core`). Post-exploration confidence ~92%; root causes pinned statically from the compiler code, the brief schema, `docs/ideation-prompt-template.md`, `docs/compiler-contract.md`, **and the real `red-bunny` SQLite DB** (read-only). Confirmatory golden/unit repro skipped per the deterministic-`@loom/core` static-root-cause rule — the stored data + code are the evidence.

Delta vs prior triage `2026-06-09-prompt-generation-issues-triage.md`: that pass covered four **different** prose-pipeline findings (`HARDCANONOMIT`/`ONSTAGEJOIN`/`POVEMPTYLINE`/`POVPERCEIVE`, all archived). No overlap; this is a fresh ideation-surface pass. SECRETLINE-001 extends the `POVEMPTYLINE-001` empty-value-line pattern to the secrets section.

User decisions (AskUserQuestion, 2026-06-12): O1 → add the secrets empty-line hardening ticket; O3 → trim `<contradiction_prohibitions>` to continuity-only for ideation.

## Findings

### O1 — `Forbidden reveals now:\n- n` is faithful rendering of authored data, not a code bug
- The `red-bunny` secret `019ea6b5-9c4b-760b-…` stores `forbidden_reveals: ["n"]` (verified `json_type`=array, value `["n"]`). The list editor stores items verbatim; `front.ts:155-161` renders the one-element array as `- n`. User deletes the stray item — no code fix for the symptom.
- Adjacent real gap: empty secrets sub-fields still emit wasteful `None specified` value-lines (the `POVEMPTYLINE-001` token-waste pattern, not yet applied to secrets). Does NOT change the `- n` line.
- Disposition: **ACTION — `tickets/SECRETLINE-001.md`** (omit empty value-lines in `<secrets_and_reveal_constraints>`; tag + rules retained per §29.4).

### O2 — Ideation `Grounds:` truncate every record summary at 77 chars + `...` (covers issues #3, #4, #5-first)
- Root cause: `citation-keys.ts:39-41` `recordLabel()` uses `metadata.displayLabel` (the truncated UI `display_label`, `editor-descriptors.ts:530-533` cap 80) instead of the full `deriveFullDisplayLabel` (`labels.ts:4-6`). Confirmed: DB BELIEF `display_label` rows are `length=80` ending `...`.
- Both prompt-gen and server-side key verification use the same `citationKeysFor` (`slot-assignment.ts:8,90`; `ideate-routes.ts:65`) → fix stays matchable.
- Disposition: **ACTION — `tickets/IDEAPROMPT-001.md`** (derive keys from full label; docs + golden lockstep).

### O3 — `<contradiction_prohibitions>` is the prose-writer block reused verbatim in ideation
- Shared constant `template-constants.ts:348-363`, in both `SECTION_ORDER:26` and `IDEATION_SECTION_ORDER:56`; `docs/ideation-prompt-template.md:49` sanctions the full block. ~Half its lines are prose-craft-only (voice/catchphrases/exposition-dialogue/resolve-tension/concrete-vs-abstract); others duplicate `<ideation_role>`/`<ideation_quality>`.
- User chose **trim** (not drop/keep). New ideation-specific `ideation_contradiction_prohibitions` section; prose block untouched; docs amended in lockstep.
- Disposition: **ACTION — `tickets/IDEAPROMPT-002.md`**.

### O4 — `reincorporate_dormant` least-recently-updated logic is reliable — no defect
- `slot-assignment.ts:72-103` sorts the **selected working set** (`snapshot-builder.ts:144-163`) by `metadata.updatedAt` (ISO-8601 fixed-length `…Z`, lexical = chronological; verified in DB), tie-break by id, picks earliest. "the park near the Leka-Enea school" (`2026-06-07`) is correctly the oldest LOCATION — matches the observed behavior.
- Minor non-blocking nits only: `localeCompare` locale-sensitivity (harmless on equal-length ASCII timestamps); records without `updatedAt` silently dropped (DB guarantees `NOT NULL`).
- Disposition: **NO TICKET — analysis answer (conforms).**

## What already conforms
- Genuinely-empty `forbidden_reveals` already renders `None specified` (only the empty value-*line* hygiene is open — O1/SECRETLINE-001).
- Citation-key collision/sort/verification use a single source (`citationKeysFor`); O2's fix flows to both sides.
- Dormancy selection (O4) is reliable as-is.

## FOUNDATIONS alignment
- O1 (hardening), O2 → deterministic compilation @ prompt-compilation (§8) — aligns (O1 retains tag+rules per §29.4; O2 restores full grounds).
- O3 → ideation assistance prompt @ prompt-compilation (§9.1) — aligns (prose-only block trimmed from a non-prose prompt; deterministic; docs lockstep).

## Deliverables (finding → ticket map)
| Finding | Ticket | Notes |
|---|---|---|
| O1 | `tickets/SECRETLINE-001.md` | Empty value-line omission in secrets section (extends `POVEMPTYLINE-001`) |
| O2 (#3/#4/#5-first) | `tickets/IDEAPROMPT-001.md` | Citation keys from full label, not truncated browse-label |
| O3 | `tickets/IDEAPROMPT-002.md` | Ideation-specific trimmed `<contradiction_prohibitions>` |
| O4 | — | No ticket; dormancy conforms (analysis answer) |

## Named assumptions
- Deliverable class is tickets (user directive). Namespace: `IDEAPROMPT-NNN` family for the ideation-prompt fixes (O2/O3 share that surface); separate `SECRETLINE-001` for O1 since `<secrets_and_reveal_constraints>` is shared by both prose and ideation prompts.
- Each compiler change carries its in-same-revision `docs/compiler-contract.md` (+ template doc) update and golden refresh.
