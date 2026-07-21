import { DIAGNOSTIC_CODES, ideationApplicabilityFor, type Severity } from "../src/index.js";
import { readdirSync, readFileSync } from "node:fs";
import { basename, join } from "node:path";
import { describe, expect, it } from "vitest";

type InventoryRow = {
  id: string;
  severity: Severity;
  ideationApplicability: "applies" | "prose-only";
};

const reservedSeverityByCode = new Map<string, Severity>([
  // Present in DIAGNOSTIC_CODES and UI fixtures, but not emitted by the current validation rule registry.
  [DIAGNOSTIC_CODES.castMissingCoreDossier, "blocker"]
]);

describe("validation rule inventory", () => {
  it("matches the diagnostic code set and registered severities", () => {
    const rows = parseInventoryRows();
    const expectedIds = new Set<string>(Object.values(DIAGNOSTIC_CODES));
    const actualIds = new Set(rows.map((row) => row.id));

    expect([...actualIds].filter((id) => !expectedIds.has(id)).sort(), "unexpected inventory IDs").toEqual([]);
    expect([...expectedIds].filter((id) => !actualIds.has(id)).sort(), "missing inventory IDs").toEqual([]);
    expect(rows).toHaveLength(actualIds.size);

    const severityByCode = deriveRegisteredSeverities();

    for (const row of rows) {
      expect(row.severity, row.id).toBe(severityByCode.get(row.id));
      expect(row.ideationApplicability, row.id).toBe(ideationApplicabilityFor(row.id));
    }
  });
});

function parseInventoryRows(): InventoryRow[] {
  const inventory = readFileSync(new URL("../../../docs/specs/validation-rule-inventory.md", import.meta.url), "utf8");

  return inventory
    .split("\n")
    .flatMap((line) => {
      const match = line.match(/^\|\s*`([^`]+)`\s*\|\s*(blocker|warning)\s*\|\s*(applies|prose-only)\s*\|/);

      return match
        ? [
            {
              id: match[1]!,
              severity: match[2] as Severity,
              ideationApplicability: match[3] as "applies" | "prose-only"
            }
          ]
        : [];
    });
}

function deriveRegisteredSeverities(): Map<string, Severity> {
  const severityByCode = new Map(reservedSeverityByCode);
  const rulesDir = resolveSourcePath(new URL("../src/validation/rules", import.meta.url).pathname);
  const codeByKey = new Map<string, string>(Object.entries(DIAGNOSTIC_CODES).map(([key, value]) => [key, value]));

  for (const file of readdirSync(rulesDir).filter((entry) => entry.endsWith(".ts") && !["index.ts", "types.ts"].includes(entry))) {
    const source = readFileSync(join(rulesDir, file), "utf8");
    const severity = deriveFileSeverity(file, source);

    for (const match of source.matchAll(/DIAGNOSTIC_CODES\.([A-Za-z0-9]+)/g)) {
      const code = codeByKey.get(match[1]!);

      if (!code) {
        continue;
      }

      const previous = severityByCode.get(code);
      if (previous && previous !== severity) {
        throw new Error(`Conflicting severities for ${code}: ${previous} vs ${severity}`);
      }

      severityByCode.set(code, severity);
    }
  }

  return severityByCode;
}

function resolveSourcePath(pathname: string): string {
  const sandboxMarker = "/.stryker-tmp/";
  const markerIndex = pathname.indexOf(sandboxMarker);

  if (markerIndex === -1) {
    return pathname;
  }

  const originalRoot = process.env.INIT_CWD;

  if (!originalRoot) {
    return pathname;
  }

  const packageMarker = "/packages/";
  const packageIndex = pathname.indexOf(packageMarker, markerIndex + sandboxMarker.length);

  return packageIndex === -1 ? pathname : join(originalRoot, pathname.slice(packageIndex + 1));
}

function deriveFileSeverity(file: string, source: string): Severity {
  if (basename(file) === "warnings.ts") {
    expect(source).toContain('severity: "warning"');
    return "warning";
  }

  expect(source).toContain('severity: "blocker"');
  return "blocker";
}
