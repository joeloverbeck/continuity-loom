# SPEC-035 — Author-Focused Ideation

**Status**: ACTIVE
Parent: GitHub PRD #97
Implementation issues: GitHub #98 and #99
Governing authorities: `docs/FOUNDATIONS.md`, `docs/ACTIVE-DOCS.md`,
`docs/compiler-contract.md`, `docs/ideation-prompt-template.md`,
`docs/user-guide.md`, and
`reports/playtest-the-unbidden-oath-2026-07-18T145754Z.md`

## Purpose

Grounded Ideation can inspect the selected story authority and current
Generation Brief, but it cannot receive the author's temporary question about
that material. This leaves targeted uncertainty outside the declared request
and encourages either generic retries or temporary edits to canonical or
prompt-facing story state.

This specification adds one bounded, inspectable Author focus value to the
existing ideation request. The value is non-canonical, mounted-session request
context. It can shape responses only inside the slots already selected by the
deterministic ideation compiler. It never selects sources, changes grounding,
persists, or enters a prose workflow automatically.

This behavior conforms to the existing constitution. No
`docs/FOUNDATIONS.md` amendment is authorized or required.

## Terms And Ownership

- **Raw focus** is the current text held by the mounted `IdeateView`. It is
  browser component state only.
- **Normalized focus** is raw focus after JavaScript `String.prototype.trim()`.
  Missing focus normalizes to the empty string. Empty and whitespace-only focus
  are therefore the same blank request. Internal whitespace, line breaks,
  Unicode normalization form, and grapheme composition are otherwise preserved;
  the implementation does not apply NFC, NFKC, whitespace collapse, or another
  hidden rewrite.
- **Focus code-point count** is the number of Unicode code points in normalized
  focus, equivalent to `[...normalizedFocus].length`. It is not a UTF-16 code-unit
  count or a grapheme-cluster count. A normalized value with at most `500` code
  points is valid; `501` or more is invalid.
- **Current focused request** is the normalized focus together with the current
  mode, Count, Dormant slot, and explicit avoid list.
- **Current inspected preview** is the successful compile result owned by the
  latest request attempt for the current focused request. Its prompt and
  fingerprint are the only values eligible for send.

Focus normalization, counting, the `500` limit, and request validation belong
to the existing core ideation request contract in
`packages/core/src/compiler/ideation/types.ts`. Core exports that one contract
for server and browser consumers. Focus rendering belongs to the existing
`<ideation_slots>` renderer. The server's existing compile and ideate routes own
request parsing, prompt rebuilding, and the inspected-fingerprint gate. The
existing `IdeateView` and `IdeateControls` own raw mounted-session state,
validation presentation, latest-request ownership, and user actions.

No store, repository method, persistence call, migration, compatibility alias,
second focus field, second prompt section, or new route is introduced.

## Core Request Contract

The existing ideation request gains one optional field:

```ts
interface IdeationRequest {
  mode: "ideas" | "questions";
  count: number;
  dormantSlot: boolean;
  avoidList: string[];
  focus: string;
}
```

`focus` is optional at the untrusted input boundary and defaults to `""` in the
parsed request. The parsed `IdeationRequest` always exposes normalized focus.
The same core-owned schema, normalizer, count helper, maximum constant, and
author-readable validation message are used by compiler tests, server parsing,
and browser validation/count presentation.

Canonical normalization and validity cases are:

| Input | Normalized focus | Count | Result |
|---|---|---:|---|
| missing | `""` | `0` | valid blank request |
| `""` | `""` | `0` | valid blank request |
| spaces, tabs, or line breaks only | `""` | `0` | valid blank request |
| `"  door pressure  "` | `"door pressure"` | `13` | valid focused request |
| exactly 500 Unicode code points after trim | exact trimmed value | `500` | valid focused request |
| 501 Unicode code points after trim | exact trimmed value | `501` | invalid request |
| non-string focus supplied to an untrusted route | N/A | N/A | invalid request |

The author-facing limit error is `Author focus must be 500 Unicode code points
or fewer.` The technical server response retains the existing invalid-request
category and a `focus` issue path. A malformed or over-limit value is rejected
before credential lookup or provider transport.

Focus is excluded from slot assignment. `assignSlots` may parse the complete
request so it sees normalized controls, but it must not use focus for operator
eligibility, citation assignment, grounding bundles, dormant-record selection,
record ordering, reuse preference, requested-count shrinkage, or output parsing.

## Deterministic Prompt And Fingerprint Contract

Blank normalized focus renders no additional prompt bytes. For identical story
state, request controls, and versions, missing focus, empty focus, and
whitespace-only focus must preserve the existing prompt, prompt fingerprint,
slot assignment, grounding, operator eligibility, ordering, and intentional
count shrinkage byte-for-byte.

Nonblank normalized focus renders exactly once inside the existing
`<ideation_slots>` request header, immediately after the mode declaration and
before the slate/assignment disclosure:

```md
Mode: ideas. Render each slot as a premise-level possibility.
Author focus (non-canonical request context): <escaped normalized focus>
Use Author focus only to shape responses within assigned slots. It is not story fact, continuity authority, a new source, or permission to contradict compiled records.
Slate contains 5 grounded slots.
```

Question mode uses the existing question-mode declaration in the same position.
The focus value is escaped through the current core `escapeDataText` primitive,
so `&`, `<`, and `>` become `&amp;`, `&lt;`, and `&gt;`. The normalized value is
inserted at this one render site only. The static boundary instruction does not
repeat it.

A nonblank focus therefore changes prompt bytes and the prompt fingerprint, but
cannot change the `IdeationAssignment`. Deterministic replay of identical
snapshot, complete request, and versions produces identical prompt bytes,
fingerprint, and assignment.

## Compile And Send Contract

`POST /api/compile` keeps its existing ideation preview shape:

```ts
{
  promptKind: "ideation",
  ideationRequest: { mode, count, dormantSlot, avoidList, focus }
}
```

It parses the complete request through the core contract and returns the prompt
plus fingerprint only when ideation readiness and focus validation pass.
Malformed or over-limit focus returns the existing author-readable invalid
compile-request response with no prompt.

`POST /api/ideate` keeps the existing ideation request fields and adds the
fingerprint of the currently inspected preview:

```ts
{
  mode,
  count,
  dormantSlot,
  avoidList,
  focus,
  expectedPromptFingerprint
}
```

The server executes this order for every send attempt:

1. Parse the complete ideation request and require one nonblank string
   `expectedPromptFingerprint`.
2. Rebuild the current project snapshot and evaluate existing ideation
   readiness.
3. Compile the complete normalized request from current project state.
4. Compare the rebuilt fingerprint with `expectedPromptFingerprint`.
5. Only after an exact match, read provider credentials/settings and invoke the
   existing OpenRouter transport once.
6. Parse and quarantine the response through the existing result contract.

Missing or malformed fingerprints and malformed or over-limit focus are
invalid requests. A valid but mismatched fingerprint returns a `409`
`stale-ideation-prompt` response explaining that the author must inspect the
current prompt before sending. Every rejected path makes zero provider calls and
performs no automatic retry. A successful action makes the same single provider
call as today with the server-rebuilt prompt.

The server never accepts client-supplied prompt text. The rebuilt prompt and its
fingerprint remain the one send authority.

Existing ideation readiness warnings and blockers retain their current
severity, copy, and availability effects. Existing author-language missing-key,
provider, network, malformed-output, and citation outcomes also remain
unchanged; focus validation and stale-fingerprint rejection are additive
fail-closed gates rather than replacements for those outcomes.

## Browser State And Accessibility Contract

Ideate remains the entry point. Whenever an ideation preview can be requested,
the existing controls also show one optional multiline control labeled:

`What do you need ideas or questions about?`

Programmatically associated help states that Author focus is temporary,
non-canonical request context; it shapes grounded ideas or questions but does
not change story records or slot grounding. The control is associated with a
live normalized Unicode-code-point count such as `42 / 500`. When over limit it
is also associated with the accessible error `Author focus must be 500 Unicode
code points or fewer.` The error uses an alert/error relationship that does not
depend on color or visual placement. The field and all existing controls remain
keyboard operable.

The browser state matrix is:

| State | Visible outcome | Eligible actions |
|---|---|---|
| blank | Count is `0 / 500`; a byte-compatible generic preview may compile | existing controls and current-preview send |
| filled and valid | Exact normalized escaped value appears once in Prompt Inspector after a successful compile | existing controls and current-preview send |
| over limit | Live count and associated error are visible; prior preview is stale/ineligible | edit focus only; no preview-ready/send action |
| compiling | Current focus and count remain mounted; status says compilation is in progress; any older preview is ineligible | edit controls; no send |
| preview ready | Prompt Inspector shows the latest request's exact normalized focus and fingerprint | Get ideas/Get new slate and regeneration actions as otherwise ready |
| stale | A focus edit has synchronously invalidated the previous preview | local recompile/recovery only; no send |
| sending | Current focused request and inspected fingerprint are frozen for that invocation | no second send until completion |
| regenerated | Whole-slate or per-slot regeneration uses current focus, controls, avoid list, and inspected fingerprint | current result actions |
| cleared | Slate and keepers are cleared; focus and other request controls remain | fresh send after current preview is ready |
| remounted | Focus resets to blank; no prior focus is restored | generic preview lifecycle |

Every focus edit invalidates send eligibility before a compile result can be
used and starts a new local preview attempt when the value is valid. Compile
attempts receive monotonically increasing ownership tokens. Only the latest
attempt for the still-current mounted view may update Prompt Inspector or
restore send eligibility; success or failure from an older out-of-order request
is ignored.

Shortening an over-limit value to a valid value clears the error, starts a fresh
local compile, and restores send only after the latest preview succeeds. It does
not reload the page or invoke OpenRouter.

Focus survives mode changes, Count changes, Dormant slot changes, Get ideas,
Get new slate, Regenerate all, per-slot Regenerate, and Clear all for the same
mounted `IdeateView`. Mode/Count/Dormant changes may continue clearing the
avoid-list according to existing behavior but must preserve focus. Whole-slate
and per-slot regeneration attach the current slate avoid list alongside the same
current normalized focus and fingerprint. Unmounting and later remounting
Ideate creates a new blank focus state.

## Provider, Canon, Prose, And Storage Boundaries

Typing, normalization, counting, validation, compilation, fingerprinting, and
inspection remain localhost-only operations. Get ideas, Get new slate,
Regenerate all, and per-slot Regenerate remain the only user actions that may
invoke OpenRouter. Each eligible action makes one explicit request. This change
adds no automatic retry, background send, delayed send, provider fallback,
model-specific prompt fork, or second provider call.

The control, help, prompt label, and quarantine banner make these boundaries
visible:

- Author focus is non-canonical request context, never story state.
- Records and the active working set remain continuity authority.
- Focus is never imported, linked, prefilled, inferred, or derived from records,
  Private Notes, candidates, accepted prose, rejected or superseded output,
  prior prompts, keepers, reconciliation/hygiene output, or other assistance
  scratch.
- Focus and focused ideas never enter a prose prompt, story record, Generation
  Brief field, candidate, accepted output, or active-working-set membership
  automatically.
- Parsed ideas and malformed provider output retain the existing visibly
  quarantined scratch behavior and no apply/insert/use-as-prose action.

Focus and prompt text are excluded from the project store, browser local or
session storage, keeper payloads, story configuration, backup, migration,
export, accepted-segment rows or provenance, analytics, telemetry, and process
logs. No project-data or accepted-segment schema version changes.

## Synchronized Implementation And Completion Matrix

Issue #99 lands the following as one behavior revision after this active spec is
reviewed:

| Surface | Required change and proof |
|---|---|
| Core request contract | Add one optional `focus`, the shared trim/count/limit/error contract, 0/500/501 and astral-code-point coverage, and public exports for server/browser use. |
| Core prompt renderer | Render the escaped nonblank value once after mode; prove blank byte compatibility, deterministic replay, changed focused fingerprint, and unchanged assignments/shrinkage. |
| Core golden/property assurance | Preserve the blank frozen ideation prompt; add focused golden/request cases and property proof that focus never changes slot assignment. |
| Existing compile route | Parse focused requests, return exact inspected prompt/fingerprint, and reject malformed/over-limit focus without prompt bytes. |
| Existing ideate route | Require inspected fingerprint, rebuild the complete focused request, reject missing/stale/invalid input before credentials/transport, and retain one successful provider call. |
| Server route/e2e proof | Cover normalized focused preview, matching success with instrumented transport, stale/missing/invalid failures, zero transport on rejection, determinism, no persistence, quarantine, and secret/log exclusion. |
| Ideate controls/view | Add the associated label/help/count/error, immediate stale state, latest-request ownership, recovery, fingerprint send, all-action retention, Clear all preservation, and remount reset. |
| Browser/accessibility proof | Exercise the real production Ideate route and focused preview/recovery path; component regressions cover keyboard/DOM associations, out-of-order results, send gating, retention, Clear all, and remount. |
| `docs/compiler-contract.md` | Add the request source, normalization, exact render destination, empty behavior, assignment exclusions, fingerprint gate, lifecycle, storage exclusions, and contract-version change. |
| `docs/ideation-prompt-template.md` | Add the Author focus request field, prompt text/placement, browser lifecycle, and provider/canon/persistence boundaries. |
| `docs/user-guide.md` | Explain the optional control, temporary non-canonical status, live limit/recovery, local preview, inspected send, retention, Clear all, and remount behavior in author language. |
| `docs/ACTIVE-DOCS.md` | Register this active spec, then replace the active reference with its archived historical path after completion; update the version note. |
| Versions and frozen evidence | Bump template `1.9.0 → 1.10.0`, compiler `1.11.0 → 1.12.0`, and compiler contract `1.12.0 → 1.13.0`; synchronize every active version pin and frozen prompt expectation. |
| Canonical and robustness gates | Run focused tests, scoped core coverage, changed-source mutation handling, a final production browser smoke, `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`. |

## Completion And Archival

Before issue #99 closes:

1. Every contract and matrix row above must be implemented and mapped to exact
   acceptance evidence for PRD #97 and issues #98/#99.
2. This document must change to `**Status**: ✅ COMPLETED`.
3. An `## Outcome` section must record completion date, actual changes,
   deviations, and verification results without embedding its own commit SHA.
4. `docs/ACTIVE-DOCS.md` must stop presenting this file as active authority and
   point to
   `archive/specs/SPEC-035-author-focused-ideation.md` as completed historical
   evidence.
5. The spec must move to that archive path before the final implementation
   commit is staged.

## FOUNDATIONS Alignment

- §§4.1, 6.4, 6.6, 10, 20, and 26.1: focus and assistance output remain
  non-authoritative scratch; no record, brief, prose, accepted-output, note, or
  accepted-prose source path is added.
- §§4.4, 8, and 9.1: one explicit normalized request and one deterministic
  render site preserve inspectable assistance compilation and source selection.
- §§4.5, 11, 22, and 23: invalid or stale focused requests fail closed before
  transport, while the latest successful prompt remains inspectable and
  provider credentials stay secret.
- §§24 and 27: focus is local mounted state with explicit author-language
  labeling, accessible recovery, and no persistence or remote owner.
- §29: the change adds no branch, plot rail, automatic continuity mutation,
  hidden source, accepted-prose source, Private Notes source, probabilistic
  inclusion, prompt archive, warning gate, compatibility alias, migration,
  background provider action, additional provider call, secret/logging path, or
  remote data authority. It preserves explicit source disclosure, deterministic
  compilation, prompt inspection, quarantined assistance output, and the
  user-initiated transport boundary.

No ADR exists in the current repository, no authority exception is taken, and
the constitutional amendment procedure is not triggered.

## Out Of Scope

- Persisting focus in any project, browser, backup, migration, export, keeper,
  provenance, analytics, or log surface.
- Importing, linking, prefilling, or deriving focus from any continuity source,
  Private Note, prose/candidate/accepted output, prior prompt, keeper, or
  assistance scratch.
- Changing active-working-set membership, record rendering, citation keys,
  operator taxonomy or eligibility, grounding selection, dormant-slot rules,
  requested-count shrinkage, avoid-list semantics, response parsing, citation
  verification, or malformed-output quarantine.
- Promising provider relevance, creativity, count compliance, completeness, or
  response quality beyond transporting the inspected bounded request.
- Adding an automatic apply/insert path, retry, background request, provider
  fallback, second provider request, hidden transform, or provider-specific
  prompt fork.
- Changing OpenRouter settings, model refresh, prose generation/candidates,
  candidate acceptance, Accepted Segments, Record Hygiene, Segment
  Reconciliation, Generation Brief semantics, Records, navigation, Story
  Configuration, or Prompt Search.
- Addressing the originating report's other ticket/coverage candidates.

## Risks And Mitigations

- **Focus becomes hidden source selection:** slot-assignment equality and
  property tests compare every assignment field across focus values.
- **UTF-16 length diverges from the contract:** shared core code-point helpers
  and astral-character `500`/`501` fixtures drive browser, server, and tests.
- **Prompt injection breaks section boundaries:** the single value render uses
  the existing `escapeDataText` primitive and focused golden coverage.
- **Blank requests drift:** the frozen unfocused prompt and fingerprint remain
  exact byte baselines.
- **An older preview wins a race:** a latest-attempt ownership token guards
  every async compile result, and a deferred-response component regression
  resolves attempts out of order.
- **A stale browser request reaches OpenRouter:** the server rebuilds the
  complete request and compares its fingerprint before settings/credential
  access or transport.
- **Temporary context persists:** storage-boundary tests plus source review prove
  there is no repository, keeper, browser-storage, backup, export, migration,
  provenance, or logging write.
