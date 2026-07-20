# Comparative validation summary

## Blind paired trials

Evaluators received only each frozen prompt, input, rubric, and randomized outputs A/B. They did not receive either skill definition, the decontamination diagnosis, removed clauses, old audit findings, expected winner, or the blinding key.

| Task | Candidate label | Candidate adequate | Current adequate | Noninferiority | Blind preference | Material/severe regression |
|---|---|---|---|---|---|---|
| 01 terminology sharpening | A | yes | yes | tie | candidate | none |
| 02 durable validation decision | A | yes | yes | tie | tie | none |
| 03 authority conflict | B | yes | yes | tie | candidate | none |
| 04 process-term boundary | B | yes | yes | tie | tie | none |
| 05 supporting no-change | A | yes | yes | tie | tie | none |

The candidate is noninferior on all five core and safety-relevant tasks. It preserves glossary creation, ADR capture, governing-authority conflict handling, process/tooling exclusion, authoritative-record ownership, and the exact supporting-role no-change result.

## Deterministic checks

- Frozen corpus: every entry in `corpus/CORPUS.sha256` verified after both trial waves.
- Candidate immutability: all three candidate file hashes still match `analysis/variant-manifest.sha256` after trials and evaluation.
- Relative references: both referenced candidate format files exist.
- Candidate scope: exactly `SKILL.md`, `CONTEXT-FORMAT.md`, and `ADR-FORMAT.md`; no helper added or removed.
- Live target: no changes before validation/landing.
- Decontamination helper suite: 12/12 passed. The first sandboxed invocation could not run nested child processes; the approved non-sandboxed rerun passed all tests.
- Whitespace check: `git diff --no-index --check` emitted no whitespace errors; its exit 1 represented the expected content difference.

## Noninferiority decision

Decision: **accepted**.

The candidate is behaviorally adequate on every task, has no material or severe regression, retains the necessary domain and ownership boundaries, and is meaningfully simpler: 904 versus 2,200 runtime words (58.9% smaller). The remaining unusual rules have transferable justifications: upstream-glossary deference prevents competing authorities; lazy multi-context routing prevents speculative files; caller mutation-boundary handling respects the driving workflow; and settled/provisional closeout lines prevent false claims of ratification.
