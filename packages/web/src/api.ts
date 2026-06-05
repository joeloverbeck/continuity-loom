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
export type OpenProjectResponse = OpenProjectResult | ProjectOperationFailure;

export interface BackupResponse {
  backupPath: string;
}

export type BackupProjectResponse = BackupResponse | ProjectOperationFailure;

export interface RuntimeStatus {
  health: HealthResponse;
  version: VersionInfo;
}

export type ApiFailure = {
  ok: false;
  kind: string;
  message: string;
  issues?: unknown[];
  referrers?: unknown[];
};

export type RecordSummary = {
  id: string;
  type: string;
  displayLabel: string;
  status: string | null;
  salience: string | null;
  urgency: string | null;
  archived: boolean;
  userOrder: number | null;
  createdAt: string;
  updatedAt: string;
};

export type RecordDetail = RecordSummary & {
  payload: unknown;
};

export interface ListRecordsFilters {
  type?: string;
  status?: string;
  includeArchived?: boolean;
  q?: string;
  refRole?: string;
  targetId?: string;
}

export interface CreateRecordRequest {
  type: string;
  displayLabel?: string;
  payload: unknown;
  userOrder?: number | null;
}

export interface UpdateRecordRequest {
  displayLabel?: string;
  payload: unknown;
  userOrder?: number | null;
}

export type StoryConfigKind = "STORY CONTRACT" | "UNIVERSAL CONTENT POLICY" | "PROSE MODE";

export type RecordsListResponse = { ok: true; records: RecordSummary[] } | ApiFailure;
export type RecordDetailResponse = { ok: true; record: RecordDetail } | ApiFailure;
export type RecordReferencesResponse =
  | { ok: true; outgoing: Array<{ refRole: string; targetId: string }>; incoming: Array<{ fromRecordId: string; refRole: string }> }
  | ApiFailure;
export type OkResponse = { ok: true } | ApiFailure;
export type StoryConfigResponse = { ok: true; payload: unknown } | ApiFailure;
export type WorkingSetResponse = { ok: true; selectedRecordIds: string[] } | ApiFailure;

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

async function requestJson<T>(url: string, method: "GET" | "POST" | "PUT" | "DELETE", body?: unknown): Promise<T> {
  const requestInit: RequestInit = {
    method,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    }
  };

  if (body !== undefined) {
    requestInit.body = JSON.stringify(body);
  }

  const response = await fetch(url, requestInit);

  return (await response.json()) as T;
}

async function postJson<T>(url: string, body?: unknown): Promise<T> {
  return requestJson<T>(url, "POST", body);
}

function queryString(filters: Record<string, string | boolean | undefined>): string {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== "") {
      params.set(key, String(value));
    }
  }

  const query = params.toString();
  return query ? `?${query}` : "";
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

export async function openProject(request: OpenProjectRequest): Promise<OpenProjectResponse> {
  return postJson<OpenProjectResponse>("/api/project/open", request);
}

export async function getProject(): Promise<ProjectOpenState> {
  return fetchJson<ProjectOpenState>("/api/project");
}

export async function createBackup(): Promise<BackupProjectResponse> {
  return postJson<BackupProjectResponse>("/api/project/backup");
}

export async function closeProject(): Promise<{ open: false }> {
  return postJson<{ open: false }>("/api/project/close");
}

export async function listRecords(filters: ListRecordsFilters = {}): Promise<RecordsListResponse> {
  return requestJson<RecordsListResponse>(
    `/api/records${queryString({
      type: filters.type,
      status: filters.status,
      includeArchived: filters.includeArchived,
      q: filters.q,
      refRole: filters.refRole,
      targetId: filters.targetId
    })}`,
    "GET"
  );
}

export async function getRecord(id: string): Promise<RecordDetailResponse> {
  return requestJson<RecordDetailResponse>(`/api/records/${encodeURIComponent(id)}`, "GET");
}

export async function createRecord(request: CreateRecordRequest): Promise<RecordDetailResponse> {
  return postJson<RecordDetailResponse>("/api/records", request);
}

export async function updateRecord(id: string, request: UpdateRecordRequest): Promise<RecordDetailResponse> {
  return requestJson<RecordDetailResponse>(`/api/records/${encodeURIComponent(id)}`, "PUT", request);
}

export async function archiveRecord(id: string): Promise<OkResponse> {
  return postJson<OkResponse>(`/api/records/${encodeURIComponent(id)}/archive`);
}

export async function deleteRecord(id: string): Promise<OkResponse> {
  return requestJson<OkResponse>(`/api/records/${encodeURIComponent(id)}`, "DELETE");
}

export async function getRecordReferences(id: string): Promise<RecordReferencesResponse> {
  return requestJson<RecordReferencesResponse>(`/api/records/${encodeURIComponent(id)}/references`, "GET");
}

export async function getStoryConfig(kind: StoryConfigKind): Promise<StoryConfigResponse> {
  return requestJson<StoryConfigResponse>(`/api/story-config/${encodeURIComponent(kind)}`, "GET");
}

export async function setStoryConfig(kind: StoryConfigKind, payload: unknown): Promise<OkResponse> {
  return requestJson<OkResponse>(`/api/story-config/${encodeURIComponent(kind)}`, "PUT", { payload });
}

export async function getWorkingSet(): Promise<WorkingSetResponse> {
  return requestJson<WorkingSetResponse>("/api/working-set", "GET");
}

export async function setWorkingSet(selectedRecordIds: string[]): Promise<WorkingSetResponse> {
  return requestJson<WorkingSetResponse>("/api/working-set", "PUT", { selectedRecordIds });
}
