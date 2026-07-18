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
const keySecretText = "sk-or-ideate-route-secret";

describe("ideate routes", () => {
  let configDir: string;
  let originalConfigDir: string | undefined;
  let originalApiKey: string | undefined;

  beforeEach(() => {
    originalConfigDir = process.env.CONTINUITY_LOOM_CONFIG_DIR;
    originalApiKey = process.env.OPENROUTER_API_KEY;
    configDir = mkdtempSync(join(tmpdir(), "loom-ideate-routes-settings-"));
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

  it("returns parsed ideas, flags unknown citations, and does not mutate project data", async () => {
    sendChatCompletionMock.mockResolvedValue({
      ok: true,
      candidate: {
        text: [
          "IDEA 1",
          "operator: Reveal",
          "headline: Let the hidden item pressure the exchange.",
          "why: The selected records support a reveal-adjacent pressure move.",
          "grounds: [SECRET-1], [UNKNOWN-99]"
        ].join("\n")
      }
    });
    process.env.OPENROUTER_API_KEY = keySecretText;
    const fastify = app();
    await prepareIdeationProject(fastify);

    const before = await generationBrief(fastify);
    const payload = await inspectedIdeationPayload(fastify, {
      count: 3,
      focus: "  What pressure <opens> the door?  "
    });
    const response = await fastify.inject({ method: "POST", url: "/api/ideate", payload });
    const after = await generationBrief(fastify);
    const body = response.json() as {
      ideas: { unknownCitations: string[] }[];
      citations: Record<string, string>;
      metadata: Record<string, unknown>;
    };

    expect(response.statusCode).toBe(200);
    expect(body.ideas[0]?.unknownCitations).toEqual(["[UNKNOWN-99]"]);
    expect(body.citations["[SECRET-1]"]).toBe("The loading-door key has been copied.");
    expect(body.metadata).toMatchObject({
      provider: "openrouter",
      versions: { template: "1.10.0", compiler: "1.12.0", contract: "1.13.0" }
    });
    const sentPrompt = sendChatCompletionMock.mock.calls[0]?.[0]?.prompt ?? "";
    expect(sentPrompt).toContain("# Grounded Ideation Prompt");
    expect(sentPrompt.match(/What pressure &lt;opens&gt; the door\?/g)).toHaveLength(1);
    expect(sendChatCompletionMock).toHaveBeenCalledTimes(1);
    expect(after).toEqual(before);
  });

  it("returns malformed raw scratch when the model output cannot be parsed", async () => {
    sendChatCompletionMock.mockResolvedValue({ ok: true, candidate: { text: "freeform answer" } });
    process.env.OPENROUTER_API_KEY = keySecretText;
    const fastify = app();
    await prepareIdeationProject(fastify);

    const response = await fastify.inject({
      method: "POST",
      url: "/api/ideate",
      payload: await inspectedIdeationPayload(fastify)
    });

    expect(response.json()).toMatchObject({ ok: true, malformed: true, raw: "freeform answer" });
  });

  it("returns missing-key before transport when no API key is configured", async () => {
    const fastify = app();
    await prepareIdeationProject(fastify);

    const response = await fastify.inject({
      method: "POST",
      url: "/api/ideate",
      payload: await inspectedIdeationPayload(fastify)
    });

    expect(response.json()).toEqual({
      ok: false,
      category: "missing-key",
      message: "OpenRouter API key is missing."
    });
    expect(sendChatCompletionMock).not.toHaveBeenCalled();
  });

  it("rejects a missing inspected fingerprint before transport", async () => {
    const fastify = app();
    await prepareIdeationProject(fastify);

    const response = await fastify.inject({
      method: "POST",
      url: "/api/ideate",
      payload: { focus: "What changes?" }
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ ok: false, kind: "invalid-ideation-request" });
    expect(sendChatCompletionMock).not.toHaveBeenCalled();
  });

  it("rejects a whitespace-only inspected fingerprint as malformed before transport", async () => {
    const fastify = app();

    const response = await fastify.inject({
      method: "POST",
      url: "/api/ideate",
      payload: {
        focus: "What changes?",
        expectedPromptFingerprint: " \t\n "
      }
    });
    const body = response.json() as { kind: string; issues: { path: (string | number)[] }[] };

    expect(response.statusCode).toBe(400);
    expect(body.kind).toBe("invalid-ideation-request");
    expect(body.issues.map((issue) => issue.path)).toContainEqual(["expectedPromptFingerprint"]);
    expect(sendChatCompletionMock).not.toHaveBeenCalled();
  });

  it("rejects malformed non-string Author focus before snapshot or transport", async () => {
    const fastify = app();

    const response = await fastify.inject({
      method: "POST",
      url: "/api/ideate",
      payload: {
        focus: 42,
        expectedPromptFingerprint: "not-used"
      }
    });
    const body = response.json() as { kind: string; issues: { path: (string | number)[] }[] };

    expect(response.statusCode).toBe(400);
    expect(body.kind).toBe("invalid-ideation-request");
    expect(body.issues.map((issue) => issue.path)).toContainEqual(["focus"]);
    expect(sendChatCompletionMock).not.toHaveBeenCalled();
  });

  it("rejects over-limit Author focus before snapshot or transport", async () => {
    const fastify = app();
    const response = await fastify.inject({
      method: "POST",
      url: "/api/ideate",
      payload: {
        focus: "😀".repeat(501),
        expectedPromptFingerprint: "not-used"
      }
    });
    const body = response.json() as { kind: string; issues: { message: string }[] };

    expect(response.statusCode).toBe(400);
    expect(body.kind).toBe("invalid-ideation-request");
    expect(body.issues.map((issue) => issue.message)).toContain(
      "Author focus must be 500 Unicode code points or fewer."
    );
    expect(sendChatCompletionMock).not.toHaveBeenCalled();
  });

  it("rejects a stale inspected fingerprint before credentials or transport", async () => {
    const fastify = app();
    await prepareIdeationProject(fastify);
    const inspected = await inspectedIdeationPayload(fastify, { focus: "What opens?" });

    const response = await fastify.inject({
      method: "POST",
      url: "/api/ideate",
      payload: { ...inspected, focus: "What closes?" }
    });

    expect(response.statusCode).toBe(409);
    expect(response.json()).toEqual({
      ok: false,
      kind: "stale-ideation-prompt",
      message: "The ideation request changed. Inspect the current prompt before sending."
    });
    expect(sendChatCompletionMock).not.toHaveBeenCalled();
  });
});

function app(options: Parameters<typeof createServer>[0] = {}): ReturnType<typeof createServer> {
  const fastify = createServer(options);
  apps.push(fastify);
  return fastify;
}

async function prepareIdeationProject(fastify: ReturnType<typeof createServer>): Promise<void> {
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
      parentPath: await mkdtemp(join(tmpdir(), "loom-ideate-routes-")),
      folderName: "ideate",
      title: "Ideate"
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
  const entityId = await createCleanEntity(fastify);
  const secretId = await createCleanSecret(fastify, entityId);
  const response = await fastify.inject({
    method: "PUT",
    url: "/api/generation-brief",
    payload: cleanBriefForEntity(entityId, secretId)
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

async function createCleanSecret(fastify: ReturnType<typeof createServer>, entityId: string): Promise<string> {
  const response = await fastify.inject({
    method: "POST",
    url: "/api/records",
    payload: {
      type: "SECRET",
      displayLabel: "Door key is copied",
      payload: {
        status: "hidden",
        secret_kind: "artifact_truth",
        secret_claim: "The loading-door key has been copied.",
        holders: [entityId],
        non_holders_to_protect: "all_except_holders",
        audience_visibility: "hidden",
        pov_access: "hidden",
        salience: "high",
        allowed_surface_cues: ["The spare key is warm."],
        forbidden_reveals: "none",
        reveal_permission: "clue_only",
        reveal_triggers: ["Only surface clues may appear."],
        clue_carriers: []
      }
    }
  });
  const body = response.json() as { record: { id: string } };

  expect(response.statusCode).toBe(201);
  return body.record.id;
}

function cleanBriefForEntity(entityId: string, secretId: string) {
  return {
    ...cleanBrief,
    active_working_set: {
      selected_records: [entityId, secretId],
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

async function generationBrief(fastify: ReturnType<typeof createServer>): Promise<unknown> {
  const response = await fastify.inject({ method: "GET", url: "/api/generation-brief" });
  expect(response.statusCode).toBe(200);
  return response.json();
}

async function inspectedIdeationPayload(
  fastify: ReturnType<typeof createServer>,
  request: Record<string, unknown> = {}
): Promise<Record<string, unknown>> {
  const response = await fastify.inject({
    method: "POST",
    url: "/api/compile",
    payload: { promptKind: "ideation", ideationRequest: request }
  });
  const body = response.json() as { metadata?: { fingerprint?: string } };

  expect(response.statusCode).toBe(200);
  expect(body.metadata?.fingerprint).toEqual(expect.any(String));
  return { ...request, expectedPromptFingerprint: body.metadata!.fingerprint! };
}

function restoreEnv(name: string, value: string | undefined): void {
  if (value === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = value;
  }
}

const storyConfigPayloads = {
  "UNIVERSAL CONTENT POLICY": {
    rating_label: "General",
    allowed_content_scope: "Mild suspense.",
    tonal_handling: "Quiet.",
    character_bias_handling: "Character views are limited."
  },
  "STORY CONTRACT": {
    title: "Ideate",
    premise: "A tests a locked door.",
    genre_mode: "mystery",
    tone: "tense",
    setting_baseline: "A loading dock.",
    content_intensity: "general",
    explicitness: "non-graphic",
    language_register: "plain",
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
    current_time: "Now.",
    current_location: "Dock.",
    onstage_entities: [] as string[],
    immediate_situation_summary: "A stands by the door.",
    offstage_pressuring_entities: [],
    positions: "A is at the threshold.",
    possessions: "A has a key.",
    visible_conditions: [],
    environmental_conditions: "Rain.",
    entity_statuses: [],
    line_of_sight_and_visibility: "Clear.",
    routes_and_exits: ["door"],
    available_time: "One exchange.",
    consent_or_force_conditions: "none",
    current_locks: []
  },
  immediate_handoff: {
    recent_causal_context: "A arrived.",
    last_visible_moment: "A lifted the key.",
    begin_after: "A lifting the key."
  },
  manual_moment_directive: {
    must_render: ["Have A test the door."],
    may_render_if_naturally_caused: [],
    do_not_force: []
  },
  current_cast_voice_pressure: [],
  cast_voice_overrides: []
};
