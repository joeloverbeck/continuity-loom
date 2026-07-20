# Structure, provenance, and accretion analysis

## Provenance

The local target predates retirement of `skill-audit`: `to-prd` entered this
repository in commit `06b719a7ef9360e7d2fa32a221258a767e18956b` on 2026-07-16,
while `skill-audit` was removed in commit
`7e8a545860c0d70f25be429d0a02b37d44be8bbc` on 2026-07-20. Subsequent local
changes added decision-ledger qualification, bounded-read procedure, exact
metadata readback, playtest custody, checklist-authority wiring, sequence-comment
verification, a minimal-load consultation map, and an unwritten-path validator
exception. This history identifies review-era accretion candidates; it does not
establish that any rule is necessary.

## Complete classification

Each row is one substantive instruction or coherent group and has exactly one
category from the decontamination taxonomy.

| ID | File / group | Category | Candidate treatment |
|---|---|---|---|
| S1 | `SKILL.md`: synthesize conversation into one PRD or a ratified program; no requirements interview | Core trigger or output contract | Preserve. |
| S2 | `SKILL.md`: configured tracker and label vocabulary; read repo authorities | Current repository convention with a canonical owner | Preserve as concise pointers to entrypoint and tracker docs. |
| S3 | `SKILL.md`: house-style-only consultation branch and minimal-load map | Correct but disproportionately costly rare-case rule | Keep a short conditional rule and links; remove the exhaustive load mapping. |
| S4 | `SKILL.md` Step 1 intake and explicit working-note completion | Audit bookkeeping, report conformance, custody ceremony, self-audit scaffolding | Preserve the intake outcomes, remove the requirement to narrate every item in working notes. |
| S5 | `SKILL.md` Step 2 highest existing testing seams and external behavior | Domain knowledge unavailable to a general agent | Preserve. |
| S6 | `SKILL.md` non-code deliverables and behavior-preserving refactor exceptions | Correct but disproportionately costly rare-case rule | Condense behind explicit conditions. |
| S7 | `SKILL.md` product-scope ratification and single/multi/deferred packaging | Core trigger or output contract | Preserve. |
| S8 | `SKILL.md` open-decision closure and missing-label handling in the sole checkpoint | Necessary safety or state-integrity invariant | Preserve once; remove repeated qualifications. |
| S9 | `SKILL.md` valid receipt, timeout, and new-seam stop rules | Necessary safety or state-integrity invariant | Preserve in compact decision form. |
| S10 | `SKILL.md` four-reference read list plus repeated five-step publication summary | Duplicated instruction | Keep routing and a single gate sequence; references own details. |
| S11 | `SKILL.md` Final Response Blocker | Necessary safety or state-integrity invariant | Preserve tracker readback and cleanup requirements; remove duplicated ledger prose. |
| I1 | `intake.md`: worktree baseline, entrypoint, glossary, domain docs, ADRs, tracker docs | Current repository convention with a canonical owner | Preserve as a compact intake checklist. |
| I2 | `intake.md`: explicit eight-item working-notes recital | Audit bookkeeping, report conformance, custody ceremony, self-audit scaffolding | Replace with one requirement to retain evidence needed for closeout. |
| I3 | `intake.md`: same-kind exemplar selection and bounded `gh` recipes | Current tool-specific requirement | Preserve selection/fallback and compact command examples. |
| I4 | `intake.md`: PRD-ready artifact scope, freshness, and deferred candidates | Core trigger or output contract | Preserve. |
| I5 | `intake.md`: playtest custody receipt and `playtest-to-issues` handoff | Necessary safety or state-integrity invariant | Preserve; it passed baseline task 5. |
| I6 | `intake.md`: rerun producer validator and limit its evidentiary meaning | Necessary safety or state-integrity invariant | Preserve concisely. |
| I7 | `intake.md`: decision-closure ledger taxonomy | Core trigger or output contract | Preserve the three statuses and label consequence in one table. |
| I8 | `intake.md`: already-published source-exploitation ledger | One-off defensive exception | Replace with the transferable invariant: exact duplicates recover; remaining-scope requests exclude consumed work. |
| I9 | `intake.md`: line-count, heading-search, targeted-read ceremony for every long authority | Current tool-specific requirement | Keep the applicability check (avoid truncated evidence); remove the fixed command lore. |
| B1 | `prd-body.md`: untitled preamble and seven required sections | Core trigger or output contract | Preserve. |
| B2 | `prd-body.md`: numbered `As an ..., I want ..., so that ...` stories | Core trigger or output contract | Preserve exact validator-compatible form. |
| B3 | `prd-body.md`: resolved defaults and still-open decisions | Necessary safety or state-integrity invariant | Preserve once. |
| B4 | `prd-body.md`: no volatile code paths/symbols; stable identifiers and authority citations allowed | Domain knowledge unavailable to a general agent | Preserve concisely. |
| B5 | `prd-body.md`: prototype-snippet exception | Correct but disproportionately costly rare-case rule | Retain as one conditional sentence. |
| B6 | `prd-body.md`: testing and further-notes seam markers | Core trigger or output contract | Preserve exactly for executable validation. |
| B7 | `prd-body.md`: FOUNDATIONS and Section 29 alignment | Current repository convention with a canonical owner | Preserve as a pointer. |
| P1 | `publication.md`: title form and exact-title duplicate guard | Necessary safety or state-integrity invariant | Preserve; baseline task 7 protects it. |
| P2 | `publication.md`: exact shell duplicate-search failure taxonomy | Current tool-specific requirement | Replace the long recipe with the same zero/one/many and read-failure invariants plus a compact command. |
| P3 | `publication.md`: one workflow per PRD and concrete program sequencing | Core trigger or output contract | Preserve; baseline task 3 protects it. |
| P4 | `publication.md`: exact sequence-comment verifier | Necessary safety or state-integrity invariant | Preserve the tested helper and exactly-one rule. |
| P5 | `publication.md`: label existence proof and missing-label ratification | Necessary safety or state-integrity invariant | Preserve. |
| P6 | `publication.md`: ready / needs-triage / sequenced taxonomy | Domain knowledge unavailable to a general agent | Preserve with fewer qualifications. |
| P7 | `publication.md`: browser-visible checklist from tracker authority | Current repository convention with a canonical owner | Preserve as a pointer plus validator gate. |
| D1 | `source-durability.md`: temporary sources and staged-body cleanup | Necessary safety or state-integrity invariant | Preserve; remove host-specific editing narration. |
| D2 | `source-durability.md`: summarize undurable sources rather than cite them | Necessary safety or state-integrity invariant | Preserve; baseline task 4 protects it. |
| D3 | `source-durability.md`: ratified-but-unwritten path's three validator-policy cases | One-off defensive exception | Distill to the transferable rule: never cite nonexistent bytes; name deliverable without an extractable path and mark pending. |
| D4 | `source-durability.md`: validator extraction syntax and extensionless formatting detail | Current tool-specific requirement | Preserve the helper call and narrow syntax note. |
| D5 | `source-durability.md`: clean, tracked, publication-ref visible, content-identical proof | Necessary safety or state-integrity invariant | Preserve exactly as the four-cell gate. |
| D6 | `source-durability.md`: repeated prose, long inline run sheet, and sandbox-helper warning | Incident narrative, dated witness, commit anecdote, or audit provenance | Remove runtime incident claim and duplicate recipe; retain direct commands and ledger. |
| D7 | `source-durability.md`: unique ADR shorthand resolution | Necessary safety or state-integrity invariant | Preserve. |
| V1 | `validation-and-closeout.md`: reusable policy manifest and body validator | Necessary safety or state-integrity invariant | Preserve. |
| V2 | `validation-and-closeout.md`: status-language regex and exit-code tutorial | Audit bookkeeping, report conformance, custody ceremony, self-audit scaffolding | Preserve truthful-status review as one sentence; remove the ceremony and fixed regex. |
| V3 | `validation-and-closeout.md`: metadata, exact body identity, same-policy validation, and durability readback | Necessary safety or state-integrity invariant | Preserve. |
| V4 | `validation-and-closeout.md`: full shell script for readback | Current tool-specific requirement | Replace with compact commands and explicit failure semantics. |
| V5 | `validation-and-closeout.md`: repair only the failed surface, then rerun full readback | Necessary safety or state-integrity invariant | Preserve. |
| V6 | `validation-and-closeout.md`: interruption recovery and duplicate-safe issue-number recovery | Necessary safety or state-integrity invariant | Preserve concisely. |
| V7 | `validation-and-closeout.md`: temporary cleanup and per-path final dirt ledger | Audit bookkeeping, report conformance, custody ceremony, self-audit scaffolding | Keep cleanup and baseline-to-final classification; remove repeated ownership definitions and final-response duplication. |
| A1 | body validator implementation: template, story, seam, checklist, source, ADR, and policy checks | Core trigger or output contract | Preserve unchanged. |
| A2 | body validator dynamic checklist authority | Current repository convention with a canonical owner | Preserve unchanged. |
| A3 | body-validator tests | Necessary safety or state-integrity invariant | Preserve unchanged. |
| A4 | sequence-comment verifier and tests | Necessary safety or state-integrity invariant | Preserve unchanged. |

## Marked audit-induced risk patterns

| Pattern | Evidence and risk | Candidate response |
|---|---|---|
| Qualifications layered on qualifications | Step 2 receipt, open-decision, timeout, label, and default rules restate one another across three files. This competes for attention at the sole checkpoint. | State the decision state machine once in `SKILL.md`; references supply only body/label consequences. |
| Several rules solve one hazard | Duplicate prevention appears in title intake, source exploitation, recovery, and final closeout; durability prerequisites appear before and after multiple recipes. | Keep exact-title recovery and four-cell durability invariants in their canonical references, and link from recovery. |
| Audit/report conformance in runtime | Mandatory working-note inventories, status-language ceremony, and exhaustive final dirt narration exceed the product operation they protect. | Retain evidence and truthful closeout outcomes without prescribing self-audit narration. |
| Stale environment assertion | The durability reference says wrapped Git helpers can fail under "the active sandbox" and prescribes a shell run sheet universally. | Remove the environment anecdote; require direct observable Git evidence. |
| One-off defensive exception | The unwritten-path paragraph explains all three validator-policy failure categories rather than stating the durable rule. | Keep the rule and remove the validator-case narrative. |
| Rare branches crowd common path | House-style-only consultation, refactor timeout behavior, absent-exemplar bootstrapping, and prototype snippets are expanded in the normal path. | Keep each as a short conditional branch. |
| Mandatory-reference context cost | A normal publication loads 7,839 markdown words across `SKILL.md` and five references, with the same gates repeated. | Shorten the five existing files without changing routing or helper inventory. |
| Frontmatter/runtime mismatch | The description promises synthesis plus one seam checkpoint, while runtime prose adds several quasi-checkpoints through open-decision and label ceremony. | Preserve one combined Step 2 checkpoint and make all other gates mechanical. |

## Candidate hypothesis

A single candidate will leave all executable helpers unchanged and shorten only
the six runtime Markdown files. It will preserve the trigger, one combined Step
2 checkpoint, PRD body contract, playtest custody, duplicate recovery, label
taxonomy, browser checklist, four-cell durability proof, published-body identity,
recovery, and cleanup. The candidate succeeds only if all seven frozen tasks are
noninferior and the target's own tests pass.

