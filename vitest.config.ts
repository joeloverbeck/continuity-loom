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
    passWithNoTests: true
  }
});
