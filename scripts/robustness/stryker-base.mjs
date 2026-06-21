export function createCoreMutationConfig({ name, mutate, thresholds }) {
  return {
    mutate,
    testRunner: "vitest",
    vitest: {
      configFile: "vitest.config.ts",
      dir: "packages/core",
      related: true
    },
    checkers: ["typescript"],
    tsconfigFile: "packages/core/tsconfig.test.json",
    typescriptChecker: {
      prioritizePerformanceOverAccuracy: false
    },
    reporters: ["clear-text", "progress", "html", "json"],
    htmlReporter: {
      fileName: `reports/mutation/${name}/index.html`
    },
    jsonReporter: {
      fileName: `reports/mutation/${name}/mutation.json`
    },
    incremental: true,
    incrementalFile: `.cache/stryker/${name}.json`,
    tempDirName: ".stryker-tmp",
    cleanTempDir: "always",
    thresholds
  };
}
