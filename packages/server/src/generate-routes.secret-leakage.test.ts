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
const fakeApiKey = "sk-or-FAKE-LEAK-CANARY-0000";

describe("generate route secret leakage regression", () => {
  let configDir: string;
  let originalConfigDir: string | undefined;
  let originalApiKey: string | undefined;

  beforeEach(() => {
    originalConfigDir = process.env.CONTINUITY_LOOM_CONFIG_DIR;
    originalApiKey = process.env.OPENROUTER_API_KEY;
    configDir = mkdtempSync(join(tmpdir(), "loom-generate-secret-leakage-"));
    process.env.CONTINUITY_LOOM_CONFIG_DIR = configDir;
    process.env.OPENROUTER_API_KEY = fakeApiKey;
    sendChatCompletionMock.mockReset();
  });

  afterEach(async () => {
    await Promise.all(apps.splice(0).map((fastify) => fastify.close()));
    restoreEnv("CONTINUITY_LOOM_CONFIG_DIR", originalConfigDir);
    restoreEnv("OPENROUTER_API_KEY", originalApiKey);
    rmSync(configDir, { recursive: true, force: true });
  });

  it("keeps configured keys out of prompt preview text and generated success surfaces", async () => {
    sendChatCompletionMock.mockResolvedValue({ ok: true, candidate: { text: "Candidate prose." } });
    const fastify = app();
    await prepareGenerationProject(fastify);

    const preview = await fastify.inject({ method: "POST", url: "/api/compile" });
    expect(preview.statusCode).toBe(200);
    const previewBody = preview.json() as { prompt: string };
    expect(previewBody.prompt).not.toContain(fakeApiKey);

    const response = await fastify.inject({ method: "POST", url: "/api/generate" });
    const sentPrompt = sendChatCompletionMock.mock.calls[0]?.[0]?.prompt;

    expect(response.statusCode).toBe(200);
    expect(sentPrompt).toBe(previewBody.prompt);
    expect(sentPrompt).not.toContain(fakeApiKey);
    expect(response.body).not.toContain(fakeApiKey);
  });

  it("keeps configured keys out of generate error responses and logs", async () => {
    sendChatCompletionMock.mockResolvedValue({
      ok: false,
      category: "provider-unavailable",
      message: "The selected model or provider is unavailable."
    });
    const capture = captureProcessWrites();
    const fastify = app({ logger: true });

    try {
      await prepareGenerationProject(fastify);
      const response = await fastify.inject({ method: "POST", url: "/api/generate" });

      expect(response.statusCode).toBe(200);
      expect(response.body).not.toContain(fakeApiKey);
      expect(sendChatCompletionMock.mock.calls[0]?.[0]?.prompt).not.toContain(fakeApiKey);
    } finally {
      const output = capture.restore();
      expect(output).not.toContain(fakeApiKey);
    }
  });
});

/*
Security surface map:
- Project metadata and SQLite project store: project-store.secret-boundary.test.ts.
- Accepted segment metadata: accepted-routes.test.ts.
- Compiled prompt string, prompt preview text, generate responses, and logs: this file.
- Generated demo fixtures: demo-creation.test.ts and core demo-fixture coverage.
- Candidate session serialization: N/A in v1; discarded/regenerated candidates are not persisted.
- Generated files: covered by storage/backup regression for Loom stores and backups.
*/

function app(options: Parameters<typeof createServer>[0] = {}): ReturnType<typeof createServer> {
  const fastify = createServer(options);
  apps.push(fastify);
  return fastify;
}

async function prepareGenerationProject(fastify: ReturnType<typeof createServer>): Promise<void> {
  await openProject(fastify);
  await putStoryConfig(fastify);
  await putBrief(fastify);
  await putSettings(fastify);
}

async function openProject(fastify: ReturnType<typeof createServer>): Promise<void> {
  const response = await fastify.inject({
    method: "POST",
    url: "/api/project/create",
    payload: {
      parentPath: await mkdtemp(join(tmpdir(), "loom-generate-secret-project-")),
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

async function putBrief(fastify: ReturnType<typeof createServer>): Promise<void> {
  const response = await fastify.inject({
    method: "PUT",
    url: "/api/generation-brief",
    payload: cleanBrief
  });

  expect(response.statusCode).toBe(200);
}

async function putSettings(fastify: ReturnType<typeof createServer>): Promise<void> {
  const response = await fastify.inject({
    method: "PUT",
    url: "/api/settings/openrouter",
    payload: {
      model: "anthropic/claude-sonnet-4",
      temperature: 0.7,
      maxOutputTokens: 1800
    }
  });

  expect(response.statusCode).toBe(200);
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
