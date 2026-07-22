import assert from "node:assert/strict";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import test from "node:test";

import { captureGithubIssues, parseIssueNumbers } from "./capture-github-issues.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const captureCli = resolve(here, "capture-github-issues.mjs");

test("parseIssueNumbers accepts hashes and rejects invalid or duplicate values", () => {
  assert.deepEqual(parseIssueNumbers(["#369", "370"]), [369, 370]);
  assert.throws(() => parseIssueNumbers(["369", "#369"]), /duplicate issue number 369/);
  assert.throws(() => parseIssueNumbers(["not-an-issue"]), /invalid issue number/);
});

test("captureGithubIssues preserves requested order and exact manifest fields", () => {
  const calls = [];
  const captured = captureGithubIssues([371, 369], {
    issueView(number) {
      calls.push(number);
      return {
        number,
        title: `Issue ${number}`,
        body: `Body ${number}`,
        ignored: "not persisted"
      };
    }
  });

  assert.deepEqual(calls, [371, 369]);
  assert.deepEqual(captured, {
    issues: [
      { number: 371, title: "Issue 371", body: "Body 371" },
      { number: 369, title: "Issue 369", body: "Body 369" }
    ]
  });
});

test("captureGithubIssues rejects a mismatched structured lookup", () => {
  assert.throws(
    () => captureGithubIssues([369], {
      issueView: () => ({ number: 370, title: "Wrong issue", body: "Wrong body" })
    }),
    /issue #369 lookup did not return exact number, title, and body fields/
  );
});

test("capture CLI documents its required output contract", () => {
  const help = spawnSync(process.execPath, [captureCli, "--help"], { encoding: "utf8" });
  const missingOutput = spawnSync(process.execPath, [captureCli, "369"], { encoding: "utf8" });

  assert.equal(help.status, 0, help.stderr);
  assert.match(help.stderr, /--output <issues\.json>/);
  assert.equal(missingOutput.status, 2);
  assert.match(missingOutput.stderr, /Usage:/);
});
