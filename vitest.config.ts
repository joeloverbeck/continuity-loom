import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: false,
    // Headroom for heavy jsdom/React suites under CI load (default 5000ms).
    testTimeout: 15000,
    include: [
      "packages/**/*.test.ts",
      "packages/**/*.test.tsx",
      "src/**/*.test.ts",
      "src/**/*.test.tsx",
      "test/**/*.test.ts"
    ],
    passWithNoTests: true,
    coverage: {
      provider: "v8",
      enabled: false,
      include: ["packages/core/src/compiler/**/*.ts", "packages/core/src/validation/**/*.ts"],
      exclude: ["**/*.test.ts", "**/*.test.tsx"],
      reporter: ["text", "text-summary", "html", "json-summary", "lcov"],
      thresholds: {
        lines: 95,
        statements: 95,
        functions: 95,
        branches: 90,
        "packages/core/src/validation/**": {
          lines: 97,
          statements: 97,
          functions: 97,
          branches: 95
        },
        autoUpdate: false
      }
    }
  }
});
