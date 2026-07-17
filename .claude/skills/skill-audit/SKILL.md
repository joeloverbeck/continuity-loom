---
name: skill-audit
description: "Use when a skill was exercised during the current session and you want to evaluate its quality, find gaps, or identify improvements. Triggers: end of session, after implementing with a skill, after encountering skill friction."
user-invocable: true
arguments:
  - name: skill-path
    description: "Path to the skill directory or SKILL.md"
    required: true
---

# Skill Audit

Claude host adapter for the cross-host skill-audit workflow.

## Invocation

```text
/skill-audit <path-to-skill-directory-or-SKILL.md>
```

Canonical workflow ID: `skill-audit-workflow-v1`.

Before auditing or implementing audit findings, read
[`references/workflow.md`](references/workflow.md) completely and follow it as
the sole procedural authority. This adapter owns only Claude-specific command
metadata and invocation syntax. Use the host's available read, search, and patch
tools wherever the workflow names a capability rather than a particular tool.
