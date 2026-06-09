import type { CompileResult, GenerationReadiness, OpenProjectResult, ProjectStatus, ValidationResult, VersionInfo } from "@loom/core";

export interface HealthResponse {
  status: "ok";
}

export interface CreateProjectRequest {
  parentPath: string;
  folderName: string;
  title: string;
  description?: string;
}

export interface CreateDemoProjectRequest {
  parentPath: string;
  folderName: string;
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

export type TransportFailure = {
  ok: false;
  category: string;
  message: string;
  retryAfter?: number;
};

export type CompileBlocked = {
  ok: false;
  kind: "validation-blocked";
  validation: ValidationResult;
};

export type CompileResponse = CompileResult | CompileBlocked | ApiFailure;

export interface OpenRouterModelListEntry {
  id: string;
  name: string;
  contextLength?: number;
}

export interface OpenRouterSettings {
  model: string;
  temperature: number;
  maxOutputTokens: number;
  topP?: number;
  cachedModels?: OpenRouterModelListEntry[];
}

export interface OpenRouterSettingsResponse extends OpenRouterSettings {
  hasOpenRouterCredential: boolean;
}

export type OpenRouterSettingsPatch = Partial<OpenRouterSettings>;
export type RefreshModelsResponse = { ok: true; models: OpenRouterModelListEntry[] } | TransportFailure;

export interface GenerationMetadata {
  model: string;
  provider: "openrouter";
  temperature: number;
  maxOutputTokens: number;
  topP?: number;
  versions: CompileResult["metadata"]["versions"];
}

export type GenerateResponse =
  | { ok: true; candidate: { text: string }; metadata: GenerationMetadata }
  | CompileBlocked
  | ApiFailure
  | TransportFailure;

export interface AcceptedSegmentRef {
  id: number;
  sequence: number;
  createdAt: string;
}

export interface AcceptedSegment extends AcceptedSegmentRef {
  text: string;
  metadata: GenerationMetadata;
}

export type AcceptResponse = { ok: true; segment: AcceptedSegmentRef } | ApiFailure;
export type ListAcceptedSegmentsResponse = { ok: true; segments: AcceptedSegment[] } | ApiFailure;
export type DeleteAcceptedSegmentResponse = { ok: true; deleted: { id: number } } | ApiFailure;

export interface DurableChangeReminderSegment {
  sequence: number;
  createdAt: string;
}

export interface DurableChangeReminder {
  active: boolean;
  latestSegment: DurableChangeReminderSegment | null;
  acknowledgedThroughSequence: number;
}

export type DurableChangeReminderResponse = { ok: true; reminder: DurableChangeReminder } | ApiFailure;

export type RecordSummary = {
  id: string;
  type: string;
  displayLabel: string;
  fullDisplayLabel?: string;
  status: string | null;
  salience: string | null;
  urgency: string | null;
  displayValues?: Record<string, string | null>;
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
export type StoryConfigListResponse = { ok: true; configs: Partial<Record<StoryConfigKind, unknown>> } | ApiFailure;
export type StoryConfigResponse = { ok: true; payload: unknown } | ApiFailure;
export type WorkingSetResponse = { ok: true; selectedRecordIds: string[] } | ApiFailure;
export interface GenerationBriefDefaults {
  generation_context: {
    value: "first_segment" | "continuation_after_accepted_segment";
    source: "persisted" | "accepted-segment-count";
    acceptedSegmentCount: number;
  };
}
export type GenerationBriefResponse = { ok: true; session: unknown; defaults: GenerationBriefDefaults } | ApiFailure;
export type SetGenerationBriefResponse = { ok: true; session: unknown } | ApiFailure;

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
      Accept: "application/json"
    }
  };

  if (body !== undefined) {
    requestInit.headers = {
      ...requestInit.headers,
      "Content-Type": "application/json"
    };
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

export async function createDemoProject(request: CreateDemoProjectRequest): Promise<CreateProjectResponse> {
  return postJson<CreateProjectResponse>("/api/project/create-demo", request);
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

export async function listStoryConfig(): Promise<StoryConfigListResponse> {
  return requestJson<StoryConfigListResponse>("/api/story-config", "GET");
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

export async function getGenerationBrief(): Promise<GenerationBriefResponse> {
  return requestJson<GenerationBriefResponse>("/api/generation-brief", "GET");
}

export async function setGenerationBrief(surfaces: Record<string, unknown>): Promise<SetGenerationBriefResponse> {
  return requestJson<SetGenerationBriefResponse>("/api/generation-brief", "PUT", surfaces);
}

export async function validate(): Promise<ValidationResult | ApiFailure> {
  return postJson<ValidationResult | ApiFailure>("/api/validate");
}

export async function readiness(): Promise<GenerationReadiness | ApiFailure> {
  return postJson<GenerationReadiness | ApiFailure>("/api/readiness");
}

export async function compile(): Promise<CompileResponse> {
  // A body with ok === false is blocked-or-error; any other body is the bare CompileResult.
  return postJson<CompileResponse>("/api/compile");
}

export async function getOpenRouterSettings(): Promise<OpenRouterSettingsResponse> {
  return requestJson<OpenRouterSettingsResponse>("/api/settings/openrouter", "GET");
}

export async function putOpenRouterSettings(patch: OpenRouterSettingsPatch): Promise<OpenRouterSettingsResponse | ApiFailure> {
  return requestJson<OpenRouterSettingsResponse | ApiFailure>("/api/settings/openrouter", "PUT", patch);
}

export async function refreshModels(): Promise<RefreshModelsResponse> {
  return postJson<RefreshModelsResponse>("/api/settings/openrouter/models");
}

export async function generate(): Promise<GenerateResponse> {
  return postJson<GenerateResponse>("/api/generate");
}

export async function acceptCandidate(input: {
  text: string;
  generationMetadata: GenerationMetadata;
}): Promise<AcceptResponse> {
  return requestJson<AcceptResponse>("/api/accepted-segments", "POST", input);
}

export async function listAcceptedSegments(): Promise<ListAcceptedSegmentsResponse> {
  return requestJson<ListAcceptedSegmentsResponse>("/api/accepted-segments", "GET");
}

export async function deleteAcceptedSegment(id: number): Promise<DeleteAcceptedSegmentResponse> {
  return requestJson<DeleteAcceptedSegmentResponse>(`/api/accepted-segments/${id}`, "DELETE");
}

export async function getDurableChangeReminder(): Promise<DurableChangeReminderResponse> {
  return requestJson<DurableChangeReminderResponse>("/api/durable-change-reminder", "GET");
}

export async function acknowledgeDurableChangeReminder(): Promise<DurableChangeReminderResponse> {
  return requestJson<DurableChangeReminderResponse>("/api/durable-change-reminder/acknowledge", "POST", {});
}
