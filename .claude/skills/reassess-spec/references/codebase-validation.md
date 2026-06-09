# Codebase Validation (Step 3)

Validate every reference from Step 2 against the current codebase.

**Parallel grep-batch guard**: when validating via direct `grep` / `find` / `test` calls batched in one parallel turn, guard each with `|| true`. A non-zero exit from one call (grep finding nothing, `test` on a missing path) cancels its siblings in the batch. Zero-match results are expected and valid during validation.

Substep applicability by Pre-Process classification:

| Substep | (a) new | (b) extension | (c) refactor | (d) retroactive |
|---|---|---|---|---|
| 3.0 Cross-file scope | ✓ | ✓ | ✓ | skip |
| 3.1 File paths | ✓ | ✓ | ✓ | ✓ (rigorous) |
| 3.2 Types / schema fields | ✓ | ✓ | ✓ | ✓ (rigorous) |
| 3.3 Functions / exports | ✓ | ✓ | ✓ | ✓ (rigorous) |
| 3.4 Dependencies | ✓ | ✓ | ✓ | ✓ (rigorous) |
| 3.5 Skill-structure | ✓ | if SKILL.md changes structurally | if content moves between SKILLs | skip |
| 3.6 Downstream consumers | ✓ | ✓ | skip | skip |
| 3.7 Upstream spec refs | ✓ | ✓ | ✓ | skip |
| 3.8 FOUNDATIONS-contract fidelity | ✓ | if validation/compilation/record-authority/POV semantics touched | skip | skip |
| 3.9 New-deliverable consumer verification | ✓ | ✓ | skip | skip |
| 3.10 Source-document completeness | ✓ | ✓ | skip | ✓ (rigorous — verify landing) |
| 3.11 Spec structural completeness | ✓ | ✓ | skip | skip |

For specs with >10 references, consider parallel Explore agents organized by theme (max 3). Spot-check agent claims with direct Grep/Read before including in findings — agent results are leads, not facts; trust a direct tool result over an agent claim.

**Greenfield / foundation specs** (the spec's deliverables ARE the repo's first code — no pre-existing code tree, e.g. a Phase-1 repository/runtime foundation): the substep table still applies, but the consumer-grep substeps have nothing to grep. Handle them explicitly rather than skipping silently:

- **3.6 Downstream Consumers**: record `N/A — greenfield, no code tree` instead of an empty grep. There are no existing import sites because there is no code yet.
- **3.9 New-Deliverable Consumer Verification**: the deliverables' consumers are **planned**, not present — every later phase named in a sequencing/ordering doc or the spec's own later-phase plan. That satisfies the "explicitly planned" branch; do NOT fire the zero-consumer HIGH Issue for a foundation spec whose consumers are unbuilt-but-sequenced future work. Record the planned consumers (the sequencing doc's phase list) for the audit trail.

This is distinct from `SKILL.md`'s "no greenfield approach proposals" guardrail, which is about not proposing alternative designs — here "greenfield" means the *repo* is empty.

## 3.0 Cross-File Scope Establishment

For patterns referenced across multiple files (type imports, schema-field usage, command invocations), run a cross-file count grep first to establish full scope before per-file analysis. Compare the spec's claimed locations against the actual count — this catches files the spec missed and prevents incomplete deliverables.

**Embedded quantitative baseline claims**: when a spec embeds numeric assertions about the current codebase (per-file word/line counts, percentages, file sizes, match counts), spot-verify them with `wc` / `grep -c` / `find`. A mismatch reveals a stale baseline the rest of the spec may rest on; an exact match corroborates that the spec was written against the current tree. Cheap to run, high signal — especially for doc-amendment specs that tabulate current-vs-proposed document sizes.

## 3.1 File Paths

Glob/Grep to confirm each path exists. If moved, renamed, or deleted, record the actual location. Distinguish existing paths (must exist now) from proposed paths (exist after implementation); proposed paths still need their parent directory to exist, must not collide with an existing file, and must follow conventions (kebab-case filenames, `SPEC-NNN-<slug>.md` for specs, `<PREFIX>-NNN.md` for tickets).

**Name-collision check for proposed paths**: when a spec proposes a NEW file, list the parent directory for SIMILAR filenames (substring match on the distinctive token, not exact-path). A proposed file whose parent already holds a near-name sibling occupying the same conceptual slot is a HIGH Issue — the spec should MODIFY the existing file instead. An exact-path existence check passes this silently.

## 3.2 Types and Schema Fields

Grep for each type, interface, or schema field. Confirm existence and current shape. Check:

- **Field existence and naming** — flag fields the spec assumes but that don't exist or have different names/types. The schema-authoritative sources for Continuity Loom records are `docs/story-record-schema.md` (story records, generation-time brief) and `docs/compiler-contract.md` (prompt sections, compilation inputs); when the spec validates/emits/compiles a record, verify field names against these, not against FOUNDATIONS prose (prose describes *intent*; the schema docs carry the *actual* field names, and the two can drift).
- **Type accuracy** — verify assumed types match actual types.
- **Field-choice drift** — when a record class offers multiple semantically-distinct fields and the spec's algorithm picks one, verify it picked the semantically-correct one (both fields exist, so a name-drift check passes silently); a wrong choice with correctness consequences is HIGH or CRITICAL.
- **Enum / table exhaustiveness** — if the spec includes a lookup keyed by a string enum (e.g. validation focus tag → check), verify it covers all current values.
- **Schema fidelity** — if the spec proposes a JSON/YAML schema, verify against `docs/story-record-schema.md` and any existing schema file.

**Doc-amendment edit-instruction fidelity** (doc-amendment specs — see SKILL.md Pre-Process "Documentation / amendment specs"): a doc-amendment spec prescribes *edits* (replace this row, append this note, add this table row), not just quoted current text. A stale quote is one failure mode; these three are the others, each easy to miss because the spec reads internally coherent while the target doc tells a different story. For every prescribed edit, read the target region and check:

- **Replace-target existence** — for an edit phrased "replace / remove / modify X," grep the target doc to confirm X is actually there. A "replace any language that implies Y" instruction whose target has no such language (e.g. a bare `{placeholder}` with no note) presupposes content that does not exist; reframe it as an *add* (Issue, MEDIUM).
- **Replacement content preservation** — for a full-row or full-block replacement, diff the spec's replacement text against the live block and flag any still-accurate clause the replacement drops without intending to (e.g. a contract row that silently loses an "EVENT … renders X" behavioral note). A silent drop of valid content is an Issue (MEDIUM); cite the dropped clause.
- **Inserted-artifact shape match** — for a prescribed table row, list item, or code block to be *inserted*, verify it matches the destination structure: column count, key/format convention (`| Case N |` vs bare `| N |`), and heading level (a `### x.y` inserted into a doc that is flat `## N`). A malformed artifact decomposes into a broken edit (Issue, MEDIUM). While here, note any pre-existing drift the insertion exposes (e.g. the destination table already missing earlier rows) as out-of-scope context, not as this spec's defect.

## 3.3 Functions and Exports

Grep for each function or command; confirm signature, location, and export status. Line-number references are informational — verify they point to the claimed content; if drifted, correct them or replace with grep-stable symbol names. Check:

- **Signature differences** from what the spec assumes; **parameter sufficiency** at every call site.
- **Reuse opportunities** — for each new function the spec proposes, grep for an existing one serving the same purpose; a duplicate is an Issue (prefer reuse) or Improvement (note the alternative).
- **Code-example fidelity** — Before/After snippets must match the actual control-flow structure.
- **Pseudocode dependency completeness** — each call/constructor in spec pseudocode must either exist or be defined as a deliverable elsewhere in the spec; neither = an incomplete deliverable Issue.
- **Surface-convention fidelity** — proposed commands, flags, or APIs should match existing Continuity Loom conventions and `docs/compiler-contract.md`; flag deviations.

## 3.4 Dependencies (specs / skills)

- **Spec dependencies**: verify each `Depends on:` / `Predecessors:` / `Blocks:` / `Related:` entry resolves to a file in `specs/`. For an entry that resolves to no file, flag it as a broken dependency Issue unless the spec or another spec documents an intentional removal/supersession (then a LOW annotate-the-reference finding).
  - **Parenthetical scope-claim verification**: for an entry with a parenthetical scope claim (e.g. `SPEC-004 (validator framework)`), verify the parenthetical against the sibling spec's title/primary scope (a `head -5` usually surfaces the title). A misattribution propagates misleading provenance into decomposition — HIGH Issue; the file-resolution check passes silently because the file exists.
  - **Named-list drift**: for a sibling the target depends on or blocks, scan the sibling's named lists (validator inventories, deliverable tables, enum vocabularies) for entries the target references. A target naming a validator/value the sibling's enumeration omits is a HIGH Issue (cross-spec contract drift).
- **Skill dependencies**: verify `.claude/skills/<name>/` directories referenced in the spec exist. For specs consuming a skill's output, verify the skill's SKILL.md `Output` section describes the format the spec expects.

## 3.5 Skill-Structure Validation

For deliverables that propose SKILL.md changes, applicability is gated on the SHAPE of the change. Content-only edits (rewording, prose updates) need no 3.5 validation — report N/A. Structural edits (frontmatter, HARD-GATE block, Step/Phase definitions, Output declarations) require verifying:

- Frontmatter declares `name`, `description`, `user-invocable`, `arguments`; the description names triggers, produces, and mutates.
- A Prerequisites / required-reads block is present.
- The Final Rule (or equivalent) is a single enforceable sentence.
- If the skill mutates files, a `<HARD-GATE>` block and a Write/Commit step are present.

Match the conventions of the repo's existing skills (`brainstorm`, `skill-audit`) rather than inventing new structure.

## 3.6 Downstream Consumers

For types, interfaces, or functions the spec modifies, grep all import sites and usage points across `.claude/skills/*`, `docs/*`, and any code tree. Record blast radius.

For **new, retired, or changed** string-enum values (a new/retired validation focus tag, prompt-section name, or dispatch token), grep each affected value across all consumer sites — new values need a new arm at every dispatch site; retired values need every consumer updated (or retired alongside); changed values need both. Surface the consumer count explicitly. (A spec that ONLY retires values is the common case the literal "new enum" framing would steer past — the broadened scope closes that gap.)

**Audit the spec's own completeness-sweep / gate command**: when a spec ships a self-verification `grep`/`find`/`test` "completeness sweep, re-run as a gate" (common in removal/rename specs), validate the gate's coverage against where consumers actually live. A gate that omits a consumer directory or uses a pattern that misses a syntax variant is an under-scoped gate — the spec's own verification passes green while real consumers drift. HIGH Issue; recommend widening the gate's paths/pattern and adding the missed consumers to Files-to-touch.

**Correction-spec baseline (delta map)**: when the spec prescribes an end-state for behavior that partly exists already (a "Phase N correction" — see SKILL.md Pre-Process "Correction specs"), grep each prescribed symbol, string, code, or rule against the current tree *before* treating it as new work. For every prescribed item that already matches the target, record `already present at <path:line>` and reframe the deliverable as the remaining delta. A correction spec that reads greenfield but lands on an existing implementation is the trap; the baseline grep converts rebuild framing into edit framing.

## 3.7 Upstream Spec References

Grep specs in `specs/` for references to this spec's deliverables; note affected specs. Use matches to refresh the Dependencies section and any "X has not landed yet" claims with accurate status.

**Bidirectional symbol-name consistency**: when a sequencing/index doc or a sibling spec names a deliverable this spec also defines, compare the *names*, not just resolve the dependency. Grep the **sibling's / index doc's** token for the concept, not only this spec's token — a one-directional grep for this spec's own name returns zero sibling hits and silently misses reverse-direction drift (this spec calls it `fooDefault`; the index calls it `deriveFooDefault`). On mismatch, flag a cross-spec contract-drift Issue (HIGH) and adopt the index doc's name as canonical when one exists — **unless the index itself is demonstrably stale against ground truth** (filesystem / `git`), in which case ground truth wins, the corrected reference uses the actual location (per §3.1), and the index's own drift is recorded as an out-of-scope follow-up rather than propagated into this spec. This check fires even when the spec carries no `Depends on:` / `Blocks:` headers — the index doc is the dependency record. A "rely on <doc>" inline hint (SKILL.md §Inline user hint) nominates exactly this authority.

**Set-membership & sequencing registration**: beyond name consistency, when the index doc governs a *set* the target belongs to, verify the target is actually registered in it AND that the target's metadata states its sequencing dependency (which specs land first / after). A target that is part of a governed set but unlisted in the index — or silent on its phase/ordering — is a coordination Issue (HIGH): it risks a parallel, conflicting decomposition track and docs landing before the behavior they describe. To discover the ledger, list `specs/` for an ordering/index/implementation-order document at Step 3 entry.

**Forward-compat with blocked specs**: for specs that define schemas/validators/contracts AND whose `Blocks:` list includes later specs, read each blocked spec for extensions to the current spec's surfaces (new conditionally-mandatory fields, new validator codes, new enum values). If a blocked spec proposes additions the current spec's design would silently reject (strict shape validation, closed enums, no unknown-field tolerance), flag a forward-compat Improvement at MEDIUM. Skip when there are no `Blocks:` entries or the blocked specs don't extend the current spec's data surfaces.

## 3.8 FOUNDATIONS-Contract Fidelity

For deliverables that touch FOUNDATIONS-governed semantics — deterministic prompt compilation (§8), the universal prompt contract (§9), validation and hard-fails (§11), record authority and human gatekeeping (§13/§14/§20), POV/knowledge/secrets (§15), physical continuity (§16), the accepted-segment archive (§21), prompt inspection and secrets (§22/§23):

- **No principle weakening**: read the relevant FOUNDATIONS sections. For each principle the deliverable touches, verify the proposal enforces it at least as strictly as the constitution requires. A proposal that weakens a principle is a CRITICAL Issue. **Exception — constitutional-amendment specs**: when the spec's declared purpose is amending `docs/FOUNDATIONS.md` itself, relaxing a rule is the intended deliverable, not a violation. Do not auto-CRITICAL it; instead verify the amendment is internally coherent, preserves each engaged §29 hard-fail's intent, and synchronizes sibling docs (see the constitutional-amendment carve-out in SKILL.md Guardrails and `foundations-alignment.md` §4.4). **Dependent-spec variant**: a non-amendment spec that *relies on* a sanctioned sibling amendment to weaken a rule is likewise not auto-CRITICAL — it is a HIGH dependency Issue (declare the coupling). See `foundations-alignment.md` §4.4.
- **Secret-firewall preservation**: for deliverables affecting POV/secret handling or prompt compilation, verify no path lets a secret leak into a narrator/mind the deterministic records forbid (§15, §29.6). Missing firewall is CRITICAL.
- **Deterministic-compilation preservation**: for deliverables touching prompt compilation, verify no LLM intermediary selects/ranks/summarizes/rewrites records during compilation and that identical inputs+versions produce identical output (§4.4, §8, §29.4). Violations are CRITICAL.
- **Validation discipline**: for deliverables proposing validation rules, verify they stay deterministic and blocking, distinguish warnings from blockers, and name what failing means (block generation? warn?) (§11). Unaddressed second-order effects are Improvement findings at minimum.
- **No accepted prose as canon**: verify no deliverable makes accepted prose a source of canon or includes accepted prose in generated prompts (§10, §29.1). Violations are CRITICAL.

## 3.9 New-Deliverable Consumer Verification

For each proposed new deliverable (new command, new validator, new skill output, new public type, new reference-file section), verify at least one identifiable consumer exists or is explicitly planned. Grep for references to it by name across `.claude/skills/*`, `specs/*`, `tickets/*`, and `docs/*`, and inspect the spec's own Problem Statement/Approach for a concrete consumer-side workflow.

**Outcome**:
- **≥1 consumer found**: deliverable justified — record the consumers in Step 6 for audit-trail visibility.
- **Zero consumers AND no pending consumer named**: HIGH Issue → present at Step 6 as a Question with three options: (a) drop per YAGNI; (b) keep with explicit rationale naming a near-term consumer; (c) defer to a separate consumer-driven spec. Defer the decision to the user — do not silently drop at Step 3. (Greenfield/foundation specs are **not** zero-consumer cases — their consumers are the sequenced future phases; see the Greenfield note above the substep sections.)

**Registry-registered deliverables** (e.g. a validator added to a framework registry array) have a structural consumer model — registry insertion *is* the wiring. Confirm the registration site rather than name-grepping for callers; flagging "zero consumers" there is a false positive.

## 3.10 Source-Document Completeness Check

For specs citing an external source document (a report under `reports/`, a brainstorm output under `docs/plans/`, a research report) in their Problem Statement / Motivating Evidence / Approach, the claims were enumerated and tagged at Step 2. Here:

**Cited-but-missing source**: if a cited source document could not be resolved or read at Step 2 (no enumerable claims), there is nothing to adjudicate — do not treat it as the no-source skip case below. Raise it as a finding: **HIGH** when the spec's claims rest on the source unverifiably, **MEDIUM** when those claims are independently verifiable against the codebase (verify them directly first, then recommend removing or repointing the dangling citation).

1. **Verify** each enumerated claim is adjudicated by the spec — **Accepted** in Approach/Deliverables with a per-claim mapping (this covers accept-with-divergence: the spec adopts the intent but deliberately diverges; record the divergence in the mapping), **Rejected** in Out of Scope with a rationale, or **Deferred** with a named follow-up surface.
2. **Surface unadjudicated claims** as MEDIUM Improvement findings — name the claim, cite the source line, recommend the spec add an adjudication.
3. **Surface source-internal inconsistency** — when the source contradicts itself (a normative claim disagreeing with the source's own worked example) AND the spec follows one part, surface as a MEDIUM Improvement (LOW if the spec already handles it) and recommend the spec record which variant it follows and why, so decomposition doesn't re-adopt the rejected variant.

**Content-supplying predecessor specs**: when a spec declares it *supplies the documentation content of* (or otherwise derives from) named predecessor specs — common for doc-amendment specs that document already-implemented behavior — treat those predecessors as source documents even though they are specs, not external reports under `reports/`. Enumerate each predecessor's established contracts (validators, fields, requiredness rules, prompt-section behavior) and verify the spec's amendment plan adjudicates each — Accepted (the plan documents it), Deferred (named follow-up), or out of scope with rationale. A predecessor contract the amendment plan silently omits is a MEDIUM Improvement (coverage gap); a contradicted one is a HIGH Issue.

For classification (d), apply a stronger variant: verify each "accepted" claim actually landed in the codebase. An accepted-but-unredeemed claim with no delivering citation — a commit, sibling spec, or observable `<path:line>` landing — is a HIGH Issue (silent-retcon risk).

**Skip** when: (c) refactor classification, or no external source document **and no content-supplying predecessor spec** is cited (self-originating specs are scoped by 3.0–3.9 alone).

## 3.11 Spec Structural Completeness Check

For specs introducing new work (classes (a) and (b)), verify the spec carries the sections ticket decomposition needs:

- **§Deliverables (or §Approach with named targets)** — each deliverable names a concrete target (file path, function signature, command spec) the implementer can grep against. A §Approach that reads as feature description without named targets is incomplete on this axis.
- **§Verification (or §Acceptance Tests)** — re-runnable confirmation (test commands, validator invocations). Manual-only smoke tests are partial; no Verification section at all is incomplete.
- **§Risks & Open Questions** (or equivalently named) — known limitations and deferred decisions surfaced explicitly rather than discovered at ticket-time. Sections such as `§Edge cases` and `§Failure modes` that surface limitations and deferred decisions count as equivalent coverage even without the literal Risks/Open-Questions title.

**Severity**: a code/tooling spec missing §Deliverables or §Verification entirely is a HIGH Issue (decomposition can't proceed). Missing §Risks & Open Questions is a MEDIUM Improvement — but **downgrade to LOW** when the spec surfaces its limitations under equivalent sections (`§Edge cases`, `§Failure modes`), recommending only an explicit "Open questions: none remaining" line; reserve MEDIUM for specs that surface no limitations anywhere. A docs-only or process spec missing these is LOW or N/A depending on whether its content depends on implementer follow-up.

**Skip** for (c) refactor and (d) retroactive (the latter's structural completeness lives in its Outcome section).

## Conditional Deliverable Validation

For specs with conditional deliverables ("If root cause X is confirmed, do Y"), validate: (1) **diagnostic sufficiency** — the investigation can distinguish the hypotheses; (2) **fix correctness** — each proposed fix references correct types/functions/paths regardless of which is selected; (3) **soundness** — each fix respects FOUNDATIONS even though conditional (a conditional violation is still a spec defect).
