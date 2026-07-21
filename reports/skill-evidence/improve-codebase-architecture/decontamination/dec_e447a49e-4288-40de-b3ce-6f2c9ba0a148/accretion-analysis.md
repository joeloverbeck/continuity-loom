# Structure and provenance classification

## Provenance boundary

The target entered this repository in commit
`06b719a7ef9360e7d2fa32a221258a767e18956b` on 2026-07-16, while the retired
`skill-audit` still existed here; that skill was removed on 2026-07-20. The
standing owner-confirmed basis therefore applies. The import commit contains no
earlier local edit history. Historical uses from other repositories establish
that report delivery, candidate verification, WSL opening, scratch-authority
handling, and the grilling handoff were exercised, but their audit diagnoses
are not treated as trusted requirements.

Baseline size: 208 lines, 2,374 words, 16,467 bytes across `SKILL.md` and
`HTML-REPORT.md`.

## Classification: `SKILL.md`

Each row is one substantive instruction or coherent instruction group and has
exactly one workflow category.

| Group | Category | Treatment |
|---|---|---|
| Frontmatter trigger, purpose, and scan/report/grill outcome | Core trigger or output contract | Preserve. |
| Requirement to load `codebase-design` | Current repository convention with a canonical owner | Preserve as the canonical pointer. |
| Inline vocabulary list and three quoted design principles | Duplicated instruction | Remove; `codebase-design` owns them. |
| Domain-doc, ADR, and principle intake routing | Current repository convention with a canonical owner | Distill to the repo authority entrypoint plus `codebase-design`'s authority rules. |
| Breadth-versus-depth exploration split and delegation-policy condition | Current tool-specific requirement | Preserve conditionally and shorten. |
| Explanation of Explore-agent excerpt behavior and policy-disallowed narration | One-off defensive exception | Remove the history-shaped explanation; preserve direct verification as a transferable rule. |
| Five organic friction questions | Domain knowledge unavailable to a general agent | Preserve. |
| Repeated definition of the deletion test | Duplicated instruction | Replace with a pointer to the loaded design skill. |
| Unique temp-file identity and outside-repo scratch location | Necessary safety or state-integrity invariant | Preserve. |
| OS/WSL opener matrix, detached launch, and absolute-path fallback | Current tool-specific requirement | Distill without losing WSL or nonblocking behavior. |
| Tailwind/Mermaid visual-report requirement | Core trigger or output contract | Preserve. |
| Full candidate-card schema in the entrypoint | Duplicated instruction | Replace with a concise gate and canonical `HTML-REPORT.md` pointer. |
| Repeated glossary-use and forbidden-substitute rules | Duplicated instruction | Remove from the entrypoint; canonical owners remain loaded. |
| Conflict/endorsement callout explanation and examples | Duplicated instruction | Keep the requirement once in `HTML-REPORT.md`; remove repeated exposition. |
| No-interface-design report boundary and exact selection question | Necessary safety or state-integrity invariant | Preserve verbatim in substance. |
| Selected-candidate routing into `grilling` | Core trigger or output contract | Preserve. |
| Inline glossary writes, ADR offers, and context routing | Duplicated instruction | Delegate to `domain-modeling` and `grilling`, while preserving explicit mutation limits. |
| Alternative-interface routing to `codebase-design` | Current repository convention with a canonical owner | Preserve as a pointer. |
| Pre-edit implementation decision summary | Necessary safety or state-integrity invariant | Preserve and shorten. |
| Issue/PRD implementation workflow, scope, and verification | Current repository convention with a canonical owner | Preserve as conditional routing. |

## Classification: `HTML-REPORT.md`

| Group | Category | Treatment |
|---|---|---|
| Self-contained temp report and CDN choice | Core trigger or output contract | Preserve. |
| HTML scaffold | Domain knowledge unavailable to a general agent | Preserve; it makes the visual contract reproducible. |
| Header and legend contract | Core trigger or output contract | Preserve. |
| Candidate-card structure, compact evidence, and recommendation fields | Core trigger or output contract | Preserve. |
| Five diagram patterns and examples | Domain knowledge unavailable to a general agent | Preserve, with light compression only. |
| Editorial visual style and diagram sizing | Core trigger or output contract | Preserve. |
| Static-report script restriction | Necessary safety or state-integrity invariant | Preserve. |
| Top-recommendation shape | Core trigger or output contract | Preserve. |
| Repeated glossary definitions and forbidden substitutes | Duplicated instruction | Replace with the canonical `codebase-design` pointer. |
| Multiple example phrasings and repeated Wins explanations | Correct but disproportionately costly rare-case rule | Reduce to one transferable example and concise constraints. |

## Audit-induced risk patterns

| Pattern | Justification |
|---|---|
| Qualifications layered on qualifications | The exploration paragraph separately explains agent availability, excerpt quality, direct evidence, and policy-disallowed narration. The transferable invariant is simply conditional breadth delegation plus first-party evidence verification. |
| Several rules solving one hazard in different places | Domain-authority routing is present in this entrypoint and `codebase-design`; domain mutation routing is repeated again despite `domain-modeling` and `grilling` owning it. |
| Duplicated definitions | The architecture glossary and report-card contract appear in both target files and in `codebase-design`. |
| Tool incident detail crowding the common path | WSL and detached-opener facts are valid, but the current paragraph spends common-path context explaining silent no-op and success semantics. A conditional opener rule can preserve the behavior. |
| Rare-branch procedure in the main entrypoint | Context-map ambiguity, lazy context-file creation, and ADR-offer qualification already belong to the invoked domain skills. Loading them here competes with those owners. |
| Frontmatter widened by accumulated behavior | No evidence of trigger widening was found; the description still matches the core three-stage workflow and is retained. |
| Audit bookkeeping or dated witness prose | None is explicit in the current files. Historical events remain in evidence rather than being added to runtime text. |

## Candidate hypothesis

Construct one candidate that keeps the scan -> scratch HTML -> explicit selection
-> grilling -> authorized implementation transaction, but replaces duplicated
glossary, authority, report-schema, and domain-mutation prose with narrow pointers
to their canonical owners. Preserve WSL/nonblocking delivery, the evidence gate,
scratch placement, the no-interface report boundary, explicit mutation limits,
and the pre-edit behavior-preserving handoff. Compress `HTML-REPORT.md` only where
it repeats `codebase-design`; keep its visual scaffold and diagram knowledge.

No functional defect is in scope. In particular, the candidate will not add a
new browser-verification workflow merely because one historical fixture contains
that branch.
