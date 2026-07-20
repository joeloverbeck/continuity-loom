import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./openrouter/client.js", () => ({
  sendChatCompletion: vi.fn()
}));

import { sendChatCompletion } from "./openrouter/client.js";
import { createServer } from "./server.js";

const apps: ReturnType<typeof createServer>[] = [];
const sendChatCompletionMock = vi.mocked(sendChatCompletion);
let originalApiKey: string | undefined;

beforeEach(() => {
  originalApiKey = process.env.OPENROUTER_API_KEY;
  process.env.OPENROUTER_API_KEY = "sk-or-cast-reference-test";
  sendChatCompletionMock.mockReset();
  sendChatCompletionMock.mockResolvedValue({ ok: true, candidate: { text: "Unused candidate." } });
});

afterEach(async () => {
  await Promise.all(apps.splice(0).map((fastify) => fastify.close()));
  restoreEnv("OPENROUTER_API_KEY", originalApiKey);
});

describe("CAST MEMBER entity reference gating", () => {
  it("blocks preview and send for an unselected target, preserves state, and recovers after selection", async () => {
    const fastify = createServer();
    apps.push(fastify);
    const folderPath = await openProject(fastify);
    await putStoryConfig(fastify);

    const povId = await createEntity(fastify, "Mara Vale", "A dockworker waiting at the warehouse door.");
    const targetId = await createEntity(fastify, "Iven Rook", "An offstage supervisor under institutional pressure.");
    const castMemberId = await createCastMember(fastify, targetId);

    await putCompleteBrief(fastify, povId, castMemberId, [povId, targetId, castMemberId]);
    const initialCompile = await compile(fastify);

    await putCompleteBrief(fastify, povId, castMemberId, [povId, castMemberId]);
    const blockedBrief = await getJson(fastify, "/api/generation-brief");
    const blockedCastRecord = await getJson(fastify, `/api/records/${castMemberId}`);
    const blockedTargetRecord = await getJson(fastify, `/api/records/${targetId}`);

    const blockedReadinessResponse = await fastify.inject({
      method: "POST",
      url: "/api/readiness",
      payload: { promptKind: "prose" }
    });
    const blockedReadiness = blockedReadinessResponse.json() as {
      canPreview: boolean;
      canGenerate: boolean;
      blockers: Array<{ code: string; severity: string }>;
    };

    expect(blockedReadinessResponse.statusCode).toBe(200);
    expect(blockedReadiness).toMatchObject({
      canPreview: false,
      canGenerate: false,
      blockers: [{ code: "record-reference-unselected-required", severity: "blocker" }]
    });

    const blockedCompileResponse = await fastify.inject({ method: "POST", url: "/api/compile" });
    expect(blockedCompileResponse.json()).toMatchObject({
      ok: false,
      kind: "validation-blocked",
      validation: { blockers: [{ code: "record-reference-unselected-required" }] }
    });
    expect(blockedCompileResponse.json()).not.toHaveProperty("prompt");

    const blockedGenerateResponse = await fastify.inject({
      method: "POST",
      url: "/api/generate",
      payload: { expectedPromptFingerprint: initialCompile.metadata.fingerprint }
    });
    expect(blockedGenerateResponse.json()).toMatchObject({ ok: false, kind: "validation-blocked" });
    expect(blockedGenerateResponse.json()).not.toHaveProperty("candidate");
    expect(sendChatCompletionMock).not.toHaveBeenCalled();

    expect(await getJson(fastify, "/api/generation-brief")).toEqual(blockedBrief);
    expect(await getJson(fastify, `/api/records/${castMemberId}`)).toEqual(blockedCastRecord);
    expect(await getJson(fastify, `/api/records/${targetId}`)).toEqual(blockedTargetRecord);

    const closeResponse = await fastify.inject({ method: "POST", url: "/api/project/close" });
    expect(closeResponse.statusCode).toBe(200);
    const reopenResponse = await fastify.inject({
      method: "POST",
      url: "/api/project/open",
      payload: { folderPath }
    });
    expect(reopenResponse.statusCode).toBe(200);
    expect(await getJson(fastify, "/api/generation-brief")).toEqual(blockedBrief);
    expect(await getJson(fastify, `/api/records/${castMemberId}`)).toEqual(blockedCastRecord);
    expect(await getJson(fastify, `/api/records/${targetId}`)).toEqual(blockedTargetRecord);
    const persistedReadiness = await fastify.inject({
      method: "POST",
      url: "/api/readiness",
      payload: { promptKind: "prose" }
    });
    expect(persistedReadiness.json()).toMatchObject({
      canPreview: false,
      canGenerate: false,
      blockers: [{ code: "record-reference-unselected-required", severity: "blocker" }]
    });

    await putCompleteBrief(fastify, povId, castMemberId, [povId, targetId, castMemberId]);
    const recoveredReadiness = await fastify.inject({
      method: "POST",
      url: "/api/readiness",
      payload: { promptKind: "prose" }
    });
    expect(recoveredReadiness.json()).toMatchObject({ canPreview: true, canGenerate: true });

    const recoveredCompile = await compile(fastify);
    const repeatedCompile = await compile(fastify);
    expect(recoveredCompile.prompt).toBe(initialCompile.prompt);
    expect(recoveredCompile.metadata.fingerprint).toBe(initialCompile.metadata.fingerprint);
    expect(repeatedCompile).toEqual(recoveredCompile);
    expect(recoveredCompile.prompt).not.toContain(targetId);
    expect(sendChatCompletionMock).not.toHaveBeenCalled();
  });
});

interface CompileBody {
  prompt: string;
  metadata: { fingerprint: string };
}

async function openProject(fastify: ReturnType<typeof createServer>): Promise<string> {
  const parentPath = await mkdtemp(join(tmpdir(), "loom-cast-reference-"));
  const response = await fastify.inject({
    method: "POST",
    url: "/api/project/create",
    payload: { parentPath, folderName: "cast-reference", title: "Cast Reference" }
  });
  expect(response.statusCode).toBe(201);
  return (response.json() as { folderPath: string }).folderPath;
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

async function createEntity(
  fastify: ReturnType<typeof createServer>,
  displayLabel: string,
  shortDescription: string
): Promise<string> {
  const response = await fastify.inject({
    method: "POST",
    url: "/api/records",
    payload: {
      type: "ENTITY",
      displayLabel,
      payload: {
        display_name: displayLabel,
        entity_kind: "person",
        roles_in_story: ["primary_actor"],
        short_description: shortDescription
      }
    }
  });
  expect(response.statusCode).toBe(201);
  return (response.json() as { record: { id: string } }).record.id;
}

async function createCastMember(fastify: ReturnType<typeof createServer>, entityId: string): Promise<string> {
  const response = await fastify.inject({
    method: "POST",
    url: "/api/records",
    payload: {
      type: "CAST MEMBER",
      displayLabel: "An exacting offstage supervisor.",
      payload: {
        entity_id: entityId,
        identity: {
          one_line: "An exacting offstage supervisor.",
          public_face: "Controlled and procedural.",
          private_pressure: "Afraid the warehouse failure will expose him."
        },
        voice_anchor: {
          core_voice: "Formal and economical.",
          rhythm_and_syntax: "Short declarative clauses.",
          register_and_diction: "Institutional vocabulary.",
          vocabulary_and_metaphor_pools: "Ledgers, locks, and tides.",
          profanity_and_intensity: "Low profanity, compressed intensity.",
          taboo_and_avoidance_patterns: "Avoids naming his own fear.",
          dialogue_tactics_and_speech_functions: "Redirects questions into procedure.",
          address_terms_and_naming: "Uses surnames and titles.",
          silence_interruption_and_turntaking: "Waits, then interrupts once.",
          under_pressure_voice: "Clipped and over-precise.",
          suppression_or_evasion_rule: "Answers motive questions with logistics.",
          must_preserve: ["procedural precision"],
          must_avoid: ["casual warmth"],
          anti_repetition_warnings: ["Do not repeat ledger metaphors."]
        },
        pressure_behavior_core: {
          cornered: "Narrows everyone else's choices.",
          tempted_or_offered_power: "Asks what authority comes with it.",
          protecting_attachment: "Turns protection into a rule."
        },
        body_presence_core: {
          physicality: "Still and square-shouldered.",
          habitual_gestures_or_presence: "Aligns objects to table edges.",
          social_presentation: "Restrained authority."
        },
        agency_core: {
          default_strategy: "Delay until the facts are controlled.",
          risk_style: "Calculated and reputation-conscious."
        }
      }
    }
  });
  expect(response.statusCode).toBe(201);
  return (response.json() as { record: { id: string } }).record.id;
}

async function putCompleteBrief(
  fastify: ReturnType<typeof createServer>,
  povId: string,
  castMemberId: string,
  selectedRecords: readonly string[]
): Promise<void> {
  const response = await fastify.inject({
    method: "PUT",
    url: "/api/generation-brief",
    payload: {
      active_working_set: {
        selected_records: selectedRecords,
        active_onstage_cast_full: [],
        present_minor_cast_compressed: [],
        offstage_relevant_cast: [castMemberId]
      },
      current_authoritative_state: {
        current_time: "Night.",
        current_location: "Warehouse.",
        onstage_entities: [povId],
        immediate_situation_summary: "Mara waits at the loading door while pressure builds offstage.",
        offstage_pressuring_entities: [],
        positions: "Mara stands beside the loading door.",
        possessions: "Mara carries a brass key.",
        visible_conditions: ["dim"],
        environmental_conditions: "Rain strikes the warehouse roof.",
        entity_statuses: "Mara is awake and alert.",
        line_of_sight_and_visibility: "Mara can see the loading door.",
        routes_and_exits: ["loading door"],
        available_time: "A few seconds.",
        consent_or_force_conditions: "none",
        current_locks: ["The roof exit is blocked."]
      },
      immediate_handoff: {
        recent_causal_context: "Mara arrived with the key.",
        last_visible_moment: "The loading-door light changed.",
        begin_after: "The light changing."
      },
      manual_moment_directive: {
        must_render: ["Mara tests the loading door."],
        may_render_if_naturally_caused: [],
        do_not_force: []
      },
      generation_validation_focus: {
        validation_focus_tags: {
          generation_context: ["first_segment"],
          expected_local_modes: [],
          possible_durable_changes: []
        }
      },
      stop_guidance: { soft_unit_guidance: "Stop after Mara tests the door." }
    }
  });
  expect(response.statusCode).toBe(200);
}

async function compile(fastify: ReturnType<typeof createServer>): Promise<CompileBody> {
  const response = await fastify.inject({ method: "POST", url: "/api/compile" });
  expect(response.statusCode).toBe(200);
  expect(response.json()).toHaveProperty("prompt");
  return response.json() as CompileBody;
}

async function getJson(fastify: ReturnType<typeof createServer>, url: string): Promise<unknown> {
  const response = await fastify.inject({ method: "GET", url });
  expect(response.statusCode).toBe(200);
  return response.json();
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
    title: "Cast Reference Test",
    premise: "A warehouse door changes the balance of a city bargain.",
    genre_mode: "urban fantasy",
    tone: "tense and intimate",
    setting_baseline: "Rainy districts under old bargains.",
    content_intensity: "mature",
    explicitness: "Render mature material only when earned.",
    language_register: "controlled contemporary prose"
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
