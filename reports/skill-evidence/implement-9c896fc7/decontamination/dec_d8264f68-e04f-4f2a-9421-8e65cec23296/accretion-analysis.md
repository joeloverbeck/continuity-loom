# Implement skill structure and provenance classification

This classification was completed after the corpus and all seven current-skill outputs were frozen, and before a candidate directory existed. Categories are those defined by the eligible-run protocol. Each row is one coherent substantive instruction group and has exactly one category.

## Classification

| Surface / coherent group | Category | Candidate treatment and justification |
|---|---|---|
| `SKILL.md` frontmatter trigger and implement-the-request sentence | Core trigger or output contract | Preserve; this is the skill identity. |
| `SKILL.md` phase-specific reference routing | Current repository convention with a canonical owner | Preserve as concise progressive-disclosure routing. |
| `SKILL.md` independent-through-EOF reading ceremony | One-off defensive exception | Distill to “read a selected reference completely”; the bounded-chunk/truncation story is generic host behavior, not implementation-domain behavior. |
| `SKILL.md` live tracker intake, exact bodies/comments, related children/blockers | Necessary safety or state-integrity invariant | Preserve; prevents implementation against stale or incomplete scope. |
| `SKILL.md` full ledger column inventory and exact first-edit sentence | Duplicated instruction | Keep the invariant in `scope-ledger.md`; retain only a concise hard gate in `SKILL.md`. |
| `SKILL.md` external-proof preflight | Necessary safety or state-integrity invariant | Preserve; unavailable acceptance proof must block or be explicitly reduced before edits. |
| `SKILL.md` issue-by-issue or explicitly integrated execution | Core trigger or output contract | Preserve. |
| `SKILL.md` embedded TDD field inventory and exact TDD gate transport | Current repository convention with a canonical owner | Replace with a pointer to the repository `tdd` contract and retain only the requirement to carry its durable result. |
| `SKILL.md` browser proof, resume revalidation, focused/root verification | Necessary safety or state-integrity invariant | Preserve concisely, with detailed conditions owned by `implementation-evidence.md`. |
| `SKILL.md` acceptance exactness atoms/proof surfaces/sequence | Necessary safety or state-integrity invariant | Preserve; executable closeout validation depends on this exact evidence shape. |
| `SKILL.md` tracked-report versus publishable-closeout two-sink rule | Necessary safety or state-integrity invariant | Preserve once; remove restatements elsewhere. |
| `SKILL.md` exact pre-stage and commit gate prose | Audit bookkeeping, report conformance, custody ceremony, self-audit scaffolding | Replace with short outcome gates; the exact body contract is executable in helper validation and need not occupy the orchestration path. |
| `SKILL.md` mandatory code review and fixed-point/fallback route | Necessary safety or state-integrity invariant | Preserve, delegating the full review shape to `code-review`. |
| `SKILL.md` embedded review-fix inventories and structured builder switch details | Duplicated instruction | Route to `review-evidence.md` and `closeout-templates.md`; do not repeat in the entrypoint. |
| `SKILL.md` tracker closeout hard stop and exact readback | Necessary safety or state-integrity invariant | Preserve prominently. |
| `SKILL.md` residual-summary wording, evidence-identity cleanup, and body-field inventory | Current tool-specific requirement | Keep behind closeout references/helper output, not duplicated in the common path. |
| `scope-ledger.md` dirty-tree ownership, exact issue capture, dependency classification | Necessary safety or state-integrity invariant | Preserve. |
| `scope-ledger.md` repository-specific `/tmp/worldloom-issues.json` example | Current tool-specific requirement | Generalize the filename while preserving the canonical capture helper. |
| `scope-ledger.md` Principles/domain-doc lookup | Current repository convention with a canonical owner | Preserve as conditional routing through active repository guidance. |
| `scope-ledger.md` artifact disposition and module ownership decisions | Necessary safety or state-integrity invariant | Preserve. |
| `scope-ledger.md` long ledger prose plus exact first-edit recitation | Audit bookkeeping, report conformance, custody ceremony, self-audit scaffolding | Reduce to a compact required ledger and stop condition. |
| `implementation-evidence.md` seam selection, docs-only N/A, issue-by-issue execution | Core trigger or output contract | Preserve. |
| `implementation-evidence.md` copied full TDD closeout field list | Current repository convention with a canonical owner | Replace with a pointer to the `tdd` skill’s canonical closeout evidence. |
| `implementation-evidence.md` ownership placement check | Necessary safety or state-integrity invariant | Preserve. |
| `implementation-evidence.md` browser production-route/action proof | Necessary safety or state-integrity invariant | Preserve. |
| `implementation-evidence.md` browser/API special cases, port ownership, cleanup, console, freshness, backend currentness | Correct but disproportionately costly rare-case rule | Condense to a conditional browser-proof checklist; keep stateful fixture safety as a conditional branch. |
| `implementation-evidence.md` Worldloom SQLite `.backup` anecdote | Incident narrative, dated witness, commit anecdote, or audit provenance | Remove the product name and retain the transferable invariant: use an application-consistent snapshot, not a raw copy of a live stateful store. |
| `implementation-evidence.md` hidden local fixture identity exact sentence | Correct but disproportionately costly rare-case rule | Route to generated scaffold/validator help; retain only the privacy invariant. |
| `implementation-evidence.md` resume revalidation | Necessary safety or state-integrity invariant | Preserve. |
| `implementation-evidence.md` package/lock synchronization and workspace built-output recovery | Current tool-specific requirement | Keep as concise applicability checks. |
| `implementation-evidence.md` runner/plugin/harness recovery narrative | One-off defensive exception | Replace with a durable rule: preserve the original failure, prove equivalence of any substitute, otherwise report blocked. |
| `implementation-evidence.md` verification-command ledger | Necessary safety or state-integrity invariant | Preserve; final claims must be bound to the final tree. |
| `implementation-evidence.md` acceptance exactness challenge | Necessary safety or state-integrity invariant | Preserve once. |
| `implementation-evidence.md` repeated staging gate field bodies | Audit bookkeeping, report conformance, custody ceremony, self-audit scaffolding | Collapse to staging invariants; helper/tests own literal conformance. |
| `review-evidence.md` invoke `code-review`, fixed point, fallback only when canonical review says so | Necessary safety or state-integrity invariant | Preserve. |
| `review-evidence.md` full copied fallback report template | Duplicated instruction | Remove; `code-review` is the canonical owner and implement must carry its returned evidence unchanged. |
| `review-evidence.md` review-fix red-first, refresh SHA/gates/browser proof | Necessary safety or state-integrity invariant | Preserve concisely. |
| `review-evidence.md` five-category evidence-identity serialization and regex lore | Audit bookkeeping, report conformance, custody ceremony, self-audit scaffolding | Route to scaffold/validator; retain final-evidence freshness as the domain invariant. |
| `review-evidence.md` exact accepted-residual wording | Current tool-specific requirement | Preserve via validator-emitted output, not hand-authored prose. |
| `tracker-closeout-gates.md` acceptance manifest, exact audit rows, final SHA, review/TDD/browser evidence | Necessary safety or state-integrity invariant | Preserve as the closeout predicate. |
| `tracker-closeout-gates.md` repeated validator matrix and exact flag combinations | Current tool-specific requirement | Keep one compact matrix and direct agents to `--help`; remove duplicate command variants. |
| `tracker-closeout-gates.md` repeated placeholder/token/body regex explanations | Audit bookkeeping, report conformance, custody ceremony, self-audit scaffolding | Let `validate-closeout-body.mjs` decide; preserve “validator must pass on exact body.” |
| `tracker-closeout-gates.md` mutation-ready emitted preflight | Necessary safety or state-integrity invariant | Preserve; use helper stdout verbatim. |
| `tracker-closeout-gates.md` post-comment exact body verification and ambiguous-mutation recovery | Necessary safety or state-integrity invariant | Preserve. |
| `tracker-closeout-gates.md` exact-number child/parent state readback | Necessary safety or state-integrity invariant | Preserve. |
| `child-family-closeout.md` child-before-parent ordering, shared evidence URL, exact readback | Necessary safety or state-integrity invariant | Preserve. |
| `child-family-closeout.md` three overlapping family-size/fixed-child sequences | Duplicated instruction | Merge into one sequence with conditional fixed-template and split-body branches. |
| `child-family-closeout.md` low-headroom split-core ceremony | Correct but disproportionately costly rare-case rule | Retain behind an explicit low-headroom trigger and route mechanics to `closeout-templates.md`. |
| `closeout-templates.md` scaffold-builder and validator CLI cookbook | Current tool-specific requirement | Preserve as the canonical operator reference. |
| `closeout-templates.md` hand-authored full parent body and full review/TDD fallback templates | Duplicated instruction | Remove from runtime; the builder emits the authoritative scaffold and sibling skills own their evidence blocks. |
| `closeout-templates.md` structured evidence JSON schema | Domain knowledge unavailable to a general agent | Preserve in a compact schema because the builder consumes it. |
| `closeout-templates.md` numerous validator-regex repair anecdotes and copy/paste pass phrases | Incident narrative, dated witness, commit anecdote, or audit provenance | Remove from runtime; `--help`, errors, and tests retain current executable truth. |
| `closeout-templates.md` blocked closeout handoff | Core trigger or output contract | Preserve in compact form. |
| manifest, scaffold, validation, split-core, capture, and exact-comment scripts | Current tool-specific requirement | Preserve unchanged; these are executable owners of the closeout contract. |
| all helper tests except prose-conformance assertions | Necessary safety or state-integrity invariant | Preserve unchanged. |
| prose-conformance test that asserts dozens of historical phrases across every guide | Audit bookkeeping, report conformance, custody ceremony, self-audit scaffolding | Replace with a small test for canonical routing and safety invariants; do not require retired prose to remain. |

## Provenance and risk patterns

- The skill arrived in this repository already large, then accumulated changes in seven consecutive commits over four days before audit retirement. Commit messages and event reports establish repeated mutation, not necessity.
- The runtime documentation contains the same closeout facts in `SKILL.md`, `implementation-evidence.md`, `review-evidence.md`, `tracker-closeout-gates.md`, `child-family-closeout.md`, and `closeout-templates.md`; executable helpers then enforce many of them again.
- Exact validator tokens and historical workaround phrases are often presented as domain guidance. The transferable rule is to generate and validate the exact body; regex-repair lore need not be preloaded.
- Browser/stateful-fixture safety is real, but common-path prose contains many rare branches. The candidate should retain a conditional checklist and leave exact field syntax to canonical sibling skills and validators.
- The three recorded friction events are treated only as prompts to reproduce cost and scope-shape behavior. They are not an answer key and do not authorize functional fixes, including the single-child/non-sibling scaffold defect.

## Candidate hypothesis

Keep every executable helper intact. Replace the seven prose surfaces with a smaller state-machine: live-scope intake; owned, test-first implementation; fixed-point review; generated-and-validated closeout; exact tracker readback. Delegate TDD and review evidence shapes to their canonical skills, delegate closeout syntax to the builder/validator, retain conditional browser/stateful-fixture safety, and remove copied templates, regex lore, repeated literal gates, and incident-specific examples.
