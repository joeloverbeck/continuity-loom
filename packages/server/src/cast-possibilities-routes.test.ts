import { mkdtempSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import type { CastPossibilitiesDisclosure } from "@loom/core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./openrouter/client.js", () => ({
  sendChatCompletion: vi.fn()
}));

import { sendChatCompletion } from "./openrouter/client.js";
import { createServer } from "./server.js";
import { writeOpenRouterSettings } from "./settings.js";

const apps: ReturnType<typeof createServer>[] = [];
const projectParents: string[] = [];
const sendChatCompletionMock = vi.mocked(sendChatCompletion);
let originalConfigDir: string | undefined;
let originalApiKey: string | undefined;

beforeEach(() => {
  originalConfigDir = process.env.CONTINUITY_LOOM_CONFIG_DIR;
  originalApiKey = process.env.OPENROUTER_API_KEY;
  const configDir = mkdtempSync(join(tmpdir(), "loom-cast-possibilities-settings-"));
  projectParents.push(configDir);
  process.env.CONTINUITY_LOOM_CONFIG_DIR = configDir;
  delete process.env.OPENROUTER_API_KEY;
  sendChatCompletionMock.mockReset();
});

afterEach(async () => {
  await Promise.all(apps.splice(0).map((app) => app.close()));
  await Promise.all(projectParents.splice(0).map((path) => rm(path, { recursive: true, force: true })));
  restoreEnv("CONTINUITY_LOOM_CONFIG_DIR", originalConfigDir);
  restoreEnv("OPENROUTER_API_KEY", originalApiKey);
});

describe("Cast Possibilities routes", () => {
  it("rejects no-project, purpose-readiness, and malformed selected sources without transport", async () => {
    const unopened = createServer();
    apps.push(unopened);
    const noProject = await unopened.inject({
      method: "POST",
      url: "/api/cast-possibilities/compile",
      payload: {}
    });
    expect(noProject.statusCode).toBe(409);
    expect(noProject.json()).toMatchObject({ ok: false, kind: "no-open-project" });

    const notReady = await preparedApp();
    const notReadyBrief = await notReady.inject({ method: "GET", url: "/api/generation-brief" });
    const notReadySession = notReadyBrief.json<{ session: Record<string, unknown> }>().session;
    await notReady.inject({
      method: "PUT",
      url: "/api/generation-brief",
      payload: {
        ...notReadySession,
        current_authoritative_state: {
          ...(notReadySession.current_authoritative_state as Record<string, unknown>),
          current_time: ""
        }
      }
    });
    const readiness = await notReady.inject({
      method: "POST",
      url: "/api/cast-possibilities/compile",
      payload: {}
    });
    expect(readiness.statusCode).toBe(422);
    expect(readiness.json()).toMatchObject({
      ok: false,
      kind: "cast-possibilities-not-ready",
      projectIdentity: expect.any(String),
      blockers: expect.arrayContaining([
        expect.objectContaining({ code: "cast-possibilities-current-time-required" })
      ])
    });

    const malformed = await preparedApp();
    const malformedBrief = await malformed.inject({ method: "GET", url: "/api/generation-brief" });
    const malformedSession = malformedBrief.json<{ session: Record<string, unknown> }>().session;
    const workingSet = malformedSession.active_working_set as Record<string, unknown>;
    await malformed.inject({
      method: "PUT",
      url: "/api/generation-brief",
      payload: {
        ...malformedSession,
        active_working_set: {
          ...workingSet,
          selected_records: [
            ...(workingSet.selected_records as string[]),
            "019c0000-0000-7000-8000-00000000ffff"
          ]
        }
      }
    });
    const malformedSource = await malformed.inject({
      method: "POST",
      url: "/api/cast-possibilities/compile",
      payload: {}
    });
    expect(malformedSource.statusCode).toBe(422);
    expect(malformedSource.json()).toMatchObject({ ok: false, kind: "malformed-validation-source" });
    expect(sendChatCompletionMock).not.toHaveBeenCalled();
  });

  it("registers the compile route and returns an inspected saved-source prompt without transport", async () => {
    const candidate = await preparedApp();

    const response = await candidate.inject({
      method: "POST",
      url: "/api/cast-possibilities/compile",
      payload: {}
    });
    const body = response.json();

    expect(response.statusCode, JSON.stringify(body)).toBe(200);
    expect(body).toMatchObject({
      ok: true,
      disclosure: {
        sourceProfile: "cast-possibilities",
        savedDraftIdentity: expect.stringMatching(/^generation-brief:fnv1a32:/),
        fingerprint: expect.stringMatching(/^fnv1a32:/),
        versions: { template: "1.0.0", compiler: "1.0.5", contract: "1.0.0" }
      }
    });
    expect(body.prompt).toContain("# Cast Possibilities Prompt");
    expect(body.outputSchema).toMatchObject({
      required: ["contract", "characters"]
    });
    expect(sendChatCompletionMock).not.toHaveBeenCalled();
  });

  it("rejects a stale inspected fingerprint before credentials or transport", async () => {
    const candidate = await preparedApp();
    const compile = await compilePossibilities(candidate);
    const brief = await candidate.inject({ method: "GET", url: "/api/generation-brief" });
    expect(brief.statusCode).toBe(200);
    const saved = brief.json<{ session: Record<string, unknown> }>().session;
    const update = await candidate.inject({
      method: "PUT",
      url: "/api/generation-brief",
      payload: {
        ...saved,
        current_authoritative_state: {
          ...(saved.current_authoritative_state as Record<string, unknown>),
          immediate_situation_summary: "The saved immediate situation changed."
        }
      }
    });
    expect(update.statusCode).toBe(200);

    const response = await candidate.inject({
      method: "POST",
      url: "/api/cast-possibilities/analyze",
      payload: analyzePayload(compile)
    });

    expect(response.statusCode).toBe(409);
    expect(response.json()).toMatchObject({ ok: false, kind: "cast-possibilities-source-changed" });
    expect(sendChatCompletionMock).not.toHaveBeenCalled();
  });

  it("returns typed readiness blockers with project identity when source becomes unready before Analyze", async () => {
    const candidate = await preparedApp();
    const compile = await compilePossibilities(candidate);
    const brief = await candidate.inject({ method: "GET", url: "/api/generation-brief" });
    const saved = brief.json<{ session: Record<string, unknown> }>().session;
    await candidate.inject({
      method: "PUT",
      url: "/api/generation-brief",
      payload: {
        ...saved,
        current_authoritative_state: {
          ...(saved.current_authoritative_state as Record<string, unknown>),
          current_time: ""
        }
      }
    });

    const response = await candidate.inject({
      method: "POST",
      url: "/api/cast-possibilities/analyze",
      payload: analyzePayload(compile)
    });

    expect(response.statusCode).toBe(422);
    expect(response.json()).toMatchObject({
      ok: false,
      kind: "cast-possibilities-not-ready",
      projectIdentity: expect.any(String),
      blockers: expect.arrayContaining([
        expect.objectContaining({ code: "cast-possibilities-current-time-required" })
      ])
    });
    expect(sendChatCompletionMock).not.toHaveBeenCalled();
  });

  it("sends exactly once for full-cast Analyze, parses atomically, attaches local metadata, and writes nothing", async () => {
    process.env.OPENROUTER_API_KEY = "sk-or-cast-possibilities-test";
    configureCompatibleModel();
    const candidate = await preparedApp();
    const before = await projectSurfaces(candidate);
    const compile = await compilePossibilities(candidate);
    sendChatCompletionMock.mockResolvedValue({
      ok: true,
      candidate: { text: validOutput(compile.disclosure) }
    });

    const response = await candidate.inject({
      method: "POST",
      url: "/api/cast-possibilities/analyze",
      payload: analyzePayload(compile)
    });
    const body = response.json();
    const after = await projectSurfaces(candidate);

    expect(response.statusCode).toBe(200);
    expect(body).toMatchObject({
      ok: true,
      possibilities: { contract: "cast_possibilities.v1" },
      advisory: { verified: false, canonical: false, prose: false },
      metadata: {
        sourceProfile: "cast-possibilities",
        character: "all-eligible-characters",
        fingerprint: compile.disclosure.fingerprint,
        provider: "openrouter"
      }
    });
    expect(sendChatCompletionMock).toHaveBeenCalledTimes(1);
    expect(sendChatCompletionMock.mock.calls[0]?.[0]).toMatchObject({
      request: {
        model: "test/structured-output-capable",
        messages: [{ role: "user", content: compile.prompt }],
        temperature: 0,
        max_completion_tokens: 4096,
        stream: false,
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "cast_possibilities",
            strict: true,
            schema: {
              properties: {
                characters: {
                  items: {
                    properties: {
                      character_key: {
                        enum: ["[CHARACTER-1]"]
                      },
                      cards: {
                        items: {
                          description: expect.stringContaining(
                            "Render Elin trying to keep Niko from touching or reading the hidden letter."
                          ),
                          properties: {
                            dossier_keys: {
                              items: {
                                enum: ["[DOSSIER-1]"]
                              }
                            },
                            context_keys: {
                              items: {
                                enum: expect.arrayContaining([
                                  "[BRIEF-current_time]"
                                ])
                              }
                            },
                            observable_move: {
                              description: expect.stringContaining(
                                "Do not write quoted dialogue or exact words"
                              )
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        provider: { require_parameters: true, allow_fallbacks: false },
        transforms: [],
        plugins: [],
        tools: [],
        tool_choice: "none"
      }
    });
    expect(after).toEqual(before);
  });

  it("regenerates exactly one inspected target from its three explicit avoid summaries", async () => {
    process.env.OPENROUTER_API_KEY = "sk-or-cast-possibilities-test";
    configureCompatibleModel(1);
    const candidate = await preparedApp();
    const full = await compilePossibilities(candidate);
    const target = full.disclosure.eligibleCharacters[0];
    expect(target).toBeDefined();
    if (!target) {
      return;
    }
    const avoidList = ["First prior card", "Second prior card", "Third prior card"];
    const targeted = await compilePossibilities(candidate, {
      targetCharacterId: target.castMemberId,
      avoidList,
      baseSourceFingerprint: full.disclosure.fingerprint
    });
    expect(targeted.prompt).toContain("<target_character_avoid_list>");
    avoidList.forEach((summary) => expect(targeted.prompt).toContain(summary));
    expect(targeted.disclosure.eligibleCharacters).toHaveLength(1);
    expect(targeted.providerRequest.contextLength).toBe(1);
    sendChatCompletionMock.mockResolvedValue({
      ok: true,
      candidate: { text: validOutput(targeted.disclosure) }
    });

    const response = await candidate.inject({
      method: "POST",
      url: "/api/cast-possibilities/analyze",
      payload: {
        ...analyzePayload(targeted),
        targetCharacterId: target.castMemberId,
        avoidList,
        baseSourceFingerprint: full.disclosure.fingerprint
      }
    });
    const body = response.json();

    expect(body).toMatchObject({
      ok: true,
      replacement: { character_key: target.characterKey, cards: { length: 3 } },
      metadata: { character: target.castMemberId }
    });
    expect(body).not.toHaveProperty("possibilities");
    expect(sendChatCompletionMock).toHaveBeenCalledTimes(1);
  });

  it("rejects target compilation when the full-slate source fingerprint is stale", async () => {
    const candidate = await preparedApp();
    const full = await compilePossibilities(candidate);
    const target = full.disclosure.eligibleCharacters[0]!;
    const brief = await candidate.inject({ method: "GET", url: "/api/generation-brief" });
    const saved = brief.json<{ session: Record<string, unknown> }>().session;
    const update = await candidate.inject({
      method: "PUT",
      url: "/api/generation-brief",
      payload: {
        ...saved,
        current_authoritative_state: {
          ...(saved.current_authoritative_state as Record<string, unknown>),
          immediate_situation_summary: "The source changed in another browser view."
        }
      }
    });
    expect(update.statusCode).toBe(200);

    const response = await candidate.inject({
      method: "POST",
      url: "/api/cast-possibilities/compile",
      payload: {
        targetCharacterId: target.castMemberId,
        avoidList: ["old one", "old two", "old three"],
        baseSourceFingerprint: full.disclosure.fingerprint
      }
    });

    expect(response.statusCode).toBe(409);
    expect(response.json()).toMatchObject({
      ok: false,
      kind: "cast-possibilities-source-changed"
    });
    expect(sendChatCompletionMock).not.toHaveBeenCalled();
  });

  it("distinguishes missing credentials, unknown capability, incompatible models, and oversize prompts before transport", async () => {
    const candidate = await preparedApp();
    const compile = await compilePossibilities(candidate);
    const currentAnalyzePayload = analyzePayload(compile);

    const missingKey = await candidate.inject({
      method: "POST",
      url: "/api/cast-possibilities/analyze",
      payload: currentAnalyzePayload
    });
    expect(missingKey.json()).toMatchObject({ ok: false, category: "missing-key" });

    process.env.OPENROUTER_API_KEY = "sk-or-cast-possibilities-test";
    writeOpenRouterSettings({
      model: "test/no-cache",
      temperature: 0,
      maxOutputTokens: 4096,
      cachedModels: []
    });
    const stale = await candidate.inject({
      method: "POST",
      url: "/api/cast-possibilities/analyze",
      payload: currentAnalyzePayload
    });
    expect(stale.json()).toMatchObject({
      ok: false,
      kind: "cast-possibilities-source-changed"
    });
    const unknownInspection = await compilePossibilities(candidate);
    const unknown = await candidate.inject({
      method: "POST",
      url: "/api/cast-possibilities/analyze",
      payload: analyzePayload(unknownInspection)
    });
    expect(unknown.json()).toMatchObject({
      ok: false,
      category: "structured-output-capability-unknown"
    });

    writeOpenRouterSettings({
      cachedModels: [{
        id: "test/no-cache",
        name: "Known incompatible",
        supportedParameters: ["temperature"]
      }]
    });
    const incompatibleInspection = await compilePossibilities(candidate);
    const incompatible = await candidate.inject({
      method: "POST",
      url: "/api/cast-possibilities/analyze",
      payload: analyzePayload(incompatibleInspection)
    });
    expect(incompatible.json()).toMatchObject({
      ok: false,
      category: "structured-output-incompatible-model"
    });

    writeOpenRouterSettings({
      maxOutputTokens: 4096,
      cachedModels: [{
        id: "test/no-cache",
        name: "Too small",
        contextLength: 4097,
        supportedParameters: ["response_format", "structured_outputs", "temperature", "top_p", "max_tokens"]
      }]
    });
    const oversizeInspection = await compilePossibilities(candidate);
    sendChatCompletionMock.mockResolvedValue({
      ok: true,
      candidate: { text: validOutput(oversizeInspection.disclosure) }
    });
    const oversize = await candidate.inject({
      method: "POST",
      url: "/api/cast-possibilities/analyze",
      payload: analyzePayload(oversizeInspection)
    });
    expect(oversizeInspection.providerRequest).toMatchObject({
      contextLength: 4097
    });
    expect(oversize.json()).toMatchObject({ ok: true });
    expect(sendChatCompletionMock).toHaveBeenCalledTimes(1);
  });

  it("returns one safe whole-response quarantine without raw provider output", async () => {
    process.env.OPENROUTER_API_KEY = "sk-or-cast-possibilities-test";
    configureCompatibleModel();
    const candidate = await preparedApp();
    const compile = await compilePossibilities(candidate);
    const sentinel = "RAW_PROVIDER_SENTINEL";
    sendChatCompletionMock.mockResolvedValue({ ok: true, candidate: { text: sentinel } });

    const response = await candidate.inject({
      method: "POST",
      url: "/api/cast-possibilities/analyze",
      payload: analyzePayload(compile)
    });
    const serialized = JSON.stringify(response.json());

    expect(response.json()).toMatchObject({ ok: true, quarantined: true, reasonCode: "not-pure-json" });
    expect(response.json()).not.toHaveProperty("metadata");
    expect(serialized).not.toContain(sentinel);
    expect(sendChatCompletionMock).toHaveBeenCalledTimes(1);
  });
});

type FastifyApp = ReturnType<typeof createServer>;

async function preparedApp(): Promise<FastifyApp> {
  const candidate = createServer();
  apps.push(candidate);
  const parentPath = await mkdtemp(join(tmpdir(), "loom-cast-possibilities-"));
  projectParents.push(parentPath);
  const create = await candidate.inject({
    method: "POST",
    url: "/api/project/create-demo",
    payload: { parentPath, folderName: "cast-possibilities-demo" }
  });
  expect(create.statusCode).toBe(201);
  return candidate;
}

type CompileResponse = {
  prompt: string;
  disclosure: CastPossibilitiesDisclosure;
  providerRequest: { requestFingerprint: string; contextLength?: number };
};

function analyzePayload(compile: CompileResponse): {
  expectedPromptFingerprint: string;
  expectedRequestFingerprint: string;
} {
  return {
    expectedPromptFingerprint: compile.disclosure.fingerprint,
    expectedRequestFingerprint: compile.providerRequest.requestFingerprint
  };
}

async function compilePossibilities(
  candidate: FastifyApp,
  payload: Record<string, unknown> = {}
): Promise<CompileResponse> {
  const response = await candidate.inject({
    method: "POST",
    url: "/api/cast-possibilities/compile",
    payload
  });
  expect(response.statusCode, response.body).toBe(200);
  return response.json<CompileResponse>();
}

function configureCompatibleModel(contextLength?: number): void {
  writeOpenRouterSettings({
    model: "test/structured-output-capable",
    temperature: 0,
    maxOutputTokens: 4096,
    cachedModels: [{
      id: "test/structured-output-capable",
      name: "Structured Output Capable",
      ...(contextLength === undefined ? {} : { contextLength }),
      supportedParameters: ["response_format", "structured_outputs", "temperature", "top_p", "max_tokens"]
    }]
  });
}

async function projectSurfaces(candidate: FastifyApp): Promise<unknown> {
  const responses = await Promise.all([
    "/api/records",
    "/api/working-set",
    "/api/generation-brief",
    "/api/accepted-segments",
    "/api/durable-change-reminder"
  ].map((url) => candidate.inject({ method: "GET", url })));
  responses.forEach((response) => expect(response.statusCode).toBe(200));
  return responses.map((response) => response.json());
}

function validOutput(disclosure: CastPossibilitiesDisclosure): string {
  const contextKey = Object.keys(disclosure.citationMap).find((key) => !key.startsWith("[DOSSIER-"));
  expect(contextKey).toBeDefined();
  return JSON.stringify({
    contract: "cast_possibilities.v1",
    characters: disclosure.eligibleCharacters.map((character) => ({
      character_key: character.characterKey,
      cards: [1, 2, 3].map((number) => ({
        observable_move: `Observable move ${number}`,
        character_fit: `Character fit ${number}`,
        moment_fit: `Moment fit ${number}`,
        local_effect: `Local effect ${number}`,
        dossier_keys: [character.dossierKeys[0]],
        context_keys: [contextKey],
        distinction: `Distinction ${number}`
      }))
    }))
  });
}

function restoreEnv(name: string, value: string | undefined): void {
  if (value === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = value;
  }
}
