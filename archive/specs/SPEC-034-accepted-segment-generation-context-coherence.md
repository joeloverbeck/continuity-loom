# SPEC-034 — Accepted-Segment Generation Context Coherence

**Status**: ✅ COMPLETED
Parent: GitHub PRD #94
Implementation issues: GitHub #95 and #96
Governing authorities: `docs/FOUNDATIONS.md`, `docs/ACTIVE-DOCS.md`,
`docs/compiler-contract.md`, `docs/story-record-schema.md`,
`docs/validation-rule-inventory.md`, `docs/stress-suite.md`,
`docs/stress-coverage-matrix.md`, `docs/demo-blocker-recipes.md`, and
`docs/user-guide.md`

## Purpose

The saved Generation Brief may contain a structurally valid
`generation_context` that contradicts the accepted-segment archive. An author
can accept a first segment while the brief still says `first_segment`, or delete
the final accepted segment while the brief still says
`continuation_after_accepted_segment`. The current implementation preserves an
explicit saved value and therefore lets readiness evaluate the wrong lifecycle
requirements.

This specification makes accepted-segment count the single lifecycle fact while
preserving the saved Generation Brief as author-owned draft data. A contradiction
is saveable but not generation-ready. The system derives the required context,
reports one actionable blocker, evaluates every other deterministic check using
the required context, and waits for the author to repair the existing selector
and explicitly save.

This behavior conforms to the existing constitution. No `docs/FOUNDATIONS.md`
amendment is authorized or required.

## Terms And Ownership

- **Saved context** is the optional value currently stored at
  `generationSession.generation_validation_focus.validation_focus_tags.generation_context`.
  It remains draft data owned by the author.
- **Accepted-segment count** is the number of rows in the existing accepted
  segment archive. Segment text, metadata, provenance, candidates, reminders,
  and assistance output are not inputs to lifecycle derivation.
- **Required context** is `first_segment` when accepted-segment count is zero and
  `continuation_after_accepted_segment` when the count is one or greater.
- **Coherent** means that the saved context is absent or equals the required
  context. An absent value is coherent because readiness supplies the required
  deterministic non-story default; it is not persisted by a read.
- **Effective readiness context** is always the required context. It is the one
  value used by validation, deterministic compilation, Prompt Preview,
  user-supplied candidate intake, Generate, and provider sending.

The pure derivation and coherence model belong to `packages/core` beside the
existing generation-brief draft normalization. The server snapshot builder owns
the read of accepted-segment count and supplies the derived coherence metadata
to core validation. The existing Generation Brief route owns the browser-facing
coherence response. No repository method, table, column, migration, or
acceptance-side persistence call is added.

## Canonical State Matrix

| Accepted-segment count | Saved context | Required context | Coherent | Effective readiness context | Persisted draft effect |
|---:|---|---|---|---|---|
| `0` | missing | `first_segment` | yes | `first_segment` | none |
| `0` | `first_segment` | `first_segment` | yes | `first_segment` | none |
| `0` | `continuation_after_accepted_segment` | `first_segment` | no | `first_segment` | unchanged until explicit save |
| `1+` | missing | `continuation_after_accepted_segment` | yes | `continuation_after_accepted_segment` | none |
| `1+` | `continuation_after_accepted_segment` | `continuation_after_accepted_segment` | yes | `continuation_after_accepted_segment` | none |
| `1+` | `first_segment` | `continuation_after_accepted_segment` | no | `continuation_after_accepted_segment` | unchanged until explicit save |

The nonzero row covers one and multiple accepted segments. Tests must exercise
zero, one, and multiple counts so that the zero/nonzero boundary and stable
nonzero state are both explicit.

## Lifecycle Transition Matrix

| Operation | Count transition | Required-context outcome | Saved-context outcome |
|---|---:|---|---|
| Accept the first segment | `0 → 1` | changes from `first_segment` to `continuation_after_accepted_segment` | unchanged; a saved `first_segment` becomes mismatched |
| Accept an additional segment | `1+ → 2+` | remains `continuation_after_accepted_segment` | unchanged; a matching continuation stays coherent |
| Delete a non-final segment | `2+ → 1+` | remains `continuation_after_accepted_segment` | unchanged; a matching continuation stays coherent |
| Delete the final segment | `1 → 0` | changes from `continuation_after_accepted_segment` to `first_segment` | unchanged; a saved continuation becomes mismatched |

Project open, Generation Brief reads, readiness reads, validation, compilation,
blocked Generate, reminder display, and Segment Reconciliation do not constitute
lifecycle transitions and never alter the saved context.

## Canonical Generation Brief Response

`GET /api/generation-brief` keeps its existing route and returns exactly one
top-level coherence object in addition to the saved session:

```ts
type GenerationContext = "first_segment" | "continuation_after_accepted_segment";

interface GenerationBriefResponse {
  ok: true;
  session: GenerationSessionDraft;
  generationContext: {
    savedValue: GenerationContext | null;
    requiredValue: GenerationContext;
    acceptedSegmentCount: number;
    coherent: boolean;
  };
}
```

`savedValue` is `null` only when the stored draft omits context. `requiredValue`
is always derived from accepted-segment count. `coherent` follows the state
matrix above. The response must not also expose `defaults.generation_context`,
`value`, `source`, a legacy alias, a persisted-derived value, or another
single-value property that could become a competing lifecycle authority.

`PUT /api/generation-brief` remains the ordinary explicit draft save. It accepts
the existing enum values and returns the normalized saved session. It does not
need a separate repair endpoint, one-click fix, transition action, or migration.

## Readiness And Diagnostic Contract

The server computes coherence from the saved draft and accepted-segment count
before constructing the validation snapshot. The snapshot's generation context
is the required value even when the saved value contradicts it. Consequently,
all existing deterministic checks see the truthful archive-derived lifecycle:

- a stale saved `first_segment` cannot suppress continuation handoff checks;
- a stale saved continuation cannot retain continuation-only requirements after
  the final segment is deleted; and
- normalization still supplies exactly one effective context, so the mismatch
  must not create `focus-tag-count-invalid`.

A contradictory saved value adds exactly one blocker:

- diagnostic code: `generation-context-accepted-segment-mismatch`;
- affected field:
  `generationSession.generation_validation_focus.validation_focus_tags.generation_context`;
- title: `Generation context does not match accepted segments`;
- summary template:
  `Generation context is saved as {saved author label}, but the accepted-segment archive contains {count phrase} and requires {required author label}.`;
- why it matters: readiness and prompt compilation must use the lifecycle proved
  by the accepted-segment archive;
- fastest fix:
  `Choose {required author label} in Generation Brief and save the draft.`;
- action: focus the existing Generation context selector.

Primary copy uses `First segment` and `Continuation after accepted segment`, not
raw enum spellings. The technical details retain the stable code, raw field path,
saved value, required value, and accepted-segment count. The same derived
readiness object and copy render on Generation Brief, Prompt Preview, and
Generate.

The mismatch blocker is additive. Other applicable blockers, including the
continuation handoff blocker, remain visible because they evaluate the required
context. Warnings remain non-blocking.

## Availability, Prompt Freshness, And Provider Boundary

The existing pages and actions remain the only entry points:

| Surface or action | Coherent draft | Mismatched draft |
|---|---|---|
| Generation Brief read/edit | available | available |
| Save Generation Brief | available | available |
| Readiness checklist | current result | mismatch plus every other applicable blocker |
| Prompt Preview / deterministic compile | available when no other blocker exists | blocked with no prompt bytes |
| Write or paste candidate | available only after a current prompt is compiled | unavailable; no candidate created |
| Generate | available only when prompt and provider readiness pass | unavailable |
| OpenRouter transport | only after explicit Generate | zero calls |

An inspected prompt becomes unusable when archive state changes. While the
saved context is mismatched, Preview and Generate withhold or discard stale
prompt display and expose no compiled prompt bytes. Recovery requires this
sequence on one project instance:

1. The author activates the readiness action and focus reaches the existing
   Generation context selector.
2. The author chooses the displayed required value.
3. The author invokes the ordinary **Save Generation Brief** action.
4. A fresh Generation Brief/readiness read reports coherence.
5. A new deterministic compilation produces the only prompt eligible for
   inspection, user-supplied candidate intake, Generate, or provider sending.

No coherence read or repair action contacts OpenRouter. Generate remains the
sole provider action.

## User-Visible And Accessibility Contract

Generation Brief displays, adjacent to the existing selector:

- Saved context, or `Not saved`;
- Required context in author language;
- accepted-segment count;
- status `Coherent` or `Mismatch`; and
- the mismatch explanation and manual save instruction when applicable.

The selector has the accessible name `Generation context`. Readiness actions on
all three pages use the label `Edit generation context`. The action is keyboard
operable, routes to the existing Generation Brief page when necessary, scrolls
the field into view, and places DOM focus on the selector. Draft Save stays
available during mismatch. After explicit save and reload, the status and shared
blocker clear deterministically; unrelated blockers remain truthful.

The regression uses the existing Generation Brief and cross-page readiness
component seams. It does not add a browser framework or a separate full-journey
test suite. Final implementation proof also includes one bounded production
browser smoke of the real routed repair action.

## No-Mutation And Persistence Contract

The following operations may read accepted-segment count and saved context but
must leave the Generation Brief's stored bytes unchanged:

- first or additional segment acceptance;
- final or non-final segment deletion;
- project open;
- `GET /api/generation-brief`;
- readiness and validation;
- deterministic compilation and Prompt Preview;
- blocked Generate and provider preflight; and
- Segment Reconciliation or reminder activity.

Only the existing explicit Generation Brief save may change the saved context.
Accepted-segment rows and generation-session rows remain separate transaction
boundaries. The implementation introduces no project-schema migration, accepted-
segment schema change, enum change, export field, provenance field, compatibility
alias, persisted accepted count, persisted required context, or automatic prose-
derived state.

Existing projects open normally. A contradictory saved value is not malformed
and is not rewritten during open; it becomes an actionable readiness blocker.

## Accepted-Prose Firewall

Lifecycle derivation reads only accepted-segment count. It must not read, copy,
parse, summarize, embed, log, send, compare, or derive a Generation Brief value
from accepted-segment text. A unique sentinel stored as accepted prose must be
absent from:

- validation diagnostics and readiness JSON;
- Generation Brief coherence metadata;
- compiled prose prompts and prompt fingerprints' source material;
- process logs; and
- OpenRouter request bodies.

Segment Reconciliation retains its existing narrow latest-segment assistance
source. This specification neither changes nor reuses that exception.

## Synchronized Implementation And Completion Matrix

Issue #96 lands these changes as one behavior revision after this active spec is
reviewed:

| Surface | Required change and proof |
|---|---|
| `packages/core` generation-brief draft/readiness | Add one pure coherence derivation; missing and matching stay coherent; contradictory readiness uses required context at counts `0`, `1`, and multiple. |
| Core validation and readiness | Add the stable mismatch blocker, exact field target, dynamic author-language evidence, focus action, and inventory drift coverage; retain all other required-context diagnostics without false focus-count errors. |
| Server snapshot builder | Read existing accepted-segment count once, preserve saved draft, populate coherence metadata, and place required context in the validation snapshot. |
| Existing Generation Brief route | Replace the misleading defaults object with the one canonical `generationContext` response and no alias. |
| Existing compile/readiness/generate/accepted routes | Prove one gate blocks prompt bytes, user-supplied candidate intake, Generate, and provider calls; acceptance/deletion never mutate the brief. |
| Repository-boundary and lifecycle tests | On one project instance prove first acceptance, additional acceptance, non-final deletion, final deletion, explicit repair, reload, fresh compile, unchanged generation-session persistence, and separate accepted rows. |
| Generation Brief component | Show saved/required/count/status, accessible selector, draft Save availability, direct focus, explicit save, and reload recovery. |
| Cross-page readiness components | Render the same blocker, target, action, count, technical evidence, and repair on Generation Brief, Prompt Preview, and Generate; withhold stale prompt UI. |
| Accepted-prose firewall | Use one unique sentinel to prove count-only behavior and absence from diagnostics, coherence metadata, prose prompt, logs, and provider requests. |
| `docs/compiler-contract.md` | Specify required-context normalization, mismatch gate, no prompt bytes, and fresh-compilation recovery. |
| `docs/story-record-schema.md` | Distinguish saved, required, and effective context; preserve the draft/readiness and no-migration boundaries. |
| `docs/validation-rule-inventory.md` | Register `generation-context-accepted-segment-mismatch` with severity, target, constitutional basis, and coverage. |
| `docs/stress-suite.md` | Expand Cases 28 and 29 into the symmetric missing/matching/mismatched zero/one/multiple lifecycle matrix and explicit repair sequence. |
| `docs/stress-coverage-matrix.md` | Map Cases 28 and 29 to core, server, component, firewall, and browser evidence. |
| `docs/demo-blocker-recipes.md` | Add a normal-edit saveable-mismatch recipe with blocked Preview/Generate and explicit save recovery. |
| `docs/user-guide.md` | Explain saved versus required context, mismatch blocking, manual selector/save recovery, accepted-prose exclusion, and zero provider calls before Generate. |
| Assurance | Run focused red/green seams, a production browser smoke, `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`. |

## Completion And Archival

Before issue #96 closes:

1. Every matrix row and synchronized surface above must be implemented and
   mapped to exact acceptance evidence.
2. This document must be changed to `**Status**: ✅ COMPLETED`.
3. An `## Outcome` section must record completion date, actual changes,
   deviations, and verification results without embedding its own commit SHA.
4. `docs/ACTIVE-DOCS.md` must stop presenting this file as active authority and
   point to `archive/specs/SPEC-034-accepted-segment-generation-context-coherence.md`
   as completed historical evidence.
5. The spec must move to that archive path before the implementation commit is
   staged.

## FOUNDATIONS Alignment

- §§3, 4.4, 4.5, 6.3, 8, and 11: accepted-segment count supplies one
  deterministic non-story default; contradictory drafts remain saveable while
  prompt compilation and generation fail closed.
- §§4.1, 10, 20, and 21: accepted prose remains output, not canon or future
  prose-prompt context; the author explicitly changes the only saved field.
- §§22 and 23: no prompt bytes or provider request exist while mismatched, and
  a fresh inspected prompt precedes the sole explicit Generate action.
- §§24 and 27: project data stays local, the existing editor remains canonical,
  and the same author-language recovery appears across all three readiness
  pages.
- §29: the change adds no autonomous mutation, hidden prose inference,
  compatibility authority, branch, plot rail, override, warning gate, migration,
  remote owner, or secret/logging path. It directly enforces §29.5's requirement
  that generation context derive from accepted-segment count rather than a
  UI-only default.

## Out Of Scope

- Automatic context changes during acceptance, deletion, open, read,
  validation, compilation, reminder activity, or reconciliation.
- A repair endpoint, one-click fix, background transition, compatibility alias,
  duplicate route field, or persisted required context/count.
- New context enum values, project/accepted-segment schema migrations, export or
  provenance changes, and accepted-prose-derived fields.
- Any change to Segment Reconciliation sources, suggestions, application
  boundaries, or reminder acknowledgement.
- Provider choice, retry/fallback policy, prompt persistence, candidate
  persistence, or unrelated playtest findings.

## Risks And Mitigations

- **Saved value accidentally overwritten:** repository-byte assertions surround
  every lifecycle/readiness/compile/blocked-generate operation.
- **Mismatch hides continuation requirements:** snapshots always use required
  context, and tests require the mismatch plus the continuation handoff blocker.
- **Duplicate lifecycle authority:** one core derivation supplies snapshots and
  the route; the legacy defaults response is removed without an alias.
- **Stale prompt survives a transition:** mismatch blocks compilation entirely
  and recovery computes a fresh inspected prompt and fingerprint only after explicit save; identical source bytes may truthfully produce the same deterministic fingerprint.
- **Accepted prose leaks into lifecycle logic:** sentinel coverage spans
  diagnostics, metadata, prompt, logs, and provider requests.

## Outcome

Completed on 2026-07-18.

- Added one core generation-context coherence derivation, snapshot metadata, the
  prose-only `generation-context-accepted-segment-mismatch` blocker, and
  required-context evaluation for all other readiness checks.
- Replaced the legacy Generation Brief defaults response with the canonical
  saved/required/count/coherent response and rendered that state beside the
  existing accessible selector.
- Made successful candidate acceptance refresh readiness and compilation so a
  first-acceptance mismatch immediately withholds stale prompt and candidate
  actions while retaining the acceptance notice.
- Added matrix, route, lifecycle/repository, provider-spy, accepted-prose
  firewall, shared-page, accessibility, and prompt-freshness regression proof.
- Synchronized the compiler, schema, validation, stress, demo, and user-guide
  authorities named by this spec.

Deviations: none. The risk wording now clarifies that a fresh deterministic
compile may reproduce the same fingerprint when its prompt source bytes are
unchanged; freshness means recomputation after repair, not forced byte churn.

Verification passed: `npm run lint`, `npm run typecheck`, `npm test` (171 files,
1812 tests), and `npm run build`, plus the focused two-direction lifecycle
capstone and three-page browser-component coverage.
