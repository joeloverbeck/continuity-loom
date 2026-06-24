# SPEC-032 — Segment Reconciliation Assistance Prompt and Quarantined Review Page

**Status**: COMPLETED
Phase: post-v1 feature spec; adds a third assistance prompt class (`segment-reconciliation`) plus its menu-accessible review page — gated on a sign-off-required `docs/FOUNDATIONS.md` amendment (Deliverable 0)
Depends on: the SPEC-007 deterministic prose compiler and SPEC-021/022 ideation compiler, the SPEC-027/030 record-hygiene assistance surface (`/api/record-hygiene` compile/analyze pair, `RecordHygieneView`, session keepers, dual-scope precedent), the SPEC-011/020 accepted-segment archive and latest-access disclosure, the SPEC-012 durable-change reminder workflow, the record registry (`recordTypeRegistry` / `parseRecordPayload` / `projectRecordStatus` / `extractRecordReferences`), the saved generation-brief draft shapes, the OpenRouter client, and the `@loom/core` import-boundary rule
Governing authority: `docs/FOUNDATIONS.md` (constitutional — this spec proposes an amendment to it); `docs/compiler-contract.md` (domain authority for prompt compilation — extended with a new §2.3 source profile and §3.4 section order); `docs/story-record-schema.md` (domain authority for the brief projection and registry-derived schema catalog)
Primary authority docs: `docs/FOUNDATIONS.md`, `docs/ACTIVE-DOCS.md`, `docs/compiler-contract.md`, `docs/story-record-schema.md`
Supporting authorities: `docs/story-record-hygiene-prompt-template.md`, `docs/ideation-prompt-template.md`, `docs/prompt-template.md`, `docs/prompt-template-rationale.md`, `docs/validation-rule-inventory.md`, `docs/stress-suite.md`, `docs/stress-coverage-matrix.md`, `docs/user-guide.md`, `docs/archival-workflow.md`, `tickets/README.md`, `tickets/_TEMPLATE.md`, `README.md`
Source proposal: `reports/segment-reconciliation-assistance-change-proposal.md` (the normative design; this spec is its actionable conversion and does not restate every clause — §§3–8, §11, §12 of the report remain the detailed authority a downstream ticket may cite)

> Section style note: this file uses the canonical `specs/` section set
> (Problem Statement / Approach / Deliverables / FOUNDATIONS Alignment /
> Verification / Out of Scope / Risks & Open Questions) that the `reassess-spec`
> and `spec-to-tickets` skills parse. It mirrors the SPEC-027 / SPEC-030 / SPEC-031
> hand-authored preamble style (status/phase/authority blocks, premise-verification
> + scope-decisions blocks) and deliberately omits the source proposal's
> external-generator evidence-ledger scaffolding (`Target commit:` /
> fetch-provenance / the Appendix A raw-URL acquisition ledger), because this spec
> was authored locally against the working tree (HEAD `24d5d2b`), not fetched at an
> exact commit — matching the SPEC-024/025/026/027 precedent.

---

## Brainstorm Context

- **Original request:** "Analyze carefully `reports/segment-reconciliation-assistance-change-proposal.md`, and create a spec in `specs/*` with the actionable work, aligned with `docs/**`. If foundational document amendments are warranted, include them in the spec as well."
- **Source report shape:** a 2,211-line research-backed change proposal (18 numbered sections + a repository-evidence register, an external-research register, an acquisition ledger, and a self-check appendix). It returns a committed verdict — ship a third top-level assistance surface, **Segment Reconciliation** — and supplies a fully-specified normative design: new source profile, latest-segment-only request, saved-draft nineteen-field projection, dual record scope, registry-derived schema catalog, deterministic prompt section order, strict pure-JSON output contract, reference-token grammar, verbatim-echo firewall, full-response quarantine, UI quarantine, reminder CTA, and the **exact `docs/FOUNDATIONS.md` amendment wording (§10) plus a same-revision documentation/version/test cascade (§11, §12)**. It prescribes its own decomposition (§13 sequence) and nominates itself for SPEC-032.
- **Triage shape — unified proposal as source report.** Per the brainstorm's "unified proposal" rule this is not a finding-set to score item-by-item; it collapses to one `accept` on the whole proposal plus an explicit deliverable-count decision. No sub-scope is deferred — the report is explicit that the amendment and first dependent behavior must ship in one indivisible revision and that no design question is left open beyond the four owner sign-off items below.
- **Spec number:** `SPEC-032` — highest existing is `SPEC-031` (in `archive/specs/`); `specs/` is empty. The proposal anticipated this number.
- **Deliverable-count decision:** **one spec.** The request asked for "a spec" (singular); the proposal is a single coherent, self-decomposing feature whose constitutional, core, server, and web workstreams share one source contract and must land coherently. The repo's spec→tickets workflow splits implementation downstream.
- **Closest precedent:** SPEC-027 (Record-Hygiene Assistance Prompt) arose from an identically-worded request against a sibling change proposal and became one spec with a sign-off-gated Deliverable 0 amendment. This spec follows that template directly.

### Premise verification (operator-verified against HEAD `24d5d2b`)

- **Commit-drift reconciled — the report's freshness disclaimer is mooted, which strengthens adoption.** The report targets `5375d9c`; `git merge-base --is-ancestor 5375d9c HEAD` confirms it is an ancestor of HEAD. The only two intervening commits (`bb9b054`, `24d5d2b`, both WSTABLE-001 working-set table layout) touch none of the constitutional/contract surfaces: `git diff --stat 5375d9c..HEAD -- docs/FOUNDATIONS.md docs/compiler-contract.md docs/story-record-schema.md docs/ACTIVE-DOCS.md packages/core/src/version.ts` is empty.
- **FOUNDATIONS amendment targets all exist at the cited numbering** (`docs/FOUNDATIONS.md`): §8 Deterministic prompt compilation (L264), §9.1 Assistance prompt class (L313), §10 No accepted prose in generated prompts (L382), §21 Accepted segment archive (L763), §28.1 (L945) / §28.2 (L949), §29.2 Continuity authority hard fails (L1002), §29.3 Active working set hard fails (L1011), §29.4 Prompt compilation hard fails (L1020), §29.8 Accepted prose archive hard fails (L1062), §29.9 Prompt audit and secrets hard fails (L1070). §29.5/§29.12 are unchanged-but-relevant per report §10.11.
- **Versions current** (`packages/core/src/version.ts`): `templates 1.5.0`, `compiler 1.7.0`, `contract 1.8.0`, `app 0.0.0`. Target bumps: `templates 1.6.0`, `compiler 1.8.0`, `contract 1.9.0`, `app` unchanged.
- **Registry exposes exactly 18 record types** (`packages/core/src/records/registry.ts` — `definitions` spreads `entityDefinitions`, `castMemberDefinition`, `knowledgeDefinitions`, `spaceMaterialDefinitions`, `causalPressureDefinitions`, `relationshipEmotionDefinitions`; 18 distinct `recordType:` literals across `packages/core/src/records/*.ts`). The report's "18, not the brief's 17" correction is verified; the catalog must be registry-derived and assertion-tested, never a typed constant.
- **Registry seams the catalog/parser will reuse exist** (`registry.ts`): `recordTypeRegistry`, `recordTypes`, `parseRecordPayload`, `projectRecordStatus`, `extractRecordReferences`.
- **Sibling assistance seams the report points to are real**: the Record-Hygiene compile/analyze surface, snapshot builder, parser, and view (SPEC-027/030, archived) and the ideation surface (SPEC-021/022) — the report's §2.1 / §8.9 seam list and Appendix A ledger enumerate them at exact-commit paths. A downstream ticket must re-verify each `file:line` it touches at implementation time (the seams have existed since their specs archived, but line numbers are not pinned here).

### Scope decisions (carried for owner sign-off at Deliverable 0)

- **D1 — visible name / route / profile id (report Assumption A1, recommended default).** Visible name **Segment Reconciliation**; route `/segment-reconciliation`; source-profile identifier `segment-reconciliation`. The owner may rename the *visible* surface at sign-off; the *profile identifier* should remain stable once shipped because it enters the compiler contract and versioned prompt schema. **Assumption, owner-overridable.**
- **D2 — brief-exclusion boundary (report Assumption A2, recommended default).** Beyond the fixed exclusions (MANUAL MOMENT DIRECTIVE, STOP GUIDANCE — always excluded as forward-direction controls), also exclude CURRENT CAST VOICE PRESSURE, CAST VOICE OVERRIDES, ACTIVE WORKING SET curation (incl. `selected_records` as a *target*), `selected_pov` and cast bands, GENERATION VALIDATION FOCUS, normalized `generation_context`, STORY CONTRACT, UNIVERSAL CONTENT POLICY, and PROSE MODE. The owner may narrow/expand only these assumption-labeled exclusions at sign-off; the nineteen included paths and the fixed exclusions are settled. **Assumption, owner-overridable.**
- **D3 — FOUNDATIONS amendment wording (report §10).** The exact replacement text for §8, §9.1, §10, §21, §28.1/§28.2, and §29.2/§29.3/§29.4/§29.8/§29.9 is the Deliverable 0 wording, reproduced by reference to report §10.1–§10.10. **Sign-off-gated; not yet approved.**
- **D4 — lifecycle deactivation-destination table (report §7.4).** The per-type allowed `DEACTIVATE` destinations are a proposed schema/domain contract requiring owner sign-off. **Sign-off-gated; not yet approved.**
- **D5 — record scope model (committed, not an assumption).** `active_working_set` (default) and `whole_project` (explicit alternative); no semantic-active predicate in either; oversize fails visibly (`segment-reconciliation-prompt-too-large`).
- **D6 — output contract (committed).** One strict JSON object, locally validated in full, all-or-nothing quarantine, no partial salvage, no second LLM pass, no hidden repair.

---

## Problem Statement

Continuity Loom's core loop ends with **clerical debt**: after accepting a segment, the author must manually update every durable continuity change before generating again (`docs/user-guide.md`; SPEC-012 durable-change reminder). The reminder names the obligation but does not help *find* the affected fields, *locate* the relevant records, or *construct* valid new records. A single accepted scene can simultaneously move time/location, change who is onstage/visible/armed/in-possession, alter the immediate causal handoff, fulfill/block/revise a plan, tick a clock, close/transfer an obligation, activate a consequence, answer an open thread, reveal a secret, or transform a relationship or emotion — touching many of the 18 registered record types and the nineteen CURRENT AUTHORITATIVE STATE / IMMEDIATE HANDOFF brief paths at once.

The prose itself is readable evidence of what happened, but the constitution **correctly refuses to let prose become continuity authority by osmosis** (§10, §28.1). The missing surface is therefore **not** an automatic extractor and **not** a prose-to-canon pipeline. It is a **review instrument** that places the latest accepted segment beside current structured authority, asks an external model for typed candidate deltas, and leaves every canonical decision to the user.

**Why a third surface, not a mode inside an existing one.** Ideate (`prose-aligned`) is forward-looking launch context and selected pressure; it never reads accepted prose or full schema-guided state. Record Hygiene (`project-review`) is records-only, excludes accepted prose / generation fields / ENTITY+CAST MEMBER payloads, and cannot propose creation from a new segment. Segment Reconciliation needs a constitutionally distinct **accepted-segment evidence lane** and a **record-creation schema catalog** that neither sibling can host without weakening its own source firewall.

**Why the constitution blocks it today (and must be amended first, not reinterpreted).** Several current FOUNDATIONS sentences make the proposed source illegal: §8 forbids inferring source material from accepted prose or including accepted prose in prompts; §9.1 recognizes exactly two source profiles and forbids inferring assistance selection from accepted prose; §10 makes accepted-prose exclusion a hard rule for generated prompts; §21 says segment browsing is not a prompt source; §28.1 excludes accepted prose entirely; §29.4/§29.8 reject any prompt context containing accepted segments. The feature is sanctioned *in spirit* by §26 (candidate event extraction from user-selected prose, subject to human review and provenance), but implementation cannot precede the amendment. **Deliverable 0 carries the exact wording for owner sign-off under §1.1.**

**Why reconciliation cannot reuse prose-readiness input.** Reconciliation exists partly to discover *missing or stale* generation-time fields. Blocking it because CURRENT AUTHORITATIVE STATE or IMMEDIATE HANDOFF is incomplete would trip the §29.5 diagnostic-assistance rule (a diagnostic prompt must not be blocked by the condition it exists to inspect). It therefore needs a dedicated typed snapshot built from the **saved draft**, with missing values represented explicitly and no readiness gate. Structurally malformed stored data, a missing accepted segment, a stale fingerprint, an unsafe provider config, or an un-fittable prompt may block reconciliation; *missing story-state content may not.*

---

## Approach

Add a new `segment-reconciliation` assistance source profile and a quarantined `/segment-reconciliation` review page, reusing the Ideate/Hygiene architectural patterns (explicit request input, deterministic citation keys, inspect-before-send, fingerprint-gated analyze, session keepers, malformed-output quarantine, dual explicit scopes) without weakening either sibling's firewall. The work is one indivisible synchronization set: **constitutional amendment → new domain authority + contract/schema/ACTIVE-DOCS/version cascade → core compiler/parser → server snapshot+routes → web page+reminder CTA → golden/property/parser/route/e2e/UI/stress/doc coverage.** The amendment and the accepted-prose read must **not** be split into an "enable first, harden later" sequence (report §13).

Load-bearing design commitments (the report is the detailed authority; this is the spec-level contract):

1. **Source profile `segment-reconciliation`** is a pure function of: the explicit request (`segmentSelection: "latest"`, `recordScope`), exactly one latest accepted segment (id/sequence/acceptedAt/text), the purpose-limited nineteen-path saved-draft brief projection (missing/blank/present explicit), every complete non-archived record in the selected scope (all types, all lifecycle states), minimal id/type/label reference stubs for out-of-scope referenced records, a registry-derived schema catalog, and pinned template/compiler/contract versions. `acceptedSegment.text` is the only new constitutional source material.
2. **Latest-only, server-fetched.** No picker, range, "last N", archive checkbox, similarity retrieval, or client-side selection. The server obtains the latest row via a dedicated ordered single-row repository method returning id/sequence/time/text.
3. **Dual record scope, no status predicate.** `active_working_set` (default; the records whose ids occur in saved `active_working_set.selected_records`, including ENTITY/CAST MEMBER, all lifecycle states) or `whole_project` (every non-archived project record). Reading working-set membership to honor the scope is not a mutation. Every qualifying record renders in full in deterministic registry/label/id order — **no ranking, retrieval, salience, batching, summarization, or token eviction.** Archived records never render. Oversize → visible `segment-reconciliation-prompt-too-large` failure with OpenRouter middle-out/compression explicitly disabled.
4. **Deterministic, inspectable compilation.** Identical source tuple + versions → byte-identical prompt and fingerprint. Thirteen always-present sections (`RECONCILIATION_SECTION_ORDER`), source contract at the front edge, strict output schema at the final edge. Locally-generated accepted-segment span keys (`[SEG-<seq>-S###]`) via the report §5.3 partition algorithm; brief keys (`[BRIEF:<path>]`); per-type record keys (`[ENTITY-1]`) and reference-stub keys (`[REF-…]`); `[RECORD-SCOPE]` contrast key. Data blocks render as escaped JSON with explicit untrusted-evidence framing (escape `<`,`>`,`&`); record/segment text never becomes a heading or instruction.
5. **Fingerprint-gated analyze.** Compile returns prompt + fingerprint + disclosure + output JSON Schema. Analyze echoes the fingerprint; the server rebuilds the whole snapshot/prompt and returns `409 reconciliation-source-changed` on drift. The server never trusts client-supplied prompt/records/segment/catalog/counts.
6. **Registry-derived schema catalog.** Generated from `recordTypeRegistry` + each type's Zod payload schema (Zod 4 `z.toJSONSchema()` as transport aid), including required/optional fields, defaults, unions, every enum, `display_label` requirement, repository-managed `id` (forbidden in output), lifecycle field + legal values + allowed deactivation destinations (D4 table), and reference-bearing paths/cardinality/target types. JSON-Schema conversion is a transport aid; the authoritative validator remains `parseRecordPayload` after token resolution. Catalog generation fails (blocks) if a creation-relevant constraint cannot be represented.
7. **Strict pure-JSON output + full-response quarantine.** One JSON object (`contract: "segment_reconciliation.v1"`, `source` echo, three always-present proposal arrays), `additionalProperties:false` at every layer, validated locally through 14 ordered passes (report §6.8). Brief proposals (`FILL`/`REPLACE`/`CLEAR` on the nineteen paths, whole-field array replacement). Record-change proposals (`UPDATE_FIELDS`/`DEACTIVATE`, RFC-6901 pointer patches, immutable `id`, ≤1 proposal per record, post-patch registry re-parse). Creation proposals (registry type, no `id`, real enum vocabulary, reference tokens `$record:[KEY]` / `$new:NEW-NNN`, exact acyclic `dependencies`, deterministic temporary ids never surfaced/stored). Any failure → `status: "malformed"` scratch with a reason code; **no partial salvage, no JSON repair, no second model call, no persistence.**
8. **Accepted-prose echo firewall** (report §6.9): NFKC + case-fold + whitespace-collapsed comparison; reject any model-authored string containing a ≥50-normalized-char accepted-segment substring or a ≥8-token verbatim run; exempt only enum literals/booleans/numbers/ids/keys/tokens and validated proper-name atoms ≤3 tokens. Provenance is span keys, never quotations.
9. **No automatic application anywhere.** A proposal card may copy its value/patch, open the canonical brief field / existing record / blank typed editor, and reveal evidence spans. It may **not** prefill, stage, patch, save, create, archive, deactivate, merge, remove, select, or reorder. Session-scoped keepers in `sessionStorage` only; Clear performs no server write. No background watcher, acceptance hook, scheduled job, or automatic provider call.
10. **Reminder upgrade, not replacement.** The durable-change reminder gains a **Reconcile latest segment** CTA that navigates to the page; Acknowledge and Snooze keep their current meaning. Opening the surface never acknowledges/snoozes the reminder or implies canonical updates are complete.
11. **No storage migration.** Reads existing sources; all response state is ephemeral. No new table/column/event/schema version. Raw output and accepted text are never logged or persisted.

---

## Deliverables

> The numbering is a coherent landing order. **Deliverable 0 is a constitutional change requiring explicit owner sign-off before any dependent deliverable is implemented or this spec is decomposed into tickets** (FOUNDATIONS §1.1; brainstorm coupled-amendment rule). The amendment, the first dependent behavior, the domain docs, the version bumps, and the tests land in **one revision** — never the constitutional edit standalone.

### Deliverable 0 — FOUNDATIONS amendment (SIGN-OFF-GATED — proposed wording, not approved)

Apply the **exact** replacement text in report §10 to `docs/FOUNDATIONS.md`:

- **§10.1** — replace the prompt-class source/prohibition paragraphs in **§8** (adds the segment-reconciliation compile clause; clarifies that the profile's direct explicit read of one selected accepted segment is *not* inference; forbids accepted-prose text in any prose prompt or any assistance prompt *other than* the exact `segment-reconciliation` profile).
- **§10.2** — replace **§9.1** in full (three source profiles: `prose-aligned`, `project-review`, `segment-reconciliation`; the additional segment-reconciliation source constraints; the determinism/inspectability/gating/no-LLM-intermediary/never-prose obligations; the additional segment-reconciliation *output* obligations).
- **§10.3** — replace **§10** in full ("the sole prompt-source exception is the `segment-reconciliation` profile … exactly one accepted segment, latest only in v1, as bounded evidence"; the non-canon, no-quote, paraphrase-and-echo-guard requirements).
- **§10.4** — replace **§21** in full (segment browsing remains non-source; the one-segment assistance exception; reminder may link to Segment Reconciliation without acknowledging it).
- **§10.5** — replace **§28.1 / §28.2** (the one narrow v1 assistance exception; one-complete-segment-only, no range/retrieval/summary/truncation, oversize fails).
- **§10.6–§10.10** — replace the **§29.2 / §29.3 / §29.4 / §29.8 / §29.9** hard-fail checklists with the segment-reconciliation-aware versions.
- **§10.11** — confirm **§29.1 / §29.5 / §29.12** need no wording change but still apply and require direct tests.

**Until D0 is signed off, the wording above is a proposal only.** Record the sign-off on this spec (flip the D3/D4 scope-decision lines to APPROVED) before decomposition; apply the edit atomically with its dependent code.

>> I'm the user who requested this spec, and I'm signing off the amendment. Proceed as intended.

### Deliverable 1 — Same-change documentation, registry, and version cascade

- **New active domain authority** `docs/segment-reconciliation-prompt-template.md` — the profile, source predicate, field boundary, thirteen-section order, schema catalog, lifecycle destinations (D4), output schema, provenance spans, echo guard, and UI quarantine, written as an active document (report §§3–8 converted to normative form, no research discussion). Register its exact row in the `docs/ACTIVE-DOCS.md` authority-registry table (report §11.1) **and** add it to the "Prompt, compiler, validation, and schema authorities" bullet list in the same doc (the synchronization list, currently `docs/ACTIVE-DOCS.md` §"Prompt, compiler, validation, and schema authorities") — both the table row and the bullet list, not just the row. **Do not** register the change-proposal report as an authority.
- **`docs/compiler-contract.md`** — header pin → `1.9.0`; insert §2.3 segment-reconciliation source profile and renumber Universal exclusions to §2.4; insert §3.4 thirteen-section order; insert §4.2 source-mapping table; add the four empty-state rules to §8; add the prompt-facing-vs-validation paragraph to §9; append the change-control rule to §10 (report §11.2 supplies exact text).
- **`docs/story-record-schema.md`** — append the Segment-Reconciliation note to §3.3 IMMEDIATE HANDOFF; insert §9.4 segment-reconciliation assistance projection (nineteen paths, dual scope, registry-derived catalog, 18-type adoption set, lifecycle-destination table, catalog-equals-registry test rule); append the synchronization bullet to schema §10 (report §11.3 supplies exact text).
- **`docs/user-guide.md`** — update the post-acceptance loop to the nine-step optional-reconciliation flow (report §11.4); state Reconciliation is optional, non-canonical, may be wrong, and never applies changes. The active documentation of reminder behavior is `docs/user-guide.md` itself (L143–145) — there is no active reminder *spec* descendant; SPEC-012 is archived and must not be edited.
- **`packages/core/src/version.ts`** — bump `templates 1.5.0→1.6.0`, `compiler 1.7.0→1.8.0`, `contract 1.8.0→1.9.0`; update every active pin/golden fixture in the same revision. (If intervening work moves these, apply the equivalent next-minor increments.)

### Deliverable 2 — Core compiler, schema catalog, parser, and echo guard (`@loom/core`)

New modules under `packages/core/src/compiler/reconciliation/`: `types.ts`, `citation-keys.ts`, `segment-spans.ts`, `schema-catalog.ts`, `record-renderer.ts`, `template.ts`, `compile-segment-reconciliation-prompt.ts`, `output-schema.ts`, `parse-output.ts`. Extend `template-constants.ts` with `RECONCILIATION_SECTION_ORDER` and `packages/core/src/index.ts` exports. Implements: the source tuple + dedicated `SegmentReconciliationSnapshot` (distinct from `GenerationSessionReadyInput` / `ValidationSnapshot` / `StoryRecordHygieneSnapshot`); the §5.3 span algorithm; brief/record/stub/scope citation keys; registry-derived catalog with catalog-version tied to `contract.version`; deterministic prompt compilation + fingerprint; the strict output JSON Schema; the all-or-nothing parser (14 passes, reference-token resolution, temporary-id injection, `parseRecordPayload` re-validation, synthetic project index, acyclic dependency check); and the verbatim-echo firewall. Must keep `@loom/core` framework/platform-free (no `node:*`, fastify, react, vite).

### Deliverable 3 — Server snapshot builder, routes, and repository method (`@loom/server`)

New `segment-reconciliation-snapshot-builder.ts`, `segment-reconciliation-routes.ts`, `segment-reconciliation-parse.ts`; extend `record-repository.ts` with `getLatestAcceptedSegmentForReconciliation()` (one ordered row → id/sequence/time/text; never loads a range); register routes in `server.ts`. `POST /api/segment-reconciliation/compile` (parse strict request → fetch latest segment → load saved draft + records → build scope + stubs → generate catalog/spans/keys → compile + fingerprint → return prompt/disclosure/output-schema/source metadata). `POST /api/segment-reconciliation/analyze` (parse strict request + expected fingerprint → rebuild + drift-reject → one OpenRouter request with the inspected prompt and exact structured-output policy → local parse/validate → typed valid proposals or malformed scratch). The server must reject/ignore client-supplied prompt/records/brief/segment/catalog/counts. For this operation, explicitly disable OpenRouter Response Healing, context compression / middle-out, web/file plugins, uninspected tool calls, and fallback to providers that ignore required structured-output parameters; structured mode uses `response_format: json_schema` + `strict:true` + `provider.require_parameters:true` where supported, else plain pure-JSON with the same local parser. Do **not** widen reminder metadata methods to carry accepted text. Never log/persist raw output or accepted text.

### Deliverable 4 — Web review page, quarantine UI, keepers, and reminder CTA (`@loom/web`)

New `packages/web/src/segment-reconciliation/SegmentReconciliationView.tsx`, `ReconciliationProposalCard.tsx`, `keepers.ts`; extend `api.ts` typed clients, `shell/AppShell.tsx` primary route, `shell/DurableChangeReminder.tsx` CTA. Project-gated `/segment-reconciliation` route beside Ideate/Record Hygiene with the scratch banner, read-only latest-segment source, scope radio (`Active working set` default / `Whole project`), Compile/Inspect/Copy/Send/Clear, the full pre-send disclosure (incl. secret exposure warning + own one-time send-confirmation key), prompt-staleness invalidation, three-group valid-output cards (evidence chips, contrast keys, current-vs-proposed, rationale, permanent "Suggestion only" badge), navigation/copy/keeper controls **only**, malformed-output error surface (reason code + collapsed raw + copy + clear, no parsed cards), `sessionStorage` keepers keyed by project + fingerprint, and the **Reconcile latest segment** reminder CTA (navigate only; no acknowledge/snooze/background compile). All forbidden controls (Apply/Create/Prefill/Deactivate/Archive/Merge/Remove/Add-to-working-set/Use-as-prose/etc.) must be absent.

### Deliverable 5 — Test, regression, and stress cascade

Per report §12: core golden tests (`packages/core/test/segment-reconciliation-golden.test.ts`, ≥15 cases), core property + cross-pillar capstone tests, exhaustive output-parser valid/invalid fixtures + mutation coverage, server compile/analyze route + repository + e2e tests (incl. the multi-change e2e asserting the project store is byte-for-byte unchanged), web tests, and stress-suite/coverage-matrix additions (`docs/stress-suite.md`, `docs/stress-coverage-matrix.md`). Register the reconciliation files in the existing robustness/mutation gate and update `docs/robustness-testing.md` (a registered development-assurance authority whose **Enrolled Scopes** enumerate per-pillar mutation configs P1 prose / P2 ideation / P3 validation, each with a named `mutation:*` script and `stryker.*.config.mjs`): decide and record the scope mechanism — either a new `segment-reconciliation` pillar (new Stryker config + `mutation:reconciliation` script + Enrolled-Scopes entry) or enrollment of the new `packages/core/src/compiler/reconciliation/**` files into the existing core pillar (report §12.3 leaves this open). The cross-pillar capstone must fail if any prose/Ideate/Hygiene prompt starts including accepted text, or if the reconciliation prompt fails to include exactly one segment.

---

## FOUNDATIONS Alignment

| Principle / hard-fail | Stance | Rationale (mechanism @ surface) |
|---|---|---|
| §10, §28.1 accepted-prose firewall | **tensions — cleared by Deliverable 0** | The feature requires reading one accepted segment into a prompt, which §10/§28.1 currently forbid. Deliverable 0 narrows the rule to the exact `segment-reconciliation` profile (one latest segment, bounded evidence, no quote-through) with the prohibition intact everywhere else. Not a silent reinterpretation — the exact wording is sign-off-gated. |
| §8 deterministic compilation | aligns | Byte-identical prompt+fingerprint for identical source tuple + versions; only local normalize/escape/sort/key/JSON-Schema generation; no LLM intermediary selects/summarizes/repairs @ prompt-compilation. |
| §9.1 assistance prompt class | aligns (extends) | Adds a third explicitly-declared, inspectable source profile with its own typed snapshot and never-prose output; selection is user-explicit, never keyword/embedding/model-chosen @ assistance compilation. |
| §7 / §29.3 active-working-set supremacy | aligns | Reading `selected_records` to honor the working-set scope is not a mutation and grants no prose authority; every qualifying record renders, none hidden/ranked/evicted; reference stubs cannot become change targets or import out-of-scope payloads. |
| §20 / §29.2 durable change & human gatekeeping | aligns | No Apply/prefill/auto-write; the user re-authors every change in the canonical editor; the LLM never mutates records or brief fields; quarantine labels keep cards on the review side. |
| §11 / §29.5 validation & diagnostic-assistance | aligns | Reconciliation blocks only on malformed source/provider/fingerprint/oversize, never on incomplete readiness or the contradictions it exists to inspect; it adds no prose-readiness blocker. |
| §15 / §29.6 POV, knowledge, secrets | aligns | Whole-project scope discloses secret-bearing records explicitly with counts and an opt-in send; default focused scope limits exposure; author-private notes excluded. |
| §22 / §29.9 prompt audit & secrets | aligns | Prompt inspected before send; no prompt/response/keeper persistence; Clear leaves no residue; raw output and accepted text never logged; API keys never in prompt UI. |
| §21 / §29.8 accepted-segment archive | aligns (post-D0) | Exactly one latest segment, no range/older-picker/model-excerpt/summary; reminder CTA preserves acknowledge/snooze; opening the surface never clears the reminder. |
| §23 OpenRouter & secrets | aligns | Response Healing, context compression, plugins, and parameter-ignoring fallback disabled; network limited to the inspected prompt the user intentionally sends. |
| §24 local-first ownership | aligns | No storage migration; ephemeral scratch only; project data stays local and user-owned. |

§29.1 (identity), §29.5 (validation), §29.12 (author-private notes) require no wording change (report §10.11) but still apply and get direct tests.

---

## Verification

The spec is implementable only when downstream tickets prove all report §16 acceptance criteria, in particular:

1. Owner-approved D0 wording lands with the feature (no standalone constitutional edit).
2. Exactly one latest accepted segment enters **only** the reconciliation assistance prompt; every prose prompt and every other assistance prompt stays accepted-prose-free (cross-pillar capstone).
3. Only the nineteen allowed brief paths are source/targets; the fixed + D2 exclusions are absent.
4. `active_working_set` is default, `whole_project` is explicit; every non-archived in-scope record renders, all statuses included; no archived record renders; no status/ranking/retrieval/eviction influences inclusion.
5. All registered type/field/enum schemas come from the registry; catalog-equals-registry tests pass; catalog round-trips representative payloads through `parseRecordPayload`; output JSON Schema is `additionalProperties:false` throughout.
6. Every proposal carries valid accepted-segment span provenance + current contrast keys; brief proposals pass path-specific draft validation; record patches/deactivations pass schema/reference/lifecycle validation; creation proposals use valid types/enums, no model ids, valid acyclic token dependencies, and full registry parsing.
7. Material verbatim accepted-prose echo quarantines the whole response; any malformed item quarantines the complete response with no repair/salvage/second pass.
8. No UI/API action writes, prefills, stages, archives, deactivates, creates, or changes working-set membership; source-fingerprint drift returns `409` and prevents result acceptance; provider compression/healing/plugins are disabled; Clear/keeper behavior leaves no project-store/log residue.
9. Reminder CTA preserves acknowledge/snooze; no new readiness blocker or storage migration exists; docs, versions, golden tests, stress coverage, and ACTIVE-DOCS registration move together.

Gate every implementation revision on `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, the existing robustness/mutation gate, and a final diff audit against the **amended** FOUNDATIONS §29.

---

## Out of Scope

- Generating prose, dialogue, scene text, future-scene summaries, branches, beats, outlines, or plot rails (the prohibition on requesting prose alternatives scopes to the prose class and stays intact).
- Reconciling more than one accepted segment; any older-segment picker, range, "last N", similarity/keyword retrieval, or archive mining in v1.
- Mining candidates, rejected/superseded regenerations, prompt logs, or author-private notes.
- Any automatic mutation: auto-update/-create records, auto-fill the brief, auto-curate the working set, infer canon, or apply suggestions (no Apply/prefill/stage, bulk or per-item).
- Replacing Record Hygiene's MERGE/REMOVE review; making accepted prose a future-prose source; adding a readiness blocker to prose generation.
- Background watchers, acceptance hooks, scheduled jobs, automatic provider calls, or any persistence of prompts/responses/findings/keepers/prose-derived summaries.
- Any storage migration (new table/column/event/schema version) — explicitly rejected.
- Freeform request objective/focus text, custom field/record-type filters, or model-authored follow-up input in v1.

---

## Risks & Open Questions

**Open for owner sign-off at Deliverable 0** (these gate decomposition):
- **D3 — exact FOUNDATIONS §10 wording.** Approve or revise report §10.1–§10.10 verbatim text.
- **D4 — §7.4 lifecycle deactivation-destination table.** Approve or revise the per-type allowed-destination set (e.g. SECRET → `disproven`/`abandoned`; OBJECT → `lost`/`destroyed`/`transferred`/`inactive`; EMOTION → `settled` only).
- **D1 — visible name / route.** Confirm **Segment Reconciliation** (or rename the visible surface; keep the profile id stable).
- **D2 — A2 exclusion boundary.** Confirm or adjust the recommended brief-exclusion set (voice controls, working-set curation, validation focus, generated context, story config).

**Risks** (report §14 enumerates mitigations; load-bearing ones):
- **State laundering / prose-as-canon drift** → no apply/prefill, canonical re-authorship, quarantine labels, project-store-invariance e2e tests, and the explicit constitutional wording.
- **Verbatim echo** → no quote fields, span-key provenance, paraphrase instruction, deterministic substring/token guard, full-response quarantine. Excessive false-positive echo rejection is mitigated by exempting only short atomic names/enums/ids and showing the reason; thresholds are tested and versioned.
- **Hidden source loss / archive dumping** → latest-only one-row query, disabled compression/middle-out, complete-scope rendering, visible oversize failure, provider-metadata assertions.
- **Prompt injection in story text** → escaped data containers, repeated untrusted-data framing, strict schema/parser, zero mutation (limits surface and consequence, not possibility).
- **Schema drift** → registry/Zod-derived catalog, catalog-equals-registry capstone, same-change version/docs rule.
- **Stale review** → server rebuild + fingerprint `409`.
- **Secret-exposure surprise** → explicit counts/disclosure + opt-in send; default focused scope; notes excluded.
- **Provider schema incompatibility** → surface support/error clearly; optional plain pure-JSON mode with the same parser; never weaken local validation.

**Decomposition note for `spec-to-tickets`:** the natural ticket spine follows report §13 — (0) D0 sign-off + the indivisible amendment/docs/version landing, (1) core types/spans/catalog/compiler/fingerprint/output-schema/parser/echo-guard + tests, (2) repository one-row method + server snapshot builder, (3) compile/analyze routes + provider restrictions + route/e2e, (4) web page/inspector/disclosure/cards/keepers/malformed/CTA, (5) golden/property/mutation/cross-pillar/UI/stress/doc coverage. No ticket may ship the accepted-prose read without the amendment, source contract, output quarantine, and tests in place.

## Outcome

Completed: 2026-06-24

Implemented the Segment Reconciliation assistance profile end to end: FOUNDATIONS amendment, active template authority, compiler/schema/parser, server snapshot and route integration, OpenRouter structured-output policy, web review page, durable-change reminder CTA, stress/robustness enrollment, and capstone coverage.

Deviations: the Stryker segment-reconciliation mutation pillar is enrolled with `thresholds.break: null`, consistent with first-time robustness enrollment; the first score is advisory rather than a blocking floor.

Verification:

- `npm test -- segment-reconciliation-cross-pillar`
- `npm run mutation:segment-reconciliation`
- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm run build`
- `git diff --check`
