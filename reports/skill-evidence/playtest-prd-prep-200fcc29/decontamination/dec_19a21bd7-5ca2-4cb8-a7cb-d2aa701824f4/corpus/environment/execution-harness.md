# Paired-trial execution harness

For each variant and task:

1. Create a fresh local shared clone of repository commit `7e8a545860c0d70f25be429d0a02b37d44be8bbc` in a unique `/tmp` directory.
2. Overlay every frozen file under the task's `inputs/` at the same repo-relative path in the clone.
3. Ensure the task source's own same-stem `*-prd-prep.md` is absent. Keep a prior report's prep when it is included in `inputs/`.
4. Install only the assigned skill variant at `.claude/skills/playtest-prd-prep`. Do not inspect the other variant or any live-workspace same-stem output.
5. Execute the raw prompt from inside the clone with minimal task-local context. Repository and GitHub reads are allowed; tracker writes, commits, pushes, issue mutations, product changes, and source-report edits are forbidden.
6. Retain the raw generated prep, the agent's response, commands/checks, source-inspector output, final-validator output, and final `git status --short` under the assigned trial result directory.
7. Run the variant's validator and the frozen current-skill validator against the generated prep. A validator failure is a trial result, not permission to repair the skill.

The task source and predecessor artifacts must match `hashes.sha256` before execution. The evaluator rubric is not shown to the task runner.
