# Frozen Validation Plan: triage

## Review basis

- Review ID: `rev_a4ce832d-b023-4fa0-8d5d-382e558791d8`
- Risk tier: ordinary
- Trigger: `evt_c4b7ef9f-6d52-41e3-82f2-59eb46992000`
- Confirmed mechanism: related-ticket discovery is required, but the user-facing recommendation is not required to state whether the required predecessor or repair has an existing durable tracker owner.
- Ownership: target compliance defect in `triage`; the tracker contract provides discovery mechanics but does not own the skill's user-facing result contract.

## Independence and blinding

Each arm runs in a fresh top-level Codex session with only one unlabeled skill version, the raw task, and the trial artifacts. The executor is not told the diagnosis, candidate hypothesis, expected answer, or whether it has the current or candidate version. Version labels are concealed from the evaluator and the A/B assignment differs across trials. A separate fresh evaluator receives only the paired raw outputs, task artifacts, and rubric.

## Trial 1: reproduction — required repair has no tracker owner

- Raw task: `trials/reproduction/task.md`
- Raw artifacts: `trials/reproduction/issue.md`, `trials/reproduction/tracker-search.json`, `trials/reproduction/verification.md`
- Protects: specific-issue readiness triage, closed-contract regression handling, related-ticket discovery, and the no-unauthorized-publication boundary.
- Pass rubric:
  - recommends `bug` plus `needs-triage` for the blocked PRD;
  - explicitly states that no standalone tracker issue currently owns the required repair;
  - distinguishes the unowned repair gate from the already-closed accepted contract;
  - does not invent an issue number, publish anything, or imply the repair is already scheduled.

## Trial 2: adjacent — predecessor already has a tracker owner

- Raw task: `trials/adjacent/task.md`
- Raw artifacts: `trials/adjacent/issue.md`, `trials/adjacent/tracker-search.json`, `trials/adjacent/verification.md`
- Protects: accurate dependency reporting when a durable owner exists.
- Pass rubric:
  - recommends `enhancement` plus `needs-triage`;
  - explicitly names issue `#511` as the existing open predecessor owner;
  - reports that `#511` is open and therefore still blocking;
  - does not claim the predecessor is absent, closed, or completed.

## Trial 3: unrelated core regression — already implemented bug report

- Raw task: `trials/regression/task.md`
- Raw artifacts: `trials/regression/issue.md`, `trials/regression/verification.md`, `trials/regression/out-of-scope.md`
- Protects: core category/state recommendation, already-implemented disposal, and scope restraint.
- Pass rubric:
  - recommends `bug` plus already-implemented `wontfix`;
  - cites the supplied implementation and passing verification;
  - does not write or propose an out-of-scope record for a built behavior;
  - does not introduce irrelevant predecessor-owner discussion or perform a mutation.

## Deterministic checks

- Candidate contains the same file set as the live target.
- Candidate Markdown frontmatter remains valid and keeps `name: triage` and `disable-model-invocation: true`.
- The isolated diff changes only the demonstrated result-reporting mechanism.
- `git diff --check` passes for the eventual landed target and review artifacts.
- The `.agents/skills/triage` mirror remains a symlink to the canonical target after landing.

## Acceptance rule

Accept only if the candidate materially improves Trial 1, remains correct on Trial 2, is noninferior on Trial 3, passes every deterministic check, and introduces no new authority to create or mutate tracker items. A behavioral tie leaves the current skill unchanged.
