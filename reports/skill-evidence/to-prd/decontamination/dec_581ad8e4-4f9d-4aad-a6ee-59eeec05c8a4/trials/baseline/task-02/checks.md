# Validation check

## Command

```sh
node reports/skill-evidence/to-prd/decontamination/dec_581ad8e4-4f9d-4aad-a6ee-59eeec05c8a4/baseline/scripts/validate-prd-body.mjs reports/skill-evidence/to-prd/decontamination/dec_581ad8e4-4f9d-4aad-a6ee-59eeec05c8a4/trials/baseline/task-02/prd-body.md
```

## Exit

`2`

## Diagnostics

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

The isolated validator stopped while loading its browser-checklist authority and did not reach body validation. No pass is claimed.
