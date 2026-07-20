# Triage structure and provenance classification

## Provenance

- The target entered this repository in commit `06b719a7ef9360e7d2fa32a221258a767e18956b` on 2026-07-16 as part of "Copied over skills."
- The repository's retirement/decontamination change landed later, in `557b9abb332de97b712abe129b5c09a7b4639e42` on 2026-07-20.
- The standing owner confirmation therefore applies. No target-specific audit report or earlier completion is available in this repository, so no historical finding is used as an answer key.

## Exactly-one-category classification

Each row covers one substantive instruction or coherent instruction group and assigns exactly one workflow category.

| ID | File and instruction group | Category | Candidate treatment |
| --- | --- | --- | --- |
| S01 | `SKILL.md`: mission, issue state machine, and external PRs as request surfaces | Core trigger or output contract | Preserve concisely. |
| S02 | `SKILL.md`: mandatory AI disclaimer on tracker comments/issues | Necessary safety or state-integrity invariant | Preserve. |
| S03 | `SKILL.md`: route brief and rejected-enhancement details to the two references | Current repository convention with a canonical owner | Preserve as conditional references. |
| S04 | `SKILL.md`: two category roles and five state roles | Domain knowledge unavailable to a general agent | Preserve. |
| S05 | `SKILL.md`: exactly one category/state and stop on conflicting states | Necessary safety or state-integrity invariant | Preserve. |
| S06 | `SKILL.md`: map canonical roles through the repo label authority; setup fallback | Current repository convention with a canonical owner | Distill to the active label/tracker docs and stop if missing. |
| S07 | `SKILL.md`: normal transitions, reporter reply, and maintainer override | Domain knowledge unavailable to a general agent | Preserve concisely. |
| S08 | `SKILL.md`: natural-language invocation examples | Core trigger or output contract | Preserve as one compact sentence; examples are unnecessary. |
| S09 | `SKILL.md`: attention buckets ordered by age | Core trigger or output contract | Preserve. |
| S10 | `SKILL.md`: external-PR discovery filter, explicit-PR exception, metadata limitation fallback | Current tool-specific requirement | Preserve conditionally and shorten. |
| S11 | `SKILL.md`: label hygiene over items already reported | Necessary safety or state-integrity invariant | Preserve. |
| S12 | `SKILL.md`: recommendation grouping/order and dependency rationale | Core trigger or output contract | Preserve concisely. |
| S13 | `SKILL.md`: gate-closure reverse-reference sweep, compact search fallback, pagination ledger | Correct but disproportionately costly rare-case rule | Move to a conditional family/gate paragraph; retain exact-token and boundedness invariants. |
| S14 | `SKILL.md`: parent/child reverse reading and child classification | Correct but disproportionately costly rare-case rule | Preserve behind the family/gate condition, shortened. |
| S15 | `SKILL.md`: full issue/PR gather; Git dirt; authority, ref, diff, glossary and ADR context | Core trigger or output contract | Preserve as the gather step. |
| S16 | `SKILL.md`: redundancy search and current-tree evidence artifact distinction | Domain knowledge unavailable to a general agent | Preserve, distilled. |
| S17 | `SKILL.md`: `.out-of-scope` prior-rejection check | Current repository convention with a canonical owner | Point to `OUT-OF-SCOPE.md` only when relevant. |
| S18 | `SKILL.md`: related-ticket compact discovery and exact reads | Current tool-specific requirement | Preserve conditionally in the gather step. |
| S19 | `SKILL.md`: bug reproduction, PR diff/test verification, enhancement readiness gates | Core trigger or output contract | Preserve. |
| S20 | `SKILL.md`: prerequisite versus summarized-provenance artifact roles | Domain knowledge unavailable to a general agent | Preserve. |
| S21 | `SKILL.md`: closed accepted-contract regression disposition | One-off defensive exception | Distill to a transferable completed-contract regression rule without the repair-ticket ceremony. |
| S22 | `SKILL.md`: recorded proof can be stale after surface-changing commits | Necessary safety or state-integrity invariant | Preserve. |
| S23 | `SKILL.md`: throwaway state and process teardown for verification | Necessary safety or state-integrity invariant | Preserve. |
| S24 | `SKILL.md`: recommend category/state/evidence and wait for maintainer direction | Necessary safety or state-integrity invariant | Preserve. |
| S25 | `SKILL.md`: use grilling and domain-modeling when design remains open | Current repository convention with a canonical owner | Preserve as a route, without embedding either workflow. |
| S26 | `SKILL.md`: re-read label preconditions before mutation | Necessary safety or state-integrity invariant | Preserve. |
| S27 | `SKILL.md`: per-state outcome actions | Domain knowledge unavailable to a general agent | Preserve compactly; references own brief and rejection-record formats. |
| S28 | `SKILL.md`: exact post-mutation readback, comment identity, byte comparison, repair/report behavior | Necessary safety or state-integrity invariant | Preserve the invariant; shorten GitHub/jq mechanics to a conditional sentence. |
| S29 | `SKILL.md`: direct quick override and default brief behavior | Core trigger or output contract | Preserve while making confirmation/approval boundaries explicit. |
| S30 | `SKILL.md`: standing conditional override, body authority, gate state reason, prerequisites, combined comment ordering | Necessary safety or state-integrity invariant | Preserve and collapse duplicated gate/readback rules. |
| S31 | `SKILL.md`: published-PRD-family anecdote explaining why body counts | Incident narrative, dated witness, commit anecdote, or audit provenance | Remove; the transferable body-or-comment rule remains in S30. |
| S32 | `SKILL.md`: needs-info template | Core trigger or output contract | Preserve in shorter form. |
| S33 | `SKILL.md`: blocked-readiness `needs-triage` template | Duplicated instruction | Replace with a short required-content list; S19/S27 own the distinction. |
| S34 | `SKILL.md`: resume prior notes and do not repeat resolved questions | Necessary safety or state-integrity invariant | Preserve. |
| A01 | `AGENT-BRIEF.md`: brief is authoritative and differs for issue versus PR | Domain knowledge unavailable to a general agent | Preserve. |
| A02 | `AGENT-BRIEF.md`: durable interface-level language, no paths/lines | Necessary safety or state-integrity invariant | Preserve. |
| A03 | `AGENT-BRIEF.md`: behavioral rather than procedural direction | Core trigger or output contract | Preserve. |
| A04 | `AGENT-BRIEF.md`: independent testable acceptance criteria | Core trigger or output contract | Preserve. |
| A05 | `AGENT-BRIEF.md`: explicit scope boundaries | Necessary safety or state-integrity invariant | Preserve. |
| A06 | `AGENT-BRIEF.md`: canonical brief template | Core trigger or output contract | Preserve, tightened. |
| A07 | `AGENT-BRIEF.md`: two full issue examples, full PR example, and bad example | Duplicated instruction | Remove; they restate A01-A06 and force every brief-writing branch to load provenance-sized tutorial text. |
| O01 | `OUT-OF-SCOPE.md`: rejected-enhancement memory and dedup purpose | Domain knowledge unavailable to a general agent | Preserve. |
| O02 | `OUT-OF-SCOPE.md`: one concept per kebab-case file, durable rationale, prior requests | Core trigger or output contract | Preserve. |
| O03 | `OUT-OF-SCOPE.md`: long dark-mode tree and code example | Duplicated instruction | Remove; the compact format contract is sufficient. |
| O04 | `OUT-OF-SCOPE.md`: concept-similarity check and maintainer confirm/reconsider/distinguish options | Domain knowledge unavailable to a general agent | Preserve concisely. |
| O05 | `OUT-OF-SCOPE.md`: write only for rejected enhancements, never bugs or already-built requests | Necessary safety or state-integrity invariant | Preserve. |
| O06 | `OUT-OF-SCOPE.md`: create/update, comment, close sequence | Core trigger or output contract | Preserve. |
| O07 | `OUT-OF-SCOPE.md`: changed-decision removal behavior | Correct but disproportionately costly rare-case rule | Preserve in one sentence. |

## Audit-induced risk patterns

| Pattern | Evidence and justification |
| --- | --- |
| Qualifications layered on qualifications | Gate/search/readback rules repeatedly restate compact discovery, exact reads, state reasons, and bounded fallbacks across recommendation, specific triage, quick override, and verification. The safety invariant is transferable; the repeated procedural layers compete for attention. |
| Incident-shaped defenses | The body-recorded standing override is justified with a published-PRD-family story, and stale-proof handling mentions a sibling closeout. The transferable rules survive without those stories. |
| Several rules solving one hazard | Label mapping/preconditions, approval, gate verification, comment exactness, and final state readback appear in multiple places. Consolidating each hazard into one home reduces collision risk. |
| Rare branches crowding the common path | Gate-closure family sweeps, parent closeability, local-only prerequisite reachability, and exact GitHub comment extraction are valuable but dominate the basic categorise-verify-recommend flow. Keep them conditional and compact. |
| Progressive disclosure is nominal | Normal brief-writing loads three long examples after a complete template; rejected-enhancement handling loads a long example before its concise rules. Removing examples makes the references genuinely task-focused. |
| Repository-specific behavior stated generically | Setup fallback and generic tracker wording coexist with this repository's active GitHub and label authorities. The candidate points to those authorities and stops rather than teaching cross-repository setup from triage. |

## Candidate hypothesis

A single candidate can preserve the state machine, verification, approval, stateful-operation safety, PR handling, agent-brief contract, and rejected-enhancement memory while removing tutorial examples, incident narration, repeated gates, and over-specified normal-path search mechanics. The main risk is losing a rare safety branch, so all mutation, PR, privacy, design-gate, and readiness behaviors stay explicit and the seven frozen trials protect them.
