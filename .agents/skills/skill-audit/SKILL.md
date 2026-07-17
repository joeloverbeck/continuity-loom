---
name: skill-audit
description: Use after a skill was exercised in the current session to audit it against actual work, report evidence-backed findings, and optionally implement user-requested fixes.
---

# Skill Audit

Codex host adapter for the cross-host skill-audit workflow.

Canonical workflow ID: `skill-audit-workflow-v1`.

Before auditing or implementing audit findings, read
[`../../../.claude/skills/skill-audit/references/workflow.md`](../../../.claude/skills/skill-audit/references/workflow.md)
completely and follow it as the sole procedural authority. This adapter owns
only Codex-compatible frontmatter and discovery metadata. Use Codex filesystem
reads and searches for inspection and `apply_patch` for manual edits when the
workflow names those capabilities.
