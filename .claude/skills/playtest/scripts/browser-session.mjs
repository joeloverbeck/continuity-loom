#!/usr/bin/env node

import { chromium } from "playwright";
import {
  appendFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  unlinkSync,
  writeFileSync
} from "node:fs";
import { createServer } from "node:net";
import { isAbsolute, join, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";

const GUARDED_POST_PATHS = new Set([
  "/api/generate",
  "/api/ideate",
  "/api/record-hygiene/analyze",
  "/api/accepted-segment-change-review/analyze",
  "/api/settings/openrouter/models"
]);

function usage() {
  return `Usage:
  node .claude/skills/playtest/scripts/browser-session.mjs \\
    --evidence-dir <reports/assets/stem> --scratch-dir </tmp/path> \\
    --base-url <http://127.0.0.1:port> [--port 0] [--headed]

Launches a fresh 1440x900 persistent Chromium context, exposes CDP to
browser-act.mjs, installs provider-request guards before navigation, and logs
console/network failures. Requests outside the supplied app origin are also
blocked. Runs until shutdown.request appears in evidence-dir. SIGINT/SIGTERM
are recorded as unexpected terminations and exit nonzero.`;
}

function parseArgs(argv) {
  const args = { port: 0, headless: true };
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--help" || token === "-h") args.help = true;
    else if (token === "--evidence-dir") args.evidenceDir = argv[(index += 1)];
    else if (token === "--scratch-dir") args.scratchDir = argv[(index += 1)];
    else if (token === "--base-url") args.baseUrl = argv[(index += 1)];
    else if (token === "--port") args.port = Number(argv[(index += 1)]);
    else if (token === "--headed") args.headless = false;
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

async function availableLoopbackPort() {
  const server = createServer();
  await new Promise((resolveListen, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolveListen);
  });
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : null;
  await new Promise((resolveClose, reject) => {
    server.close((error) => (error ? reject(error) : resolveClose()));
  });
  if (!port) throw new Error("Could not allocate a loopback CDP port.");
  return port;
}

function record(file, entry) {
  appendFileSync(file, `${JSON.stringify({ at: new Date().toISOString(), ...entry })}\n`);
}

export function isGuardedProviderRequest(method, url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  if (parsed.hostname === "openrouter.ai" || parsed.hostname.endsWith(".openrouter.ai")) {
    return true;
  }
  return method === "POST" && GUARDED_POST_PATHS.has(parsed.pathname);
}

export function isAllowedAppRequest(baseUrl, requestUrl) {
  let base;
  let candidate;
  try {
    base = new URL(baseUrl);
    candidate = new URL(requestUrl);
  } catch {
    return false;
  }
  if (candidate.protocol === "data:" || candidate.protocol === "about:") return true;
  if (candidate.protocol === "blob:") return candidate.origin === base.origin;

  const allowedProtocols =
    base.protocol === "http:" ? new Set(["http:", "ws:"]) : new Set(["https:", "wss:"]);
  return (
    allowedProtocols.has(candidate.protocol) &&
    candidate.hostname === base.hostname &&
    candidate.port === base.port
  );
}

export function getBrowserSessionTermination(trigger) {
  if (trigger === "shutdown-request") {
    return {
      trigger,
      expected: true,
      exitCode: 0,
      message: "Browser session closed after shutdown.request."
    };
  }
  if (trigger === "SIGINT" || trigger === "SIGTERM") {
    return {
      trigger: `signal:${trigger}`,
      expected: false,
      exitCode: 2,
      message: `Browser session received ${trigger} before shutdown.request.`
    };
  }
  if (trigger === "browser-context-close") {
    return {
      trigger,
      expected: false,
      exitCode: 2,
      message: "Browser context closed before shutdown.request."
    };
  }
  throw new Error(`Unknown browser-session termination trigger: ${trigger}`);
}

// Launch with reducedMotion: "reduce" so CSS animations that honor
// prefers-reduced-motion cannot keep a click target perpetually in motion.
// Playwright's actionability "stable" gate polls a target's bounding box across
// animation frames; a forever-animating element never stabilizes and the click
// times out at the motion-stability gate. This is an animation × actionability
// interaction, not an environment limitation; the documented fallback for a
// target that still will not stabilize (an animation without a reduced-motion
// guard) is keyboard activation via focus + press, which needs no motion
// stability. Screenshots do not depend on the stability gate and work here.
export function buildLaunchOptions({ cdpPort, headless }) {
  return {
    headless,
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    reducedMotion: "reduce",
    args: [`--remote-debugging-port=${cdpPort}`, "--remote-debugging-address=127.0.0.1"]
  };
}

// Per-run capability probe: capture one throwaway screenshot of the initial
// page so a run knows from session.json whether raster evidence is available
// instead of assuming it is not. Fail-soft — a failed probe records
// screenshotCapable: false and never aborts the run (the journey can proceed
// through text/tree snapshots).
export async function runScreenshotSelfCheck(page, { timeout = 8_000 } = {}) {
  const startedAt = Date.now();
  try {
    const buffer = await page.screenshot({ timeout });
    return {
      screenshotCapable: true,
      screenshotProbeMs: Date.now() - startedAt,
      screenshotProbeBytes: buffer.length
    };
  } catch (error) {
    return {
      screenshotCapable: false,
      screenshotProbeMs: Date.now() - startedAt,
      screenshotProbeError: String(error?.message ?? error).split("\n")[0]
    };
  }
}

function isGuardedRequest(request) {
  return isGuardedProviderRequest(request.method(), request.url());
}

async function launchContext(profileDir, launchOptions) {
  const attempts = [
    { label: "chromium", options: launchOptions },
    { label: "chrome", options: { ...launchOptions, channel: "chrome" } }
  ];
  const failures = [];
  for (const attempt of attempts) {
    try {
      const context = await chromium.launchPersistentContext(profileDir, attempt.options);
      return { context, channel: attempt.label };
    } catch (error) {
      failures.push(`${attempt.label}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  throw new Error(`Could not launch a Playwright browser.\n${failures.join("\n")}`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    process.stdout.write(`${usage()}\n`);
    return;
  }
  if (!args.evidenceDir || !args.scratchDir || !args.baseUrl) throw new Error(usage());
  if (!Number.isInteger(args.port) || args.port < 0 || args.port > 65535) {
    throw new Error("--port must be an integer from 0 to 65535.");
  }

  const evidenceDir = resolve(args.evidenceDir);
  const scratchDir = assertTmpPath("--scratch-dir", args.scratchDir);
  const baseUrl = new URL(args.baseUrl);
  if (baseUrl.protocol !== "http:" || baseUrl.hostname !== "127.0.0.1" || !baseUrl.port) {
    throw new Error("--base-url must be an http://127.0.0.1 URL with an explicit port.");
  }
  const allowedOrigin = baseUrl.origin;
  mkdirSync(evidenceDir, { recursive: true });
  mkdirSync(scratchDir, { recursive: true });

  const sessionPath = join(evidenceDir, "session.json");
  const shutdownPath = join(evidenceDir, "shutdown.request");
  if (existsSync(sessionPath)) {
    throw new Error(`Refusing to overwrite an existing browser session: ${sessionPath}`);
  }
  if (existsSync(shutdownPath)) unlinkSync(shutdownPath);

  const consoleLog = join(evidenceDir, "console-log.jsonl");
  const networkLog = join(evidenceDir, "network-failures.jsonl");
  const providerBlockLog = join(evidenceDir, "provider-request-blocks.jsonl");
  const externalBlockLog = join(evidenceDir, "external-request-blocks.jsonl");
  for (const stream of [consoleLog, networkLog, providerBlockLog, externalBlockLog]) {
    writeFileSync(stream, "", "utf8");
  }

  const cdpPort = args.port === 0 ? await availableLoopbackPort() : args.port;
  const profileDir = mkdtempSync(join(scratchDir, "profile-"));
  const launchOptions = buildLaunchOptions({ cdpPort, headless: args.headless });

  let context;
  let channel;
  try {
    ({ context, channel } = await launchContext(profileDir, launchOptions));
  } catch (error) {
    rmSync(profileDir, { recursive: true, force: true });
    throw error;
  }

  await context.route("**/*", async (route) => {
    const request = route.request();
    if (!isGuardedRequest(request)) {
      if (isAllowedAppRequest(baseUrl.href, request.url())) {
        await route.continue();
        return;
      }
      record(externalBlockLog, {
        kind: "external-request-blocked",
        method: request.method(),
        url: request.url(),
        resourceType: request.resourceType()
      });
      await route.abort("blockedbyclient");
      return;
    }
    record(providerBlockLog, {
      kind: "provider-request-blocked",
      method: request.method(),
      url: request.url(),
      resourceType: request.resourceType()
    });
    await route.abort("blockedbyclient");
  });

  function attach(page) {
    page.on("console", (message) => {
      const level = message.type();
      if (level !== "error" && level !== "warning") return;
      record(consoleLog, {
        kind: "console",
        level,
        text: message.text(),
        location: message.location(),
        pageUrl: page.url()
      });
    });
    page.on("pageerror", (error) => {
      record(consoleLog, {
        kind: "pageerror",
        message: String(error),
        pageUrl: page.url()
      });
    });
    page.on("requestfailed", (request) => {
      record(networkLog, {
        kind: "requestfailed",
        method: request.method(),
        url: request.url(),
        error: request.failure()?.errorText ?? "unknown"
      });
    });
    page.on("response", (response) => {
      if (response.status() < 400) return;
      record(networkLog, {
        kind: "http-error",
        status: response.status(),
        method: response.request().method(),
        url: response.url()
      });
    });
  }

  context.pages().forEach(attach);
  context.on("page", attach);

  const probePage = context.pages()[0] ?? (await context.newPage());
  const screenshotSelfCheck = await runScreenshotSelfCheck(probePage);

  let shuttingDown = false;
  let poller = null;
  const shutdown = async (trigger) => {
    if (shuttingDown) return;
    shuttingDown = true;
    const termination = getBrowserSessionTermination(trigger);
    if (!termination.expected) {
      record(consoleLog, { kind: "session-termination", ...termination });
    }
    if (poller) globalThis.clearInterval(poller);
    await context.close().catch(() => undefined);
    rmSync(profileDir, { recursive: true, force: true });
    process.exitCode = termination.exitCode;
  };

  process.once("SIGINT", () => void shutdown("SIGINT"));
  process.once("SIGTERM", () => void shutdown("SIGTERM"));
  context.once("close", () => {
    if (shuttingDown) return;
    void shutdown("browser-context-close");
  });

  const session = {
    ready: true,
    cdpPort,
    cdpUrl: `http://127.0.0.1:${cdpPort}`,
    pid: process.pid,
    evidenceDir,
    scratchDir,
    profileDir,
    baseUrl: baseUrl.href.replace(/\/$/, ""),
    allowedOrigin,
    headless: args.headless,
    viewport: "1440x900",
    reducedMotion: "reduce",
    channel,
    browserVersion: context.browser()?.version() ?? "unknown",
    providerGuardReady: true,
    guardedPostPaths: [...GUARDED_POST_PATHS],
    guardInstalledAt: new Date().toISOString(),
    ...screenshotSelfCheck
  };
  writeFileSync(sessionPath, `${JSON.stringify(session, null, 2)}\n`, "utf8");
  process.stdout.write(
    `${JSON.stringify({
      ready: true,
      cdpPort,
      pid: process.pid,
      evidenceDir,
      screenshotCapable: screenshotSelfCheck.screenshotCapable
    })}\n`
  );

  poller = globalThis.setInterval(() => {
    if (!existsSync(shutdownPath)) return;
    unlinkSync(shutdownPath);
    void shutdown("shutdown-request");
  }, 250);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}
