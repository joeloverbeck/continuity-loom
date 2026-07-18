import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./openrouter/client.js", () => ({
  sendChatCompletion: vi.fn()
}));

import { sendChatCompletion } from "./openrouter/client.js";
import { createServer } from "./server.js";

const apps: ReturnType<typeof createServer>[] = [];
const sendChatCompletionMock = vi.mocked(sendChatCompletion);
const acceptedProseSentinel = "DRAFTABILITY_ACCEPTED_PROSE_SENTINEL_DO_NOT_PROMPT";
const draftSaveSentinel = "DRAFTABILITY_DRAFT_SAVE_SENTINEL_DO_NOT_LOG";
let originalApiKey: string | undefined;

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

beforeEach(() => {
  originalApiKey = process.env.OPENROUTER_API_KEY;
  delete process.env.OPENROUTER_API_KEY;
  sendChatCompletionMock.mockReset();
});

afterEach(async () => {
  await Promise.all(apps.splice(0).map((fastify) => fastify.close()));
  restoreEnv("OPENROUTER_API_KEY", originalApiKey);
});

describe("generation brief draftability capstone", () => {
  it("keeps draft save, readiness, defaults, and accepted prose boundaries separated end to end", async () => {
    const capture = captureProcessWrites();
    const fastify = app({ logger: true });

    try {
      await openProject(fastify);
      await putStoryConfig(fastify);
      await appendAcceptedSegment(fastify);
      const entityId = await createCleanEntity(fastify);

      const accepted = await fastify.inject({ method: "GET", url: "/api/accepted-segments" });
      const acceptedBody = accepted.json() as { segments: unknown[] };
      const expectedGenerationContext =
        acceptedBody.segments.length > 0 ? "continuation_after_accepted_segment" : "first_segment";

      const blankDraft = await fastify.inject({
        method: "PUT",
        url: "/api/generation-brief",
        payload: {
          active_working_set: {
            selected_records: [entityId],
            active_onstage_cast_full: [],
            present_minor_cast_compressed: [],
            offstage_relevant_cast: []
          },
          current_authoritative_state: {
            ...cleanCurrentState,
            onstage_entities: [entityId]
          },
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
        generationContext: {
          savedValue: expectedGenerationContext,
          requiredValue: expectedGenerationContext,
          acceptedSegmentCount: acceptedBody.segments.length,
          coherent: true
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

  it("preserves the saved draft through every accepted-segment boundary and fails closed until explicit repair", async () => {
    process.env.OPENROUTER_API_KEY = "sk-or-coherence-capstone";
    sendChatCompletionMock.mockResolvedValue({ ok: true, candidate: { text: "Fresh candidate prose." } });
    const capture = captureProcessWrites();
    const fastify = app({ logger: true });

    try {
      const folderPath = await openProject(fastify);
      const databasePath = join(folderPath, "loom.sqlite");
      await putStoryConfig(fastify);
      const entityId = await createCleanEntity(fastify);
      await putCompleteBrief(fastify, entityId, "first_segment");

      const initialSession = readSessionRow(databasePath);
      const initialCompile = await compile(fastify);
      expect(initialCompile.prompt).not.toContain(acceptedProseSentinel);

      const firstId = await appendAcceptedSegment(fastify, acceptedProseSentinel);
      expect(readSessionRow(databasePath)).toEqual(initialSession);

      const firstMismatchBrief = await generationBrief(fastify);
      expect(firstMismatchBrief).toMatchObject({
        generationContext: {
          savedValue: "first_segment",
          requiredValue: "continuation_after_accepted_segment",
          acceptedSegmentCount: 1,
          coherent: false
        }
      });
      const firstMismatchValidation = await validate(fastify);
      expect(firstMismatchValidation.blockers.map((blocker) => blocker.code)).toContain(
        "generation-context-accepted-segment-mismatch"
      );
      expect(firstMismatchValidation.blockers.map((blocker) => blocker.code)).not.toContain("focus-tag-count-invalid");
      const firstMismatchReadiness = await readiness(fastify);
      expect(firstMismatchReadiness).toMatchObject({
        canPreview: false,
        canGenerate: false,
        blockers: [{
          code: "generation-context-accepted-segment-mismatch",
          title: "Generation context does not match accepted segments"
        }]
      });
      expect(JSON.stringify(firstMismatchReadiness)).toContain("saved as First segment");
      expect(JSON.stringify(firstMismatchReadiness)).toContain(
        "accepted-segment archive contains 1 accepted segment and requires Continuation after accepted segment"
      );

      const firstBlockedCompile = await fastify.inject({ method: "POST", url: "/api/compile" });
      expect(firstBlockedCompile.json()).toMatchObject({ ok: false, kind: "validation-blocked" });
      expect(firstBlockedCompile.json()).not.toHaveProperty("prompt");
      const firstBlockedGenerate = await fastify.inject({
        method: "POST",
        url: "/api/generate",
        payload: { expectedPromptFingerprint: initialCompile.metadata.fingerprint }
      });
      expect(firstBlockedGenerate.json()).toMatchObject({ ok: false, kind: "validation-blocked" });
      expect(firstBlockedGenerate.json()).not.toHaveProperty("candidate");
      expect(sendChatCompletionMock).not.toHaveBeenCalled();
      expect(readSessionRow(databasePath)).toEqual(initialSession);

      const closeResponse = await fastify.inject({ method: "POST", url: "/api/project/close" });
      expect(closeResponse.statusCode).toBe(200);
      const reopenResponse = await fastify.inject({
        method: "POST",
        url: "/api/project/open",
        payload: { folderPath }
      });
      expect(reopenResponse.statusCode).toBe(200);
      expect(readSessionRow(databasePath)).toEqual(initialSession);
      expect((await generationBrief(fastify)).generationContext.coherent).toBe(false);

      await putGenerationContext(fastify, "continuation_after_accepted_segment");
      const continuationSession = readSessionRow(databasePath);
      expect(continuationSession.payloadJson).not.toBe(initialSession.payloadJson);
      expect((await generationBrief(fastify)).generationContext).toEqual({
        savedValue: "continuation_after_accepted_segment",
        requiredValue: "continuation_after_accepted_segment",
        acceptedSegmentCount: 1,
        coherent: true
      });

      const continuationCompile = await compile(fastify);
      expect(continuationCompile.prompt).not.toContain(acceptedProseSentinel);
      expect(continuationCompile.metadata.fingerprint).toMatch(/^fnv1a32:/);
      const recoveredGenerate = await fastify.inject({
        method: "POST",
        url: "/api/generate",
        payload: { expectedPromptFingerprint: continuationCompile.metadata.fingerprint }
      });
      expect(recoveredGenerate.json()).toMatchObject({ ok: true, candidate: { text: "Fresh candidate prose." } });
      expect(sendChatCompletionMock).toHaveBeenCalledTimes(1);
      expect(JSON.stringify(sendChatCompletionMock.mock.calls)).not.toContain(acceptedProseSentinel);

      const secondId = await appendAcceptedSegment(fastify, `${acceptedProseSentinel}_SECOND`);
      expect(readSessionRow(databasePath)).toEqual(continuationSession);
      expect((await generationBrief(fastify)).generationContext).toMatchObject({
        savedValue: "continuation_after_accepted_segment",
        requiredValue: "continuation_after_accepted_segment",
        acceptedSegmentCount: 2,
        coherent: true
      });

      await deleteAcceptedSegment(fastify, firstId);
      expect(readSessionRow(databasePath)).toEqual(continuationSession);
      expect((await generationBrief(fastify)).generationContext).toMatchObject({
        acceptedSegmentCount: 1,
        coherent: true
      });

      await deleteAcceptedSegment(fastify, secondId);
      expect(readSessionRow(databasePath)).toEqual(continuationSession);
      const finalMismatchBrief = await generationBrief(fastify);
      expect(finalMismatchBrief.generationContext).toEqual({
        savedValue: "continuation_after_accepted_segment",
        requiredValue: "first_segment",
        acceptedSegmentCount: 0,
        coherent: false
      });
      const finalMismatchValidation = await validate(fastify);
      expect(finalMismatchValidation.blockers.map((blocker) => blocker.code)).toContain(
        "generation-context-accepted-segment-mismatch"
      );
      const providerCallsBeforeFinalBlock = sendChatCompletionMock.mock.calls.length;
      const finalBlockedCompile = await fastify.inject({ method: "POST", url: "/api/compile" });
      expect(finalBlockedCompile.json()).toMatchObject({ ok: false, kind: "validation-blocked" });
      expect(finalBlockedCompile.json()).not.toHaveProperty("prompt");
      const finalBlockedGenerate = await fastify.inject({
        method: "POST",
        url: "/api/generate",
        payload: { expectedPromptFingerprint: continuationCompile.metadata.fingerprint }
      });
      expect(finalBlockedGenerate.json()).toMatchObject({ ok: false, kind: "validation-blocked" });
      expect(sendChatCompletionMock).toHaveBeenCalledTimes(providerCallsBeforeFinalBlock);
      expect(readSessionRow(databasePath)).toEqual(continuationSession);

      await putGenerationContext(fastify, "first_segment");
      const repairedFirstSession = readSessionRow(databasePath);
      expect(repairedFirstSession.payloadJson).not.toBe(continuationSession.payloadJson);
      expect((await generationBrief(fastify)).generationContext).toEqual({
        savedValue: "first_segment",
        requiredValue: "first_segment",
        acceptedSegmentCount: 0,
        coherent: true
      });
      const repairedFirstCompile = await compile(fastify);
      expect(repairedFirstCompile.prompt).not.toContain(acceptedProseSentinel);

      for (const value of [
        firstMismatchBrief,
        firstMismatchValidation,
        firstMismatchReadiness,
        firstBlockedCompile.json(),
        firstBlockedGenerate.json(),
        finalMismatchBrief,
        finalMismatchValidation,
        finalBlockedCompile.json(),
        finalBlockedGenerate.json(),
        repairedFirstCompile
      ]) {
        expect(JSON.stringify(value)).not.toContain(acceptedProseSentinel);
      }
    } finally {
      const output = capture.restore();
      expect(output).not.toContain(acceptedProseSentinel);
    }
  });
});

interface ValidationBody {
  blockers: { code: string }[];
  warnings: { code: string }[];
  isBlocked: boolean;
}

interface GenerationBriefBody {
  generationContext: {
    savedValue: "first_segment" | "continuation_after_accepted_segment" | null;
    requiredValue: "first_segment" | "continuation_after_accepted_segment";
    acceptedSegmentCount: number;
    coherent: boolean;
  };
}

interface CompileBody {
  prompt: string;
  metadata: { fingerprint: string };
}

async function openProject(fastify: ReturnType<typeof createServer>): Promise<string> {
  const response = await fastify.inject({
    method: "POST",
    url: "/api/project/create",
    payload: {
      parentPath: await tempParent(),
      folderName: "draftability",
      title: "Draftability"
    }
  });
  const body = response.json() as { folderPath: string };

  expect(response.statusCode).toBe(201);
  return body.folderPath;
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

async function appendAcceptedSegment(
  fastify: ReturnType<typeof createServer>,
  text = acceptedProseSentinel
): Promise<number> {
  const response = await fastify.inject({
    method: "POST",
    url: "/api/accepted-segments",
    payload: {
      text,
      generationMetadata: {
        source: "openrouter",
        model: "test/mock-writer",
        provider: "openrouter",
        temperature: 0.2,
        maxOutputTokens: 800,
        versions: { template: "1.0.0", compiler: "1.2.0", contract: "1.3.0" }
      }
    }
  });

  expect(response.statusCode).toBe(201);
  return (response.json() as { segment: { id: number } }).segment.id;
}

async function deleteAcceptedSegment(fastify: ReturnType<typeof createServer>, id: number): Promise<void> {
  const response = await fastify.inject({ method: "DELETE", url: `/api/accepted-segments/${id}` });
  expect(response.statusCode).toBe(200);
}

async function putCompleteBrief(
  fastify: ReturnType<typeof createServer>,
  entityId: string,
  generationContext: "first_segment" | "continuation_after_accepted_segment"
): Promise<void> {
  const response = await fastify.inject({
    method: "PUT",
    url: "/api/generation-brief",
    payload: {
      active_working_set: {
        selected_records: [entityId],
        active_onstage_cast_full: [],
        present_minor_cast_compressed: [],
        offstage_relevant_cast: []
      },
      current_authoritative_state: {
        ...cleanCurrentState,
        onstage_entities: [entityId]
      },
      immediate_handoff: cleanImmediateHandoff,
      manual_moment_directive: {
        must_render: ["B asks for the key."],
        may_render_if_naturally_caused: [],
        do_not_force: []
      },
      generation_validation_focus: {
        validation_focus_tags: {
          generation_context: [generationContext],
          expected_local_modes: [],
          possible_durable_changes: []
        }
      },
      stop_guidance: cleanStopGuidance
    }
  });
  expect(response.statusCode).toBe(200);
}

async function putGenerationContext(
  fastify: ReturnType<typeof createServer>,
  generationContext: "first_segment" | "continuation_after_accepted_segment"
): Promise<void> {
  const response = await fastify.inject({
    method: "PUT",
    url: "/api/generation-brief",
    payload: {
      generation_validation_focus: {
        validation_focus_tags: { generation_context: [generationContext] }
      }
    }
  });
  expect(response.statusCode).toBe(200);
}

async function generationBrief(fastify: ReturnType<typeof createServer>): Promise<GenerationBriefBody> {
  const response = await fastify.inject({ method: "GET", url: "/api/generation-brief" });
  expect(response.statusCode).toBe(200);
  return response.json() as GenerationBriefBody;
}

async function readiness(fastify: ReturnType<typeof createServer>): Promise<Record<string, unknown> & {
  blockers: Array<{ code: string }>;
}> {
  const response = await fastify.inject({ method: "POST", url: "/api/readiness", payload: { promptKind: "prose" } });
  expect(response.statusCode).toBe(200);
  return response.json() as Record<string, unknown> & { blockers: Array<{ code: string }> };
}

async function compile(fastify: ReturnType<typeof createServer>): Promise<CompileBody> {
  const response = await fastify.inject({ method: "POST", url: "/api/compile" });
  const body = response.json() as CompileBody;
  expect(response.statusCode).toBe(200);
  expect(body).toHaveProperty("prompt");
  return body;
}

function readSessionRow(databasePath: string): { payloadJson: string; updatedAt: string } {
  const database = new DatabaseSync(databasePath);
  try {
    const row = database.prepare("SELECT payload_json, updated_at FROM generation_session WHERE id = 1").get() as {
      payload_json: string;
      updated_at: string;
    };
    return { payloadJson: row.payload_json, updatedAt: row.updated_at };
  } finally {
    database.close();
  }
}

function restoreEnv(name: string, value: string | undefined): void {
  if (value === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = value;
  }
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

const cleanCurrentState = {
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
};

const cleanImmediateHandoff = {
  recent_causal_context: "A arrived with the key.",
  last_visible_moment: "B noticed the key.",
  begin_after: "B noticing the key."
};

const cleanStopGuidance = {
  soft_unit_guidance: "Stop after B's first response point."
};
