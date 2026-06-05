import { spawn, spawnSync } from "node:child_process";

const build = spawnSync("npm", ["run", "build", "--workspace", "@loom/server"], {
  stdio: "inherit",
  shell: process.platform === "win32"
});

if (build.status !== 0) {
  process.exit(build.status ?? 1);
}

const children = [
  spawn("node", ["packages/server/dist/launch.js", "--api-only", "--port", "5174", "--no-open"], {
    stdio: "inherit",
    shell: process.platform === "win32"
  }),
  spawn("npm", ["run", "dev", "--workspace", "@loom/web"], {
    stdio: "inherit",
    shell: process.platform === "win32"
  })
];

function stopChildren() {
  for (const child of children) {
    if (!child.killed) {
      child.kill("SIGTERM");
    }
  }
}

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    stopChildren();
    process.exit(0);
  });
}

for (const child of children) {
  child.on("exit", (code) => {
    stopChildren();
    process.exit(code ?? 0);
  });
}
