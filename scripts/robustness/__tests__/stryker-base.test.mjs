import assert from "node:assert/strict";
import test from "node:test";

import { createCoreMutationConfig } from "../stryker-base.mjs";

test("keeps non-test symlink trees out of mutation sandboxes", () => {
  const config = createCoreMutationConfig({
    name: "test",
    mutate: ["packages/core/src/compiler/**/*.ts"],
    thresholds: { high: 95, low: 92, break: null }
  });

  assert.deepEqual(config.ignorePatterns, ["/.agents", "/reports"]);
});
