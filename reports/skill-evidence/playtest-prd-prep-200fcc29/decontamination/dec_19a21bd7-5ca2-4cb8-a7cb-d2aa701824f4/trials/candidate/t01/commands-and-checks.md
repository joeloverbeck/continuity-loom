# Candidate T01 Commands And Checks

## Isolation

- Created a fresh local shared clone and detached it at `7e8a545860c0d70f25be429d0a02b37d44be8bbc`.
- Overlaid only `corpus/t01/inputs/`; the source SHA-256 matched `b8bad94a76e92201e474b81c6a0780ba34a4e71dff2f9aa3563badb656f18694`.
- Removed the source's same-stem prep before intake without reading it.
- Installed only the candidate snapshot at `.claude/skills/playtest-prd-prep`.

## Intake And Evidence

- `node .claude/skills/playtest/scripts/validate-report.mjs --report reports/playtest-the-unbidden-oath-2026-07-17T104952Z.md` - PASS with the historical schema-v1 counterfactual-disclosure warning.
- Candidate `--inspect-source` - `status: ok`; 12 prioritized findings, 21 cumulative rows, 7 strengths, no blocking or nonblocking source errors.
- Source durability - tracked and clean; identical SHA-256 at `HEAD` and `origin/main`.
- Read-only tracker projection, then exact likely-owner reads - #91, #93, #94, #96, #100-#108, and #116 all CLOSED. Closeout SHAs `11d9fec29149ac876f958c4ad5d4b6e05e52bdfa`, `eee76e3450df3734daa8fa55104929171151b48a`, and `7940337f7b93935d2862269d765683b376f63e77` are ancestors of the pinned checkout.

## Focused Proof

- Focused Vitest run across reconciliation catalog/golden, ideation slot assignment, reconciliation UI, Generation Brief, shell, Prompt Inspector, Story Configuration, Records, Record Hygiene, and note-persistence seams - 11 files and 134 tests passed.
- Project Library focused run - 1 file and 14 tests passed.
- Total focused proof - 12 files and 148 tests passed.
- Draft candidate validator - PASS; 0 PRD candidates, 1 ticket packet, 21 disposition rows, and 7 strength constraints.
- Manual disposition/grouping/authority/strength review - completed.
- Privacy and stale-language scans - no machine-local path, localhost URL, secret, prompt/prose payload, or pending-completion language hit.
- Candidate final validator - PASS with only the disclosed historical schema-v1 warning.
- The first frozen-current invocation failed before validation because the checker was executed outside the relative skill layout it expects. It was mechanically installed in a separate `/tmp` skill-shaped directory, without inspection or variant repair, and the rerun passed with the same counts and warning.
- Post-validation branch/HEAD/status matched the validated snapshot exactly.
- Root lint, typecheck, full test, and build gates were intentionally skipped because the assigned skill requires focused checks only for this report-only artifact.

## Boundary

- No tracker write, commit, push, source-report edit, product edit, test edit, doc edit, skill repair, PRD publication, or `/to-prd` checkpoint occurred.
- Workspace-authored evidence is confined to `trials/candidate/t01`.
