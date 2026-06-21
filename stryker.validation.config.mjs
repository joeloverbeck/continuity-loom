import { createCoreMutationConfig } from "./scripts/robustness/stryker-base.mjs";

export default createCoreMutationConfig({
  name: "validation",
  mutate: ["packages/core/src/validation/**/*.ts"],
  thresholds: {
    high: 98,
    low: 96,
    break: null
  }
});
