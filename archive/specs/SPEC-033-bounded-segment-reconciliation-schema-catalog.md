# SPEC-033 — Bounded Segment Reconciliation Schema Catalog

**Status**: ✅ COMPLETED
Parent: GitHub PRD #91
Implementation issues: GitHub #92 and #93
Governing authorities: `docs/FOUNDATIONS.md`, `docs/compiler-contract.md`, `docs/segment-reconciliation-prompt-template.md`, `docs/story-record-schema.md`, and `docs/robustness-testing.md`

## Problem Statement

The Segment Reconciliation prompt currently renders two overlapping descriptions
of each registered record payload: generated JSON Schema and a parallel field
descriptor tree. For the current registry, the complete
`<record_creation_schema_catalog>` section is 136,328 UTF-16 code units even
when the reconciliation snapshot contains no records. That fixed payload cost
dominates otherwise small reconciliation prompts.

The catalog cannot be made smaller by omitting sources or constraints. Segment
Reconciliation still needs every registered creation shape, every selected
source record, the complete latest accepted segment, all nineteen allowed brief
fields, and every required reference stub. The safe change is therefore a new
single prompt-facing grammar that removes representational duplication while
remaining deterministic, complete, inspectable, and fail closed.

## Approach

Replace the JSON-Schema-plus-field-descriptor pair with one line-oriented
catalog, `segment_reconciliation.schema_catalog.v1`. The existing
`schema-catalog.ts` module remains the sole catalog owner. It derives the
catalog from `recordTypes`, `recordTypeRegistry`, each registered Zod payload
validator, and the declared lifecycle and reference metadata. The compiler
renders that catalog directly; it does not retain either old prompt-facing form,
a compatibility alias, or a second handwritten record/type/enum vocabulary.

The local proposal parser remains authoritative. The catalog helps the model
produce candidate payloads, but creation proposals still pass reference-token
resolution and `parseRecordPayload` before they can be shown as valid scratch.

## Compact Catalog Grammar

The catalog uses LF line endings and this fixed structure:

```text
catalog "segment_reconciliation.schema_catalog.v1" contract=<JSON string>
uuid_pattern=<canonical JSON string for the one registered UUID validator pattern>
legend <fixed grammar legend>
record <JSON string>
repository_field <JSON path> managed=repository output=forbidden
field <JSON path> <presence> <shape> [default=<canonical JSON>] [managed=repository output=forbidden] [ref=<cardinality>:<JSON role>-><JSON target list>] [deactivate=<JSON value list>]
...
lifecycle none | lifecycle projected values=<JSON value list> deactivate=[]
end
```

There is one `record` block per registered type and one `field` line per schema
path. A path occurs once within its record block. Reference, lifecycle,
repository-management, forbidden-output, default, and requiredness facts attach
to that owning field line rather than repeating the field in parallel tables.
When the repository record id is deliberately outside a type's payload
validator, the block renders one `repository_field "id"` line instead; it must
not invent an `id` payload field. A type never renders both forms for the same
repository-managed id.
Types with no lifecycle field and no projected lifecycle vocabulary render the
single structural line `lifecycle none`. A type such as FACT whose registry
projects a legal status without storing a lifecycle payload field renders one
`lifecycle projected` line with that vocabulary and no deactivation
destinations. Types with a lifecycle field place the legal values in that
field's shape and its allowed deactivation destinations in the same field line.

The fixed tokens are:

- `!` — required in the creation payload;
- `?` — optional because the validator accepts omission, including a field with
  a registered default;
- `text(min=<n>)` — the registered string/prose shape; this grammar does not
  invent a short-text versus prose constraint that the payload validator does
  not enforce;
- `uuid` — the exact registered UUID format and pattern; creation output still
  uses declared `$record:` and `$new:` reference tokens before local resolution;
- reference cardinality is `one`, `many`, or `one_or_many`; the mixed value is
  required when one field accepts either a single reference or a reference list;
- `boolean` and `number` — their corresponding scalar shapes;
- `literal(<canonical JSON>)` and `enum(<canonical JSON list>)` — literal and
  vocabulary constraints in validator declaration order;
- `union(<shape>|...)` — alternatives in validator declaration order;
- `list(<shape>)` — a list and its item shape;
- `object(closed)` — a nested object with undeclared keys forbidden.

For a list of nested objects, the list field renders as
`list(object(closed))`, and its child paths render with `[]`, for example
`clue_carriers[].clue_text`. Nested objects likewise render their parent
`object(closed)` path and each descendant path. This keeps every structural
state and nested path explicit without recursively repeating whole object
schemas on every line.

Canonical JSON supplies every record type, path, role, target type, literal,
enum value, default, lifecycle destination, and contract version. Before prompt
rendering, `<`, `>`, and `&` in those JSON fragments are escaped as `\u003c`,
`\u003e`, and `\u0026`. No story-controlled value becomes a heading or grammar
token. The UUID pattern is represented once in the catalog header; every
`uuid` field token refers to that exact pattern. Different UUID patterns in one
registry, or an additional UUID constraint such as `minLength` that the `uuid`
token cannot express, are unrepresentable and fail closed.

## Deterministic Derivation And Ordering

Ordering is fixed as follows:

1. Record blocks follow `recordTypes` registry order.
2. Fields use depth-first pre-order over the registered validator's object
   property declaration order. A parent object/list path precedes descendants.
3. Union alternatives, enum/literal values, and registered defaults retain
   validator declaration order and value.
4. Reference target types retain declared reference-metadata order.
5. Lifecycle legal values and deactivation destinations retain their declared
   order.

The renderer reads no project state, wall clock, provider state, accepted prose,
records, or UI state. Identical registry/validator/metadata input and the same
contract version produce identical catalog bytes. The catalog remains part of
the complete prompt fingerprint, prompt length, and token estimate.

## Completeness And Fail-Closed Rules

The catalog builder must reject rather than omit or approximate any of these
conditions:

- a registry-order entry without a registry definition, or a registry
  definition not covered by the requested ordered type set;
- a payload root that is not a closed object;
- a missing, duplicate, or unrendered schema path;
- an unknown or unsupported JSON-Schema keyword or scalar/object/list/union
  shape emitted by a registered validator;
- an object whose `additionalProperties` value is not `false`;
- a required path missing from the object properties, or a requiredness/default
  state the grammar cannot express;
- a reference-bearing path without cardinality, role, or at least one permitted
  target type;
- lifecycle metadata whose field is missing, whose legal values disagree with
  the registered field vocabulary, or whose deactivation destination is not a
  legal value;
- a repository-managed or forbidden output field that is neither attached to
  its payload path nor represented by the explicit repository-envelope marker;
- any field, enum, literal, default, structural state, reference marker,
  lifecycle marker, or management marker that would need a second prompt-facing
  representation to remain complete.

The supported schema-key vocabulary is explicit and narrow: root `$schema`,
`type`, `properties`, `required`, `additionalProperties`; and field-level
`type`, `properties`, `required`, `additionalProperties`, `items`, `anyOf`,
`enum`, `const`, `default`, `minLength`, `format`, and `pattern`. Support for a
future constraint requires extending this grammar and its semantic coverage
tests in the same revision as the registry change. Unknown keywords do not
silently disappear.

The structural vocabulary above is generic compiler code. Record types, field
paths, enum values, defaults, reference roles/targets, and lifecycle values are
always derived; none may be duplicated in a handwritten prompt catalog.

## Size Fixture And Regression Contract

The reproducible zero-record fixture is a
`SegmentReconciliationSnapshot` with:

- request `latest` + `active_working_set`;
- accepted segment id `catalog-baseline-segment`, sequence `1`, fixed timestamp
  `2026-07-17T00:00:00.000Z`, and fixed non-empty text;
- all nineteen `RECONCILIATION_BRIEF_FIELD_PATHS` rendered as `missing`;
- empty generation-brief draft, record list, and reference-stub list; and
- the current template/compiler/contract versions.

Measurement extracts the complete section, including opening and closing tags,
from the compiled prompt and uses JavaScript `string.length`, matching prompt
metadata's UTF-16 code-unit measure.

- Pre-change section baseline: `136328` UTF-16 code units.
- Maximum permitted post-change section: `68164` UTF-16 code units (50 percent
  of the baseline).
- Named post-change ceiling:
  `SEGMENT_RECONCILIATION_CATALOG_SECTION_CEILING_UTF16 = 18696`.

Issue #93 sets that constant to the measured compact section length, not merely
to the 50-percent threshold. The regression test requires the current
section to be at or below both the named measured ceiling and `68164`. A same-
change schema addition may deliberately raise the named ceiling only when the
semantic coverage matrix proves the added constraints and the section remains
within the parent PRD's 50-percent bound; otherwise the change requires a new
approved specification.

## Unchanged Runtime Boundaries

- Segment Reconciliation remains available only through its existing route
  after an accepted segment exists, in explicit active-working-set or
  whole-project scope.
- Compile, Refresh, inspection, search, Copy, scope selection, keep, clear, and
  navigation remain local and make no provider call.
- Analyze remains the sole provider action. It rebuilds from current stored
  source, requires the inspected fingerprint, and sends exactly the rebuilt
  prompt only on a match.
- Malformed requests, catalog-generation failure, stale source, missing key, and
  oversize complete prompts fail before transport. There is no trimming,
  ranking, summarization, excerpting, batching, fallback, retry, model
  substitution, or project mutation.
- The complete latest accepted segment, all nineteen brief fields with explicit
  state, every qualifying full record, required minimal reference stubs,
  citations, source disclosure, and strict output contract remain byte-visible.
- Accepted prose remains bounded non-authoritative evidence. Records remain
  continuity authority. Parsed and malformed proposals remain quarantined,
  non-canonical, non-persistent scratch with no apply, prefill, export, migration,
  or automatic prompt reuse.
- Request and response roles, output schema, parser behavior, persistence, and
  project-store schema do not change.

## Synchronized Implementation Matrix

Issue #93 lands the following as one revision:

| Surface | Required change |
|---|---|
| `packages/core/src/compiler/reconciliation/schema-catalog.ts` | Replace the overlapping catalog pair with the grammar model and deterministic renderer; add strict representability checks and the named size ceiling. |
| `packages/core/src/compiler/reconciliation/compile-segment-reconciliation-prompt.ts` | Render the one compact catalog representation. |
| `packages/core/src/version.ts` | Apply the next minor template/compiler/contract versions and update every active pin/golden. |
| `docs/compiler-contract.md` | Replace the JSON-Schema mapping with this grammar, ordering, size, and failure contract. |
| `docs/segment-reconciliation-prompt-template.md` | Make this grammar the catalog authority and preserve every source/output boundary. |
| `docs/story-record-schema.md` | Replace the parallel-encoding description with the single grammar and completeness rule. |
| `docs/robustness-testing.md` | Map compact-catalog semantic/size coverage into P3 and retain pre-activation report-and-defer behavior. |
| Core catalog and golden tests | Prove registry alignment, every semantic shape, exact-once field paths, fail-closed future additions, escaping, deterministic bytes/fingerprints, source preservation, baseline reduction, and the named ceiling. |
| Server route regressions | Prove compile returns compact complete bytes and truthful metadata without transport; Analyze sends the exact rebuilt prompt only after fingerprint match; stale/malformed/oversize paths remain transport-free and non-mutating. |
| Prompt Inspector and Segment Reconciliation component regressions | Prove exact compact bytes and updated length/token metadata remain readable and accessible while existing actions and quarantine stay unchanged. |
| Assurance | Run scoped core coverage, the P3 changed-source report-and-defer workflow, `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`. |

No `docs/FOUNDATIONS.md` amendment is expected or authorized. If conformance
would require one, implementation stops and returns to the steward under the
constitutional amendment procedure.

## FOUNDATIONS Alignment

- §§9.1 and 10: the one latest accepted segment remains the sole bounded prose
  evidence exception; compacting the schema catalog neither widens accepted-
  prose access nor grants it authority.
- §22: the exact compiled prompt and truthful metadata remain inspectable; no
  prompt archive is added.
- §26.1: assistance output remains opt-in, provenance-bearing, quarantined, and
  ephemeral.
- §28.2: size reduction removes representation duplication only; no complete
  declared source is silently lost.
- §29: the change adds no branches, automatic continuity mutation, hidden
  source selection, token-budget eviction, provider transform, persistence, or
  secret exposure path.

## Verification

1. Review this spec and `docs/ACTIVE-DOCS.md` before production edits.
2. Run red-first catalog and compiler-golden tests at the ratified core seams.
3. Run unchanged-boundary parser, server route/e2e, and component regressions.
4. Run `npm run test:coverage:core`.
5. Run the P3 changed-source mutation-scope command and retain its documented
   report-and-defer result while the pillar remains pre-activation.
6. Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.
7. Compare the final diff against FOUNDATIONS §29; any exception blocks closure.

Production browser smoke is N/A for this change because entry points,
navigation, controls, keyboard behavior, accessible names, route shapes,
browser-consumed API shapes, fixtures, and action paths remain unchanged. The
existing component seams are the required browser-visible regression proof.

## Out Of Scope

- Any source selection, ranking, compression, truncation, or eviction.
- Any change to the accepted-segment, nineteen-field, record-scope, reference-
  stub, proposal, parser, echo-guard, transport, UI-quarantine, or persistence
  contracts.
- Any compatibility period containing both catalog encodings.
- Any new provider action, model choice, retry, fallback, or response repair.
- Any canonical apply/prefill/create/deactivate workflow.
- Accepted-Segment Generation Context Coherence or other deferred playtest work.

## Risks And Mitigations

- **Semantic loss hidden by smaller bytes:** exact-once path and shape coverage,
  registry equality, unsupported-key failures, and parser round-trip tests.
- **Schema drift:** registry-derived values only; future unrepresentable
  constraints fail closed and require same-change grammar/tests.
- **Misleading size metadata:** measurement uses the compiled section's UTF-16
  length, and route/component tests consume compiler metadata for those bytes.
- **Parallel authority reintroduced later:** the old JSON Schema and descriptor
  payloads are removed from prompt bytes with no alias; this spec is the single
  grammar authority.

## Outcome

- Completion date: 2026-07-17.
- What changed: Segment Reconciliation now renders one deterministic,
  registry-derived `segment_reconciliation.schema_catalog.v1` representation.
  The catalog preserves mixed single-or-list references as `one_or_many`,
  rejects UUID constraints that its compact token cannot express, and locks the
  complete zero-record section to a named ceiling of `18696` UTF-16 code units.
- Deviations: no material scope deviation. Review refined the ratified grammar
  within its implementation-discretion boundary by naming mixed reference
  cardinality and explicitly failing closed on additional UUID constraints.
- Verification: focused catalog and golden coverage passed with 23 tests; the
  scoped core coverage gate cleared the repository's 95 percent threshold; the
  P3 changed-source workflow returned its documented pre-activation defer; and
  the root lint, typecheck, test, and build gates passed on the implementation
  tree.
