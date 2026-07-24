#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const usage =
  "Usage: node .claude/skills/implement/scripts/capture-github-issues.mjs <issue> [<issue> ...] --output <issues.json>";

export const parseIssueNumbers = (values) => {
  const seen = new Set();
  return values.map((value) => {
    const number = Number(String(value).replace(/^#/, ""));
    if (!Number.isInteger(number) || number <= 0) {
      throw new Error(`invalid issue number ${value}`);
    }
    if (seen.has(number)) throw new Error(`duplicate issue number ${number}`);
    seen.add(number);
    return number;
  });
};

const issueViewFromGh = (number) =>
  JSON.parse(
    execFileSync("gh", ["issue", "view", String(number), "--json", "number,title,body"], {
      encoding: "utf8"
    })
  );

export const captureGithubIssues = (issueNumbers, options = {}) => {
  const numbers = parseIssueNumbers(issueNumbers);
  const issueView = options.issueView ?? issueViewFromGh;
  const issues = numbers.map((number) => {
    const issue = issueView(number);
    if (
      issue?.number !== number ||
      typeof issue?.title !== "string" ||
      typeof issue?.body !== "string"
    ) {
      throw new Error(`issue #${number} lookup did not return exact number, title, and body fields`);
    }
    return {
      number: issue.number,
      title: issue.title,
      body: issue.body
    };
  });

  return { issues };
};

const isCli = process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;

if (isCli) {
  const args = process.argv.slice(2);
  const outputIndex = args.indexOf("--output");
  const outputPath = outputIndex < 0 ? undefined : args[outputIndex + 1];
  const issueValues = args.filter(
    (arg, index) => index !== outputIndex && index !== outputIndex + 1 && !arg.startsWith("--")
  );
  const unknownFlags = args.filter((arg) => arg.startsWith("--") && arg !== "--output" && arg !== "--help");

  if (args.includes("--help")) {
    console.error(usage);
    process.exit(0);
  }
  if (unknownFlags.length) {
    console.error(`Unknown flag(s): ${unknownFlags.join(", ")}`);
    console.error(usage);
    process.exit(2);
  }
  if (!outputPath || outputPath.startsWith("--") || issueValues.length === 0) {
    console.error(usage);
    process.exit(2);
  }

  try {
    const captured = captureGithubIssues(issueValues);
    writeFileSync(outputPath, `${JSON.stringify(captured, null, 2)}\n`);
  } catch (error) {
    console.error(`GitHub issue capture failed: ${error.message}`);
    process.exit(1);
  }
}
