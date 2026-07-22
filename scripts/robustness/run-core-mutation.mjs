import { spawn } from "node:child_process";

const configs = [
  "stryker.prose.config.mjs",
  "stryker.ideation.config.mjs",
  "stryker.change-review.config.mjs",
  "stryker.validation.config.mjs"
];

function runConfig(configFile) {
  return new Promise((resolve) => {
    const child = spawn("npx", ["stryker", "run", configFile, ...process.argv.slice(2)], {
      stdio: "inherit"
    });

    child.on("exit", (code, signal) => {
      resolve({ code: code ?? 1, signal });
    });
  });
}

for (const configFile of configs) {
  const result = await runConfig(configFile);

  if (result.code !== 0) {
    process.exitCode = result.code;
    break;
  }

  if (result.signal) {
    process.exitCode = 1;
    break;
  }
}
