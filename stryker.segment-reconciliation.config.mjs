import { createCoreMutationConfig } from "./scripts/robustness/stryker-base.mjs";

export default createCoreMutationConfig({
  name: "segment-reconciliation",
  mutate: [
    "packages/core/src/compiler/reconciliation/**/*.ts"
  ],
  thresholds: {
    high: 95,
    low: 92,
    break: null
  }
});
