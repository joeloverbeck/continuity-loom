import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import test from "node:test";

import {
  parseGithubCommentUrl,
  verifyGithubCommentBody
} from "./verify-github-comment-body.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const verifier = resolve(here, "verify-github-comment-body.mjs");
const commentUrl = "https://github.com/worldloom/studio/issues/380#issuecomment-4952843688";

test("parseGithubCommentUrl returns the exact comment identity", () => {
  assert.deepEqual(parseGithubCommentUrl(commentUrl), {
    owner: "worldloom",
    repo: "studio",
    issueNumber: 380,
    commentId: 4952843688,
    url: commentUrl
  });
  assert.throws(() => parseGithubCommentUrl("https://github.com/worldloom/studio/issues/380"), /invalid GitHub issue comment URL/);
});

test("verifyGithubCommentBody accepts an exact UTF-8 body match", () => {
  const directory = mkdtempSync(join(tmpdir(), "implement-comment-readback-test-"));
  const bodyPath = join(directory, "body.md");
  writeFileSync(bodyPath, "Temporal evidence: café\n");
  let receivedIdentity;

  const result = verifyGithubCommentBody(commentUrl, bodyPath, {
    commentLookup(identity) {
      receivedIdentity = identity;
      return {
        id: identity.commentId,
        html_url: identity.url,
        body: "Temporal evidence: café\n"
      };
    }
  });

  assert.equal(receivedIdentity.commentId, 4952843688);
  assert.deepEqual(result, {
    url: commentUrl,
    bodyBytes: 25,
    localBytes: 25,
    exactBodyMatch: true
  });
  rmSync(directory, { recursive: true, force: true });
});

test("verifyGithubCommentBody rejects a mismatch and malformed lookup", () => {
  const directory = mkdtempSync(join(tmpdir(), "implement-comment-readback-test-"));
  const bodyPath = join(directory, "body.md");
  writeFileSync(bodyPath, "expected\n");

  assert.throws(
    () => verifyGithubCommentBody(commentUrl, bodyPath, {
      commentLookup: (identity) => ({ id: identity.commentId, html_url: identity.url, body: "different\n" })
    }),
    /GitHub comment body mismatch/
  );
  assert.throws(
    () => verifyGithubCommentBody(commentUrl, bodyPath, {
      commentLookup: () => ({ body: "expected\n" })
    }),
    /did not return the exact id, URL, and body fields/
  );
  rmSync(directory, { recursive: true, force: true });
});

test("verify comment CLI documents its two required arguments", () => {
  const help = spawnSync(process.execPath, [verifier, "--help"], { encoding: "utf8" });
  const missingBody = spawnSync(process.execPath, [verifier, commentUrl], { encoding: "utf8" });

  assert.equal(help.status, 0, help.stderr);
  assert.match(help.stderr, /<comment-url> <body\.md>/);
  assert.equal(missingBody.status, 2);
  assert.match(missingBody.stderr, /Usage:/);
});
