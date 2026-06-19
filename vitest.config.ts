import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: false,
    // CI runners oversubscribe their vCPUs with the default per-CPU worker
    // pool, starving heavy jsdom/React suites and delaying effect flushes —
    // which flakes timing-sensitive tests (timeouts and effect-registration
    // races). Run files serially so each test gets full CPU, matching local
    // determinism. (Vitest 4 forces maxWorkers:1 when this is false.)
    fileParallelism: false,
    // Insurance for heavy suites; un-contended they run well under this.
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
