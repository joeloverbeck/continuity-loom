import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const WORKFLOW_ID = "skill-audit-workflow-v1";
const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../../..");

const PATHS = {
  claudeSkill: ".claude/skills/skill-audit/SKILL.md",
  codexSkill: ".agents/skills/skill-audit/SKILL.md",
  workflow: ".claude/skills/skill-audit/references/workflow.md",
  openaiYaml: ".agents/skills/skill-audit/agents/openai.yaml",
};

const CANONICAL_HEADINGS = [
  "## Audit Workflow",
  "## Report Contract",
  "## Follow-Up Implementation",
];

function frontmatterKeys(source) {
  const match = source.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return [];

  return match[1]
    .split("\n")
    .filter((line) => /^[a-zA-Z][\w-]*:/.test(line))
    .map((line) => line.slice(0, line.indexOf(":")));
}

function wrapperWorkflowId(source) {
  return source.match(/Canonical workflow ID: `([^`]+)`\./)?.[1];
}

export function validateSourceSet({
  claudeSkill,
  codexSkill,
  workflow,
  openaiYaml,
}) {
  const errors = [];
  const claudeId = wrapperWorkflowId(claudeSkill);
  const codexId = wrapperWorkflowId(codexSkill);
  const workflowId = workflow.match(/<!-- workflow-id: ([^ ]+) -->/)?.[1];

  if (claudeId !== WORKFLOW_ID) {
    errors.push(`Claude adapter must declare workflow ID ${WORKFLOW_ID}.`);
  }
  if (codexId !== WORKFLOW_ID) {
    errors.push(`Codex adapter must declare workflow ID ${WORKFLOW_ID}.`);
  }
  if (workflowId !== WORKFLOW_ID) {
    errors.push(`Shared workflow must declare marker ${WORKFLOW_ID}.`);
  }
  if (claudeId !== codexId || claudeId !== workflowId) {
    errors.push("Host adapters and shared workflow must use one workflow ID.");
  }

  if (!claudeSkill.includes("references/workflow.md")) {
    errors.push("Claude adapter must point to references/workflow.md.");
  }
  if (
    !codexSkill.includes(
      "../../../.claude/skills/skill-audit/references/workflow.md",
    )
  ) {
    errors.push("Codex adapter must point to the shared Claude workflow path.");
  }

  for (const [name, source] of [
    ["Claude", claudeSkill],
    ["Codex", codexSkill],
  ]) {
    const nonBlankLines = source.split("\n").filter((line) => line.trim()).length;
    if (nonBlankLines > 40) {
      errors.push(`${name} adapter must stay thin (40 non-blank lines or fewer).`);
    }
    for (const heading of CANONICAL_HEADINGS) {
      if (source.toLowerCase().includes(heading.toLowerCase())) {
        errors.push(`${name} adapter duplicates canonical heading ${heading}.`);
      }
    }
  }

  const codexKeys = frontmatterKeys(codexSkill);
  const unsupportedCodexKeys = codexKeys.filter(
    (key) => !["name", "description", "license", "metadata", "allowed-tools"].includes(key),
  );
  if (unsupportedCodexKeys.length > 0) {
    errors.push(
      `Codex adapter has unsupported frontmatter: ${unsupportedCodexKeys.join(", ")}.`,
    );
  }

  if (!openaiYaml.includes("display_name:")) {
    errors.push("Codex UI metadata must define display_name.");
  }
  if (!openaiYaml.includes("short_description:")) {
    errors.push("Codex UI metadata must define short_description.");
  }

  const defaultPrompt = openaiYaml.match(/^\s*default_prompt:\s*(.+)$/m)?.[1] ?? "";
  if (!defaultPrompt) {
    errors.push("Codex UI metadata must define default_prompt.");
  }
  if (!defaultPrompt.includes("$skill-audit")) {
    errors.push("Codex default_prompt must invoke $skill-audit.");
  }
  if (!defaultPrompt.includes("SKILL_PATH")) {
    errors.push("Codex default_prompt must use the path-neutral SKILL_PATH placeholder.");
  }
  if (defaultPrompt.includes(".agents/skills/SKILL_NAME")) {
    errors.push("Codex default_prompt must not force targets under .agents/skills.");
  }
  if (!/^\s*allow_implicit_invocation:\s*false\s*$/m.test(openaiYaml)) {
    errors.push("Codex policy must set allow_implicit_invocation: false.");
  }

  return errors;
}

export function validateRepo(root = REPO_ROOT) {
  return validateSourceSet(
    Object.fromEntries(
      Object.entries(PATHS).map(([key, relativePath]) => [
        key,
        readFileSync(resolve(root, relativePath), "utf8"),
      ]),
    ),
  );
}

function isMain() {
  return process.argv[1]
    ? import.meta.url === pathToFileURL(resolve(process.argv[1])).href
    : false;
}

if (isMain()) {
  const errors = validateRepo();
  if (errors.length > 0) {
    for (const error of errors) console.error(`- ${error}`);
    process.exitCode = 1;
  } else {
    console.log(`Host adapters valid (${WORKFLOW_ID}).`);
  }
}
