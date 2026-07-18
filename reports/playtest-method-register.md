# Continuity Loom Playtest Method Register

Status: pilot  
Owner: repository maintainer  
Last updated: 2026-07-18  
Natural-run rows: 2 of 3  
Disposition: pending

## Boundary

This compact register tests whether a cross-run method inventory materially improves a later
playtest-method decision. It is opened and updated only after the current run's final report passes
validation. It is never priming material for the author journey and never an alternate continuation
report or prompt corpus.

Record only report identity, coarse task bands, method signals, and method-decision provenance.
Never record story substance, full prompts, responses, candidate or accepted prose, record payloads,
screenshots, or sensitive project state. Rows do not authorize automatic instrument adoption and
cannot support saturation, representativeness, frequency, reliability, safety, or calibrated
confidence claims.

## Natural-Run Coverage Card

| Report                                                     | Mode         | Accepted-sequence band | Brief-field band | Selected-record band | Natural author need | Assistance invoked                             | Lifecycle transition   | Prompt outcome pattern | Candidate intervention | Coverage state and note                                                                                     |
| ---------------------------------------------------------- | ------------ | ---------------------- | ---------------- | -------------------- | ------------------- | ---------------------------------------------- | ---------------------- | ---------------------- | ---------------------- | ----------------------------------------------------------------------------------------------------------- |
| `reports/playtest-the-unbidden-oath-2026-07-17T104952Z.md` | new_story    | 1                      | 16+              | 5-9                  | establish           | ideate; record-hygiene; segment-reconciliation | create-to-first-accept | mixed                  | light                  | single-witness - first encoded natural run; its outcome-triggered retry is not a prospective pair           |
| `reports/playtest-the-unbidden-oath-2026-07-18T145754Z.md` | continuation | 2-3                    | 16+              | 5-9                  | continue            | ideate; record-hygiene; segment-reconciliation | reopen-to-next-accept  | mixed                  | light                  | varied-witness - lifecycle varied while several coarse bands clustered; its retry is not a prospective pair |

Allowed bands and labels are deliberately coarse:

- accepted sequence: `not-reached`, `1`, `2-3`, or `4+`;
- deliberately populated brief fields: `0-7`, `8-15`, or `16+`;
- selected records: `0-4`, `5-9`, or `10+`;
- coverage state: `unobserved`, `single-witness`, `repeated-similar`, or `varied-witness`.

The card describes natural coverage only. It never authorizes forced feature use to fill a cell.

## Method Signal And Landing Ledger

| Signal ID | Source identity                                                                                                                       | Method claim affected                                                                    | Privacy-safe observation                                                                                                 | Occurrence          | Evidence basis                                                 | Route                 | Trigger                                               | Cheapest witness                                                                                          | Witness result | Owner disposition | Landing identity                                                                                                                                  | Retest identity                                            |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ------------------- | -------------------------------------------------------------- | --------------------- | ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | -------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| M001      | `reports/playtest-the-unbidden-oath-2026-07-17T104952Z.md`; `reports/playtest-the-unbidden-oath-2026-07-18T145754Z.md`                | Exact-prompt usefulness needs outcome-independent evidence                               | Each natural run executed one assistance prompt twice with unchanged bytes and observed discordant structural classes    | repeated-similar    | direct-visible, cross-run-recurrent, single-observer-inference | method-review         | same signal appeared in two natural runs              | one predeclared schema-v2 paired draw on a naturally qualifying Segment Reconciliation prompt             | not-run        | adopted           | `.claude/skills/playtest/references/prompt-evaluation.md`; `.claude/skills/playtest/references/report-format.md`; validator and tests; 2026-07-18 | none                                                       |
| M002      | `reports/continuity-loom-playtest-method-gap-audit-2026-07-18.md`                                                                     | First-view and decision-driving claims need an independent context witness               | The instructed operator has product-specific workflow knowledge and previously owned both observation and interpretation | first               | source-confirmed, single-observer-inference                    | method-review         | owner adjudication of MG-01                           | next natural new-story first view plus up to three challenges in each of the first two qualifying reports | not-run        | adopted           | playtest skill, observation, journey, report, validator, and tests; 2026-07-18                                                                    | none                                                       |
| M003      | first seeded report; report validator lineage                                                                                         | Published method metadata must remain structurally inspectable without rewriting history | A schema-v1 report predates the later counterfactual disclosure block                                                    | resolved-by-witness | source-confirmed                                               | ordinary-skill-defect | report-conformance mismatch requires immediate repair | warning-only v1 compatibility plus strict schema-v2 disclosure tests                                      | supports       | adopted           | `.claude/skills/playtest/scripts/validate-report.mjs`; 2026-07-18                                                                                 | `.claude/skills/playtest/scripts/validate-report.test.mjs` |
| M004      | `prompt-evaluation.md` pre-revision working-tree baseline, SHA-256 `ce4478df805d1f4d6d3ba4bbc89ec2ca1509cc009a355df714ce15d7cb6df9fa` | Fresh-context exchange must remain host-neutral and preserve raw-response custody        | The baseline reference names isolated Claude and Codex delivery paths without changing the cold-prompt boundary          | first               | source-confirmed                                               | ordinary-skill-defect | baseline/conformance event only                       | normal skill audit and target-local tests                                                                 | not-run        | unadjudicated     | none - pre-existing working-tree baseline                                                                                                         | none                                                       |
| M005      | `browser-driver.md` pre-revision working-tree baseline, SHA-256 `78223c30aa250de7375067e02a05866ed78a991bbc9cf093b2c154410b42ec22`    | Browser recovery must preserve origin, provider, and custody guards                      | The baseline reference strengthens host recovery while retaining the guarded localhost boundary                          | first               | source-confirmed                                               | ordinary-skill-defect | baseline/conformance event only                       | normal skill audit and browser-driver tests                                                               | not-run        | unadjudicated     | none - pre-existing working-tree baseline                                                                                                         | none                                                       |

Register entries inform review; they never decide it automatically:

- Any safety, privacy, provider, custody, visible-UI, or report-conformance breach routes
  immediately to ordinary skill repair without waiting for recurrence.
- Method review triggers when the same signal appears in two natural runs, a decision-driving claim
  is `narrowed` or `contradicted`, a paired discordance would otherwise justify product work, or a
  landed method change fails its declared witness.
- Counts alone never promote a method signal into a product defect, severity, reliability, or
  confidence claim.

## Three-Row Decision Checkpoint

Prospective prediction recorded 2026-07-18, before the third run: the next natural-run row will
either expose a decision-relevant coverage cluster or materially shorten or alter the next method
review. If it does neither, this register should be retired.

- Third-row trigger: the next naturally attempted playtest that produces a validated report.
- Decision question: did the register change, narrow, or prevent a concrete method decision that
  the current report and Git history alone would not have supported?
- Allowed disposition: `keep`, `revise`, or `retire`.
- If the third row identifies no concrete cross-run decision value, the disposition is `retire`.
- Do not append a fourth natural-run row while disposition is pending.
- `keep` still requires a bounded purpose and review interval; it does not make the register an
  authority for product findings.
- `revise` must name the smallest field or timing change needed before another bounded pilot.
- `retire` leaves this file as historical method evidence and removes the update obligation from
  the playtest skill.
