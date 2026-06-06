import { mkdtemp } from "node:fs/promises";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./openrouter/client.js", () => ({
  sendChatCompletion: vi.fn()
}));

import { sendChatCompletion } from "./openrouter/client.js";
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
    const response = await fastify.inject({ method: "POST", url: "/api/generate" });
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

    const response = await fastify.inject({ method: "POST", url: "/api/generate" });
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

    const response = await fastify.inject({ method: "POST", url: "/api/generate" });
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
    const response = await fastify.inject({ method: "POST", url: "/api/generate" });
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

  it("returns candidate text and metadata on success without mutating project data", async () => {
    sendChatCompletionMock.mockResolvedValue({ ok: true, candidate: { text: "Candidate prose." } });
    process.env.OPENROUTER_API_KEY = keySecretText;
    const fastify = app();
    await openProject(fastify);
    await putStoryConfig(fastify);
    await putBrief(fastify);
    await putSettings(fastify, { model: "openai/gpt-4.1" });

    const before = await generationBrief(fastify);
    const response = await fastify.inject({ method: "POST", url: "/api/generate" });
    const after = await generationBrief(fastify);

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      ok: true,
      candidate: { text: "Candidate prose." },
      metadata: {
        model: "openai/gpt-4.1",
        versions: { template: "1.0.0", compiler: "1.0.0", contract: "1.0.0" }
      }
    });
    expect(sendChatCompletionMock).toHaveBeenCalledTimes(1);
    expect(sendChatCompletionMock.mock.calls[0]?.[0]).toMatchObject({
      settings: expect.objectContaining({ model: "openai/gpt-4.1" })
    });
    expect(after).toEqual(before);
  });

  it("returns normalized transport errors without mutating project data", async () => {
    sendChatCompletionMock.mockResolvedValue({
      ok: false,
      category: "provider-unavailable",
      message: "The selected model or provider is unavailable."
    });
    process.env.OPENROUTER_API_KEY = keySecretText;
    const fastify = app();
    await openProject(fastify);
    await putStoryConfig(fastify);
    await putBrief(fastify);
    await putSettings(fastify);

    const before = await generationBrief(fastify);
    const response = await fastify.inject({ method: "POST", url: "/api/generate" });
    const after = await generationBrief(fastify);

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      ok: false,
      category: "provider-unavailable",
      message: "The selected model or provider is unavailable."
    });
    expect(after).toEqual(before);
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

      await fastify.inject({ method: "POST", url: "/api/generate" });
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
  const response = await fastify.inject({
    method: "PUT",
    url: "/api/generation-brief",
    payload: {
      ...cleanBrief,
      ...overrides
    }
  });

  expect(response.statusCode).toBe(200);
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
    continuity_philosophy: "continuity_first",
    setting_baseline: "Rainy districts under old bargains.",
    content_intensity: "mature",
    explicitness: "Render mature material only when earned.",
    language_register: "controlled contemporary prose",
    prose_preferences: {
      psychic_distance: "close",
      dialogue_density: "moment_led",
      interiority: "filtered",
      paragraphing: "mixed"
    }
  },
  "UNIVERSAL CONTENT POLICY": {
    rating_label: "Mature",
    allowed_content_scope: "Tense but non-graphic.",
    tonal_handling: "Grounded.",
    governing_policy_note: "Obey provider policy.",
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
    prior_accepted_prose_status_or_handoff_note: "None. No accepted prose is included.",
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
