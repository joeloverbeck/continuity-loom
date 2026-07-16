#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const usage =
  "Usage: node .claude/skills/implement/scripts/verify-github-comment-body.mjs <comment-url> <body.md>";

export const parseGithubCommentUrl = (value) => {
  const match = value.match(
    /^https:\/\/github\.com\/([^/\s]+)\/([^/\s]+)\/issues\/(\d+)#issuecomment-(\d+)$/
  );
  if (!match) throw new Error(`invalid GitHub issue comment URL ${value}`);

  return {
    owner: match[1],
    repo: match[2],
    issueNumber: Number(match[3]),
    commentId: Number(match[4]),
    url: value
  };
};

const commentFromGh = ({ owner, repo, commentId }) =>
  JSON.parse(
    execFileSync("gh", ["api", `repos/${owner}/${repo}/issues/comments/${commentId}`], {
      encoding: "utf8"
    })
  );

export const verifyGithubCommentBody = (commentUrl, bodyPath, options = {}) => {
  const identity = parseGithubCommentUrl(commentUrl);
  const commentLookup = options.commentLookup ?? commentFromGh;
  const localBody = readFileSync(bodyPath, "utf8");
  const comment = commentLookup(identity);

  if (
    comment?.id !== identity.commentId ||
    comment?.html_url !== identity.url ||
    typeof comment?.body !== "string"
  ) {
    throw new Error("GitHub comment lookup did not return the exact id, URL, and body fields");
  }

  const bodyBytes = Buffer.byteLength(comment.body, "utf8");
  const localBytes = Buffer.byteLength(localBody, "utf8");
  if (comment.body !== localBody) {
    throw new Error(
      `GitHub comment body mismatch at ${identity.url}: stored ${bodyBytes} bytes, local ${localBytes} bytes`
    );
  }

  return {
    url: identity.url,
    bodyBytes,
    localBytes,
    exactBodyMatch: true
  };
};

const isCli = process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;

if (isCli) {
  const args = process.argv.slice(2);
  if (args.includes("--help")) {
    console.error(usage);
    process.exit(0);
  }
  if (args.length !== 2 || args.some((arg) => arg.startsWith("--"))) {
    console.error(usage);
    process.exit(2);
  }

  try {
    console.log(JSON.stringify(verifyGithubCommentBody(args[0], args[1]), null, 2));
  } catch (error) {
    console.error(`GitHub comment body verification failed: ${error.message}`);
    process.exit(1);
  }
}
