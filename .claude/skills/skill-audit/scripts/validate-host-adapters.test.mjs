import assert from "node:assert/strict";
import test from "node:test";

import {
  validateRepo,
  validateSourceSet,
} from "./validate-host-adapters.mjs";

const validSources = {
  claudeSkill: `---
name: skill-audit
description: audit
user-invocable: true
---
Canonical workflow ID: \`skill-audit-workflow-v1\`.
[workflow](references/workflow.md)
`,
  codexSkill: `---
name: skill-audit
description: audit
---
Canonical workflow ID: \`skill-audit-workflow-v1\`.
[workflow](../../../.claude/skills/skill-audit/references/workflow.md)
`,
  workflow: "<!-- workflow-id: skill-audit-workflow-v1 -->\n# Workflow\n",
  openaiYaml: `interface:
  display_name: "Skill Audit"
  short_description: "Audit and improve Codex skills."
  default_prompt: "$skill-audit SKILL_PATH"
policy:
  allow_implicit_invocation: false
`,
};

test("the repository host adapters satisfy the shared-workflow contract", () => {
  assert.deepEqual(validateRepo(), []);
});

test("rejects a mismatched adapter workflow ID", () => {
  const errors = validateSourceSet({
    ...validSources,
    codexSkill: validSources.codexSkill.replace(
      "skill-audit-workflow-v1",
      "skill-audit-workflow-v2",
    ),
  });

  assert.ok(errors.some((error) => error.includes("Codex adapter must declare")));
  assert.ok(errors.some((error) => error.includes("must use one workflow ID")));
});

test("rejects a host wrapper that duplicates the canonical workflow", () => {
  const errors = validateSourceSet({
    ...validSources,
    claudeSkill: `${validSources.claudeSkill}\n## Audit Workflow\n`,
  });

  assert.ok(errors.some((error) => error.includes("duplicates canonical heading")));
});

test("rejects path-biased Codex UI metadata", () => {
  const errors = validateSourceSet({
    ...validSources,
    openaiYaml: validSources.openaiYaml.replace(
      "SKILL_PATH",
      ".agents/skills/SKILL_NAME",
    ),
  });

  assert.ok(errors.some((error) => error.includes("SKILL_PATH placeholder")));
  assert.ok(errors.some((error) => error.includes("must not force targets")));
});

test("rejects unsupported Codex frontmatter", () => {
  const errors = validateSourceSet({
    ...validSources,
    codexSkill: validSources.codexSkill.replace(
      "description: audit",
      "description: audit\nuser-invocable: true",
    ),
  });

  assert.ok(errors.some((error) => error.includes("unsupported frontmatter")));
});

test("rejects incomplete Codex UI metadata", () => {
  for (const [line, expectedError] of [
    ['  display_name: "Skill Audit"\n', "must define display_name"],
    [
      '  short_description: "Audit and improve Codex skills."\n',
      "must define short_description",
    ],
    ['  default_prompt: "$skill-audit SKILL_PATH"\n', "must define default_prompt"],
  ]) {
    const errors = validateSourceSet({
      ...validSources,
      openaiYaml: validSources.openaiYaml.replace(line, ""),
    });

    assert.ok(errors.some((error) => error.includes(expectedError)));
  }
});

test("rejects a Codex default prompt without the skill token", () => {
  const errors = validateSourceSet({
    ...validSources,
    openaiYaml: validSources.openaiYaml.replace("$skill-audit", "$other-skill"),
  });

  assert.ok(errors.some((error) => error.includes("must invoke $skill-audit")));
});

test("rejects implicit or unspecified Codex invocation", () => {
  for (const openaiYaml of [
    validSources.openaiYaml.replace(
      "allow_implicit_invocation: false",
      "allow_implicit_invocation: true",
    ),
    validSources.openaiYaml.replace("  allow_implicit_invocation: false\n", ""),
  ]) {
    const errors = validateSourceSet({ ...validSources, openaiYaml });

    assert.ok(
      errors.some((error) =>
        error.includes("must set allow_implicit_invocation: false"),
      ),
    );
  }
});
