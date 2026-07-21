# Independent structure and provenance classification

Scope: the claimed baseline copies of `SKILL.md`, `evidence-identities.md`, and `fallback-evidence.md`, plus Git history for the matching live files under `.claude/skills/code-review`. The three baseline files are byte-identical to the live files at analysis time. No corpus rubric, trial output, candidate, live target, event stream, or gate status was read or changed.

Each substantive instruction or coherent instruction group below has exactly one category. Headings, blank lines, and Markdown fence delimiters are not separate instructions. Where one source line contains two independent instructions, the quoted anchor distinguishes them.

## Category key

| ID | Eligible-run category |
|---|---|
| C1 | Core trigger or output contract |
| C2 | Domain knowledge unavailable to a general agent |
| C3 | Necessary safety or state-integrity invariant |
| C4 | Current repository convention with a canonical owner |
| C5 | Current tool-specific requirement |
| C6 | Duplicated instruction |
| C7 | Incident narrative, dated witness, commit anecdote, or audit provenance |
| C8 | One-off defensive exception |
| C9 | Audit bookkeeping, report conformance, custody ceremony, self-audit scaffolding |
| C10 | Stale empirical quantity or environment assertion |
| C11 | Contradictory or instruction-competing clause |
| C12 | Correct but disproportionately costly rare-case rule |

## Exhaustive classification

### `baseline/SKILL.md`

| ID | Location and coherent group | Category | Concrete basis |
|---|---|---|---|
| S01 | 1–3, frontmatter trigger and description | C1 | Defines when the skill applies and its promised two-axis result. |
| S02 | 6–11, Standards/Spec axes and standalone-vs-`implement` orientation | C1 | Defines the review's central behavior and output boundary. |
| S03 | 13, parallel delegation subject to surfaced policy, with local fallback | C5 | Behavior depends on the host's current sub-agent policy and capabilities. |
| S04 | 15, route missing tracker setup to `/setup-matt-pocock-skills` | C4 | Concise pointer to the repository's setup owner. |
| S05 | 19–33, fixed-point selection, original-frame retention, durable SHA/diff/commit frame, dirty-worktree scope, and early ref/diff checks | C1 | Establishes the object being reviewed and prevents a review of the wrong or empty change set. |
| S06 | 35–43, ordered spec-source discovery and confirmed no-spec route | C1 | Defines the Spec axis input and the no-spec behavior. |
| S07 | 45, Principles/domain-authority/ADR resolution | C4 | Defers authority selection to `ACTIVE-DOCS.md` and `docs/agents/domain.md`. |
| S08 | 47, exact pre-dispatch Spec inventory and durable-sink syntax | C9 | An exact-label provenance ledger used for later reconciliation. |
| S09 | 49–53, identify concrete standards sources and axis placement of principles | C1 | Defines the Standards axis authorities. |
| S10 | 55, exact pre-dispatch Standards inventory and literal smell token | C9 | Report-conformance ledger rather than review analysis itself. |
| S11 | 57–75, Fowler smell baseline, override/judgement rules, and twelve smells with remedies | C2 | Supplies a fixed review-method taxonomy not derivable from repository files alone. |
| S12 | 77–79, tool discovery, policy-blocked dispatch rules, and separated local execution | C5 | Branches on the current host's agent/tool surface. |
| S13 | 81, sub-agent completion/closure dispositions and proof | C5 | Exact lifecycle actions and dispositions depend on the host's close/inventory surface. |
| S14 | 83, interrupted/partial reviewer recovery and main-agent-synthesis fallback | C8 | Specialized defensive path for a partially returned reviewer result. |
| S15 | 85, pre/final/handoff authority-set reconciliation | C9 | Custody ledger for which authorities each pass saw. |
| S16 | 87, conditional pointer to the fallback owner | C4 | `fallback-evidence.md` is named as the canonical fallback contract. |
| S17 | 89, “validator-safe prose” and angle-token clause | C5 | Exists because the current nested parser treats angle tokens as placeholders. |
| S18 | 89, published-artifact cleanup/disposition clause | C3 | Prevents durable evidence from claiming inspectability after a proof artifact is removed. |
| S19 | 91, normal immediate-fix durable-sink field hard stop, including copied TDD fields | C9 | Large exact-label report-conformance and custody gate. |
| S20 | 93–117, normal no-fix compact handoff field set | C9 | Mandatory evidence-shape ledger for `implement` handoff. |
| S21 | 119, multi-pass/multiple-review-fix structured evidence JSON branch | C12 | Conditional machinery for a comparatively rare multi-pass closeout case. |
| S22 | 121, Large Tracker Body Workflow pointer and code-review overlay boundary | C4 | Defers size planning/publication mechanics to the implement-owned canonical contract. |
| S23 | 123 except the byte ceiling, normal-body validator command, flags, manifests, nesting, and nonlocal-sink fallback | C5 | Exact behavior is coupled to current validator and builder CLIs. |
| S24 | 123, hard-coded `65,536-byte` GitHub body ceiling | C10 | External service limit is embedded as an exact environment quantity. |
| S25 | 125–135, closeout-ready `Review:`/`Review fallback:` lines, accepted-residual semantics, and unchanged-tree rerun disposition | C1 | Defines caller-facing review outcomes and truthful result wording. |
| S26 | 137, browser-sensitive behavior-fix freshness requirement | C3 | Prevents stale browser proof after review changes a browser-consumed path. |
| S27 | 139, backend/process/fixture currentness and SQLite snapshot correctness | C3 | Prevents false UI proof against a stale process or inconsistent fixture snapshot. |
| S28 | 141, non-semantic-fix browser-rerun exception | C8 | Narrow exception replacing a rerun with path-specific targeted proof. |
| S29 | 143, commit-metadata-only browser-rerun exception | C8 | Narrow exception for unchanged tracked bytes after proof. |
| S30 | 145–151, Standards reviewer packet and brief | C1 | Defines the Standards-axis delegated review input and output. |
| S31 | 153–158, base Spec reviewer packet and source-inventory match | C1 | Defines the Spec-axis delegated review input. |
| S32 | 159–168, issue tables, parent/user-story/list/composite/sequence/route/browser-N/A/exact/nonlocal acceptance checks | C6 | The same acceptance checklist is restated in `fallback-evidence.md:20–31`. |
| S33 | 169, include repo-native domain authorities in the Spec packet | C4 | Points to authorities selected by the repository's domain owner. |
| S34 | 170, Spec finding brief and narrative limit | C1 | Defines the Spec reviewer result. |
| S35 | 171, zero-residual response shape hard stop | C9 | Rejects output on ledger/table/field conformance before aggregation. |
| S36 | 173, skip Spec reviewer on confirmed missing spec | C1 | Core no-spec branch. |
| S37 | 175–177, pre-fix two-axis presentation gate | C1 | Preserves separate initial outcomes before any repair. |
| S38 | 179, mandatory fallback block before implementation pre-close audit | C6 | Restates the owner rule in `fallback-evidence.md:7–13,45,117`. |
| S39 | 181, resume/compaction/interruption reconstruction procedure | C12 | Costly conditional recovery path outside the normal review flow. |
| S40 | 183, per-axis final summary without cross-axis reranking | C1 | Core output semantics. |
| S41 | 185, immediate-fix/TDD/re-review/browser-freshness procedure | C4 | These are repository closeout conventions with `tdd` and `implement` as named owners; the runtime block copies their mechanics instead of only pointing. |
| S42 | 187–211, immediate-fix outcomes, immutable finding ledger, sub-agent/recovery/cleanup, and source inventories | C9 | Detailed closeout bookkeeping and custody schema. |
| S43 | 212–219, copied TDD, sequence, verification, browser/backend, and identity fields | C6 | Repeats contracts owned in TDD, evidence identities, and earlier SKILL clauses. |
| S44 | 220–224, commit/residual/parent/evidence-line/axis-summary fields | C9 | Remaining exact closeout ledger and report shape. |
| S45 | 226–233, rationale for keeping Standards and Spec separate | C1 | Explains the central two-axis contract and masking hazard. |

### `baseline/evidence-identities.md`

| ID | Location and coherent group | Category | Concrete basis |
|---|---|---|---|
| E01 | 1–13, shared identity-refresh mandate, four-line identity template, historical-red retention, and per-token superseded sweep | C9 | Evidence custody inventory and self-check ceremony expressed as exact report fields. |
| E02 | 15, delimiter and normalization grammar | C5 | Coupled to current validator parsing rules. |
| E03 | 17, withheld local-path form with stable ID, hash, and provenance | C3 | Preserves identity while honoring a privacy/authority restriction. |
| E04 | 19, nested-validator angle-token rule | C5 | Parser-specific syntax restriction. |
| E05 | 21–23, published-artifact lifecycle and browser fixture snapshot/currentness rule | C3 | Prevents deletion/stale-state errors from invalidating proof while durable claims remain. |
| E06 | 25–44, regex-passing examples for cleanup, sequence, sweeps, accepted residuals, and forbidden placeholder words | C5 | Explicitly teaches exact tokens accepted or rejected by current validator regexes. |

### `baseline/fallback-evidence.md`

| ID | Location and coherent group | Category | Concrete basis |
|---|---|---|---|
| F01 | 1–3, fallback-only trigger and ownership statement | C1 | Defines when this branch applies and what output it owns. |
| F02 | 5–8, non-bypassable durable fallback block and required fields | C9 | Mandatory report-shape and custody gate. |
| F03 | 9–10, copied canonical TDD preflight/row/map/gate details and structural validation | C6 | Repeats the contract owned by `../tdd/closeout-evidence.md` rather than stopping at the pointer. |
| F04 | 11, validator-safe angle-token prose | C5 | Current nested-parser requirement. |
| F05 | 12, proof-artifact cleanup lifecycle | C6 | Repeats `evidence-identities.md:21` and `SKILL.md:89`. |
| F06 | 13, stop on any missing/implied field | C9 | Report-conformance hard stop. |
| F07 | 15–19, fallback reason, shared inputs, and separated Standards/Spec outputs | C1 | Core local execution equivalent of the two review axes. |
| F08 | 20, per-issue coverage table trigger | C1 | Defines Spec fallback output for issue families/sets. |
| F09 | 21, acceptance-manifest builder and validator scope | C5 | Exact current helper and flags. |
| F10 | 22–30, parent/list/user-story/composite/sequence/route/browser-N/A/exact-acceptance checks | C6 | Restates `SKILL.md:159–167` for the fallback path. |
| F11 | 31, cold external LLM/fresh-subagent/credentialed/nonlocal proof branch | C12 | Specialized acceptance class with a comparatively costly proof requirement. |
| F12 | 32–36, exact sources, smell treatment/field, and axis summary | C6 | Repeats the core Standards/Spec output rules already stated in `SKILL.md`. |
| F13 | 37–38, found-vs-residual and accepted-residual result semantics | C1 | Prevents fixed or accepted findings from disappearing from the review result. |
| F14 | 39–42, shape hard stop, pass-only literal gate, and body token sweep | C9 | Self-audit and exact report-conformance scaffold. |
| F15 | 43, implement-owned large-body workflow pointer and overlay boundary | C4 | Correctly routes split/publication mechanics to their canonical owner. |
| F16 | 44 except the byte ceiling, fallback validator CLI, flags, manifests, nested-validator recovery, and manual equivalent | C5 | Exact current validator/tool behavior. |
| F17 | 44, hard-coded `65,536-byte` GitHub body ceiling | C10 | External service quantity embedded in runtime prose. |
| F18 | 45, full-block placement and one-line non-substitution rule | C9 | Durable closeout custody requirement. |
| F19 | 47–70, mandatory template review frame and Standards/Spec sections/table/sequence | C1 | Concrete fallback form for the core review result. |
| F20 | 72–80, residual-finding and accepted-residual template | C1 | Core truthful outcome contract. |
| F21 | 82, full copied TDD closeout gate placeholder | C6 | Repeats both the TDD owner and `fallback-evidence.md:9–10`. |
| F22 | 84–86, browser freshness, console state, and backend currentness fields | C3 | Prevents stale or tainted browser/backend proof. |
| F23 | 88, evidence identity block pointer inside the template | C6 | Repeats the shared identity requirement already owned by `evidence-identities.md`. |
| F24 | 90–109, immediate-fix count/immutable ledger/fix/TDD/verification/commit/residual fields | C9 | Detailed fallback closeout bookkeeping and custody schema. |
| F25 | 111, axis summary | C1 | Core fallback result summary. |
| F26 | 113, literal fallback gate line | C9 | Validator/report-conformance assertion. |
| F27 | 114, closeout-ready `Review fallback:` line | C1 | Caller-facing fallback output contract. |
| F28 | 117, caller handoff stop requiring embedded/linked full body | C9 | Final custody and report-shape gate. |

No baseline group was assigned C7 or C11. There is no substantive runtime incident story, dated witness, commit anecdote, or audit-history passage in these three files, and no instruction collision is concrete enough to classify independently without inferring beyond the text. Git provenance is therefore used only as provenance, not as an answer key.

## Provenance notes

- `06b719a7` (2026-07-16, `Copied over skills.`) introduced all three files wholesale: 197 lines of `SKILL.md`, 23 lines of `evidence-identities.md`, and 110 lines of `fallback-evidence.md`. This repository history does not expose the pre-import authorship or rationale, so the import proves presence, not necessity.
- `6645191e` (2026-07-17, `Created playtest skill.`) redirected Principles to repo-native domain authority, added structured multi-pass/finding-ledger mechanics, and expanded keyed TDD evidence in both normal and fallback closeout text.
- `e34fadc9` (2026-07-18, `Updated skills.`) strengthened aggregation into a pre-fix reporting gate.
- `d3dbe5fe` (2026-07-19, `Created a skill to commission method gap research.`) added pre-dispatch/handoff authority inventories, sub-agent cleanup proof, and resume-time inventory reconciliation. The commit subject does not state a code-review rationale.
- `f0570194` (2026-07-19, `3rd playtest.`) replaced copied large-body commands with an implement-owned workflow pointer and added the zero-residual Spec output hard stop.
- `45160f9f` (2026-07-19, `Updated skills.`) added the core-vs-closeout orientation and the validator-passing examples section.
- `10e1c19f` (2026-07-19, `PRD prep for improvements to CAST MEMBER records.`) changed the accepted-residual literal and added exact validator workarounds, including forbidden prose tokens.
- `7e8a5458` (2026-07-20, `Updated skills.`) added interrupted-review recovery, final-review inventory propagation, concrete tracker-comment identity, and stricter authority-disposition wording.
- Current line provenance is still dominated by the wholesale import (`SKILL.md` 184/233 lines, `evidence-identities.md` 23/44, `fallback-evidence.md` 104/117 by blame summary), with the remaining clauses layered in the following four days. Neither age nor recency was treated as proof of necessity.

## Audit-risk patterns with concrete justification

1. **Several rules solve the same hazard in different places.** Exact-acceptance rules appear in `SKILL.md:159–168` and `fallback-evidence.md:20–31`; TDD gate internals appear in `SKILL.md:91,185,212–214` and `fallback-evidence.md:9–10,82`; identity/currentness requirements recur in `SKILL.md:89,91,114–116,137–143,216–219`, all of `evidence-identities.md`, and `fallback-evidence.md:12,42,84–88`. This is concrete duplication and drift exposure, not a claim that the protected behavior is unnecessary.
2. **Report conformance occupies a large runtime surface.** The three files total 10,983 words. Exact inventories, immutable finding ledgers, cleanup proofs, gate lines, token sweeps, and copied closeout templates account for the C9 groups above, while `SKILL.md:11` itself says a standalone review needs only the core. This is self-audit/custody scaffolding crowding a simpler common path.
3. **Validator implementation details leak into reviewer prose.** `evidence-identities.md:25–44` instructs the agent to use `completed` rather than `completion`, one exact residual phrase, and to avoid `TBD`, `TODO`, `pending`, and `unknown` even in legitimate prose. The file explicitly attributes these constraints to regexes, making this a narrow current-tool coupling rather than review-domain knowledge.
4. **Rare closeout branches are loaded beside the core flow.** Multi-pass structured JSON (`SKILL.md:119`), interruption reconstruction (`SKILL.md:83,181`), parent/child/sibling ledgers, external nonlocal proof (`fallback-evidence.md:31`), SQLite WAL snapshot rules, and commit-metadata-only/non-semantic browser exceptions all appear in runtime instructions despite conditional applicability. The orientation added by `45160f9f` concretely acknowledges that these are not part of standalone core review.
5. **An external limit is stated as a durable exact number in two places.** Both `SKILL.md:123` and `fallback-evidence.md:44` embed GitHub's body limit as `65,536` bytes. That can be current and still be an environment assertion whose durability depends on the external service and validator.
6. **Recent layers have weak commit-level rationale.** The code-review changes are carried by broad or unrelated subjects such as `Copied over skills.`, `Created playtest skill.`, `Created a skill to commission method gap research.`, and `PRD prep for improvements to CAST MEMBER records.` This does not discredit the rules, but it means Git history cannot by itself establish transferability; the rules need behavioral or current-contract support.

Not flagged: dated incident narration, embedded commit hashes in runtime instructions, a widened trigger unsupported by the frontmatter, or a concrete internal contradiction. Those patterns are not present clearly enough in the authorized baseline to justify a mark.
