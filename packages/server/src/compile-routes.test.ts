import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { createServer } from "./server.js";

const apps: ReturnType<typeof createServer>[] = [];
const promptSecretText = "COMPILE_ROUTE_PROMPT_SECRET_DO_NOT_LOG";
const missingRecordId = "019b0298-5c00-7000-8000-000000009999";

async function tempParent(): Promise<string> {
  return mkdtemp(join(tmpdir(), "loom-compile-routes-"));
}

function app(options: Parameters<typeof createServer>[0] = {}): ReturnType<typeof createServer> {
  const fastify = createServer(options);
  apps.push(fastify);
  return fastify;
}

async function openProject(fastify: ReturnType<typeof createServer>): Promise<void> {
  const response = await fastify.inject({
    method: "POST",
    url: "/api/project/create",
    payload: {
      parentPath: await tempParent(),
      folderName: "compile",
      title: "Compile"
    }
  });

  expect(response.statusCode).toBe(201);
}

async function putStoryConfig(
  fastify: ReturnType<typeof createServer>,
  overrides: Partial<typeof storyConfigPayloads> = {}
): Promise<void> {
  for (const [kind, payload] of Object.entries({ ...storyConfigPayloads, ...overrides })) {
    const response = await fastify.inject({
      method: "PUT",
      url: `/api/story-config/${encodeURIComponent(kind)}`,
      payload: { payload }
    });

    expect(response.statusCode).toBe(200);
  }
}

async function putBrief(fastify: ReturnType<typeof createServer>, overrides: Record<string, unknown> = {}): Promise<string> {
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
  return entityId;
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

afterEach(async () => {
  await Promise.all(apps.splice(0).map((fastify) => fastify.close()));
});

describe("compile routes", () => {
  it("returns a structured no-open-project error with no prompt", async () => {
    const fastify = app();
    const response = await fastify.inject({ method: "POST", url: "/api/compile" });
    const body = response.json() as { kind: string; prompt?: string };

    expect(response.statusCode).toBe(409);
    expect(body.kind).toBe("no-open-project");
    expect(body).not.toHaveProperty("prompt");
  });

  it("compiles a blocker-free project and is deterministic across calls", async () => {
    const fastify = app();
    await openProject(fastify);
    await putStoryConfig(fastify);
    await putBrief(fastify);

    const first = await fastify.inject({ method: "POST", url: "/api/compile" });
    const second = await fastify.inject({ method: "POST", url: "/api/compile" });
    const firstBody = first.json() as {
      prompt: string;
      metadata: { fingerprint: string; versions: { template: string; compiler: string; contract: string } };
    };
    const secondBody = second.json() as typeof firstBody;

    expect(first.statusCode).toBe(200);
    expect(firstBody.prompt).toContain("<final_output_instruction>");
    expect(firstBody.metadata.versions).toEqual({ template: "1.6.0", compiler: "1.8.0", contract: "1.9.0" });
    expect(secondBody.prompt).toBe(firstBody.prompt);
    expect(secondBody.metadata.fingerprint).toBe(firstBody.metadata.fingerprint);
  });

  it("compiles an ideation preview with relaxed readiness", async () => {
    const fastify = app();
    await openProject(fastify);
    await putStoryConfig(fastify);
    await putBrief(fastify, {
      manual_moment_directive: {
        must_render: [],
        may_render_if_naturally_caused: [],
        do_not_force: []
      }
    });

    const response = await fastify.inject({
      method: "POST",
      url: "/api/compile",
      payload: { promptKind: "ideation", ideationRequest: { mode: "questions", count: 3, dormantSlot: false } }
    });
    const body = response.json() as { prompt: string; metadata: { versions: { template: string; compiler: string; contract: string } } };

    expect(response.statusCode).toBe(200);
    expect(body.prompt).toContain("# Grounded Ideation Prompt");
    expect(body.prompt).toContain("<ideation_slots>");
    expect(body.prompt).toContain("Mode: questions.");
    expect(body.prompt).not.toContain("<final_output_instruction>");
    expect(body.metadata.versions).toEqual({ template: "1.6.0", compiler: "1.8.0", contract: "1.9.0" });
  });

  it("fails closed when validation is blocked and emits no prompt", async () => {
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

    const response = await fastify.inject({ method: "POST", url: "/api/compile" });
    const body = response.json() as { kind: string; prompt?: string; validation: { isBlocked: boolean } };

    expect(response.statusCode).toBe(200);
    expect(body.kind).toBe("validation-blocked");
    expect(body.validation.isBlocked).toBe(true);
    expect(body).not.toHaveProperty("prompt");
  });

  it("emits no prompt when variable PROSE MODE has no selected POV", async () => {
    const fastify = app();
    await openProject(fastify);
    await putStoryConfig(fastify, {
      "PROSE MODE": { ...storyConfigPayloads["PROSE MODE"], pov_character: "variable" }
    });
    await putBrief(fastify);

    const response = await fastify.inject({ method: "POST", url: "/api/compile" });
    const body = response.json() as { kind: string; prompt?: string; validation: { blockers: { code: string }[]; isBlocked: boolean } };

    expect(response.statusCode).toBe(200);
    expect(body.kind).toBe("validation-blocked");
    expect(body.validation.isBlocked).toBe(true);
    expect(body.validation.blockers.map((blocker) => blocker.code)).toContain("selected-pov-required-for-variable-mode");
    expect(body).not.toHaveProperty("prompt");
  });

  it("emits no prompt when selected POV conflicts with fixed PROSE MODE", async () => {
    const fastify = app();
    await openProject(fastify);
    await putStoryConfig(fastify);
    const entityId = await putBrief(fastify);
    const rewrite = await fastify.inject({
      method: "PUT",
      url: "/api/generation-brief",
      payload: {
        ...cleanBriefForEntity(entityId),
        active_working_set: {
          selected_records: [entityId],
          active_onstage_cast_full: [],
          present_minor_cast_compressed: [],
          offstage_relevant_cast: [],
          selected_pov: entityId
        }
      }
    });

    expect(rewrite.statusCode).toBe(200);

    const response = await fastify.inject({ method: "POST", url: "/api/compile" });
    const body = response.json() as { kind: string; prompt?: string; validation: { blockers: { code: string }[]; isBlocked: boolean } };

    expect(response.statusCode).toBe(200);
    expect(body.kind).toBe("validation-blocked");
    expect(body.validation.isBlocked).toBe(true);
    expect(body.validation.blockers.map((blocker) => blocker.code)).toContain("selected-pov-conflicts-with-prose-mode");
    expect(body).not.toHaveProperty("prompt");
  });

  it("does not throw when a first-segment brief has no prior-prose note", async () => {
    const fastify = app();
    await openProject(fastify);
    await putStoryConfig(fastify);
    await putBrief(fastify, {
      immediate_handoff: {
        recent_causal_context: "A arrived with the key.",
        last_visible_moment: "B noticed the key.",
        begin_after: "B noticing the key."
      }
    });

    const response = await fastify.inject({ method: "POST", url: "/api/compile" });
    const body = response.json() as { kind?: string; prompt?: string; validation?: { isBlocked: boolean; blockers: { code: string }[] } };

    expect(response.statusCode).toBe(200);
    expect(body.kind).not.toBe("internal-server-error");
    expect(body.validation?.blockers.map((blocker) => blocker.code) ?? []).not.toContain(
      "prompt-facing-prose-contamination"
    );
  });

  it("returns malformed-source errors from the shared snapshot builder with no prompt", async () => {
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

    const response = await fastify.inject({ method: "POST", url: "/api/compile" });
    const body = response.json() as { kind: string; prompt?: string };

    expect(response.statusCode).toBe(422);
    expect(body.kind).toBe("malformed-validation-source");
    expect(body).not.toHaveProperty("prompt");
  });

  it("does not mutate generation session during compile", async () => {
    const fastify = app();
    await openProject(fastify);
    await putStoryConfig(fastify);
    await putBrief(fastify);

    const before = (await fastify.inject({ method: "GET", url: "/api/generation-brief" })).json();
    await fastify.inject({ method: "POST", url: "/api/compile" });
    const after = (await fastify.inject({ method: "GET", url: "/api/generation-brief" })).json();

    expect(after).toEqual(before);
  });

  it("does not log prompt-facing text", async () => {
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

      await fastify.inject({ method: "POST", url: "/api/compile" });
    } finally {
      const output = capture.restore();
      expect(output).not.toContain(promptSecretText);
    }
  });
});

const storyConfigPayloads = {
  "STORY CONTRACT": {
    title: "Compile Test",
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
