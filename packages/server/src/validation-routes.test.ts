import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { createServer } from "./server.js";

const apps: ReturnType<typeof createServer>[] = [];
const secretText = "VALIDATION_ROUTE_SECRET_DO_NOT_LOG";

async function tempParent(): Promise<string> {
  return mkdtemp(join(tmpdir(), "loom-validation-routes-"));
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
      folderName: "validation",
      title: "Validation"
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

describe("validation routes", () => {
  it("returns a structured no-open-project error", async () => {
    const fastify = app();
    const response = await fastify.inject({ method: "POST", url: "/api/validate" });

    expect(response.statusCode).toBe(409);
    expect(response.json()).toEqual({ ok: false, kind: "no-open-project", message: "No project is open." });
  });

  it("returns validation result for clean and warning-only project state", async () => {
    const fastify = app();
    await openProject(fastify);
    await putStoryConfig(fastify);
    await putBrief(fastify);

    const response = await fastify.inject({ method: "POST", url: "/api/validate" });
    const body = response.json() as { blockers: unknown[]; warnings: { code: string }[]; isBlocked: boolean };

    expect(response.statusCode).toBe(200);
    expect(body.blockers).toEqual([]);
    expect(body.isBlocked).toBe(false);
    expect(body.warnings.length).toBeGreaterThan(0);
  });

  it("returns blocker codes for contradictory prompt-facing state", async () => {
    const fastify = app();
    await openProject(fastify);
    await putStoryConfig(fastify);
    await putBrief(fastify, {
      immediate_handoff: {
        ...cleanBrief.immediate_handoff,
        recent_causal_context: "This contains copied accepted prose from an old candidate."
      },
      manual_moment_directive: {
        must_render: ["Write the whole chapter outline."],
        may_render_if_naturally_caused: [],
        do_not_force: []
      }
    });

    const response = await fastify.inject({ method: "POST", url: "/api/validate" });
    const body = response.json() as { blockers: { code: string }[]; isBlocked: boolean };

    expect(body.isBlocked).toBe(true);
    expect(body.blockers.map((blocker) => blocker.code)).toEqual(
      expect.arrayContaining(["local-prose-scope-violation", "prompt-facing-prose-contamination"])
    );
  });

  it("does not mutate generation session during validation", async () => {
    const fastify = app();
    await openProject(fastify);
    await putStoryConfig(fastify);
    await putBrief(fastify);

    const before = (await fastify.inject({ method: "GET", url: "/api/generation-brief" })).json();
    await fastify.inject({ method: "POST", url: "/api/validate" });
    const after = (await fastify.inject({ method: "GET", url: "/api/generation-brief" })).json();

    expect(after).toEqual(before);
  });

  it("does not log prompt-facing payload text", async () => {
    const capture = captureProcessWrites();
    const fastify = app({ logger: true });
    try {
      await openProject(fastify);
      await putStoryConfig(fastify);
      await putBrief(fastify, {
        manual_moment_directive: {
          must_render: [secretText],
          may_render_if_naturally_caused: [],
          do_not_force: []
        }
      });

      await fastify.inject({ method: "POST", url: "/api/validate" });
    } finally {
      const output = capture.restore();
      expect(output).not.toContain(secretText);
    }
  });
});

const storyConfigPayloads = {
  "STORY CONTRACT": {
    title: "Continuity Test",
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
