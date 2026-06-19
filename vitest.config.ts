import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: false,
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
