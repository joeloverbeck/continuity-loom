import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { extname, join } from "node:path";

const forbiddenFrameworkImports = new Set(["fastify", "react", "vite"]);
const staticImportPattern = /\bimport\s+(?:type\s+)?(?:[^'"]+\s+from\s+)?["']([^"']+)["']/g;
const dynamicImportPattern = /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g;
const requirePattern = /\brequire\s*\(\s*["']([^"']+)["']\s*\)/g;

function listTypeScriptFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);

    if (entry.isDirectory()) {
      return listTypeScriptFiles(path);
    }

    return extname(entry.name) === ".ts" ? [path] : [];
  });
}

function importedSpecifiers(source: string): string[] {
  return [staticImportPattern, dynamicImportPattern, requirePattern].flatMap((pattern) =>
    Array.from(source.matchAll(pattern), (match) => match[1] ?? "")
  );
}

describe("@loom/core boundary", () => {
  it("does not import node builtins or framework modules from production source", () => {
    const sourceDir = new URL("../src", import.meta.url);
    const violations = listTypeScriptFiles(sourceDir.pathname).flatMap((file) => {
      const source = readFileSync(file, "utf8");

      return importedSpecifiers(source)
        .filter((specifier) => specifier.startsWith("node:") || forbiddenFrameworkImports.has(specifier))
        .map((specifier) => `${file}: ${specifier}`);
    });

    expect(violations).toEqual([]);
  });
});
