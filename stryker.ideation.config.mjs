import { createCoreMutationConfig } from "./scripts/robustness/stryker-base.mjs";

export default createCoreMutationConfig({
  name: "ideation",
  mutate: [
    "packages/core/src/compiler/ideation/**/*.ts",
    "packages/core/src/compiler/sections/ideation.ts"
  ],
  thresholds: {
    high: 95,
    low: 92,
    break: null
  }
});
