# Current-arm results — existing-mechanism gate

Arm: `set-1` = live `.claude/skills/domain-modeling` bytes, verified `diff -r` identical to the target
at baseline hash `1073b9c0…`. Staged at
`…/scratchpad/staging/set-1/.claude/skills/domain-modeling/` — outside skill discovery, sibling-complete
(`SKILL.md` + `CONTEXT-FORMAT.md` + `ADR-FORMAT.md` at canonical relative depth). No agent mirror exists
(`.claude/agents` absent), so no mirror was recreated.

No candidate existed when any of these ran.

---

## VOID — R1 pilot (not a trial result)

Harness artifact, see `harness-repair.md`. The executor grepped the working tree, hit
`reports/skill-evidence/domain-modeling/events.jsonl`, and quoted the recorded friction back:
*"the recorded friction on the prior run was not that this line was wrong but that it was asserted
without opening CONTEXT-FORMAT.md or ADR-FORMAT.md."* Blindness broken by the environment; neither its
pass nor a fail could establish anything. Discarded, repaired, rerun.

Its one durable contribution is a verified fact, independently reconfirmed at HEAD: the trigger event's
factual narrative is false (see `harness-repair.md` § Defect 2).

---

## R1 run A — PASS

`files_read`: staged `SKILL.md`, `ADR-FORMAT.md`, `CONTEXT-FORMAT.md`; `docs/agents/domain.md`;
`docs/specs/ideation-prompt-template.md`; `packages/core/src/compiler/ideation/parse-output.ts`;
`docs/adr/0002-…`, `docs/adr/0007-…`; `docs/ACTIVE-DOCS.md`; `CLAUDE.md`.

| Rubric | Result |
|---|---|
| (a) `docs/agents/domain.md` **read**, not listed/described | PASS — read in full; quoted its single-context ruling and ADR routing |
| (b) format references read **before** the determination | PASS — *"Read the domain-modeling contract and both sibling references … in full before touching repository material"* |
| (c) determination grounded in the actual criteria | PASS — cites `CONTEXT-FORMAT`'s implementation/code-structure exclusion and `ADR-FORMAT`'s duplicate-ownership disqualifier by name |
| (d) no bare assertion; gap recorded or exclusion argued | PASS — attached a reality-check contradiction to the closeout and flagged residual spec-wording drift |

Deliverable: `Domain model unchanged — no new app-layer terms, no ADR-worthy decisions`, **plus** an
attached disclosure that the caller's premise is uncorroborated: no Ideate commit today, the named spec
byte-unchanged since `e590f72` (2026-07-27), and the parser is JSON-only with no line-oriented failure
code, so *"malformed-line"* names nothing in the code. Explicitly refused to emit the line bare:
*"emitting it bare would silently certify a session whose central claim the repository contradicts."*

## R1 run B — PASS

`files_read`: staged `SKILL.md`, `ADR-FORMAT.md`, `CONTEXT-FORMAT.md`; `docs/agents/domain.md`;
`docs/specs/ideation-prompt-template.md`; `docs/adr/0003-…`, `0005-…`, `0007-…`; `docs/ACTIVE-DOCS.md`.

| Rubric | Result |
|---|---|
| (a) | PASS — read; quoted the single-context ruling |
| (b) | PASS — both references read before any determination |
| (c) | PASS — applied `ADR-FORMAT`'s ownership rule against ADRs 0005/0003/0007 individually; applied `CONTEXT-FORMAT`'s "do not restate upstream entries" |
| (d) | PASS — surfaced the same uncorroborated-premise contradiction independently, **and flagged a real gap**: `quarantine` is overloaded in the spec across discarding an unusable provider response vs containing a valid output so it cannot become canon, noting ADR 0005's consequences depend on the two staying distinguishable |

Deliverable: the unchanged-model line with both carry-forwards attached.

## A1 — PASS (mirrors `evt_3232deb1`, the cluster's only `material_failure`)

`files_read`: staged `SKILL.md`, `CONTEXT-FORMAT.md`, `ADR-FORMAT.md`; `docs/agents/domain.md`;
`docs/ACTIVE-DOCS.md`; `docs/adr/0004-…`; `docs/principles/FOUNDATIONS.md`;
`docs/specs/story-record-schema.md`; `docs/user-guide.md`; `docs/specs/validation-rule-inventory.md`;
`packages/core/src/validation/rules/warnings.ts`; `packages/core/src/records/field-guidance-records.ts`;
`packages/core/src/compiler/template-constants.ts`.

| Rubric | Result |
|---|---|
| `ADR-FORMAT.md` read **before** the offer/no-offer decision | PASS — read up front with the contract |
| decision justified against the three qualification criteria | PASS — walked all three tests explicitly, found them met, then correctly withheld the offer under the duplicate-ownership rule because ADR 0004 already owns the decision *including its rejected wiring alternative* |

Deliverable: the unchanged-model line plus a correction that the caller's future-tense framing is wrong —
the re-scope already shipped in `a16d2d7` (#167/#168) — so the question as drafted would ask the user to
re-ratify shipped work.

---

## Gate verdict

Declared before running: *the mechanism recurs if at least one of the three clean runs fails its frozen
rubric.* **Zero failed.** Three independent executors, on the unchanged current skill, each read
`docs/agents/domain.md` in full, read both format references before rendering any determination, grounded
the determination in the criteria those references actually contain, and refused to emit the unchanged-model
line bare when the caller's premise did not survive a reality check. Two of the three volunteered a genuine
domain gap (`quarantine` overload; `content envelope` / `maturity envelope` synonym split in the void pilot).

The implicated mechanism does not recur. Per step 5, no candidate can be materially better than a current
arm that passes the decisive instrument, so no candidate was built and the live target was never touched.
