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
          allowDefaultProject: ["*.js", "*.ts", "scripts/*.mjs"]
        },
        tsconfigRootDir: import.meta.dirname
      }
    }
  }
);
