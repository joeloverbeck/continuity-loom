import { createCoreMutationConfig } from "./scripts/robustness/stryker-base.mjs";

export default createCoreMutationConfig({
  name: "prose",
  mutate: [
    "packages/core/src/compiler/**/*.ts",
    "!packages/core/src/compiler/ideation/**/*.ts",
    "!packages/core/src/compiler/sections/ideation.ts",
    "!packages/core/src/compiler/reconciliation/**/*.ts"
  ],
  thresholds: {
    high: 95,
    low: 92,
    break: null
  }
});
