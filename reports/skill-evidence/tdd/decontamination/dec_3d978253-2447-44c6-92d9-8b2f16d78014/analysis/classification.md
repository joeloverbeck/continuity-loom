# Structure and provenance classification

Run: `dec_3d978253-2447-44c6-92d9-8b2f16d78014`

The target was imported at commit `06b719a7` with 2,270 lines already present, then accumulated further evidence-validator and closeout changes through `6645191e`, `e34fadc9`, `45160f9f`, and `7e8a5458`. The classifications below concern runtime necessity, not whether those historical changes were reasonable in their original incidents.

## `SKILL.md`

| Substantive instruction/group | Category | Treatment and transferable basis |
|---|---|---|
| Frontmatter trigger and red/green purpose (lines 1-10) | Core trigger or output contract | Preserve in a shorter common-path introduction. |
| Read project context and governing authorities (lines 12-14) | Current repository convention with a canonical owner | Preserve conditionally as a pointer to repository guidance; remove the mandatory evidence-disposition ceremony from ordinary single-issue TDD. |
| Fielded preflight, durable chronology, acceptance manifest, atom/sequence maps, compact table, implementation-ledger and recovery blocks (lines 16-60) | Audit bookkeeping, report conformance, custody ceremony, self-audit scaffolding | Remove from TDD runtime. Tracker-family acceptance custody belongs to the surrounding implementation/closeout workflow; the TDD-domain invariant is only to understand acceptance, choose public seams, and retain red/green evidence. |
| Public-behavior test definition and links (lines 62-70) | Core trigger or output contract | Preserve, with one canonical definition and progressive links. |
| User-confirmed seams requirement (lines 72-76) | Necessary safety or state-integrity invariant | Distill: use issue/spec-named seams as agreed; ask only when absent or ambiguous. The unconditional wording competes with autonomous execution. |
| Static/source check rules (lines 78-84) | Domain knowledge unavailable to a general agent | Preserve concisely as a rare conditional branch. |
| Implementation-coupled, tautological, and horizontal-slice anti-patterns (lines 86-90) | Domain knowledge unavailable to a general agent | Preserve once, distilled; detailed examples remain optional reference material. |
| Repeated shared-boundary table stop (line 92) | Duplicated instruction | Remove with the larger audit table system. |
| Red before green and one minimal slice (lines 96, 121-123) | Core trigger or output contract | Preserve as the central loop; merge duplicates. |
| Stateful re-entry/terminal paths and overlapping async settlement (lines 97-98) | Necessary safety or state-integrity invariant | Preserve conditionally and point to the focused references. |
| Bootstrap, setup/schema/dependency/build/harness/stale-fixture and wrong-surface failures (lines 99, 102-109) | Correct but disproportionately costly rare-case rule | Distill to one transferable invariant: a red counts only when the intended behavior assertion fails; repair/setup and rerun wrong-reason failures. Keep specialized mechanics out of the common path. |
| Review findings restart red/green; standards-only fixes do not need fake reds (lines 100-101, 110) | Necessary safety or state-integrity invariant | Preserve as a concise review-fix rule. |
| Coverage-only evidence phrases and exact row taxonomies (lines 110-115) | Audit bookkeeping, report conformance, custody ceremony, self-audit scaffolding | Remove exact phrases and row mechanics; preserve only the semantic rule that existing green behavior is coverage, not a fabricated red. |
| Docs-only, browser/manual, external/cold evidence classifications (lines 116-120) | Correct but disproportionately costly rare-case rule | Distill to “do not invent tests for non-code evidence; verify by the appropriate method.” Proof-server custody and freshness ceremonies belong to browser/implementation owners. |
| Shared-boundary closeout and implementation evidence handoff (lines 124-125) | Audit bookkeeping, report conformance, custody ceremony, self-audit scaffolding | Remove; owned by the surrounding implementation/closeout workflow. |
| Refactoring excluded from the loop (line 127) | Contradictory or instruction-competing clause | Replace with standard red-green-refactor ordering: refactor only after green, with tests kept green. This resolves conflict with the skill trigger and task prompts without expanding scope. |

## `tests.md`

| Substantive instruction/group | Category | Treatment and transferable basis |
|---|---|---|
| Public behavior, specification-style naming, one contract per test (lines 1-24) | Domain knowledge unavailable to a general agent | Preserve and shorten. |
| Type-safe public fixtures and local escape hatches (lines 25-39) | Necessary safety or state-integrity invariant | Preserve concisely. |
| Persisted fixture validity and wrong-reason setup failure (lines 41-56) | Necessary safety or state-integrity invariant | Generalize; remove product-specific lore. |
| Worldloom SQLite `.backup` incident rule (line 43) | One-off defensive exception | Remove from universal TDD runtime. Storage-consistent fixtures remain a general invariant; a repo-specific storage authority can supply its mechanism. |
| Stateful interaction tracer and long example (lines 58-78) | Necessary safety or state-integrity invariant | Preserve as a compact checklist; omit the large provenance-specific example. |
| Static contract checks and example (lines 80-90) | Current tool-specific requirement | Preserve conditionally in a shorter form. |
| Bad-test examples and red flags (lines 92-144) | Duplicated instruction | Merge into the canonical good-test/anti-pattern checklist; retain one short independent-oracle example. |

## `mocking.md`

| Substantive instruction/group | Category | Treatment and transferable basis |
|---|---|---|
| Mock only external/system boundaries (lines 1-15) | Domain knowledge unavailable to a general agent | Preserve. |
| Dependency injection and boundary-specific interfaces (lines 16-60) | Domain knowledge unavailable to a general agent | Preserve, condensed without large examples. |
| Deferred-promise technique for observable async ordering (lines 61-98) | Necessary safety or state-integrity invariant | Preserve with the two mixed-outcome obligations; shorten the code example. |

## Closeout reference and executable helpers

| Substantive instruction/group | Category | Treatment and transferable basis |
|---|---|---|
| `closeout-evidence.md` in full | Audit bookkeeping, report conformance, custody ceremony, self-audit scaffolding | Remove. It governs tracker body schemas, issue-family manifests, evidence identities, browser-server custody, review-fix maps, publication byte limits, exact GitHub comment readback, and implement-owned rollups rather than the TDD loop. |
| `scripts/tdd-evidence-contract.mjs` | Audit bookkeeping, report conformance, custody ceremony, self-audit scaffolding | Remove with its report schema owner. |
| `scripts/validate-tdd-closeout-body.mjs` | Audit bookkeeping, report conformance, custody ceremony, self-audit scaffolding | Remove. Its 1,284 lines validate tracker-body wording and publication identity, not code behavior or tests. |
| `scripts/validate-tdd-closeout-body.test.mjs` | Audit bookkeeping, report conformance, custody ceremony, self-audit scaffolding | Remove with the validator. Its source-content assertions also freeze incident-driven wording into runtime ownership. |

## Marked audit-induced risk patterns

- Qualifications layered on qualifications: pre-red, interim, recovery, review-fix, pre-close, and closing gates restate the same evidence custody at several lifecycle points.
- Taxonomies minted around earlier audit mistakes: six row classifications, exact skip phrases, RF identifiers, evidence identity categories, and validator-safe token examples dominate the common path.
- Instructions existing to satisfy another audit check: literal labels, regex-compatible phrases, byte ceilings, token sweeps, and body headers are justified by validator conformance rather than TDD behavior.
- Several rules solve one hazard repeatedly: acceptance coverage, sequence proof, browser freshness, and expectation rewrites are duplicated across `SKILL.md`, `closeout-evidence.md`, validator code, and source-content tests.
- Repository/workflow-specific behavior stated inside a general TDD skill: implement scripts, GitHub publication, parent PRD rollups, Worldloom SQLite, and one repository's robustness authority.
- Rare closeout and publication cases crowd the normal one-test/one-change loop, making the orientation disclaimer ineffective because the full main file is mandatory runtime context.

## Candidate hypothesis

Keep one compact `SKILL.md` for applicability, seams, red-green-refactor, wrong-reason reds, review fixes, evidence recording, and verification; keep concise progressive references for test design and boundary mocking; remove the tracker-closeout subsystem and its executable validators. This should preserve the six frozen task behaviors while substantially reducing mandatory context and instruction competition.
