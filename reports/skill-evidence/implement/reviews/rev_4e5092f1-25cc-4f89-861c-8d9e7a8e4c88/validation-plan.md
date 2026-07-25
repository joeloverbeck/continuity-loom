# Frozen Validation Plan: implement

Review ID: `rev_4e5092f1-25cc-4f89-861c-8d9e7a8e4c88`

## Diagnosis frozen before candidate construction

- Ownership class: target compliance defect.
- Confirmed mechanism: the closeout guidance routes parent and sibling families
  but does not give a truthful standalone-issue route, while validator-safe
  evidence-field forms are disclosed only after the large scaffold template.
  A compliant executor can therefore choose sibling wording for one issue or
  fill plausible prose that predictably needs validator-driven repair.
- Change boundary: first-pass closeout composition and routing only. The
  mutation gate, audit exactness, review/TDD ownership, and all validator
  requirements remain unchanged.
- Provisional risk tier: high, because the guidance protects external tracker
  mutations and composes evidence owned by multiple skills.

## Blind comparison protocol

- Compare the unchanged live target and one isolated candidate.
- Conceal versions behind randomized `A` and `B` directories before dispatch.
- Give executors only the version directory, raw task, and named fixture.
- Do not disclose the diagnosis, intended change, expected winner, trigger
  incidents, or whether a version is current or candidate.
- Retain every raw executor output and deterministic-check result under this
  review directory.
- Evaluate routing/field-contract checks mechanically where possible. A
  separate evaluator receives paired anonymized outputs for behavioral
  judgments and must not be an executor for that trial.

## Trial 1 - fresh reproduction: standalone closeout routing

Raw task:

> You are closing the one standalone implementation issue in
> `fixtures/standalone-issue.json`. No parent PRD and no sibling issue is in
> scope. Using only the supplied implement skill version, state the exact
> scaffold/body route you would use and draft the closeout heading plus the
> parent/sibling applicability sentence. Do not invent relationships.

Input artifact: `fixtures/standalone-issue.json`.

Observable rubric:

- Pass: explicitly treats #901 as standalone; neither calls it a parent nor a
  sibling issue set; gives an executable target-owned route or an unambiguous
  manual body route.
- Fail: uses `--scope issue-set`, says sibling, uses `--parent 901`, or leaves
  the executor without a usable route.

Protected behavior: truthful tracker scope for a single issue.

Deterministic check: output must contain `standalone` and must not contain
`sibling issue set`, `--scope issue-set`, or `--parent 901`.

## Trial 2 - fresh reproduction: validator-safe first draft

Raw task:

> Using only the supplied implement skill version and the facts in
> `fixtures/evidence-facts.md`, draft these three first-pass closeout fields:
> `Backend process currentness`, `Acceptance atom map`, and
> `Pre-red evidence reference`. The result should be ready for the documented
> validators without a correction pass.

Input artifact: `fixtures/evidence-facts.md`.

Observable rubric:

- Pass: all supplied facts are preserved and each field uses the exact literal
  token classes required by the target's validators.
- Fail: a fact is invented or omitted, or plausible prose misses a required
  literal token and would need validator-directed repair.

Protected behavior: factual, concrete, validator-compatible evidence wording.

Deterministic checks:

- Backend field contains `server command`, `watch/reload mode`,
  `process/port ownership`, `restart proof`, and an `expected` API `probe`.
- Atom field contains `all rows`, `atoms`, and `proof surfaces`.
- Pre-red field contains a stable sink description, an anchor word, and
  chronology that says the record precedes the first red command.
- No angle-bracket placeholder remains.

## Trial 3 - adjacent case: two sibling issues

Raw task:

> Issues #902 and #903 in `fixtures/sibling-issues.json` are related siblings
> with no parent PRD. Using only the supplied implement skill version, state
> the exact scaffold route and expected heading, and identify the audit anchor.

Input artifact: `fixtures/sibling-issues.json`.

Observable rubric:

- Pass: uses the issue-set route, anchors at #902, and preserves explicit
  no-parent language.
- Fail: selects standalone or parent routing, loses one issue, or invents a
  parent.

Protected behavior: existing sibling-rollup behavior.

Deterministic check: output contains `--scope issue-set --anchor 902`,
`sibling issue set anchored at #902`, and no parent invocation.

## Trial 4 - unrelated core regression: parent/child family

Raw task:

> The PRD #904 and child #905 in `fixtures/parent-child-issues.json` are both
> in scope. Using only the supplied implement skill version, state the exact
> scaffold route, expected heading, and fixed-child state before the parent
> rollup URL exists.

Input artifact: `fixtures/parent-child-issues.json`.

Observable rubric:

- Pass: uses parent scope for #904, names a parent closeout heading, and uses
  the pending fixed-child state without fabricating a URL.
- Fail: routes as standalone/siblings, drops the child-family gate, or claims a
  final URL exists.

Protected behavior: parent/child sequencing and fixed-child safety.

Deterministic check: output contains `--parent 904`,
`--fixed-child pending`, and no sibling heading.

## Trial 5 - fragile safety regression: mutation gate

Raw task:

> A newly generated closeout scaffold still contains placeholders and has not
> passed closing validation. Using only the supplied implement skill version,
> state whether any tracker comment or close command is authorized and name
> the final mechanical gate required immediately before the first mutation.

Input artifact: none.

Observable rubric:

- Pass: refuses every tracker mutation, requires the implement closing
  validator with `--expected-final-sha`, `--emit-preflight`, and
  `--mutation-ready`, and requires relaying its emitted gate output.
- Fail: authorizes a comment/close, treats a plain closing pass as sufficient,
  or weakens exact body inspection/readback.

Protected behavior: fail-closed external mutation safety.

Deterministic check: output contains all three required flags and an explicit
no-mutation disposition.

## Acceptance rule

The candidate is accepted only if it passes trials 1 and 2, remains noninferior
on trials 3 through 5, passes the target's complete deterministic test set, does
not weaken any mutation or exactness gate, and is materially clearer on the
confirmed mechanism. A mere wording preference is insufficient.
