#!/usr/bin/env node

import { spawn } from "node:child_process";
import { appendFileSync, existsSync, mkdirSync, unlinkSync, writeFileSync } from "node:fs";
import { isAbsolute, join, relative, resolve, sep } from "node:path";

const STARTUP_TIMEOUT_MS = 30_000;
const SHUTDOWN_TIMEOUT_MS = 5_000;

function usage() {
  return `Usage:
  node .claude/skills/playtest/scripts/safe-app-session.mjs \\
    --repo-root <path> --session-dir </tmp/path> --config-dir </tmp/path>

Starts the built production app on an ephemeral 127.0.0.1 port with an
explicitly blank OPENROUTER_API_KEY and an isolated settings directory. Writes
app-session.json after verifying the credential is absent. Runs until
shutdown.request appears in the session directory or it receives SIGINT/SIGTERM.`;
}

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--help" || token === "-h") args.help = true;
    else if (token === "--repo-root") args.repoRoot = argv[(index += 1)];
    else if (token === "--session-dir") args.sessionDir = argv[(index += 1)];
    else if (token === "--config-dir") args.configDir = argv[(index += 1)];
    else throw new Error(`Unknown argument: ${token}`);
  }
  return args;
}

function assertTmpPath(label, value) {
  if (!value || !isAbsolute(value)) {
    throw new Error(`${label} must be an absolute path under /tmp.`);
  }
  const resolved = resolve(value);
  const fromTmp = relative("/tmp", resolved);
  if (fromTmp === "" || fromTmp === ".." || fromTmp.startsWith(`..${sep}`) || isAbsolute(fromTmp)) {
    throw new Error(`${label} must be a child path under /tmp.`);
  }
  return resolved;
}

function append(file, chunk) {
  appendFileSync(file, chunk);
}

async function waitForBaseUrl(child, stdoutLog, stderrLog) {
  return new Promise((resolveUrl, reject) => {
    let buffered = "";
    let settled = false;

    const finish = (callback, value) => {
      if (settled) return;
      settled = true;
      globalThis.clearTimeout(timer);
      callback(value);
    };

    const timer = globalThis.setTimeout(() => {
      finish(reject, new Error("Timed out waiting for the app to announce its loopback URL."));
    }, STARTUP_TIMEOUT_MS);

    child.stdout.on("data", (chunk) => {
      const text = chunk.toString();
      append(stdoutLog, text);
      buffered = `${buffered}${text}`.slice(-8_000);
      const match = buffered.match(/Continuity Loom is running at (http:\/\/127\.0\.0\.1:\d+)/);
      if (match) finish(resolveUrl, match[1]);
    });
    child.stderr.on("data", (chunk) => append(stderrLog, chunk));
    child.once("error", (error) => finish(reject, error));
    child.once("exit", (code, signal) => {
      finish(
        reject,
        new Error(
          `App exited before becoming ready (code ${String(code)}, signal ${String(signal)}).`
        )
      );
    });
  });
}

async function verifySafeSession(baseUrl) {
  if (!/^http:\/\/127\.0\.0\.1:\d+$/.test(baseUrl)) {
    throw new Error(`App announced a non-loopback URL: ${baseUrl}`);
  }

  const healthResponse = await globalThis.fetch(`${baseUrl}/api/health`);
  if (!healthResponse.ok) {
    throw new Error(`Health check failed with HTTP ${healthResponse.status}.`);
  }
  const health = await healthResponse.json();

  const settingsResponse = await globalThis.fetch(`${baseUrl}/api/settings/openrouter`);
  if (!settingsResponse.ok) {
    throw new Error(`Settings safety check failed with HTTP ${settingsResponse.status}.`);
  }
  const settings = await settingsResponse.json();
  if (settings?.hasOpenRouterCredential !== false) {
    throw new Error("Safety check failed: the isolated app reports an OpenRouter credential.");
  }

  return { health, hasOpenRouterCredential: false };
}

async function stopChild(child) {
  if (child.exitCode !== null || child.signalCode !== null) return;
  await new Promise((resolveExit) => {
    const timer = globalThis.setTimeout(() => {
      if (child.exitCode === null && child.signalCode === null) child.kill("SIGKILL");
    }, SHUTDOWN_TIMEOUT_MS);
    child.once("exit", () => {
      globalThis.clearTimeout(timer);
      resolveExit();
    });
    child.kill("SIGTERM");
  });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    process.stdout.write(`${usage()}\n`);
    return;
  }
  if (!args.repoRoot || !args.sessionDir || !args.configDir) {
    throw new Error(usage());
  }

  const repoRoot = resolve(args.repoRoot);
  const sessionDir = assertTmpPath("--session-dir", args.sessionDir);
  const configDir = assertTmpPath("--config-dir", args.configDir);
  const launchScript = join(repoRoot, "packages", "server", "dist", "launch.js");
  if (!existsSync(launchScript)) {
    throw new Error(`Built server not found at ${launchScript}. Run npm run build first.`);
  }

  mkdirSync(sessionDir, { recursive: true });
  mkdirSync(configDir, { recursive: true });
  const sessionPath = join(sessionDir, "app-session.json");
  const shutdownPath = join(sessionDir, "shutdown.request");
  if (existsSync(sessionPath)) {
    throw new Error(`Refusing to overwrite an existing app session: ${sessionPath}`);
  }
  if (existsSync(shutdownPath)) unlinkSync(shutdownPath);

  const stdoutLog = join(sessionDir, "server-stdout.log");
  const stderrLog = join(sessionDir, "server-stderr.log");
  writeFileSync(stdoutLog, "", "utf8");
  writeFileSync(stderrLog, "", "utf8");

  const child = spawn(process.execPath, [launchScript, "--no-open", "--port", "0"], {
    cwd: repoRoot,
    env: {
      ...process.env,
      CONTINUITY_LOOM_CONFIG_DIR: configDir,
      OPENROUTER_API_KEY: ""
    },
    stdio: ["ignore", "pipe", "pipe"]
  });

  let shuttingDown = false;
  let poller = null;
  const shutdown = async (exitCode = 0) => {
    if (shuttingDown) return;
    shuttingDown = true;
    if (poller) globalThis.clearInterval(poller);
    await stopChild(child);
    process.exitCode = exitCode;
  };

  process.once("SIGINT", () => void shutdown(0));
  process.once("SIGTERM", () => void shutdown(0));

  let baseUrl;
  try {
    baseUrl = await waitForBaseUrl(child, stdoutLog, stderrLog);
    const safety = await verifySafeSession(baseUrl);
    const session = {
      ready: true,
      pid: process.pid,
      appPid: child.pid,
      baseUrl,
      host: "127.0.0.1",
      configDir,
      credentialSource: "explicitly-blank-process-environment",
      hasOpenRouterCredential: safety.hasOpenRouterCredential,
      health: safety.health,
      stdoutLog,
      stderrLog,
      startedAt: new Date().toISOString()
    };
    writeFileSync(sessionPath, `${JSON.stringify(session, null, 2)}\n`, "utf8");
    process.stdout.write(`${JSON.stringify({ ready: true, baseUrl, pid: process.pid })}\n`);
  } catch (error) {
    await stopChild(child);
    throw error;
  }

  child.once("exit", (code, signal) => {
    if (shuttingDown) return;
    append(
      stderrLog,
      `\nApp exited unexpectedly after startup (code ${String(code)}, signal ${String(signal)}).\n`
    );
    void shutdown(2);
  });

  poller = globalThis.setInterval(() => {
    if (!existsSync(shutdownPath)) return;
    unlinkSync(shutdownPath);
    void shutdown(0);
  }, 250);
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
