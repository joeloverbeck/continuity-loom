import type {
  AcceptedSegmentProvenance,
  CompileResult,
  GenerationContextCoherence,
  GenerationReadiness,
  IdeationRequest,
  OpenProjectResult,
  ProjectStatus,
  RecordHygieneRequest,
  SegmentReconciliationRequest,
  StoryNote,
  StoryNoteClip,
  StoryNoteCreateInput,
  StoryNoteUpdateInput,
  SegmentReconciliationParsedOutput,
  ValidationResult,
  VersionInfo
} from "@loom/core";

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
  danglingSelectedRecordIds?: string[];
  suggestedAction?: string;
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
  readiness?: GenerationReadiness;
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

export interface ParsedIdeationIdea {
  slotNumber: number;
  operator: string;
  headline?: string;
  question?: string;
  why?: string;
  grounds: readonly string[];
  unknownCitations: readonly string[];
}

export type IdeateResponse =
  | { ok: true; ideas: readonly ParsedIdeationIdea[]; citations: Record<string, string>; metadata: GenerationMetadata }
  | { ok: true; malformed: true; raw: string; metadata: GenerationMetadata }
  | CompileBlocked
  | ApiFailure
  | TransportFailure;

export type RecordHygieneCompileMetadata = CompileResult["metadata"] & {
  recordCount: number;
  countsByType: Record<string, number>;
};

export type RecordHygieneCompileResponse =
  | {
      ok: true;
      prompt: string;
      metadata: RecordHygieneCompileMetadata;
      citations: Record<string, string>;
    }
  | ApiFailure;

export interface ParsedRecordHygieneFinding {
  number: number;
  cluster: string;
  relation: string;
  action: string;
  citations: readonly string[];
  sharedCore: string;
  materialDifferences: string;
  whyItMatters: string;
  manualRecommendation: string;
  survivor: string | null;
  referenceCaution: string;
  confidence: string;
}

export type RecordHygieneAnalyzeResponse =
  | { ok: true; findings: readonly ParsedRecordHygieneFinding[]; metadata: GenerationMetadata & RecordHygieneCompileMetadata }
  | { ok: true; malformed: true; raw: string; metadata: GenerationMetadata & RecordHygieneCompileMetadata }
  | ApiFailure
  | TransportFailure;

export type SegmentReconciliationCompileMetadata = CompileResult["metadata"] & {
  recordCount: number;
  countsByType: Record<string, number>;
};

export interface SegmentReconciliationDisclosure {
  sourceProfile: "segment-reconciliation";
  acceptedSegment: {
    id: string;
    sequence: number;
    acceptedAt: string;
    spanCount: number;
  };
  recordScope: SegmentReconciliationRequest["recordScope"];
  recordCount: number;
  referenceStubCount: number;
  briefFieldCount: number;
}

export interface SegmentReconciliationSourceMetadata {
  segmentSelection: SegmentReconciliationRequest["segmentSelection"];
  recordScope: SegmentReconciliationRequest["recordScope"];
  acceptedSegmentId: string;
  acceptedSegmentSequence: number;
  acceptedSegmentAcceptedAt: string;
}

export type SegmentReconciliationCompileResponse =
  | {
      ok: true;
      prompt: string;
      metadata: SegmentReconciliationCompileMetadata;
      citations: Record<string, string>;
      disclosure: SegmentReconciliationDisclosure;
      outputSchema: unknown;
      source: SegmentReconciliationSourceMetadata;
    }
  | ApiFailure;

export type SegmentReconciliationAnalyzeResponse =
  | {
      ok: true;
      proposals: SegmentReconciliationParsedOutput;
      metadata: GenerationMetadata & SegmentReconciliationCompileMetadata;
    }
  | {
      ok: true;
      malformed: true;
      reasonCode: string;
      summary: string;
      raw: string;
      metadata: GenerationMetadata & SegmentReconciliationCompileMetadata;
    }
  | ApiFailure
  | TransportFailure;

export interface AcceptedSegmentRef {
  id: number;
  sequence: number;
  createdAt: string;
}

export interface AcceptedSegment extends AcceptedSegmentRef {
  text: string;
  metadata: AcceptedSegmentProvenance;
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
export type GenerationBriefResponse = {
  ok: true;
  session: unknown;
  generationContext: GenerationContextCoherence;
} | ApiFailure;
export type SetGenerationBriefResponse = { ok: true; session: unknown } | ApiFailure;

export type NoteSort = "updated-desc" | "updated-asc" | "created-desc" | "created-asc" | "title-asc" | "relevance";

export interface NoteListQuery {
  q?: string;
  tag?: string | string[];
  mode?: "all" | StoryNote["mode"];
  pinned?: "all" | "only" | "unpinned";
  sort?: NoteSort;
  relevance?: boolean;
}

export type StoryNoteSummary = Pick<StoryNote, "id" | "title" | "tags" | "pinned" | "createdAt" | "updatedAt"> & {
  bodyPreview: string;
  mode: StoryNote["mode"];
  relevance?: number;
  titleHighlight?: string;
  bodySnippet?: string;
  matchedTags?: string[];
};

export type StoryNoteClipRead = StoryNoteClip & {
  sourceStatus: "current" | "edited" | "deleted";
};

export type ClipCaptureInput =
  | { captureKind: "whole-note"; sourceNoteId: string }
  | { captureKind: "excerpt"; sourceNoteId: string; selectedText: string; sourceUpdatedAt: string };

export type ListNotesResponse = { ok: true; notes: StoryNoteSummary[]; tags: string[] } | ApiFailure;
export type GetNoteResponse = { ok: true; note: StoryNote } | ApiFailure;
export type SaveNoteResponse = { ok: true; note: StoryNote } | ApiFailure;
export type DeleteNoteResponse =
  | { ok: true; deleted: boolean; cascadedClipCount: number; detachedSourceClipCount: number }
  | ApiFailure;
export type ListNoteClipsResponse = { ok: true; clips: StoryNoteClipRead[] } | ApiFailure;
export type CaptureNoteClipsResponse = { ok: true; clips: StoryNoteClipRead[] } | ApiFailure;
export type ReorderNoteClipsResponse = { ok: true; clips: StoryNoteClipRead[] } | ApiFailure;
export type DeleteNoteClipResponse = { ok: true } | ApiFailure;
export type DeleteNotesBatchResponse =
  | { ok: true; deleted: boolean; cascadedClipCount: number; detachedSourceClipCount: number }
  | ApiFailure;

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

function queryString(filters: Record<string, string | string[] | boolean | undefined>): string {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(filters)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item !== "") {
          params.append(key, item);
        }
      }
    } else if (value !== undefined && value !== "") {
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

export async function listNotes(query: NoteListQuery = {}): Promise<ListNotesResponse> {
  return fetchJson<ListNotesResponse>(
    `/api/notes${queryString({
      q: query.q,
      tag: query.tag,
      mode: query.mode,
      pinned: query.pinned,
      sort: query.sort,
      relevance: query.relevance
    })}`
  );
}

export async function getNote(id: string): Promise<GetNoteResponse> {
  return fetchJson<GetNoteResponse>(`/api/notes/${encodeURIComponent(id)}`);
}

export async function createNote(input: StoryNoteCreateInput): Promise<SaveNoteResponse> {
  return requestJson<SaveNoteResponse>("/api/notes", "POST", input);
}

export async function updateNote(id: string, input: StoryNoteUpdateInput): Promise<SaveNoteResponse> {
  return requestJson<SaveNoteResponse>(`/api/notes/${encodeURIComponent(id)}`, "PUT", input);
}

export async function deleteNote(id: string): Promise<DeleteNoteResponse> {
  return requestJson<DeleteNoteResponse>(`/api/notes/${encodeURIComponent(id)}`, "DELETE");
}

export async function listNoteClips(prepNoteId: string): Promise<ListNoteClipsResponse> {
  return fetchJson<ListNoteClipsResponse>(`/api/notes/${encodeURIComponent(prepNoteId)}/clips`);
}

export async function captureNoteClips(
  prepNoteId: string,
  captures: ClipCaptureInput[]
): Promise<CaptureNoteClipsResponse> {
  return postJson<CaptureNoteClipsResponse>(`/api/notes/${encodeURIComponent(prepNoteId)}/clips`, captures);
}

export async function reorderNoteClips(
  prepNoteId: string,
  orderedClipIds: string[]
): Promise<ReorderNoteClipsResponse> {
  return requestJson<ReorderNoteClipsResponse>(
    `/api/notes/${encodeURIComponent(prepNoteId)}/clips/order`,
    "PUT",
    orderedClipIds
  );
}

export async function deleteNoteClip(prepNoteId: string, clipId: string): Promise<DeleteNoteClipResponse> {
  return requestJson<DeleteNoteClipResponse>(
    `/api/notes/${encodeURIComponent(prepNoteId)}/clips/${encodeURIComponent(clipId)}`,
    "DELETE"
  );
}

export async function deleteNotesBatch(noteIds: string[]): Promise<DeleteNotesBatchResponse> {
  return postJson<DeleteNotesBatchResponse>("/api/notes/delete-batch", noteIds);
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

export async function readiness(input: { promptKind?: "prose" | "ideation" } = {}): Promise<GenerationReadiness | ApiFailure> {
  return postJson<GenerationReadiness | ApiFailure>("/api/readiness", input);
}

export async function compile(): Promise<CompileResponse> {
  // A body with ok === false is blocked-or-error; any other body is the bare CompileResult.
  return postJson<CompileResponse>("/api/compile");
}

export async function compileIdeation(request: Partial<IdeationRequest> = {}): Promise<CompileResponse> {
  return postJson<CompileResponse>("/api/compile", {
    promptKind: "ideation",
    ideationRequest: request
  });
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

export async function generate(request: { expectedPromptFingerprint: string }): Promise<GenerateResponse> {
  return postJson<GenerateResponse>("/api/generate", request);
}

export async function ideate(request: Partial<IdeationRequest> = {}): Promise<IdeateResponse> {
  return postJson<IdeateResponse>("/api/ideate", request);
}

export async function recordHygieneCompile(mode: RecordHygieneRequest["mode"] = "full_active_atomic_review"): Promise<RecordHygieneCompileResponse> {
  return postJson<RecordHygieneCompileResponse>("/api/record-hygiene/compile", {
    mode
  });
}

export async function recordHygieneAnalyze(mode: RecordHygieneRequest["mode"] = "full_active_atomic_review"): Promise<RecordHygieneAnalyzeResponse> {
  return postJson<RecordHygieneAnalyzeResponse>("/api/record-hygiene/analyze", {
    mode
  });
}

export async function segmentReconciliationCompile(
  request: SegmentReconciliationRequest
): Promise<SegmentReconciliationCompileResponse> {
  return postJson<SegmentReconciliationCompileResponse>("/api/segment-reconciliation/compile", request);
}

export async function segmentReconciliationAnalyze(
  request: SegmentReconciliationRequest & { expectedPromptFingerprint: string }
): Promise<SegmentReconciliationAnalyzeResponse> {
  return postJson<SegmentReconciliationAnalyzeResponse>("/api/segment-reconciliation/analyze", request);
}

export async function acceptCandidate(input: {
  text: string;
  generationMetadata: AcceptedSegmentProvenance;
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
