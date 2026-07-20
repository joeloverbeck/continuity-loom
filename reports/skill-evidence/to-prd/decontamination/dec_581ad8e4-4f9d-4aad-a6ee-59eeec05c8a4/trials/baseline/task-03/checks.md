# Trial checks

No command used the network or wrote to GitHub. The issue identities below are simulated readback payloads.

## PRD A staged-body validator

Command:

```sh
node reports/skill-evidence/to-prd/decontamination/dec_581ad8e4-4f9d-4aad-a6ee-59eeec05c8a4/baseline/scripts/validate-prd-body.mjs reports/skill-evidence/to-prd/decontamination/dec_581ad8e4-4f9d-4aad-a6ee-59eeec05c8a4/trials/baseline/task-03/prd-body-a.md --expect-checklist --approved-source docs/FOUNDATIONS.md --approved-source docs/compiler-contract.md --approved-source docs/story-record-schema.md --approved-source docs/validation-rule-inventory.md --approved-source docs/user-guide.md
```

Exit: `2`

Diagnostics:

```text
Cannot read browser checklist authority /home/joeloverbeck/projects/continuity-loom/reports/skill-evidence/to-prd/docs/agents/issue-tracker.md: ENOENT: no such file or directory, open '/home/joeloverbeck/projects/continuity-loom/reports/skill-evidence/to-prd/docs/agents/issue-tracker.md'
Usage:
  node .claude/skills/to-prd/scripts/validate-prd-body.mjs <body-file> [options]
  node .claude/skills/to-prd/scripts/validate-prd-body.mjs --stdin [options]

Options:
  --expect-checklist           Require the browser-visible guidance checklist.
  --approved-source <path>     Allow a durable local citation; repeat as needed.
  --disallowed-source <path>   Reject a summarized/local-only source; repeat as needed.
  --policy-file <path>         Load checklist and source policy from a reusable JSON file.
  --extract-sources            Print citation and ADR discovery without validating.
  --help                       Show this help.
```

Result: infrastructure failure before body validation. The isolated validator expects a browser-checklist authority that is absent from its isolated evidence-root resolution. No live-skill validator was substituted.

## PRD B staged-body validator

Command:

```sh
node reports/skill-evidence/to-prd/decontamination/dec_581ad8e4-4f9d-4aad-a6ee-59eeec05c8a4/baseline/scripts/validate-prd-body.mjs reports/skill-evidence/to-prd/decontamination/dec_581ad8e4-4f9d-4aad-a6ee-59eeec05c8a4/trials/baseline/task-03/prd-body-b.md --expect-checklist --approved-source docs/FOUNDATIONS.md --approved-source docs/compiler-contract.md --approved-source docs/prompt-template.md --approved-source docs/validation-rule-inventory.md --approved-source docs/user-guide.md
```

Exit: `2`

Diagnostics:

```text
Cannot read browser checklist authority /home/joeloverbeck/projects/continuity-loom/reports/skill-evidence/to-prd/docs/agents/issue-tracker.md: ENOENT: no such file or directory, open '/home/joeloverbeck/projects/continuity-loom/reports/skill-evidence/to-prd/docs/agents/issue-tracker.md'
Usage:
  node .claude/skills/to-prd/scripts/validate-prd-body.mjs <body-file> [options]
  node .claude/skills/to-prd/scripts/validate-prd-body.mjs --stdin [options]

Options:
  --expect-checklist           Require the browser-visible guidance checklist.
  --approved-source <path>     Allow a durable local citation; repeat as needed.
  --disallowed-source <path>   Reject a summarized/local-only source; repeat as needed.
  --policy-file <path>         Load checklist and source policy from a reusable JSON file.
  --extract-sources            Print citation and ADR discovery without validating.
  --help                       Show this help.
```

Result: infrastructure failure before body validation. The isolated validator expects a browser-checklist authority that is absent from its isolated evidence-root resolution. No live-skill validator was substituted.

## Sequence comment readback for simulated #1001

Simulated identity: `#1001`, exact title `PRD: User-Supplied Candidate Intake — Local Drafting and Provenance`.

Command:

```sh
SEQUENCE_COMMENT=$(<"reports/skill-evidence/to-prd/decontamination/dec_581ad8e4-4f9d-4aad-a6ee-59eeec05c8a4/trials/baseline/task-03/sequence-comment.md"); jq -n --argjson number 1001 --arg title 'PRD: User-Supplied Candidate Intake — Local Drafting and Provenance' --arg body "$SEQUENCE_COMMENT" '{number:$number,title:$title,comments:[{body:$body}]}' | node reports/skill-evidence/to-prd/decontamination/dec_581ad8e4-4f9d-4aad-a6ee-59eeec05c8a4/baseline/scripts/verify-sequence-comment.mjs --expected-body "$SEQUENCE_COMMENT"
```

Exit: `0`

Diagnostics:

```json
{
  "exactMatches": 1,
  "expectedExactly": 1,
  "verified": true
}
```

## Sequence comment readback for simulated #1002

Simulated identity: `#1002`, exact title `PRD: Prompt-Facing Full Labels — Complete Deterministic Projection`.

Command:

```sh
SEQUENCE_COMMENT=$(<"reports/skill-evidence/to-prd/decontamination/dec_581ad8e4-4f9d-4aad-a6ee-59eeec05c8a4/trials/baseline/task-03/sequence-comment.md"); jq -n --argjson number 1002 --arg title 'PRD: Prompt-Facing Full Labels — Complete Deterministic Projection' --arg body "$SEQUENCE_COMMENT" '{number:$number,title:$title,comments:[{body:$body}]}' | node reports/skill-evidence/to-prd/decontamination/dec_581ad8e4-4f9d-4aad-a6ee-59eeec05c8a4/baseline/scripts/verify-sequence-comment.mjs --expected-body "$SEQUENCE_COMMENT"
```

Exit: `0`

Diagnostics:

```json
{
  "exactMatches": 1,
  "expectedExactly": 1,
  "verified": true
}
```
