import assert from "node:assert/strict";
import test from "node:test";

import {
  buildStrykerArgs,
  classifyChangedPaths
} from "../mutation-scope.mjs";

const cacheHit = () => true;
const cacheMiss = () => false;

test("maps changed pillar source files to forced mutate targets", () => {
  const plan = classifyChangedPaths(
    [
      "packages/core/src/compiler/compile-prompt.ts",
      "packages/core/src/compiler/ideation/operators.ts",
      "packages/core/src/compiler/sections/ideation.ts",
      "packages/core/src/validation/engine.ts",
      "docs/FOUNDATIONS.md"
    ],
    { cacheExists: cacheHit }
  );

  assert.equal(plan.status, "in-scope");
  assert.deepEqual(
    plan.campaigns.map((campaign) => [campaign.pillar, campaign.mutate]),
    [
      ["ideation", ["packages/core/src/compiler/ideation/operators.ts", "packages/core/src/compiler/sections/ideation.ts"]],
      ["prose", ["packages/core/src/compiler/compile-prompt.ts"]],
      ["validation", ["packages/core/src/validation/engine.ts"]]
    ]
  );
});

test("forces all campaigns for robustness infrastructure changes", () => {
  const plan = classifyChangedPaths(
    [
      "package-lock.json",
      "scripts/robustness/stryker-base.mjs",
      "packages/core/test/support/arbitraries/prose-snapshots.ts"
    ],
    { cacheExists: cacheHit }
  );

  assert.equal(plan.status, "in-scope");
  assert.equal(plan.reason, "robustness-infrastructure-change");
  assert.deepEqual(
    plan.campaigns.map((campaign) => [campaign.pillar, campaign.mutate]),
    [
      ["prose", []],
      ["ideation", []],
      ["validation", []]
    ]
  );
});

test("reports out of scope when no locked pillar or robustness path changed", () => {
  const plan = classifyChangedPaths(["README.md", "docs/user-guide.md"], { cacheExists: cacheHit });

  assert.equal(plan.status, "out-of-scope");
  assert.equal(plan.campaigns.length, 0);
});

test("cache miss still plans forced changed-file mutation work", () => {
  const plan = classifyChangedPaths(["packages/core/src/validation/readiness.ts"], { cacheExists: cacheMiss });
  const [campaign] = plan.campaigns;

  assert.equal(plan.status, "in-scope");
  assert.equal(campaign.cacheHit, false);
  assert.deepEqual(campaign.mutate, ["packages/core/src/validation/readiness.ts"]);
  assert.deepEqual(buildStrykerArgs(campaign), [
    "stryker",
    "run",
    "stryker.validation.config.mjs",
    "--force",
    "--mutate",
    "packages/core/src/validation/readiness.ts"
  ]);
});
