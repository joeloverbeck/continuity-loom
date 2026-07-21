import { createCoreMutationConfig } from "./scripts/robustness/stryker-base.mjs";

export default createCoreMutationConfig({
  name: "segment-reconciliation",
  mutate: [
    "packages/core/src/compiler/reconciliation/**/*.ts",
    "packages/core/src/compiler/change-review/**/*.ts",
    "packages/core/src/compiler/accepted-segment-echo.ts",
    "packages/core/src/compiler/assistance-prompt-primitives.ts",
    "packages/core/src/compiler/strict-output-primitives.ts"
  ],
  thresholds: {
    high: 95,
    low: 92,
    break: null
  }
});
