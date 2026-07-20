#!/usr/bin/env node

import { readFileSync } from "node:fs";

const usage = `Usage:
  gh issue view <number> --json comments \\
    | node .claude/skills/to-prd/scripts/verify-sequence-comment.mjs --expected-body <body>`;

function fail(message, status = 2) {
  if (message) console.error(message);
  if (status === 2) console.error(usage);
  process.exit(status);
}

function parseExpectedBody(argv) {
  if (argv.length !== 2 || argv[0] !== "--expected-body" || argv[1].length === 0) {
    fail("Provide one non-empty --expected-body value.");
  }
  return argv[1];
}

const expectedBody = parseExpectedBody(process.argv.slice(2));
let payload;
try {
  payload = JSON.parse(readFileSync(0, "utf8"));
} catch (error) {
  fail(`Sequence-comment readback is not valid JSON: ${error.message}`, 1);
}

if (!Array.isArray(payload?.comments)) {
  fail("Sequence-comment readback must contain a comments array.", 1);
}

const exactMatches = payload.comments.filter((comment) => comment?.body === expectedBody).length;
const report = {
  exactMatches,
  expectedExactly: 1,
  verified: exactMatches === 1,
};

console.log(JSON.stringify(report, null, 2));
if (!report.verified) process.exit(1);
