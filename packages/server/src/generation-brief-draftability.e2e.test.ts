import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { createServer } from "./server.js";

const apps: ReturnType<typeof createServer>[] = [];
const acceptedProseSentinel = "DRAFTABILITY_ACCEPTED_PROSE_SENTINEL_DO_NOT_PROMPT";
const draftSaveSentinel = "DRAFTABILITY_DRAFT_SAVE_SENTINEL_DO_NOT_LOG";

async function tempParent(): Promise<string> {
  return mkdtemp(join(tmpdir(), "loom-generation-brief-draftability-"));
}

function app(options: Parameters<typeof createServer>[0] = {}): ReturnType<typeof createServer> {
  const fastify = createServer(options);
  apps.push(fastify);
  return fastify;
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

describe("generation brief draftability capstone", () => {
  it("keeps draft save, readiness, defaults, and accepted prose boundaries separated end to end", async () => {
    const capture = captureProcessWrites();
    const fastify = app({ logger: true });

    try {
      await openProject(fastify);
      await putStoryConfig(fastify);
      await appendAcceptedSegment(fastify);

      const accepted = await fastify.inject({ method: "GET", url: "/api/accepted-segments" });
      const acceptedBody = accepted.json() as { segments: unknown[] };
      const expectedGenerationContext =
        acceptedBody.segments.length > 0 ? "continuation_after_accepted_segment" : "first_segment";

      const blankDraft = await fastify.inject({
        method: "PUT",
        url: "/api/generation-brief",
        payload: {
          current_authoritative_state: cleanCurrentState,
          immediate_handoff: {
            ...cleanImmediateHandoff,
            recent_causal_context: draftSaveSentinel
          },
          manual_moment_directive: {
            must_render: [],
            may_render_if_naturally_caused: [],
            do_not_force: []
          },
          stop_guidance: cleanStopGuidance
        }
      });

      expect(blankDraft.statusCode).toBe(200);
      expect(blankDraft.json()).toMatchObject({
        ok: true,
        session: {
          generation_validation_focus: {
            validation_focus_tags: {
              generation_context: [expectedGenerationContext]
            }
          }
        }
      });
      expect(JSON.stringify(blankDraft.json())).not.toContain("Continue the immediate moment.");

      const savedDraft = await fastify.inject({ method: "GET", url: "/api/generation-brief" });
      expect(savedDraft.json()).toMatchObject({
        ok: true,
        defaults: {
          generation_context: {
            value: expectedGenerationContext,
            source: "persisted",
            acceptedSegmentCount: acceptedBody.segments.length
          }
        }
      });

      const blockedValidation = await validate(fastify);
      const blockedCodes = blockedValidation.blockers.map((blocker) => blocker.code);

      expect(blockedValidation.isBlocked).toBe(true);
      expect(blockedCodes).toContain("missing-manual-directive");
      expect(blockedCodes).not.toContain("focus-tag-count-invalid");

      const blockedCompile = await fastify.inject({ method: "POST", url: "/api/compile" });
      const blockedCompileBody = blockedCompile.json() as { kind?: string; prompt?: string; validation?: ValidationBody };

      expect(blockedCompile.statusCode).toBe(200);
      expect(blockedCompileBody.kind).toBe("validation-blocked");
      expect(blockedCompileBody.validation?.blockers.map((blocker) => blocker.code)).toContain("missing-manual-directive");
      expect(blockedCompileBody).not.toHaveProperty("prompt");

      const directiveSave = await fastify.inject({
        method: "PUT",
        url: "/api/generation-brief",
        payload: {
          manual_moment_directive: {
            must_render: ["B asks for the key."],
            may_render_if_naturally_caused: [],
            do_not_force: []
          }
        }
      });
      expect(directiveSave.statusCode).toBe(200);

      const warningOnlyValidation = await validate(fastify);
      expect(warningOnlyValidation.blockers.map((blocker) => blocker.code)).not.toContain("focus-tag-count-invalid");
      expect(warningOnlyValidation.isBlocked).toBe(false);
      expect(warningOnlyValidation.warnings.length).toBeGreaterThan(0);

      const compile = await fastify.inject({ method: "POST", url: "/api/compile" });
      const compileBody = compile.json() as { prompt: string };

      expect(compile.statusCode).toBe(200);
      expect(compileBody.prompt).toContain("B asks for the key.");
      expect(compileBody.prompt).not.toContain(acceptedProseSentinel);
    } finally {
      const output = capture.restore();
      expect(output).not.toContain(draftSaveSentinel);
      expect(output).not.toContain(acceptedProseSentinel);
    }
  });
});

interface ValidationBody {
  blockers: { code: string }[];
  warnings: { code: string }[];
  isBlocked: boolean;
}

async function openProject(fastify: ReturnType<typeof createServer>): Promise<void> {
  const response = await fastify.inject({
    method: "POST",
    url: "/api/project/create",
    payload: {
      parentPath: await tempParent(),
      folderName: "draftability",
      title: "Draftability"
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

async function appendAcceptedSegment(fastify: ReturnType<typeof createServer>): Promise<void> {
  const response = await fastify.inject({
    method: "POST",
    url: "/api/accepted-segments",
    payload: {
      text: acceptedProseSentinel,
      generationMetadata: {
        model: "test/mock-writer",
        provider: "openrouter",
        temperature: 0.2,
        maxOutputTokens: 800,
        versions: { template: "1.0.0", compiler: "1.1.0", contract: "1.1.0" }
      }
    }
  });

  expect(response.statusCode).toBe(201);
}

async function validate(fastify: ReturnType<typeof createServer>): Promise<ValidationBody> {
  const response = await fastify.inject({ method: "POST", url: "/api/validate" });
  expect(response.statusCode).toBe(200);
  return response.json() as ValidationBody;
}

const storyConfigPayloads = {
  "STORY CONTRACT": {
    title: "Draftability Test",
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

const cleanCurrentState = {
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
};

const cleanImmediateHandoff = {
  recent_causal_context: "A arrived with the key.",
  last_visible_moment: "B noticed the key.",
  prior_accepted_prose_status_or_handoff_note: "None. No accepted prose is included.",
  begin_after: "B noticing the key."
};

const cleanStopGuidance = {
  soft_unit_guidance: "Stop after B's first response point."
};
