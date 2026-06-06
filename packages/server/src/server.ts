import { versionInfo } from "@loom/core";
import Fastify, { type FastifyInstance } from "fastify";
import type { AddressInfo } from "node:net";

import { registerCompileRoutes } from "./compile-routes.js";
import { registerAcceptedRoutes } from "./accepted-routes.js";
import { registerGenerateRoutes } from "./generate-routes.js";
import { registerGenerationBriefRoutes } from "./generation-brief-routes.js";
import { registerProjectRoutes } from "./project-routes.js";
import { createProjectStoreManager } from "./project-store.js";
import { registerRecordRoutes } from "./record-routes.js";
import { registerSettingsRoutes } from "./settings-routes.js";
import { registerStoryConfigRoutes } from "./story-config-routes.js";
import { registerValidationRoutes } from "./validation-routes.js";
import { healthResponseSchema, versionInfoSchema } from "./version-schema.js";
import { registerWorkingSetRoutes } from "./working-set-routes.js";

export const LOOPBACK_HOST = "127.0.0.1";

export interface ServerOptions {
  logger?: boolean;
}

export interface StartedServer {
  app: FastifyInstance;
  address: AddressInfo;
  close: () => Promise<void>;
}

export function createServer(options: ServerOptions = {}): FastifyInstance {
  const app = Fastify({
    logger: options.logger
      ? {
          level: "warn",
          redact: {
            paths: [
              "req.headers.authorization",
              "req.headers.cookie",
              "apiKey",
              "api_key",
              "prompt",
              "messages",
              "candidate",
              "candidateText",
              "candidateProse",
              "choices",
              "body",
              "acceptedProse",
              "recordPayload"
            ],
            censor: "[redacted]"
          },
          serializers: {
            req(request) {
              return {
                method: request.method,
                url: request.url,
                hostname: request.hostname,
                remoteAddress: request.ip
              };
            }
          }
        }
      : false
  });

  const projectStoreManager = createProjectStoreManager();

  app.get("/api/health", () => healthResponseSchema.parse({ status: "ok" }));
  app.get("/api/version", () => versionInfoSchema.parse(versionInfo));
  registerProjectRoutes(app, projectStoreManager);
  registerRecordRoutes(app, projectStoreManager);
  registerStoryConfigRoutes(app, projectStoreManager);
  registerGenerationBriefRoutes(app, projectStoreManager);
  registerWorkingSetRoutes(app, projectStoreManager);
  registerValidationRoutes(app, projectStoreManager);
  registerCompileRoutes(app, projectStoreManager);
  registerSettingsRoutes(app);
  registerGenerateRoutes(app, projectStoreManager);
  registerAcceptedRoutes(app, projectStoreManager);
  app.addHook("onClose", async () => {
    await projectStoreManager.closeProject();
  });

  return app;
}

export async function startServer(port: number, options: ServerOptions = {}): Promise<StartedServer> {
  const app = createServer(options);

  await app.listen({ host: LOOPBACK_HOST, port });

  const address = app.server.address();

  if (!address || typeof address === "string") {
    await app.close();
    throw new Error("Server did not bind to a TCP address.");
  }

  return {
    app,
    address,
    close: () => app.close()
  };
}
