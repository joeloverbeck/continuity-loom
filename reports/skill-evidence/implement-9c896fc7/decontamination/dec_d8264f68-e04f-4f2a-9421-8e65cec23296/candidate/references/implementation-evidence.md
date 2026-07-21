# Implementation evidence

Use this before tests, browser/manual proof, staging, and final verification.

## Tests and issue execution

- Use the repository `tdd` skill at the highest practical public seam. Issue-named seams are pre-agreed unless live architecture contradicts them. Otherwise announce the conservative seam and follow `tdd` confirmation rules.
- Docs-only or no-runnable criteria use conformance/review evidence and an explicit TDD N/A; do not invent a test.
- Default to one issue at a time. When an integrated pass is safer, keep separate acceptance and closeout rows.
- Before a new cross-module entrypoint or shared helper, confirm its owner from nearby callers and current architecture; do not broaden a single-flow helper for convenience.
- Keep the issue open when required proof is missing or a named authority would be contradicted.
- Carry the `tdd` skill's canonical durable closeout result forward unchanged. Do not reconstruct its field contract here.

## Browser and manual proof

Use a real browser when acceptance or implementation changes UI, routes, browser-consumed API/data, fixtures, or user action paths. Exercise the production navigation and active decision path—not only a nearby component, read-only preview, server render, or API seam.

Before relying on proof:

1. Inspect configured ports and owners. Use isolated proof-owned processes when occupied; record commands, actual URLs, sessions/PIDs, and aligned proxy/API settings.
2. For backend-dependent proof, demonstrate that the proof server loaded the reviewed code and probe the expected API behavior. Reachability alone is insufficient.
3. If a stateful fixture is copied, use an application-consistent snapshot and probe its identity/state; never raw-copy a live store whose durable state may be split across side files or journals.
4. Record route, action, observed outcome, console warnings/errors, and whether artifacts are durable acceptance evidence or ephemeral observation.
5. After any relevant edit, restart/reload as required and rerun in a clean session when reused/HMR/setup output could taint console evidence.
6. Before closeout, compare proof with every file changed afterward. Rerun, justify not-affected with targeted proof, or mark blocked. Stop only proof-owned processes and report unrelated owners left running.

For docs/process-only work that merely cites UI behavior, record browser N/A with the concrete reason. For browser-consumed API-only work, a same-origin localhost page executing the real route sequence may qualify when status/JSON and cleanup are recorded.

Keep private fixture paths private when authority forbids publication, but retain a stable logical ID, content hash, and provenance in durable evidence. Do not delete any artifact still named as current evidence until closeout is complete and its retained/removed disposition is corrected.

## Verification ledger

Start before the first command used as pass/fail evidence:

| Exact command | Observed result/counts | Run count | Represented SHA/tree |
|---|---|---:|---|
| `<command>` | passed/failed/blocked plus output-derived result | 1 | `<sha>` / named working tree |

Record unexpected failures separately. Setup failures—dependency sync, stale workspace build, runner/plugin/harness setup—are not behavioral red evidence. Repair setup, rerun the exact command, and preserve both records. Any substitute command must have demonstrably equivalent source/test scope and result gate; otherwise verification remains blocked.

Use focused tests/typechecks during implementation, then run the repository's canonical gates for the blast radius. In this repository, workflow/package/cross-package/closeout-scale changes require `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.

Publish only final-tree ledger rows as passing closeout evidence.

## Review-entry and staging gates

Before staging:

- reconcile artifact disposition;
- map every acceptance and Principles/ADR check to status and evidence;
- challenge each `satisfied` row against the exact source wording;
- name `atoms:`, concrete `proof surfaces:`, and `sequence:` ordered proof or a justified sequence N/A;
- treat quantified values and lifecycle transitions exactly, not by representative samples or independent snapshots;
- leave unsupported rows `blocked` or `not done`;
- rerun `git status --short` and identify unrelated dirt.

For issue work, generate the acceptance manifest and run the audit-only validator before review:

```bash
node .claude/skills/implement/scripts/validate-closeout-body.mjs "$body" --audit-only --review-entry --acceptance-manifest /tmp/implement-acceptance-manifest.json
```

Omit `--review-entry` for a truthful blocked handoff.

After staging, inspect `git diff --cached --name-only`. Commit only implementation-owned files. A visible pre-stage/commit note must identify the audit sink, unresolved rows, artifact disposition, ownership decisions, unrelated dirt, and the exact staged file list.
