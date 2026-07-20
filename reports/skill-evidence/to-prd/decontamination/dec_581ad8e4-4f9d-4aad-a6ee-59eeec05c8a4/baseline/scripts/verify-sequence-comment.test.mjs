import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";

const verifierPath = fileURLToPath(new URL("./verify-sequence-comment.mjs", import.meta.url));
const expectedBody = "Program sequence:\n\n1. #83 first\n2. #84 second";

function runVerifier(comments, body = expectedBody) {
  const result = spawnSync(
    process.execPath,
    [verifierPath, "--expected-body", body],
    {
      encoding: "utf8",
      input: JSON.stringify({ comments }),
    },
  );
  return {
    ...result,
    report: result.stdout.trim() ? JSON.parse(result.stdout) : null,
  };
}

test("accepts exactly one byte-identical sequence comment", () => {
  const result = runVerifier([
    { body: "unrelated" },
    { body: expectedBody },
  ]);

  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(result.report, {
    exactMatches: 1,
    expectedExactly: 1,
    verified: true,
  });
});

test("rejects a missing sequence comment", () => {
  const result = runVerifier([{ body: "unrelated" }]);

  assert.equal(result.status, 1);
  assert.equal(result.report.exactMatches, 0);
  assert.equal(result.report.verified, false);
});

test("rejects duplicate sequence comments", () => {
  const result = runVerifier([
    { body: expectedBody },
    { body: expectedBody },
  ]);

  assert.equal(result.status, 1);
  assert.equal(result.report.exactMatches, 2);
  assert.equal(result.report.verified, false);
});

test("matches the complete body rather than a substring", () => {
  const result = runVerifier([{ body: `${expectedBody}\n3. extra` }]);

  assert.equal(result.status, 1);
  assert.equal(result.report.exactMatches, 0);
});
