# Codebase Validation (Step 2)

Before decomposing, validate the spec's assumptions against the actual Continuity Loom codebase. Collect everything; surface Issues to the user before Step 3.

**Parallel grep-batch guard**: when validating via `grep` / `find` / `test` calls batched in one parallel turn, guard each with `|| true`. A non-zero exit from one call (grep finding nothing, `test` on a missing path) cancels its siblings. Zero-match results are expected and valid during validation.

## Full Validation Path (default)

- **File paths** — Glob/Grep every path the spec references and confirm it exists where stated. Targets: spec files (`specs/*`, `archive/specs/*`), skill files (`.claude/skills/*/SKILL.md` and `references/*`), doc files (`docs/*`), report files (`reports/*`), and any code tree once one exists. Distinguish existing paths (must exist now) from proposed paths (exist after implementation); proposed paths must not collide with an existing file and must follow conventions (kebab-case, `SPEC-NNN-<slug>.md`, `<PREFIX>-NNN.md`).
- **Types / schema fields** — Grep each type, interface, or schema field the spec names. The schema-authoritative sources are `docs/story-record-schema.md` (story records, generation-time brief) and `docs/compiler-contract.md` (prompt sections, compilation inputs). Verify field names against these, not against FOUNDATIONS prose (prose carries *intent*; the schema docs carry the *actual* names, and the two can drift). **Apply this with equal rigor to fields named in the spec's proposed corrections / fix prose, not only fields it names as already-existing** — a field a spec proposes to *write* still needs its host record's schema confirmed to define it; a wrong field in a proposed fix propagates through decomposition into a ticket exactly as a wrong field in a bug claim does.
- **Functions / commands / surfaces** — Grep each; confirm signature, location, and that proposed commands/flags match existing conventions and `docs/compiler-contract.md`.
- **FOUNDATIONS references** — Grep every FOUNDATIONS principle, validation rule, or schema field the spec cites; confirm the section/rule still exists in `docs/FOUNDATIONS.md` with the claimed semantics.
- **Spec dependencies** — confirm each `Depends on:` / `Predecessors:` / `Blocks:` / `Related:` entry resolves to a file under `specs/` or `archive/specs/`. An entry resolving to no file is a broken-dependency Issue unless the spec (or a sibling) documents intentional removal/supersession (then a LOW annotate-the-reference finding).
- **Enum / consumer blast radius** — when the spec introduces, retires, or changes a string-enum value (a validation focus tag, prompt-section name, dispatch token) or a new field on an existing record/schema, pick the analogous existing sibling and grep every consumer site across `.claude/skills/*`, `docs/*`, `specs/*` (and any code tree). New values need an arm at each dispatch site; retired values need every consumer updated or retired with them. Under-enumeration of the consumer set is the most common way a deliverable silently understates a ticket's true Files to Touch — surface the consumer count explicitly.

**Flag** any stale reference, missing file, renamed entity, or FOUNDATIONS-violating assumption as an **Issue**, with one carve-out: **mechanical drift** (a path-convention swap where intent is unambiguous, a capitalization variant, an extension normalization, an unambiguous relocation of the same artifact) propagates the corrected reference silently into tickets — note the propagation inline in the Step 2 summary rather than opening an Issue cycle. **Substantive drift** (renamed type, removed file, shifted semantics, FOUNDATIONS-violating assumption, a field that doesn't exist on the named record) is an Issue requiring disposition. Decision rule: if a competent reader would immediately see the spec's reference and the codebase's actual reference are the same artifact (no semantics or scope change), it's mechanical; if the divergence raises a question about intent (rename vs. removal vs. typo vs. API shift), it's substantive.

Present Issues to the user before Step 3. For each, obtain one of five dispositions:
- **fix-before-decomposition** — a small spec correction lands first (via `/reassess-spec`), then decompose against the corrected spec.
- **defer-to-follow-up-ticket** — with a named dependency.
- **reject-with-rationale** — spec too materially wrong to decompose this round; route back to `/reassess-spec`.
- **expand-scope-in-place** — validation surfaced materially understated scope; the spec's intent is preserved but tickets are sized against the wider surface the codebase requires (the spec is not edited, the decomposition is).
- **drop-as-moot** — the deliverable's named target doesn't exist AND its intent is satisfied by sibling deliverables OR is a structural no-op under the actual codebase shape; drop it from the decomposition with a Step 2 note naming the missing target and the covering siblings.

**Brainstorm-produced specs**: when `<spec_path>` was produced by the `brainstorm` skill earlier this session, the Full Validation Path still applies — brainstorm's triage validation is less systematic than `/reassess-spec`'s discipline. Treat brainstorm's in-context exploration as already-gathered evidence for the bullets it demonstrably covered, but run fresh greps for everything it did not explicitly verify (notably the schema-field validation, since brainstorm's spec-drafting does not guarantee proposed-fix fields were schema-checked). A multi-item brainstorm triage also writes a companion `docs/triage/<date>-<topic>-triage.md`; check its follow-up-items section and surface those follow-ups in the Step 6 cross-spec follow-ups list.

## Abbreviated Spot-Check Path (when `/reassess-spec` ran in-session)

If `/reassess-spec` was run on this spec in the current session and all findings were resolved, Step 2 may be abbreviated to a targeted spot-check (3–5 greps). Verify at least:

- **(a) Primary references** — the spec's primary skill / doc / type references still exist at the stated paths.
- **(b) Schema version** — if the spec modifies a structured schema (story-record fields, generation-time-brief fields, prompt-section contract), verify it hasn't drifted since reassessment.
- **(c) Sibling specs** — no new specs under `specs/` reference the same surfaces.
- **(d) Additive extension** — for specs extending an existing schema, consumers have been updated, or the extension is additive-only (new optional field with a default).
- **(e) Rename / removal blast radius** — for tickets renaming or removing a skill, doc-governed contract, validation rule, schema field, or exported surface, grep repo-wide (`.claude/skills/`, `docs/`, `specs/`, any code tree) for every symbol. Any match outside the ticket's Files to Touch either (i) joins Files to Touch, or (ii) splits into a follow-up ticket with an explicit dependency, or (iii) when the match lands in a *sibling spec's* committed tests/deliverables, is surfaced as a flagged Step 4 consideration (held even under auto mode, since altering a sibling spec's tested behavior is a cross-spec scope decision).
- **(f) New-field / restructured-field spot-check** — when the spec adds a field to, or restructures the shape of, an existing record/schema (string → object, scalar → enum, single → array, or a `required` → optional relaxation that breaks consumers asserting presence), spot-check that the host record/schema's schema docs, validation rules, and producing/consuming skills are covered by the spec's deliverables. Route any gap per (e).

After spot-checks, render the exercised sub-checks as a compact inline list (e.g. `Spot-checks: (a) ✓, (b) ✓, (c) skipped — no new sibling specs, (d) ✓, (e) N/A — no renames, (f) N/A — no new field`).

If `/reassess-spec` ran but some findings were **deferred** by the user, treat deferred items as out of scope for decomposition. Note them in the Step 6 summary as "deferred reassessment findings that may warrant separate tickets." Do not silently incorporate deferred findings into ticket scope.

## Validation Rules This Skill Upholds

- **§11 Fail-closed validation** — when a deliverable introduces validation, verify it stays deterministic and blocking, distinguishes warnings from blockers, and names what failing means (block generation? warn?). Unaddressed second-order effects are Improvement findings at minimum.
- **§8 Deterministic compilation** — for deliverables touching prompt compilation, verify no LLM intermediary selects/ranks/summarizes/rewrites records during compilation and that identical inputs + versions produce identical output. Violations are CRITICAL.
- **§15 Secret firewall** — for deliverables affecting POV/secret handling, verify no path lets a secret leak into a narrator/mind the deterministic records forbid. Missing firewall is CRITICAL.
- **§20 No silent retcon** — enforced at ticket-write time: every ticket modifying existing behavior cites the change rationale in its Assumption Reassessment. This skill's contribution is catching drift introduced *between* reassessment and decomposition.
- **§29 Hard-fail checklist** — any §29 question answered "yes" is a CRITICAL Issue blocking decomposition until the user dispositions it.
