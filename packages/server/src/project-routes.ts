import type { FastifyInstance } from "fastify";
import { z, ZodError } from "zod";

import type { ProjectStoreManager } from "./project-store.js";

const createProjectBodySchema = z
  .object({
    parentPath: z.string().min(1),
    folderName: z.string().min(1),
    title: z.string().trim().min(1),
    description: z.string().optional()
  })
  .strict();

const openProjectBodySchema = z
  .object({
    folderPath: z.string().min(1)
  })
  .strict();

function badRequest(message: string): { ok: false; kind: "invalid-request"; message: string } {
  return { ok: false, kind: "invalid-request", message };
}

function operationFailure(message: string): { ok: false; kind: "unreadable"; message: string } {
  return { ok: false, kind: "unreadable", message };
}

export function registerProjectRoutes(app: FastifyInstance, manager: ProjectStoreManager): void {
  app.post("/api/project/create", async (request, reply) => {
    try {
      const body = createProjectBodySchema.parse(request.body);
      const status = await manager.createProject(body);
      return reply.code(201).send(status);
    } catch (error) {
      if (error instanceof ZodError) {
        return reply.code(400).send(badRequest("Project create request is invalid."));
      }

      return reply.code(409).send(operationFailure("Project could not be created."));
    }
  });

  app.post("/api/project/open", async (request, reply) => {
    try {
      const body = openProjectBodySchema.parse(request.body);
      return await manager.openProject(body.folderPath);
    } catch (error) {
      if (error instanceof ZodError) {
        return reply.code(400).send(badRequest("Project open request is invalid."));
      }

      return operationFailure("Project could not be opened.");
    }
  });

  app.get("/api/project", () => manager.getActiveProjectStatus());

  app.post("/api/project/backup", async (request, reply) => {
    try {
      return await manager.createBackup();
    } catch {
      return reply.code(409).send(operationFailure("No project is open."));
    }
  });

  app.post("/api/project/close", () => manager.closeProject());
}
