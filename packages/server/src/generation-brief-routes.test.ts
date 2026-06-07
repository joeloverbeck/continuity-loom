import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { afterEach, describe, expect, it } from "vitest";

import { createServer } from "./server.js";

const apps: ReturnType<typeof createServer>[] = [];
const idA = "019b0298-5c00-7000-8000-000000000001";
const idB = "019b0298-5c00-7000-8000-000000000002";
const idC = "019b0298-5c00-7000-8000-000000000003";
const secretBriefText = "GENERATION_BRIEF_SENTINEL_DO_NOT_LOG";

async function tempParent(): Promise<string> {
  return mkdtemp(join(tmpdir(), "loom-generation-brief-routes-"));
}

function app(options: Parameters<typeof createServer>[0] = {}): ReturnType<typeof createServer> {
  const fastify = createServer(options);
  apps.push(fastify);
  return fastify;
}

async function openProject(fastify: ReturnType<typeof createServer>): Promise<string> {
  const response = await fastify.inject({
    method: "POST",
    url: "/api/project/create",
    payload: {
      parentPath: await tempParent(),
      folderName: "generation-brief",
      title: "Generation Brief"
    }
  });
  const created = response.json() as { folderPath: string };

  expect(response.statusCode).toBe(201);
  return created.folderPath;
}

function readSession(databasePath: string): Record<string, unknown> {
  const database = new DatabaseSync(databasePath);
  try {
    const row = database.prepare("SELECT payload_json FROM generation_session WHERE id = 1").get() as {
      payload_json: string;
    };
    return JSON.parse(row.payload_json) as Record<string, unknown>;
  } finally {
    database.close();
  }
}

function writeSession(databasePath: string, payload: unknown): void {
  const database = new DatabaseSync(databasePath);
  try {
    database
      .prepare(
        `INSERT INTO generation_session (id, payload_json, updated_at)
         VALUES (1, ?, ?)
         ON CONFLICT(id) DO UPDATE SET payload_json = excluded.payload_json, updated_at = excluded.updated_at`
      )
      .run(JSON.stringify(payload), new Date().toISOString());
  } finally {
    database.close();
  }
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

describe("generation-brief routes", () => {
  it("round-trips the full generation session", async () => {
    const fastify = app();
    await openProject(fastify);

    expect((await fastify.inject({ method: "GET", url: "/api/generation-brief" })).json()).toEqual({
      ok: true,
      session: {}
    });

    const session = {
      active_working_set: {
        selected_records: [idA, idB],
        active_onstage_cast_full: [{ cast_member_id: idA, local_function: "active_speaker" }],
        present_minor_cast_compressed: [idB],
        offstage_relevant_cast: [idC],
        selected_pov: idA,
        manual_directive_id: idC
      },
      immediate_handoff: {
        recent_causal_context: "A arrived.",
        last_visible_moment: "At the threshold.",
        prior_accepted_prose_status_or_handoff_note: "none",
        begin_after: "The door opens."
      },
      manual_moment_directive: {
        must_render: ["The door opens."]
      },
      current_cast_voice_pressure: [
        {
          cast_member_id: idA,
          local_function: "active_speaker",
          current_voice_pressure: "Keep the voice clipped.",
          dialogue_pressure: "answer briefly",
          pov_narration_pressure: "none",
          nonverbal_or_silence_pressure: "still hands",
          current_must_preserve: ["precision"],
          current_must_avoid: ["rambling"]
        }
      ],
      cast_voice_overrides: [
        {
          cast_member_id: idA,
          scope: "current_generation_only",
          reason: "none",
          applies_to: ["dialogue"],
          override_text: "Use fewer metaphors."
        }
      ],
      generation_validation_focus: {
        validation_focus_tags: {
          generation_context: ["first_segment"],
          expected_local_modes: [],
          possible_durable_changes: []
        }
      },
      stop_guidance: {
        soft_unit_guidance: "Stop after the opened door lands."
      }
    };

    const putResponse = await fastify.inject({
      method: "PUT",
      url: "/api/generation-brief",
      payload: session
    });

    expect(putResponse.statusCode).toBe(200);
    expect((await fastify.inject({ method: "GET", url: "/api/generation-brief" })).json()).toEqual({
      ok: true,
      session
    });
  });

  it("merges partial surface writes without fabricating other surfaces", async () => {
    const fastify = app();
    const folderPath = await openProject(fastify);
    const databasePath = join(folderPath, "loom.sqlite");

    writeSession(databasePath, {
      immediate_handoff: {
        recent_causal_context: "A arrived.",
        last_visible_moment: "Doorway",
        prior_accepted_prose_status_or_handoff_note: "none",
        begin_after: "A waits"
      }
    });

    const response = await fastify.inject({
      method: "PUT",
      url: "/api/generation-brief",
      payload: {
        stop_guidance: { soft_unit_guidance: "Stop before any aftermath." }
      }
    });

    expect(response.statusCode).toBe(200);
    expect(readSession(databasePath)).toMatchObject({
      immediate_handoff: { begin_after: "A waits" },
      stop_guidance: { soft_unit_guidance: "Stop before any aftermath." }
    });
    expect(readSession(databasePath)).not.toHaveProperty("current_authoritative_state");
  });

  it("persists the full active working set surface while preserving membership routes", async () => {
    const fastify = app();
    const folderPath = await openProject(fastify);
    const databasePath = join(folderPath, "loom.sqlite");

    const response = await fastify.inject({
      method: "PUT",
      url: "/api/generation-brief",
      payload: {
        active_working_set: {
          selected_records: [idA, idB],
          active_onstage_cast_full: [{ cast_member_id: idA, local_function: "physically_active" }],
          present_minor_cast_compressed: [idB],
          offstage_relevant_cast: [idC],
          selected_pov: "omniscient",
          manual_directive_id: idC
        }
      }
    });

    expect(response.statusCode).toBe(200);
    expect(readSession(databasePath)).toMatchObject({
      active_working_set: {
        selected_records: [idA, idB],
        active_onstage_cast_full: [{ cast_member_id: idA, local_function: "physically_active" }],
        present_minor_cast_compressed: [idB],
        offstage_relevant_cast: [idC],
        selected_pov: "omniscient",
        manual_directive_id: idC
      }
    });
    expect((await fastify.inject({ method: "GET", url: "/api/working-set" })).json()).toEqual({
      ok: true,
      selectedRecordIds: [idA, idB]
    });
  });

  it("returns structured errors for malformed surfaces and without an open project", async () => {
    const fastify = app();
    await openProject(fastify);

    const invalid = await fastify.inject({
      method: "PUT",
      url: "/api/generation-brief",
      payload: {
        active_working_set: {
          selected_records: ["not-a-uuid"]
        }
      }
    });
    expect(invalid.statusCode).toBe(400);
    expect(invalid.json()).toMatchObject({
      ok: false,
      kind: "invalid-request",
      issues: expect.arrayContaining([expect.objectContaining({ path: ["active_working_set", "selected_records", 0] })])
    });

    const unopened = app();
    for (const request of [
      { method: "GET", url: "/api/generation-brief" },
      { method: "PUT", url: "/api/generation-brief", payload: { stop_guidance: { soft_unit_guidance: "Stop." } } }
    ] as const) {
      const response = await unopened.inject(request);
      expect(response.statusCode).toBe(409);
      expect(response.json()).toEqual({ ok: false, kind: "no-open-project", message: "No project is open." });
    }
  });

  it("does not log brief prose, directive text, or voice pressure text", async () => {
    const capture = captureProcessWrites();
    let logs = "";

    try {
      const fastify = app({ logger: true });
      await openProject(fastify);

      const response = await fastify.inject({
        method: "PUT",
        url: "/api/generation-brief",
        payload: {
          immediate_handoff: {
            recent_causal_context: secretBriefText,
            last_visible_moment: "Doorway",
            prior_accepted_prose_status_or_handoff_note: "none",
            begin_after: "A waits"
          },
          manual_moment_directive: {
            must_render: [secretBriefText]
          },
          current_cast_voice_pressure: [
            {
              cast_member_id: idA,
              local_function: "active_speaker",
              current_voice_pressure: secretBriefText,
              dialogue_pressure: "none",
              pov_narration_pressure: "none",
              nonverbal_or_silence_pressure: "none",
              current_must_preserve: [],
              current_must_avoid: []
            }
          ],
          stop_guidance: {
            soft_unit_guidance: secretBriefText
          }
        }
      });

      expect(response.statusCode).toBe(200);
    } finally {
      logs = capture.restore();
    }

    expect(logs).not.toContain(secretBriefText);
  });
});
