import { mkdtemp } from "node:fs/promises";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./openrouter/client.js", () => ({
  sendChatCompletion: vi.fn()
}));

import { sendChatCompletion } from "./openrouter/client.js";
import { normalizeOpenRouterError } from "./openrouter/errors.js";
import { createServer } from "./server.js";

const sendChatCompletionMock = vi.mocked(sendChatCompletion);
const apps: ReturnType<typeof createServer>[] = [];
const missingRecordId = "019b0298-5c00-7000-8000-000000009999";
const promptSecretText = "GENERATE_ROUTE_PROMPT_SECRET_DO_NOT_LOG";
const candidateSecretText = "GENERATE_ROUTE_CANDIDATE_SECRET_DO_NOT_LOG";
const keySecretText = "sk-or-generate-route-secret";

describe("generate routes", () => {
  let configDir: string;
  let originalConfigDir: string | undefined;
  let originalApiKey: string | undefined;

  beforeEach(() => {
    originalConfigDir = process.env.CONTINUITY_LOOM_CONFIG_DIR;
    originalApiKey = process.env.OPENROUTER_API_KEY;
    configDir = mkdtempSync(join(tmpdir(), "loom-generate-routes-settings-"));
    process.env.CONTINUITY_LOOM_CONFIG_DIR = configDir;
    delete process.env.OPENROUTER_API_KEY;
    sendChatCompletionMock.mockReset();
  });

  afterEach(async () => {
    await Promise.all(apps.splice(0).map((fastify) => fastify.close()));
    restoreEnv("CONTINUITY_LOOM_CONFIG_DIR", originalConfigDir);
    restoreEnv("OPENROUTER_API_KEY", originalApiKey);
    rmSync(configDir, { recursive: true, force: true });
  });

  it("returns a structured no-open-project error with no candidate", async () => {
    const fastify = app();
    const response = await injectGenerate(fastify, "inspected-fingerprint");
    const body = response.json() as { kind: string; candidate?: unknown };

    expect(response.statusCode).toBe(409);
    expect(body.kind).toBe("no-open-project");
    expect(body).not.toHaveProperty("candidate");
  });

  it("returns malformed-source errors from the shared snapshot builder with no candidate", async () => {
    const fastify = app();
    await openProject(fastify);
    await putBrief(fastify, {
      active_working_set: {
        selected_records: [missingRecordId],
        active_onstage_cast_full: [],
        present_minor_cast_compressed: [],
        offstage_relevant_cast: []
      }
    });

    const response = await injectGenerate(fastify, "inspected-fingerprint");
    const body = response.json() as { kind: string; candidate?: unknown };

    expect(response.statusCode).toBe(422);
    expect(body.kind).toBe("malformed-validation-source");
    expect(body).not.toHaveProperty("candidate");
  });

  it("fails closed when validation is blocked and does not call transport", async () => {
    const fastify = app();
    await openProject(fastify);
    await putStoryConfig(fastify);
    await putBrief(fastify, {
      manual_moment_directive: {
        must_render: ["Write the whole chapter outline."],
        may_render_if_naturally_caused: [],
        do_not_force: []
      }
    });

    const response = await injectGenerate(fastify, "inspected-fingerprint");
    const body = response.json() as { kind: string; candidate?: unknown; validation: { isBlocked: boolean } };

    expect(response.statusCode).toBe(200);
    expect(body.kind).toBe("validation-blocked");
    expect(body.validation.isBlocked).toBe(true);
    expect(body).not.toHaveProperty("candidate");
    expect(sendChatCompletionMock).not.toHaveBeenCalled();
  });

  it("returns missing-key before transport when no API key is configured", async () => {
    const fastify = app();
    await openProject(fastify);
    await putStoryConfig(fastify);
    await putBrief(fastify);
    await putSettings(fastify);

    const before = await generationBrief(fastify);
    const response = await injectGenerate(fastify);
    const after = await generationBrief(fastify);

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      ok: false,
      category: "missing-key",
      message: "OpenRouter API key is missing."
    });
    expect(sendChatCompletionMock).not.toHaveBeenCalled();
    expect(after).toEqual(before);
  });

  it("rejects generation before transport when the inspected prompt fingerprint is stale", async () => {
    sendChatCompletionMock.mockResolvedValue({ ok: true, candidate: { text: "Candidate prose." } });
    process.env.OPENROUTER_API_KEY = keySecretText;
    const fastify = app();
    await openProject(fastify);
    await putStoryConfig(fastify);
    await putBrief(fastify);
    await putSettings(fastify);

    const response = await fastify.inject({
      method: "POST",
      url: "/api/generate",
      payload: { expectedPromptFingerprint: "stale-inspected-fingerprint" }
    });

    expect(response.statusCode).toBe(409);
    expect(response.json()).toEqual({
      ok: false,
      kind: "stale-prompt",
      message: "The prompt changed after it was inspected. Refresh the prompt before generating."
    });
    expect(sendChatCompletionMock).not.toHaveBeenCalled();
  });

  it("returns candidate text and full generation metadata on success without mutating project data", async () => {
    sendChatCompletionMock.mockResolvedValue({ ok: true, candidate: { text: "Candidate prose." } });
    process.env.OPENROUTER_API_KEY = keySecretText;
    const fastify = app();
    await openProject(fastify);
    await putStoryConfig(fastify);
    await putBrief(fastify);
    await putSettings(fastify, {
      model: "openai/gpt-4.1",
      temperature: 0.4,
      maxOutputTokens: 2200,
      topP: 0.9
    });

    const before = await generationBrief(fastify);
    const response = await injectGenerate(fastify);
    const after = await generationBrief(fastify);
    const body = response.json() as {
      metadata: Record<string, unknown>;
    };

    expect(response.statusCode).toBe(200);
    expect(body).toEqual({
      ok: true,
      candidate: { text: "Candidate prose." },
      metadata: {
        model: "openai/gpt-4.1",
        provider: "openrouter",
        temperature: 0.4,
        maxOutputTokens: 2200,
        topP: 0.9,
          versions: { template: "1.10.0", compiler: "1.12.0", contract: "1.13.0" }
      }
    });
    expect(Object.keys(body.metadata).some((key) => /apiKey|api_key|key|prompt|candidate/i.test(key))).toBe(false);
    expect(JSON.stringify(body.metadata)).not.toContain(keySecretText);
    expect(JSON.stringify(body.metadata)).not.toContain("Candidate prose.");
    expect(sendChatCompletionMock).toHaveBeenCalledTimes(1);
    expect(sendChatCompletionMock.mock.calls[0]?.[0]).toMatchObject({
      settings: expect.objectContaining({
        model: "openai/gpt-4.1",
        temperature: 0.4,
        maxOutputTokens: 2200,
        topP: 0.9
      })
    });
    expect(after).toEqual(before);
  });

  it("omits topP from generation metadata when it is not configured", async () => {
    sendChatCompletionMock.mockResolvedValue({ ok: true, candidate: { text: "Candidate prose." } });
    process.env.OPENROUTER_API_KEY = keySecretText;
    const fastify = app();
    await openProject(fastify);
    await putStoryConfig(fastify);
    await putBrief(fastify);
    await putSettings(fastify, { model: "openai/gpt-4.1" });

    const response = await injectGenerate(fastify);
    const body = response.json() as { metadata: Record<string, unknown> };

    expect(response.statusCode).toBe(200);
    expect(body.metadata).toEqual({
      model: "openai/gpt-4.1",
      provider: "openrouter",
      temperature: 0.7,
      maxOutputTokens: 1800,
          versions: { template: "1.10.0", compiler: "1.12.0", contract: "1.13.0" }
    });
    expect(body.metadata).not.toHaveProperty("topP");
  });

  it("returns normalized transport errors without mutating project data", async () => {
    sendChatCompletionMock.mockResolvedValue({
      ok: false,
      category: "provider-unavailable",
      message: "The selected model or provider is unavailable.",
      providerStatus: 503,
      providerReason: "Model is warming up.",
      retryAfter: 8
    });
    process.env.OPENROUTER_API_KEY = keySecretText;
    const fastify = app();
    await openProject(fastify);
    await putStoryConfig(fastify);
    await putBrief(fastify);
    await putSettings(fastify);

    const before = await generationBrief(fastify);
    const response = await injectGenerate(fastify);
    const after = await generationBrief(fastify);

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      ok: false,
      category: "provider-unavailable",
      message: "The selected model or provider is unavailable.",
      providerStatus: 503,
      providerReason: "Model is warming up.",
      retryAfter: 8
    });
    expect(after).toEqual(before);
  });

  it("keeps adversarial provider failure material out of route responses and logs", async () => {
    const authorizationSecret = "sk-or-v1-provider-log-secret";
    const payloadSecret = "PROVIDER_PROMPT_PAYLOAD_DO_NOT_LOG";
    sendChatCompletionMock
      .mockResolvedValueOnce(
        normalizeOpenRouterError(401, {
          error: { message: `Authorization: Bearer ${authorizationSecret}` }
        })
      )
      .mockResolvedValueOnce(
        normalizeOpenRouterError(400, {
          error: { message: `Request JSON: {"prompt":"${payloadSecret}"}` }
        })
      );
    process.env.OPENROUTER_API_KEY = keySecretText;
    const capture = captureProcessWrites();
    const fastify = app({ logger: true });

    try {
      await openProject(fastify);
      await putStoryConfig(fastify);
      await putBrief(fastify);
      await putSettings(fastify);

      const responses = [await injectGenerate(fastify), await injectGenerate(fastify)];
      const serializedResponses = responses.map((response) => response.body).join("\n");
      expect(serializedResponses).not.toContain(authorizationSecret);
      expect(serializedResponses).not.toContain(payloadSecret);
    } finally {
      const output = capture.restore();
      expect(output).not.toContain(authorizationSecret);
      expect(output).not.toContain(payloadSecret);
      expect(output).not.toContain(keySecretText);
      expect(output).not.toContain(promptSecretText);
    }
  });

  it("does not log key, prompt, or candidate text", async () => {
    sendChatCompletionMock.mockResolvedValue({ ok: true, candidate: { text: candidateSecretText } });
    process.env.OPENROUTER_API_KEY = keySecretText;
    const capture = captureProcessWrites();
    const fastify = app({ logger: true });

    try {
      await openProject(fastify);
      await putStoryConfig(fastify);
      await putBrief(fastify, {
        manual_moment_directive: {
          must_render: [promptSecretText],
          may_render_if_naturally_caused: [],
          do_not_force: []
        }
      });
      await putSettings(fastify);

      await injectGenerate(fastify);
    } finally {
      const output = capture.restore();
      expect(output).not.toContain(keySecretText);
      expect(output).not.toContain(promptSecretText);
      expect(output).not.toContain(candidateSecretText);
    }
  });
});

function app(options: Parameters<typeof createServer>[0] = {}): ReturnType<typeof createServer> {
  const fastify = createServer(options);
  apps.push(fastify);
  return fastify;
}

async function tempParent(): Promise<string> {
  return mkdtemp(join(tmpdir(), "loom-generate-routes-"));
}

async function openProject(fastify: ReturnType<typeof createServer>): Promise<void> {
  const response = await fastify.inject({
    method: "POST",
    url: "/api/project/create",
    payload: {
      parentPath: await tempParent(),
      folderName: "generate",
      title: "Generate"
    }
  });

  expect(response.statusCode).toBe(201);
}

async function putStoryConfig(fastify: ReturnType<typeof createServer>): Promise<void> {
  for (const [kind, payload] of Object.entries(storyConfigPayloads)) {
    const response = await fastify.inject({
      method: "PUT",
      url: `/api/story-config/${encodeURIComponent(kind)}`,
      payload: { payload }
    });

    expect(response.statusCode).toBe(200);
  }
}

async function putBrief(fastify: ReturnType<typeof createServer>, overrides: Record<string, unknown> = {}): Promise<void> {
  const entityId = await createCleanEntity(fastify);
  const response = await fastify.inject({
    method: "PUT",
    url: "/api/generation-brief",
    payload: {
      ...cleanBriefForEntity(entityId),
      ...overrides
    }
  });

  expect(response.statusCode).toBe(200);
}

async function createCleanEntity(fastify: ReturnType<typeof createServer>): Promise<string> {
  const response = await fastify.inject({
    method: "POST",
    url: "/api/records",
    payload: {
      type: "ENTITY",
      displayLabel: "A",
      payload: {
        display_name: "A",
        entity_kind: "person",
        roles_in_story: ["primary_actor"],
        short_description: "A is present at the loading door."
      }
    }
  });
  const body = response.json() as { record: { id: string } };

  expect(response.statusCode).toBe(201);
  return body.record.id;
}

function cleanBriefForEntity(entityId: string) {
  return {
    ...cleanBrief,
    active_working_set: {
      selected_records: [entityId],
      active_onstage_cast_full: [],
      present_minor_cast_compressed: [],
      offstage_relevant_cast: []
    },
    current_authoritative_state: {
      ...cleanBrief.current_authoritative_state,
      onstage_entities: [entityId]
    }
  };
}

async function putSettings(
  fastify: ReturnType<typeof createServer>,
  overrides: Record<string, unknown> = {}
): Promise<void> {
  const response = await fastify.inject({
    method: "PUT",
    url: "/api/settings/openrouter",
    payload: {
      model: "anthropic/claude-sonnet-4",
      temperature: 0.7,
      maxOutputTokens: 1800,
      ...overrides
    }
  });

  expect(response.statusCode).toBe(200);
}

async function generationBrief(fastify: ReturnType<typeof createServer>): Promise<unknown> {
  const response = await fastify.inject({ method: "GET", url: "/api/generation-brief" });
  expect(response.statusCode).toBe(200);
  return response.json();
}

async function injectGenerate(
  fastify: ReturnType<typeof createServer>,
  expectedPromptFingerprint?: string
) {
  const fingerprint = expectedPromptFingerprint ?? await currentPromptFingerprint(fastify);
  return fastify.inject({
    method: "POST",
    url: "/api/generate",
    payload: { expectedPromptFingerprint: fingerprint }
  });
}

async function currentPromptFingerprint(fastify: ReturnType<typeof createServer>): Promise<string> {
  const response = await fastify.inject({ method: "POST", url: "/api/compile" });
  expect(response.statusCode).toBe(200);
  const body = response.json() as { metadata: { fingerprint: string } };
  return body.metadata.fingerprint;
}

function captureProcessWrites(): { restore: () => string } {
  const originalStdoutWrite = process.stdout.write;
  const originalStderrWrite = process.stderr.write;
  let captured = "";

  function capture(chunk: unknown, encodingOrCallback?: unknown, callback?: unknown): boolean {
    captured += Buffer.isBuffer(chunk) ? chunk.toString("utf8") : String(chunk);
    const done = typeof encodingOrCallback === "function" ? encodingOrCallback : callback;
    if (typeof done === "function") {
      done();
    }
    return true;
  }

  process.stdout.write = capture as typeof process.stdout.write;
  process.stderr.write = capture as typeof process.stderr.write;

  return {
    restore: () => {
      process.stdout.write = originalStdoutWrite;
      process.stderr.write = originalStderrWrite;
      return captured;
    }
  };
}

function restoreEnv(name: string, value: string | undefined): void {
  if (value === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = value;
  }
}

const storyConfigPayloads = {
  "STORY CONTRACT": {
    title: "Generate Test",
    premise: "A city keeps its promises badly.",
    genre_mode: "urban fantasy",
    tone: "tense and intimate",
    setting_baseline: "Rainy districts under old bargains.",
    content_intensity: "mature",
    explicitness: "Render mature material only when earned.",
    language_register: "controlled contemporary prose",
  },
  "UNIVERSAL CONTENT POLICY": {
    rating_label: "Mature",
    allowed_content_scope: "Tense but non-graphic.",
    tonal_handling: "Grounded.",
    character_bias_handling: "Render bias as character belief, not endorsement."
  },
  "PROSE MODE": {
    pov_character: "omniscient",
    person: "third",
    tense: "past",
    psychic_distance: "close",
    interiority_mode: "filtered",
    dialogue_density: "balanced",
    paragraphing: "mixed",
    language_output: "English",
    special_style_constraints: []
  }
};

const cleanBrief = {
  current_authoritative_state: {
    current_time: "Night.",
    current_location: "Warehouse.",
    onstage_entities: ["019b0298-5c00-7000-8000-000000000001"],
    immediate_situation_summary: "A is at the loading door while the key changes hands.",
    offstage_pressuring_entities: [],
    positions: "A stands near the loading door.",
    possessions: "The key is in A's hand.",
    visible_conditions: ["dim"],
    environmental_conditions: "Rain and sodium light outside.",
    entity_statuses: "A is awake.",
    line_of_sight_and_visibility: "A can see the door.",
    routes_and_exits: ["loading door"],
    available_time: "A few seconds.",
    consent_or_force_conditions: "none",
    current_locks: ["The roof exit is blocked."]
  },
  immediate_handoff: {
    recent_causal_context: "A arrived with the key.",
    last_visible_moment: "B noticed the key.",
    begin_after: "B noticing the key."
  },
  manual_moment_directive: {
    must_render: ["B asks for the key."],
    may_render_if_naturally_caused: [],
    do_not_force: []
  },
  current_cast_voice_pressure: [],
  cast_voice_overrides: [],
  generation_validation_focus: {
    validation_focus_tags: {
      generation_context: ["first_segment"],
      expected_local_modes: [],
      possible_durable_changes: []
    }
  },
  stop_guidance: {
    soft_unit_guidance: "Stop after B's first response point."
  }
};
