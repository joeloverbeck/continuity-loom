# Frozen paired-trial corpus

Initially frozen at `2026-07-20T10:42:22Z` and completed at `2026-07-20T11:29:34Z`, before any candidate directory existed. The completion added the two optional screenshots referenced by the untracked T06 source after its clean-clone source inspection exposed that they were absent from the initial packet; the task, prompt, report bytes, and rubric did not change.

The six tasks are historical playtest-report intakes selected without exposing prior same-stem prep artifacts as expected answers. They cover:

1. historical schema-v1 new-story compatibility;
2. schema-v1 continuation reconciliation against a prior prep;
3. ordinary schema-v2 new-story intake;
4. continuation after several earlier product findings were implemented;
5. a no-create experiment with mixed product, method, and future-coverage dispositions; and
6. a third-run continuation with a multi-generation recommendation ledger.

Each task contains the raw invocation, frozen report inputs, and an evaluator-only rubric. `environment/` freezes the repository and tracker facts shared by both variants. The trial harness is identical for current and candidate runs except for the skill bytes installed in the fresh clone.

The existing same-stem prep for the task source is deliberately unavailable in each fresh trial clone. A continuation task retains only prep artifacts that precede the source report.
