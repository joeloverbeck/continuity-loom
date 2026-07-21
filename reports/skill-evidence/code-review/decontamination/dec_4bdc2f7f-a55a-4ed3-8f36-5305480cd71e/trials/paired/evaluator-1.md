# Blind paired evaluation 1

This evaluation uses only each task's `prompt.md`, `inputs.md`, `rubric.md`, and the paired `variant-a.md` and `variant-b.md`. Variant provenance was not available or inferred. `Pass`, `partial`, and `fail` refer only to observable satisfaction of the stated rubric.

## 01_standalone_core

### Criterion scores

1. Pins the complete review frame and clean scope.
   - Variant A: **pass**. It gives `main`, both SHAs, the literal resolved-SHA three-dot command, the commit-list command and result, the non-empty status, changed files, and clean worktree scope.
   - Variant B: **pass**. It gives the same fixed-point facts, resolved command, commit, non-empty status, and clean committed-only scope.
2. Inventories exact Standards and Spec authorities before dispatch and keeps the axes independent.
   - Variant A: **pass**. It inventories issue #142 separately from `AGENTS.md`, `docs/FOUNDATIONS.md`, `docs/validation-rule-inventory.md`, and the smell baseline, then dispatches distinct read-only reviewers.
   - Variant B: **pass**. Its two inventories are exact and its dispatch plan assigns separate Standards and Spec responsibilities over the same pinned diff.
3. Applies the smell baseline as judgement, skips tooling-enforced matters, and maps all four issue requirements with a justified sequence disposition.
   - Variant A: **pass**. The Standards brief separates documented rules from judgement-only smells; the Spec table maps all four requirements individually, and the sequence paragraph includes observing test proof.
   - Variant B: **pass**. The Standards brief explicitly skips tooling-enforced concerns and distinguishes judgement calls; the Spec brief and report name all four requirements and give a coherent sequence disposition. A is more explicit about observing proof, but B remains complete.
4. Records reviewer IDs/statuses and truthful unavailable-close cleanup proof.
   - Variant A: **pass**. Both IDs and completed statuses are named, with the host's missing close primitive recorded truthfully.
   - Variant B: **pass**. It separately records reviewer status, cleanup disposition, and proof that no close capability surfaced.
5. Reports visible axes with per-axis counts/worst severity and no reranking.
   - Variant A: **pass**. Both required headings are visible and each axis remains zero/none.
   - Variant B: **pass**. Both headings, per-axis counts, severities, and final summary are present without reranking.
6. Avoids implementation-only machinery.
   - Variant A: **pass**. No TDD, evidence-identity, tracker-body, or implementation-closeout block is added.
   - Variant B: **pass**. It remains a standalone read-only report.

### Regression and preference

No material or severe regression is observable in either direction. Variant A has a modest completeness advantage because it maps each acceptance requirement to its evidence and states the observing proof explicitly.

**Preference: A.**

- Variant A core adequacy: **yes**.
- Variant A safety-relevant adequacy: **yes**; read-only scope, independent axes, and truthful reviewer cleanup are preserved.
- Variant B core adequacy: **yes**.
- Variant B safety-relevant adequacy: **yes**.

## 02_wip_no_spec

### Criterion scores

1. Includes committed, cached, and unstaged tracked inputs while excluding the untracked note.
   - Variant A: **pass**. The frame explicitly includes the three-dot committed diff, `git diff --cached`, and `git diff`, and excludes `notes.txt`.
   - Variant B: **pass**. It names the staged and unstaged files and commands, includes the committed diff, and explicitly excludes the note.
2. Uses the exact no-spec route and does not invent or dispatch a Spec review.
   - Variant A: **pass**. It uses `no spec available`, skips the Spec reviewer, and marks the visible Spec axis as skipped.
   - Variant B: **pass**. It uses the exact route, explains that zero Spec findings is not a satisfaction claim, and does not dispatch that axis.
3. Distinguishes the hard localhost breach from the judgement-call smell.
   - Variant A: **pass**. `0.0.0.0` is a hard Standards violation and Divergent Change remains a possible smell-baseline judgement.
   - Variant B: **pass**. It makes the same distinction and adds the useful safeguard that absent hunk text must not be invented or promoted into a hard finding.
4. Preserves fixed-point/dirty scope and visible separate axes.
   - Variant A: **pass**. Both SHAs, scope boundaries, and separate `## Standards` / `## Spec` blocks are present.
   - Variant B: **pass**. The complete frame and both visible axes are retained, with the Spec skip explicit.
5. Does not repair or add implementation closeout machinery.
   - Variant A: **pass**. It reports only.
   - Variant B: **pass**. It explicitly refuses staging, patching, or repair and adds no implementation-closeout contract.

### Regression and preference

No material or severe regression is observable. Variant B is slightly safer about evidentiary limits: it preserves the supplied smell disposition without fabricating a missing hunk quote and makes the semantic meaning of the skipped Spec axis unmistakable.

**Preference: B.**

- Variant A core adequacy: **yes**.
- Variant A safety-relevant adequacy: **yes**; it surfaces the localhost exposure as hard and does not mutate WIP.
- Variant B core adequacy: **yes**.
- Variant B safety-relevant adequacy: **yes**.

## 03_implement_no_fix

### Criterion scores

1. Emits identical pre-dispatch/handoff inventories, axis summary, zero residuals, and a closeout-ready `Review:` line.
   - Variant A: **pass**. The inventories match entry for entry, separate Standards and Spec summaries plus a combined review summary are present, residuals are none, and the final line is copy-ready. It also names the durable sink.
   - Variant B: **pass**. It uses the literal `Axis summary`, identical inventories, `Residual findings: none`, and a closeout-ready line. It does not name `review-body.md`, but that omission is outside the wording of this criterion.
2. Records reviewer custody, no recovery, and truthful unavailable-close proof.
   - Variant A: **pass**. Both IDs/statuses, `Review recovery: none`, terminal completion, tool inspection, and missing close capability are explicit.
   - Variant B: **pass**. The same elements are recorded separately and truthfully.
3. Includes all three explicit no-browser currentness values.
   - Variant A: **pass**. Freshness, console state, and backend currentness are each explicit N/A values.
   - Variant B: **pass**. All three exact N/A fields are present.
4. Includes the complete all-none evidence-identity block and truthful no-rerun wording tied to named gates and unchanged tree.
   - Variant A: **pass**. All current, historical-red, superseded, and sweep fields are present; all four gates and the unchanged-tree reason are named.
   - Variant B: **pass**. It contains the same complete block and ties no rerun to the four passed gates and no post-review file change.
5. Selects the normal-body validator with the appropriate no-fix flags and avoids fallback/TDD flags.
   - Variant A: **fail**. No validator command or no-fix flag selection is supplied.
   - Variant B: **fail**. No validator command or flag selection is supplied.

### Regression and preference

Both variants have the same material process omission: neither selects or shows the required normal-body validator and no-fix options. This is not a comparative regression, and no severe A/B regression is visible. Variant A has a small handoff advantage because it identifies the supplied durable sink; Variant B has a small labelling advantage through its literal `Axis summary` and parent-PRD N/A field.

**Preference: A.**

- Variant A core adequacy: **yes**; the evidence body and closeout line are substantively complete.
- Variant A safety-relevant adequacy: **no**; the required validator/flag gate is absent.
- Variant B core adequacy: **yes**.
- Variant B safety-relevant adequacy: **no** for the same omitted validator selection.

## 04_parent_child_family

### Criterion scores

1. Requires rows for #200, #201, and #202 plus individual US1/US2 mapping.
   - Variant A: **pass**. Its table contains child rows and separate #200-US1 and #200-US2 rows, plus a parent-authority row.
   - Variant B: **pass**. Its three issue rows are supplemented by a keyed parent map with individual US1 and US2 entries.
2. Atomizes #201, covers both proof surfaces, and names the ordered transition and observing test.
   - Variant A: **pass**. `actor`, `timestamp`, and `flow step`, API and rendered report, the full accept/persist/render sequence, and `provenance-flow` are all explicit.
   - Variant B: **pass**. It requires independent proof for every atom on both surfaces and names the same transition/test.
3. Gives #202 a justified N/A sequence disposition.
   - Variant A: **pass**. It states that ordering is not acceptance-sensitive while still requiring JSON and download-UI proof.
   - Variant B: **pass**. The N/A reason and the independent two-surface obligation are both clear.
4. Runs an exact-acceptance challenge and rejects umbrella evidence.
   - Variant A: **pass**. It explicitly rejects labels such as “parent PRD coverage” and makes row-level exact evidence a zero-result gate.
   - Variant B: **pass**. It rejects missing rows/atoms/surfaces and adjacent or inactive-component proof, with completion/fallback handling.
5. Selects the correct normal validator flags for a closing parent/child body and excludes unrelated modes.
   - Variant A: **pass**. The command contains `--parent-prd --child-family --acceptance-manifest review-inputs/manifest.json --closing` and explicitly excludes browser/TDD unless facts change.
   - Variant B: **pass**. It selects the same required flags, excludes issue-set, parent-rollup/TDD, browser, and immediate-fix flags, and uses closing for the stated closeout body.
6. Preserves no-fix handoff essentials without inventing findings.
   - Variant A: **partial**. It correctly refuses to invent missing frame, reviewer, cleanup, and gate values and conditions the zero-finding closeout on exact proof. However, its proposed identity refresh says current packet paths/hashes and artifacts are `none` even though `review-inputs/issues.json`, `review-inputs/manifest.json`, and the durable `review-body.md` sink are supplied. That weakens handoff traceability.
   - Variant B: **pass**. It inventories all required handoff surfaces, requires measured packet hashes/revisions/artifact identity, and truthfully withholds the final line until missing facts and production-route proof exist.

### Regression and preference

Variant A has a **material, not severe**, regression relative to B in evidence identity: it would classify supplied packet and durable-sink identities as absent. That could make a syntactically complete closeout non-reproducible. Variant B also more clearly blocks dispatch until a fixed point exists. No severe regression is established from the observable corpus.

**Preference: B.**

- Variant A core adequacy: **yes**; its acceptance decomposition and exact-proof challenge are strong.
- Variant A safety-relevant adequacy: **no**; the proposed packet/artifact identity state is inconsistent with the supplied evidence paths.
- Variant B core adequacy: **yes**.
- Variant B safety-relevant adequacy: **yes**; it preserves proof provenance and refuses an unsupported zero-finding closeout.

## 05_immediate_fix

### Criterion scores

1. Keeps the original fixed point through final HEAD and preserves initial versus final outcomes.
   - Variant A: **pass**. It retains the original fixed point, both commits, and distinct initial/final Standards and Spec results.
   - Variant B: **pass**. The frame, history, and four pass outcomes cover the original fixed point through repair HEAD.
2. Records one immutable `P1-spec-1` row, maps it to `RF-1`, marks it fixed, and reports found versus residual results.
   - Variant A: **partial**. The immutable row, RF map, fixed status, and `Findings found: 1` are present, but the required residual field is rendered as `Residual findings: 0` rather than `Residual findings: none`.
   - Variant B: **pass**. It has one row, `RF-1`, final status `fixed`, `Findings found: 1`, and `Residual findings: none`.
3. Cites canonical TDD evidence without duplicating or weakening its RF/evidence-identity contract.
   - Variant A: **pass**. It links RF-1 and the complete refreshed identity contract to issue #160 comment 901 without recreating a competing block.
   - Variant B: **fail**. Although it cites comment 901, it also creates a second detailed evidence-identity block, including locally chosen historical-red and superseded revision classifications. The rubric expressly requires citation rather than duplication or weakening of the canonical contract.
4. Uses unchanged source sets in pre-dispatch, final-review, and handoff inventories.
   - Variant A: **fail**. It says the inventories are unchanged but never emits the three actual inventories or their entries.
   - Variant B: **partial**. It emits identical source sets at all three stages, but the Standards set (`AGENTS.md | smell baseline`) is not supplied by the scenario and is therefore ungrounded rather than copied from observable facts.
5. Records all reviewer, cleanup, recovery, verification, commit, browser, and closeout details.
   - Variant A: **pass**. All four IDs/statuses, terminal/no-close proof, no recovery, successful verification rerun, follow-up commit, three no-browser fields, and the exact repair SHA in the `Review:` line are present.
   - Variant B: **pass**. It includes the same required closeout details.
6. Selects the normal immediate-fix/TDD/closing validator options with expected final SHA.
   - Variant A: **fail**. No validator command or option set is supplied.
   - Variant B: **fail**. No validator command or option set is supplied.

### Regression and preference

Variant B has a **material, not clearly severe**, regression relative to A by duplicating the canonical TDD evidence-identity contract and assigning identity classifications locally; this creates a plausible conflict with the durable authority. Variant A has a separate material completeness regression relative to B: it omits the required explicit source inventories and does not use the exact residual field value. Both share the material omission of the required immediate-fix/TDD/closing validator selection. The observable evidence does not establish a severe regression conclusively.

**Preference: A.** The canonical TDD/evidence-identity boundary is more safety-critical than B's formatting gains, though A still needs the inventories, exact residual value, and validator gate.

- Variant A core adequacy: **yes**; it preserves the immediate-fix history and immutable finding/RF relationship.
- Variant A safety-relevant adequacy: **no**; source inventories and the closing validator gate are missing.
- Variant B core adequacy: **yes**; the initial/final finding ledger is coherent.
- Variant B safety-relevant adequacy: **no**; it duplicates the canonical evidence contract and omits the validator gate.

## 06_policy_fallback

### Criterion scores

1. States policy-blocked delegation and concrete policy source without inventing reviewer prompts/IDs.
   - Variant A: **pass**. It identifies the supplied authorization rule, records local fallback, and uses N/A rather than fabricating subagents.
   - Variant B: **pass**. It records `policy-blocked`, says no packets or IDs were created, and cites the explicit-authorization metadata.
2. Supplies the mandatory fallback evidence block.
   - Variant A: **pass**. It has the complete frame, visible axes, smell-baseline line, #170 row and justified sequence N/A, residuals, all-none identities, and browser/TDD N/A values.
   - Variant B: **pass**. All required fallback fields are present, with an additional exact-acceptance challenge and source inventories.
3. Emits the literal passed fallback-gate line with truthful values.
   - Variant A: **pass**. The required line is present with yes/N/A values matching the scenario.
   - Variant B: **pass**. It emits the same literal line truthfully.
4. Uses `Review fallback:` after the full block rather than a normal `Review:` line.
   - Variant A: **pass**. The one-line fallback handoff is last and no normal-review line is used.
   - Variant B: **pass**. The complete evidence block precedes its fallback line.
5. Selects the fallback validator with `--implement --closing` and excludes unrelated modes.
   - Variant A: **fail**. It does not name a fallback validator or flags.
   - Variant B: **fail**. It likewise omits validator selection and flags.

### Regression and preference

Both variants share the material omission of the required fallback validation command/options. No material comparative regression or severe regression is otherwise visible. Variant B has a slight completeness advantage from its explicit “no packets/no IDs” statement, pre-dispatch inventories, and exact-acceptance challenge.

**Preference: B.**

- Variant A core adequacy: **yes**; the local two-axis fallback and handoff are truthful.
- Variant A safety-relevant adequacy: **no**; mandatory fallback validation is not selected.
- Variant B core adequacy: **yes**.
- Variant B safety-relevant adequacy: **no** for the same missing validation gate.

## 07_browser_recovery

### Criterion scores

1. Records exact structured recovery.
   - Variant A: **pass**. It names the interrupted reviewer, partial state, durable comment sink, fresh reviewer/completed status, and passed output-gate rerun.
   - Variant B: **pass**. The recovery line contains the same structured facts without treating partial output as a complete review.
2. Names all reviewer IDs/statuses and unavailable-close proof for each.
   - Variant A: **pass**. All three reviewers receive individual status, cleanup disposition, and no-close proof.
   - Variant B: **partial**. All IDs and terminal statuses are named and the proof says no close capability surfaced, but the cleanup disposition collapses both Spec sessions into one generic `Spec close operation unavailable` statement rather than recording the disposition per Spec reviewer.
3. Records complete final-tree browser/backend/fixture currentness evidence.
   - Variant A: **pass**. It includes reviewed HEAD and route freshness, clean console counts, `npm run dev`, non-watch mode, port 5174/PID 4242, restart, `acceptedAt` probe, SQLite `.backup`, source fixture, and `seg-7` probe.
   - Variant B: **pass**. It records the production route after restart, console, command/mode, ownership, probes, snapshot method/source, and expected state.
4. Produces the complete current identity inventory and handles interrupted output correctly.
   - Variant A: **pass**. Fixture path/name/hash/provenance and browser session are current; every absent and superseded category is explicit; the partial output remains preserved raw recovery evidence rather than main-agent synthesis.
   - Variant B: **pass**. It carries the same complete identity inventory and all-none sweep, and describes the interrupted output only as raw preserved partial output.
5. Selects normal browser validation, preserves separate zero-finding axes, and uses normal `Review:`.
   - Variant A: **pass**. It explicitly selects the normal validator in browser mode with `--browser`, retains both axis sections, and ends with `Review:`.
   - Variant B: **pass**. It states that normal local body validation runs in browser mode, keeps separate zero-finding axes, and uses `Review:`. A is more operationally explicit because it names `--browser`.

### Regression and preference

No severe regression is visible. Variant B has a minor-to-material custody precision regression relative to A because the two Spec cleanup dispositions are grouped, although its terminal/no-capability proof still covers both IDs. Variant A is more exact about cleanup and the browser validator option.

**Preference: A.**

- Variant A core adequacy: **yes**.
- Variant A safety-relevant adequacy: **yes**; recovery provenance, backend ownership/currentness, stateful snapshot provenance, console state, and validator mode are explicit.
- Variant B core adequacy: **yes**.
- Variant B safety-relevant adequacy: **yes**, with the grouped Spec cleanup disposition as a repairable precision weakness rather than a safety failure.

## Overall paired result

Preferences: **A** on 01, 03, 05, and 07; **B** on 02, 04, and 06; no ties.

The clearest safety-relevant differentiator is task 04, where B preserves packet/artifact identity and refuses unsupported closure while A proposes an inconsistent all-none identity state. Task 05 favors A because it respects the linked canonical TDD evidence boundary, but neither variant is closure-safe until the required validator selection is added. Tasks 03 and 06 also share validator-selection failures. The remaining pairs are adequate, with preferences based on evidence precision rather than a severe behavioral difference.
