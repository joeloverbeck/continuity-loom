import js from "@eslint/js";
import tseslint from "typescript-eslint";

const nodeGlobals = {
  console: "readonly",
  process: "readonly",
  Buffer: "readonly",
  URL: "readonly",
  URLSearchParams: "readonly"
};

export default tseslint.config(
  {
    ignores: [
      "node_modules/**",
      "dist/**",
      "coverage/**",
      "packages/*/dist/**",
      "packages/*/coverage/**",
      // Skill-evidence and browser-evidence artifacts are preserved records, not maintained
      // source. Keep them tracked but exclude them from linting (e.g. decontamination candidate
      // copies of skill scripts).
      "reports/skill-evidence/**",
      "output/**"
    ]
  },
  {
    files: ["**/*.{js,mjs}"],
    ...js.configs.recommended,
    languageOptions: {
      globals: nodeGlobals
    }
  },
  ...tseslint.configs.recommendedTypeChecked.map((config) => ({
    ...config,
    files: ["**/*.{ts,tsx}"]
  })),
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      globals: nodeGlobals,
      parserOptions: {
        projectService: {
          allowDefaultProject: [
            "*.js",
            "*.ts",
            "scripts/*.mjs",
            "test/*.ts",
            "packages/*/src/*.test.ts"
          ],
          maximumDefaultProjectFileMatchCount_THIS_WILL_SLOW_DOWN_LINTING: 96
        },
        tsconfigRootDir: import.meta.dirname
      }
    }
  },
  {
    files: ["packages/server/src/*.test.ts"],
    rules: tseslint.configs.disableTypeChecked.rules
  },
  {
    files: ["packages/core/src/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "fastify",
              message: "@loom/core must stay independent of HTTP frameworks."
            },
            {
              name: "react",
              message: "@loom/core must stay independent of UI frameworks."
            },
            {
              name: "vite",
              message: "@loom/core must stay independent of build frameworks."
            }
          ],
          patterns: [
            {
              group: ["node:*"],
              message: "@loom/core must not import Node builtins."
            }
          ]
        }
      ]
    }
  }
);
