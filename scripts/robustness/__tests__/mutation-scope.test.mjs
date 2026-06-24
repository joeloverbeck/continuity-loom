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
      "packages/core/src/compiler/reconciliation/compile-segment-reconciliation-prompt.ts",
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
      ["segment-reconciliation", ["packages/core/src/compiler/reconciliation/compile-segment-reconciliation-prompt.ts"]],
      ["validation", ["packages/core/src/validation/engine.ts"]]
    ]
  );

  assert.equal(plan.campaigns.find((campaign) => campaign.pillar === "segment-reconciliation").deferred, true);
  assert.equal(plan.campaigns.find((campaign) => campaign.pillar === "prose").deferred, false);
});

test("defers full campaigns for robustness infrastructure changes in changed-file scope", () => {
  const plan = classifyChangedPaths(
    [
      "package-lock.json",
      "scripts/robustness/stryker-base.mjs",
      "packages/core/test/support/arbitraries/prose-snapshots.ts"
    ],
    { cacheExists: cacheHit }
  );

  assert.equal(plan.status, "full-campaign-deferred");
  assert.equal(plan.reason, "robustness-infrastructure-change requires scheduled/manual full mutation");
  assert.deepEqual(
    plan.campaigns.map((campaign) => [campaign.pillar, campaign.mutate]),
    [
      ["prose", []],
      ["ideation", []],
      ["segment-reconciliation", []],
      ["validation", []]
    ]
  );
});

test("defers changed segment-reconciliation source instead of routing it to prose", () => {
  const plan = classifyChangedPaths(
    ["packages/core/src/compiler/reconciliation/compile-segment-reconciliation-prompt.ts"],
    { cacheExists: cacheMiss }
  );

  assert.equal(plan.status, "in-scope");
  assert.deepEqual(
    plan.campaigns.map((campaign) => [campaign.pillar, campaign.deferred, campaign.mutate]),
    [
      [
        "segment-reconciliation",
        true,
        ["packages/core/src/compiler/reconciliation/compile-segment-reconciliation-prompt.ts"]
      ]
    ]
  );
});

test("mixed prose and segment-reconciliation changes keep activated prose runnable", () => {
  const plan = classifyChangedPaths(
    [
      "packages/core/src/compiler/compile-prompt.ts",
      "packages/core/src/compiler/reconciliation/parse-segment-reconciliation-response.ts"
    ],
    { cacheExists: cacheHit }
  );

  assert.equal(plan.status, "in-scope");
  assert.deepEqual(
    plan.campaigns.map((campaign) => [campaign.pillar, campaign.deferred, campaign.mutate]),
    [
      ["prose", false, ["packages/core/src/compiler/compile-prompt.ts"]],
      [
        "segment-reconciliation",
        true,
        ["packages/core/src/compiler/reconciliation/parse-segment-reconciliation-response.ts"]
      ]
    ]
  );
});

test("prose-only changed source builds prose mutate args without reconciliation targets", () => {
  const plan = classifyChangedPaths(["packages/core/src/compiler/compile-prompt.ts"], { cacheExists: cacheHit });
  const [campaign] = plan.campaigns;

  assert.equal(campaign.pillar, "prose");
  assert.equal(campaign.deferred, false);
  assert.deepEqual(buildStrykerArgs(campaign), [
    "stryker",
    "run",
    "stryker.prose.config.mjs",
    "--force",
    "--mutate",
    "packages/core/src/compiler/compile-prompt.ts"
  ]);
});

test("segment-reconciliation config is a full-campaign trigger", () => {
  const plan = classifyChangedPaths(["stryker.segment-reconciliation.config.mjs"], { cacheExists: cacheHit });

  assert.equal(plan.status, "full-campaign-deferred");
  assert.deepEqual(
    plan.campaigns.map((campaign) => campaign.pillar),
    ["prose", "ideation", "segment-reconciliation", "validation"]
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
