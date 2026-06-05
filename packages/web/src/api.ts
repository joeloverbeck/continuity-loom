import type { VersionInfo } from "@loom/core";

export interface HealthResponse {
  status: "ok";
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

export async function fetchRuntimeStatus(): Promise<RuntimeStatus> {
  const [health, version] = await Promise.all([
    fetchJson<HealthResponse>("/api/health"),
    fetchJson<VersionInfo>("/api/version")
  ]);

  return { health, version };
}
