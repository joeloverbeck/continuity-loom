# Checks

## Isolated baseline validator

The direct isolated-script invocation exited `2` before reading the body because the snapshot copy resolves its checklist authority four directories above the script, yielding the absent path `reports/skill-evidence/to-prd/docs/agents/issue-tracker.md`.

The same isolated validator bytes were then executed through stdin with only that authority URL rewritten to the actual routed repository authority, `docs/agents/issue-tracker.md`. The policy was supplied through a process-substitution file descriptor so no fifth trial artifact was created.

Result: exit `0`.

- `expectsChecklist`: `true`
- Required section checks: all `true`
- Both `Seam confirmation:` markers: present
- Browser-visible checklist mode, marker, and all eight canonical items: pass
- H1, machine-local path, and story-conformance checks: pass
- User stories: `17`; malformed stories: none
- Approved local sources only: pass
- Disallowed local source absent: pass
- Unexpected local sources: none
- ADR shorthands: none
- Validator failures: none

Validator-extracted local sources:

- `docs/FOUNDATIONS.md`
- `docs/agents/issue-tracker.md`
- `docs/cast-member-draft-prompt-template.md`
- `docs/story-record-schema.md`

Post-validation durability ledger against `origin/main`:

| Path | Clean | Tracked | Visible on publication ref | Content matches ref |
| --- | --- | --- | --- | --- |
| `docs/FOUNDATIONS.md` | yes | yes | yes | yes |
| `docs/agents/issue-tracker.md` | yes | yes | yes | yes |
| `docs/cast-member-draft-prompt-template.md` | yes | yes | yes | yes |
| `docs/story-record-schema.md` | yes | yes | yes | yes |

## False-citation scan

Command pattern:

```text
task-04-undurable-source|corpus/|reports/|input\.md|/tmp/|/home/joeloverbeck
```

Result: `rg` exit `1`, meaning no match. The publication body contains neither the local prep path nor a machine-local or trial path. It summarizes the prep's settled conclusions and explicitly says the temporary source was summarized rather than cited.

The validator policy also listed the exact undurable input path under `disallowedSources`; `leakedDisallowedLocalSources` was empty.

## Status-language scan

The stale-gate phrase scan returned `rg` exit `1`, meaning no match for `should be checked`, `must be checked before publication`, `if the body passes`, `pending publication`, or `TBD before publication`.

## Simulation-only omissions

Per the no-network instruction, no same-kind exemplar fetch, exact-title duplicate guard, label-existence read, issue creation, or published-body readback was attempted.
