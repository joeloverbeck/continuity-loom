import staticFiles from "@fastify/static";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import type { AddressInfo } from "node:net";
import { fileURLToPath } from "node:url";

import { createServer, LOOPBACK_HOST } from "./server.js";

const DEFAULT_PORT = 4173;

export interface LaunchOptions {
  port: number;
  apiOnly: boolean;
  openBrowser: boolean;
  webDistDir: string;
}

export interface LaunchedApp {
  url: string;
  close: () => Promise<void>;
}

export function parseLaunchArgs(args: string[], fallbackDistDir = defaultWebDistDir()): LaunchOptions {
  let port = Number(process.env.PORT ?? DEFAULT_PORT);
  let apiOnly = false;
  let openBrowser = true;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--api-only") {
      apiOnly = true;
      continue;
    }

    if (arg === "--no-open") {
      openBrowser = false;
      continue;
    }

    if (arg === "--port") {
      const value = args[index + 1];
      index += 1;
      port = Number(value);
    }
  }

  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    throw new Error(`Invalid port: ${String(port)}`);
  }

  return {
    port,
    apiOnly,
    openBrowser,
    webDistDir: fallbackDistDir
  };
}

export function defaultWebDistDir(): string {
  return fileURLToPath(new URL("../../web/dist/", import.meta.url));
}

export function defaultRootEnvPath(): string {
  return fileURLToPath(new URL("../../../.env", import.meta.url));
}

export function loadRootEnv(envPath = defaultRootEnvPath()): void {
  if (existsSync(envPath)) {
    process.loadEnvFile(envPath);
  }
}

export function configureStaticAssets(webDistDir: string): void {
  if (!existsSync(webDistDir)) {
    throw new Error(`Web build output not found at ${webDistDir}. Run npm run build first.`);
  }
}

export function openBrowserBestEffort(url: string): void {
  const command =
    process.platform === "darwin" ? "open" : process.platform === "win32" ? "cmd" : "xdg-open";
  const args = process.platform === "win32" ? ["/c", "start", "", url] : [url];

  const child = spawn(command, args, {
    detached: true,
    stdio: "ignore"
  });

  child.on("error", () => undefined);
  child.unref();
}

export async function launch(options: LaunchOptions): Promise<LaunchedApp> {
  const app = createServer({ logger: true });

  if (!options.apiOnly) {
    configureStaticAssets(options.webDistDir);
    await app.register(staticFiles, {
      root: options.webDistDir,
      prefix: "/",
      wildcard: false
    });
    app.setNotFoundHandler((_request, reply) => reply.sendFile("index.html"));
  }

  try {
    await app.listen({ host: LOOPBACK_HOST, port: options.port });
  } catch (error) {
    const code = typeof error === "object" && error !== null && "code" in error ? error.code : "";

    if (code === "EADDRINUSE") {
      throw new Error(`Port ${options.port} is already in use. Stop that process or set PORT.`);
    }

    throw error;
  }

  const address = app.server.address() as AddressInfo | null;
  const actualPort = address?.port ?? options.port;
  const url = `http://${LOOPBACK_HOST}:${actualPort}`;
  console.log(`Continuity Loom is running at ${url}`);

  if (options.openBrowser) {
    openBrowserBestEffort(url);
  }

  return {
    url,
    close: () => app.close()
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  loadRootEnv();
  launch(parseLaunchArgs(process.argv.slice(2))).catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    process.exit(1);
  });
}
