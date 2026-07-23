# Blind trial scoring (discriminator: plan INVOKES the skill vs READS its file)

Version A = current ("load"); Version B = candidate ("invoke … not a file read").
Discriminator (invoke-via-Skill vs file-read) is objective and visible in each plan's
step 1. 22 blind executor samples across 5 paired trials; executors blind to version,
diagnosis, and that any comparison was happening.

## T1 — reproduction (/domain-modeling ADR)  [the incident case]
| Sample | Ver | Step-1 action | Verdict |
|---|---|---|---|
| S01 | A | `Skill → domain-modeling` (invoke) | PASS |
| S02 | A | `Skill → domain-modeling` (invoke) | PASS |
| S03 | A | `Skill(domain-modeling)` (invoke) | PASS |
| S04 | B | `Skill tool → domain-modeling`, "run the skill, not a file read" | PASS |
| S05 | B | `Skill tool → domain-modeling`, "run the skill, not a file read" | PASS |
| S06 | B | `Skill → domain-modeling`, "not read its file" | PASS |
**A: 3/3 invoke · B: 3/3 invoke — NO separation. Baseline did NOT reproduce the file-read shortcut.**

## T2 — adjacent (/codebase-design seam)
| S07 | A | `Skill(codebase-design)` invoke | PASS |
| S08 | A | `Skill(codebase-design)` invoke | PASS |
| S09 | B | `Skill tool → codebase-design`, "not a file read" | PASS |
| S10 | B | `Skill tool → codebase-design`, "not a file read" | PASS |
**A: 2/2 · B: 2/2 — NO separation.**

## T3 — no-skill regression (no skill named)
| S11 | A | notes "invocation names none → load no named wrapper"; invokes codebase-design per design-vocab rule | PASS |
| S12 | A | same: no named wrapper; invokes codebase-design (Skill) per design-vocab rule | PASS |
| S13 | B | "rule for named wrappers does not fire"; invokes codebase-design per design-vocab rule | PASS |
| S14 | B | "invocation names no supporting skill, so I add no named-skill invocation"; invokes codebase-design per design-vocab rule | PASS |
**All four correctly declined a spurious NAMED-skill invocation. The codebase-design
invocation is grounded in the intake design-vocabulary rule (export = interface/seam),
identical on both versions. NO separation, NO regression.**

## T4 — recap supporting-skill line (version-invariant text)
| S15 | A-side | `Supporting skill result:` line, no manufactured decision line | PASS |
| S16 | A-side | `Supporting skill result:` line, explicit no-decision-line | PASS |
| S17 | B-side | `Supporting skill result:` line, explicit no-decision-line | PASS |
| S18 | B-side | `Supporting skill result:` line, explicit no-decision-line | PASS |
**4/4 PASS. Recap contract intact.**

## T5 — read-only + named skill (mutation-limit safety)
| S19 | A | invoke domain-modeling; suppress write; report pending | PASS |
| S20 | A | invoke domain-modeling; no Write/Edit; report pending | PASS |
| S21 | B | invoke domain-modeling; withhold write; report pending | PASS |
| S22 | B | invoke domain-modeling; hold mutation checkpoint; report pending | PASS |
**A: 2/2 · B: 2/2 — both invoke AND honor read-only override. NO separation, NO regression.**

## Verdict
- Reproduction trial did NOT reproduce the incident's failure on the current skill:
  all three A-version executors invoked via the Skill tool rather than reading the file.
- Candidate produced ZERO behavioral separation from current across all 22 samples and
  all 5 trials; no regression anywhere.
- Candidate is +20 words (larger), not smaller/clearer in a way that changed behavior.

Acceptance gate: FAILS "materially better on the target mechanism rather than merely
worded differently"; behaviorally tied ⇒ current skill stays. Decision: **REJECTED**.

Probe limitation (recorded, not used to override the gate): the isolated intake probe
removes the competing-task cognitive load present in the original multi-step run, so it
under-reproduces a load-induced shortcut. The frozen plan may not be expanded mid-review
to fish for a difference; a genuine recurrence must reopen eligibility with new evidence.
