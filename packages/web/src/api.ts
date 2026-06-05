import type { OpenProjectResult, ProjectStatus, VersionInfo } from "@loom/core";

export interface HealthResponse {
  status: "ok";
}

export interface CreateProjectRequest {
  parentPath: string;
  folderName: string;
  title: string;
  description?: string;
}

export interface OpenProjectRequest {
  folderPath: string;
}

export type ProjectOpenState = ProjectStatus | { open: false };

export type ProjectOperationFailure = {
  ok: false;
  kind: string;
  message: string;
};

export type CreateProjectResponse = ProjectStatus | ProjectOperationFailure;

export interface BackupResponse {
  backupPath: string;
}

export interface RuntimeStatus {
  health: HealthResponse;
  version: VersionInfo;
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return (await response.json()) as T;
}

async function postJson<T>(url: string, body?: unknown): Promise<T> {
  const requestInit: RequestInit = {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    }
  };

  if (body !== undefined) {
    requestInit.body = JSON.stringify(body);
  }

  const response = await fetch(url, requestInit);

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return (await response.json()) as T;
}

export async function fetchRuntimeStatus(): Promise<RuntimeStatus> {
  const [health, version] = await Promise.all([
    fetchJson<HealthResponse>("/api/health"),
    fetchJson<VersionInfo>("/api/version")
  ]);

  return { health, version };
}

export async function createProject(request: CreateProjectRequest): Promise<CreateProjectResponse> {
  return postJson<CreateProjectResponse>("/api/project/create", request);
}

export async function openProject(request: OpenProjectRequest): Promise<OpenProjectResult> {
  return postJson<OpenProjectResult>("/api/project/open", request);
}

export async function getProject(): Promise<ProjectOpenState> {
  return fetchJson<ProjectOpenState>("/api/project");
}

export async function createBackup(): Promise<BackupResponse> {
  return postJson<BackupResponse>("/api/project/backup");
}

export async function closeProject(): Promise<{ open: false }> {
  return postJson<{ open: false }>("/api/project/close");
}
