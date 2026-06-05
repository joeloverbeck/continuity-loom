import { spawnSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

const scriptName = process.argv[2];

if (!scriptName) {
  console.error("Usage: node scripts/run-workspaces-if-present.mjs <script>");
  process.exit(1);
}

const packagesDir = join(process.cwd(), "packages");
const hasWorkspaces =
  existsSync(packagesDir) &&
  readdirSync(packagesDir, { withFileTypes: true }).some(
    (entry) => entry.isDirectory() && existsSync(join(packagesDir, entry.name, "package.json"))
  );

if (!hasWorkspaces) {
  process.exit(0);
}

const result = spawnSync(
  "npm",
  ["run", scriptName, "--workspaces", "--if-present"],
  { stdio: "inherit", shell: process.platform === "win32" }
);

process.exit(result.status ?? 1);
