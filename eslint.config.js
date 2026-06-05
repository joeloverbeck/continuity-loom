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
      "packages/*/coverage/**"
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
            "packages/*/test/*.ts",
            "packages/*/src/*.test.ts"
          ]
        },
        tsconfigRootDir: import.meta.dirname
      }
    }
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
