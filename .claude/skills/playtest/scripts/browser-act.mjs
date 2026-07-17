#!/usr/bin/env node

import { chromium } from "playwright";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";

const VERBS = new Set([
  "goto",
  "click",
  "dblclick",
  "hover",
  "focus",
  "check",
  "clear",
  "fill",
  "fill-file",
  "select",
  "press",
  "back",
  "reload",
  "wait",
  "screenshot",
  "elementshot",
  "text",
  "text-file",
  "tree",
  "box",
  "html",
  "pages"
]);

function usage() {
  return `Usage:
  node .claude/skills/playtest/scripts/browser-act.mjs \\
    --session <evidence-dir> <verb> [args] [flags]

Verbs (selectors accept Playwright engines such as role= and text=):
  goto <url>
  click|dblclick|hover|focus|check <selector>
  clear <selector>
  fill <selector> <short-value>
  fill-file <selector> </tmp/input-file>
  select <selector> <value>
  press <key> | press <selector> <key>
  back | reload
  wait <milliseconds|selector>
  screenshot <path>
  elementshot <selector> <path>
  text [selector]
  text-file <selector> </tmp/output-file>
  tree [selector]
  box <selector>
  html <selector>
  pages

Flags:
  --shot <path>     take a viewport screenshot after the action
  --timeout <ms>    per-action timeout (default 10000)
  --settle <ms>     extra settle delay (default 400)
  --max-chars <n>   cap text/tree/html output (default 6000)
  --all             disable the output cap
  --page <n>        page index (default: most recently opened page)`;
}

function parseArgs(argv) {
  const args = {
    timeout: 10_000,
    settle: 400,
    maxChars: 6_000,
    positional: []
  };
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--help" || token === "-h") args.help = true;
    else if (token === "--session") args.session = argv[(index += 1)];
    else if (token === "--shot") args.shot = argv[(index += 1)];
    else if (token === "--timeout") args.timeout = Number(argv[(index += 1)]);
    else if (token === "--settle") args.settle = Number(argv[(index += 1)]);
    else if (token === "--max-chars") args.maxChars = Number(argv[(index += 1)]);
    else if (token === "--all") args.maxChars = Infinity;
    else if (token === "--page") args.pageIndex = Number(argv[(index += 1)]);
    else args.positional.push(token);
  }
  return args;
}

function cap(value, maxChars) {
  if (value.length <= maxChars) return value;
  const omitted = value.length - maxChars;
  return `${value.slice(0, maxChars)}\n…[truncated ${omitted} chars; rerun with --all]`;
}

export function appearsToContainCompiledPrompt(value) {
  return (
    (value.includes("<role>") && value.includes("<final_output_instruction>")) ||
    /^# (?:Generated Prose|Grounded Ideation|Story-Record Hygiene|Segment Reconciliation) Prompt\b/m.test(
      value
    )
  );
}

export function isSupportedVerb(verb) {
  return VERBS.has(verb);
}

function safeTerminalOutput(value) {
  if (appearsToContainCompiledPrompt(value)) {
    throw new Error(
      "Visible output appears to contain a compiled prompt; use text-file on the prompt element."
    );
  }
  return value;
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function isChildPath(parent, candidate) {
  const fromParent = relative(resolve(parent), resolve(candidate));
  return (
    fromParent !== "" &&
    fromParent !== ".." &&
    !fromParent.startsWith(`..${sep}`) &&
    !isAbsolute(fromParent)
  );
}

function assertTmpFilePath(label, value) {
  if (!value || !isAbsolute(value) || !isChildPath("/tmp", value)) {
    throw new Error(`${label} must be an absolute child path under /tmp.`);
  }
  return resolve(value);
}

function outputPath(rawPath, session) {
  if (!rawPath || !isAbsolute(rawPath)) {
    throw new Error("Screenshot paths must be absolute.");
  }
  const path = resolve(rawPath);
  if (!isChildPath("/tmp", path) && !isChildPath(session.evidenceDir, path)) {
    throw new Error("Screenshots must stay under /tmp or this run's evidence directory.");
  }
  if (existsSync(path)) throw new Error(`Refusing to overwrite an existing screenshot: ${path}`);
  mkdirSync(dirname(path), { recursive: true });
  return path;
}

function requireArgs(verb, values, count) {
  if (values.length < count || values.slice(0, count).some((value) => !value)) {
    throw new Error(`${verb} is missing required arguments.\n\n${usage()}`);
  }
}

async function settle(page, settleMs) {
  await page.waitForLoadState("domcontentloaded").catch(() => undefined);
  await page.waitForLoadState("networkidle", { timeout: 2_500 }).catch(() => undefined);
  await page.waitForTimeout(settleMs);
}

export async function clearVisibleField(locator, timeout) {
  await locator.fill("", { timeout });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || args.positional.length === 0) {
    process.stdout.write(`${usage()}\n`);
    return args.help ? 0 : 1;
  }
  if (!args.session) throw new Error("Missing --session <evidence-dir>.");
  if (!Number.isFinite(args.timeout) || args.timeout <= 0) {
    throw new Error("--timeout must be a positive number.");
  }
  if (!Number.isFinite(args.settle) || args.settle < 0) {
    throw new Error("--settle must be a non-negative number.");
  }
  if (args.pageIndex !== undefined && (!Number.isInteger(args.pageIndex) || args.pageIndex < 0)) {
    throw new Error("--page must be a non-negative integer.");
  }

  const [verb, ...rest] = args.positional;
  if (!isSupportedVerb(verb)) throw new Error(`Unknown verb: ${verb}\n\n${usage()}`);

  const sessionPath = resolve(args.session, "session.json");
  if (!existsSync(sessionPath)) {
    throw new Error(
      "Could not find session.json; start browser-session.mjs with this evidence directory first."
    );
  }
  const session = JSON.parse(readFileSync(sessionPath, "utf8"));
  if (
    !session.providerGuardReady ||
    !session.cdpUrl ||
    !session.evidenceDir ||
    !session.allowedOrigin
  ) {
    throw new Error("Browser session is missing its provider-guard readiness proof.");
  }

  const result = { ok: true, verb };
  let rawOutput = null;
  let browser;
  try {
    browser = await chromium.connectOverCDP(session.cdpUrl, { timeout: 5_000 });
    const context = browser.contexts()[0];
    if (!context) throw new Error("No browser context found over CDP.");
    let pages = context.pages();
    if (pages.length === 0) pages = [await context.newPage()];
    const page = args.pageIndex === undefined ? pages[pages.length - 1] : pages[args.pageIndex];
    if (!page) throw new Error(`No page at index ${String(args.pageIndex)}.`);

    page.setDefaultTimeout(args.timeout);
    const dialogs = [];
    page.on("dialog", (dialog) => {
      dialogs.push({ type: dialog.type(), message: dialog.message() });
      void dialog.dismiss().catch(() => undefined);
    });
    const target = (selector) => page.locator(selector).first();

    switch (verb) {
      case "goto": {
        requireArgs(verb, rest, 1);
        const url = new URL(rest[0]);
        if (url.origin !== session.allowedOrigin) {
          throw new Error("goto is restricted to this browser session's app origin.");
        }
        await page.goto(url.href, {
          waitUntil: "domcontentloaded",
          timeout: args.timeout
        });
        break;
      }
      case "click":
        requireArgs(verb, rest, 1);
        await target(rest[0]).click({ timeout: args.timeout });
        break;
      case "dblclick":
        requireArgs(verb, rest, 1);
        await target(rest[0]).dblclick({ timeout: args.timeout });
        break;
      case "hover":
        requireArgs(verb, rest, 1);
        await target(rest[0]).hover({ timeout: args.timeout });
        break;
      case "focus":
        requireArgs(verb, rest, 1);
        await target(rest[0]).focus({ timeout: args.timeout });
        break;
      case "check":
        requireArgs(verb, rest, 1);
        await target(rest[0]).check({ timeout: args.timeout });
        break;
      case "clear":
        requireArgs(verb, rest, 1);
        await clearVisibleField(target(rest[0]), args.timeout);
        result.charCount = 0;
        break;
      case "fill": {
        requireArgs(verb, rest, 2);
        const value = rest.slice(1).join(" ");
        if (value.length > 500) {
          throw new Error("fill is capped at 500 characters; use fill-file for long content.");
        }
        await target(rest[0]).fill(value, { timeout: args.timeout });
        result.charCount = value.length;
        break;
      }
      case "fill-file": {
        requireArgs(verb, rest, 2);
        const inputPath = assertTmpFilePath("fill-file input", rest[1]);
        const value = readFileSync(inputPath, "utf8");
        await target(rest[0]).fill(value, { timeout: args.timeout });
        result.inputPath = inputPath;
        result.charCount = value.length;
        result.sha256 = sha256(value);
        break;
      }
      case "select":
        requireArgs(verb, rest, 2);
        result.selected = await target(rest[0]).selectOption(rest[1], {
          timeout: args.timeout
        });
        break;
      case "press":
        requireArgs(verb, rest, 1);
        if (rest.length >= 2) {
          await target(rest[0]).press(rest[1], { timeout: args.timeout });
        } else {
          await page.keyboard.press(rest[0]);
        }
        break;
      case "back":
        await page.goBack({ timeout: args.timeout });
        break;
      case "reload":
        await page.reload({
          waitUntil: "domcontentloaded",
          timeout: args.timeout
        });
        break;
      case "wait":
        requireArgs(verb, rest, 1);
        if (/^\d+$/.test(rest[0])) {
          await page.waitForTimeout(Number(rest[0]));
        } else {
          await target(rest[0]).waitFor({
            state: "visible",
            timeout: args.timeout
          });
        }
        break;
      case "screenshot":
        requireArgs(verb, rest, 1);
        result.screenshot = outputPath(rest[0], session);
        break;
      case "elementshot":
        requireArgs(verb, rest, 2);
        result.screenshot = outputPath(rest[1], session);
        await target(rest[0]).screenshot({ path: result.screenshot });
        break;
      case "text":
        rawOutput = cap(
          safeTerminalOutput(await (rest[0] ? target(rest[0]) : page.locator("body")).innerText()),
          args.maxChars
        );
        break;
      case "text-file": {
        requireArgs(verb, rest, 2);
        const outputFile = assertTmpFilePath("text-file output", rest[1]);
        if (existsSync(outputFile)) {
          throw new Error(`Refusing to overwrite an existing text extraction: ${outputFile}`);
        }
        const locator = target(rest[0]);
        if (!(await locator.isVisible())) {
          throw new Error("text-file may extract only a visible element.");
        }
        const value = await locator.innerText();
        mkdirSync(dirname(outputFile), { recursive: true });
        writeFileSync(outputFile, value, "utf8");
        result.outputPath = outputFile;
        result.charCount = value.length;
        result.sha256 = sha256(value);
        break;
      }
      case "tree":
        rawOutput = cap(
          safeTerminalOutput(
            await (rest[0] ? target(rest[0]) : page.locator("body")).ariaSnapshot()
          ),
          args.maxChars
        );
        break;
      case "box": {
        requireArgs(verb, rest, 1);
        const box = await target(rest[0]).boundingBox();
        const viewport =
          page.viewportSize() ??
          (() => {
            const [width, height] = String(session.viewport).split("x").map(Number);
            return { width, height };
          })();
        rawOutput = JSON.stringify({ box, viewport }, null, 2);
        break;
      }
      case "html":
        requireArgs(verb, rest, 1);
        if (!(await target(rest[0]).isVisible())) {
          throw new Error("html diagnostics are restricted to a visible element.");
        }
        rawOutput = cap(
          safeTerminalOutput(await target(rest[0]).evaluate((element) => element.outerHTML)),
          args.maxChars
        );
        break;
      case "pages":
        rawOutput = JSON.stringify(
          pages.map((candidate, index) => ({ index, url: candidate.url() })),
          null,
          2
        );
        break;
      default:
        throw new Error(`Unhandled verb: ${verb}`);
    }

    await settle(page, args.settle);
    if (verb === "screenshot") {
      await page.screenshot({ path: result.screenshot, fullPage: false });
    }
    if (args.shot) {
      result.screenshot = outputPath(args.shot, session);
      await page.screenshot({ path: result.screenshot, fullPage: false });
    }
    if (dialogs.length > 0) result.dialogs = dialogs;
    result.url = page.url();
    result.title = await page.title().catch(() => null);
  } catch (error) {
    result.ok = false;
    result.error = String(error?.message ?? error).split("\nCall log:")[0];
  }

  process.stdout.write(`${JSON.stringify(result)}\n`);
  if (rawOutput !== null) process.stdout.write(`--- output ---\n${rawOutput}\n`);

  // Do not call browser.close(): over CDP that would terminate the held browser.
  // Exiting this short-lived process drops only this command's WebSocket.
  return result.ok ? 0 : 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main()
    .then((exitCode) => {
      process.exit(exitCode);
    })
    .catch((error) => {
      process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
      process.exit(1);
    });
}
