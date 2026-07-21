# Blind paired evaluation

## Variant A

| Rubric requirement | Verdict | Response evidence |
|---|---|---|
| Reads all live parent/child items and prerequisite state before edits | Pass | The intake exact-reads PRD #1 and issues #2-#9 with bodies, comments, labels, and states, searches for other parent-linked items across states, classifies them, and derives a topologically sorted dependency graph before coding (lines 7-26). |
| Establishes per-child acceptance/evidence/dependency rows and works blocker-first | Pass | The initial ledger has separate rows for #2 through #9 with dependencies, acceptance/authority, planned evidence, status, and closeout state; it promises exact criterion rows rather than grouped summaries (lines 47-63). Implementation proceeds only after the refill/proof gates and in dependency order, retaining separate evidence even for inseparable work (line 67). |
| Allows only the smallest greenfield bootstrap needed to establish the named test seam, then uses red/green slices | Pass | The bootstrap is limited to the workspaces, strict configuration, scripts, runner, commands, and lockfile required by the issue, and missing tooling is explicitly rejected as a behavioral red (line 69). Subsequent exporter, public-port, replay, and remaining-functional slices require intended-reason reds and narrow greens through public seams (lines 70-73). |
| Resolves the prose/oracle conflict through explicit source authority and records the divergence | Pass | The Python harness is treated as the named fidelity oracle; its observed refill timing controls the port and parity tests, while the conflicting child prose is recorded as an issue-text inconsistency. If both are independently normative without precedence, the child and parent remain blocked pending an authoritative correction (line 26). |
| Preserves unrelated dirt and stages only owned files | Pass | Pre-existing dirty paths are captured before edits and the documentation changes are declared unrelated and untouchable (line 5). The artifact/ownership section repeats that they remain unmodified and unstaged (lines 37 and 45), and the staging gate requires explicit owned paths plus a cached-name inspection excluding those docs (line 106). |
| Runs focused plus repository-wide gates and deterministic fixture byte comparison | Pass | The exporter runs the oracle twice from identical input and compares both output bytes and SHA-256 identities (line 70). The command ledger includes the focused public-seam runner, full replay/parity, install, lint, typecheck, test, build, and hosted-CI proof when required (lines 77-89), followed by final-commit reruns (line 112). |
| Closes children only after their own proof, exact-reads all child states, then closes and exact-reads the parent | Pass | Each child may close only when its own rows are satisfied (line 144); every child is read back by exact number and all eight CLOSED states are durably recorded (line 145). The parent closes only after those reads and its own rows pass, then #1-#9 are exact-read again after parent closure (lines 146-147). |
| Uses the final commit SHA in closeout | Pass | Every child ledger row requires the final-SHA command ledger (lines 121-128); the shared evidence includes final SHA/reachability (line 131), and the fixed child close text is explicitly `Completed by FINAL_SHA` (lines 140-142). |

Material regression: none.

Severe regression: none. In particular, the response never closes the parent before the children; posting the parent-hosted evidence rollup first is clearly distinguished from closing PRD #1, which occurs only after child CLOSED readbacks.

## Variant B

| Rubric requirement | Verdict | Response evidence |
|---|---|---|
| Reads all live parent/child items and prerequisite state before edits | Pass | Before editing, it reads repository authorities and exact-reads #1-#9 with body, comments, labels, state, dependencies, and blockers; it also discovers and classifies additional parent-linked candidates (lines 5-15). It resolves the live dependency DAG before choosing the first implementation action (line 16). |
| Establishes per-child acceptance/evidence/dependency rows and works blocker-first | Pass | The initial scope ledger provides individual #2-#9 rows with dependencies/blockers, exact atoms, authority, proof seam, disposition, and status (lines 18-32). Work begins with the earliest unblocked DAG node (line 16), and an unresolved oracle conflict blocks the affected child, all semantic dependents, and the parent (lines 44-50). |
| Allows only the smallest greenfield bootstrap needed to establish the named test seam, then uses red/green slices | Pass | The bootstrap is expressly limited to the manifest, package/workspace structure, strict configuration, runner, scripts, and minimal public boundary required by the issue; missing tooling is setup evidence rather than red (line 56). Exporter and TypeScript-port slices then obtain intended-reason failing assertions/tests before the narrow implementation turns them green (lines 57-58). |
| Resolves the prose/oracle conflict through explicit source authority and records the divergence | Pass | It makes the discrepancy an authority gate, records both the exact oracle designation and conflicting sentence, follows the harness only when live authority makes it binding and prose non-normative, and preserves the divergence in the ledger and tests (lines 44-47). Ambiguous or independently normative prose blocks the child/dependents and requests an authority decision (line 48). |
| Preserves unrelated dirt and stages only owned files | Pass | The existing docs changes are classified as unrelated user-owned dirt and excluded from editing, staging, committing, and cleanup (line 6). Pre-stage/stage steps expose the owned file list, stage only explicit owned paths, inspect cached names, and unstage any pre-existing doc without reverting it (lines 83-85). |
| Runs focused plus repository-wide gates and deterministic fixture byte comparison | Pass | Fixture export is run twice from the same source and must prove byte/hash identity (line 57). The verification ledger includes oracle, fixture reproducibility, focused public-seam TDD, full replay/parity, lint, typecheck, test, build, CI when required, and final-tree freshness (lines 64-79). |
| Closes children only after their own proof, exact-reads all child states, then closes and exact-reads the parent | Pass | Tracker mutation is gated on the validated exact body (line 101). Children close individually only when their own rows pass and are exact-read after each mutation (line 110), all eight are exact-read again before the parent predicate can pass (line 111), and the parent is then closed and exact-read, followed by a final #1-#9 readback (lines 112-114). |
| Uses the final commit SHA in closeout | Pass | The rollup contains the final SHA and final-tree evidence (line 95); the fixed child text substitutes the real final SHA (lines 104-108); final parent validation is final-SHA-bound (line 112), and completion reporting again requires the final SHA (line 143). |

Material regression: none.

Severe regression: none. The parent is explicitly held open until every child is exact-read CLOSED, so there is no parent-before-child closure.

## Overall decision

**Tie.** Both variants materially satisfy all eight deterministic requirements and avoid the sole specified severe regression. Variant A supplies somewhat more command-level closeout detail; Variant B states the source-authority decision tree and meaningful-red bootstrap boundary somewhat more crisply. Those are offsetting presentation strengths, not rubric-level correctness differences.
