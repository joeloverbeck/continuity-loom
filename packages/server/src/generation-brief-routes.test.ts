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

function writeAcceptedSegment(databasePath: string): void {
  const database = new DatabaseSync(databasePath);
  try {
    database
      .prepare(
        `INSERT INTO accepted_segments (sequence, text, metadata_json, created_at)
         VALUES (1, 'Accepted prose.', '{"source":"user_supplied","versions":{"template":"test","compiler":"test","contract":"test"}}', ?)`
      )
      .run(new Date().toISOString());
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
      session: {},
      generationContext: {
        savedValue: null,
        requiredValue: "first_segment",
        acceptedSegmentCount: 0,
        coherent: true
      }
    });

    const session = {
      active_working_set: {
        selected_records: [idA, idB],
        active_onstage_cast_full: [{ cast_member_id: idA, local_function: "active_speaker" }],
        present_minor_cast_compressed: [idB],
        offstage_relevant_cast: [idC],
        selected_pov: idA,
      },
      immediate_handoff: {
        recent_causal_context: "A arrived.",
        last_visible_moment: "At the threshold.",
        begin_after: "The door opens."
      },
      manual_moment_directive: {
        must_render: ["The door opens."]
      },
      current_cast_voice_pressure: [
        {
          cast_member_id: idA,
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
          reason: "Author-only note for this temporary override.",
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
      session: {
        active_working_set: session.active_working_set,
        immediate_handoff: session.immediate_handoff,
        manual_moment_directive: {
          must_render: ["The door opens."]
        },
        current_cast_voice_pressure: [
          {
            cast_member_id: idA,
            current_voice_pressure: "Keep the voice clipped.",
            dialogue_pressure: "answer briefly",
            pov_narration_pressure: "none",
            nonverbal_or_silence_pressure: "still hands",
            current_must_preserve: ["precision"],
            current_must_avoid: ["rambling"]
          }
        ],
        cast_voice_overrides: session.cast_voice_overrides,
        generation_validation_focus: {
          validation_focus_tags: {
            generation_context: ["first_segment"]
          }
        },
        stop_guidance: session.stop_guidance
      },
      generationContext: {
        savedValue: "first_segment",
        requiredValue: "first_segment",
        acceptedSegmentCount: 0,
        coherent: true
      }
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
      generation_validation_focus: {
        validation_focus_tags: {
          generation_context: ["first_segment"]
        }
      },
      stop_guidance: { soft_unit_guidance: "Stop before any aftermath." }
    });
    expect(readSession(databasePath)).not.toHaveProperty("current_authoritative_state");

    const nestedUpdate = await fastify.inject({
      method: "PUT",
      url: "/api/generation-brief",
      payload: {
        immediate_handoff: {
          begin_after: "A opens the door."
        }
      }
    });

    expect(nestedUpdate.statusCode).toBe(200);
    expect(readSession(databasePath)).toMatchObject({
      immediate_handoff: {
        recent_causal_context: "A arrived.",
        last_visible_moment: "Doorway",
        begin_after: "A opens the door."
      },
      stop_guidance: { soft_unit_guidance: "Stop before any aftermath." }
    });
  });

  it("saves a partial blank draft as a normalized draft without readiness validation", async () => {
    const fastify = app();
    await openProject(fastify);

    const response = await fastify.inject({
      method: "PUT",
      url: "/api/generation-brief",
      payload: {
        immediate_handoff: {
          recent_causal_context: "",
          last_visible_moment: "",
          begin_after: ""
        },
        manual_moment_directive: {
          must_render: [],
          may_render_if_naturally_caused: [],
          do_not_force: []
        },
        stop_guidance: {
          soft_unit_guidance: ""
        }
      }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      ok: true,
      session: {
        generation_validation_focus: {
          validation_focus_tags: {
            generation_context: ["first_segment"]
          }
        }
      }
    });
  });

  it("returns archive-derived generation context when the draft has no saved value", async () => {
    const fastify = app();
    const folderPath = await openProject(fastify);
    const databasePath = join(folderPath, "loom.sqlite");

    writeAcceptedSegment(databasePath);

    expect((await fastify.inject({ method: "GET", url: "/api/generation-brief" })).json()).toEqual({
      ok: true,
      session: {},
      generationContext: {
        savedValue: null,
        requiredValue: "continuation_after_accepted_segment",
        acceptedSegmentCount: 1,
        coherent: true
      }
    });
  });

  it("returns one canonical generation-context coherence shape for a saved mismatch", async () => {
    const fastify = app();
    const folderPath = await openProject(fastify);
    const databasePath = join(folderPath, "loom.sqlite");

    writeSession(databasePath, {
      generation_validation_focus: {
        validation_focus_tags: {
          generation_context: ["first_segment"]
        }
      }
    });
    writeAcceptedSegment(databasePath);

    const body = (await fastify.inject({ method: "GET", url: "/api/generation-brief" })).json();

    expect(body).toEqual({
      ok: true,
      session: {
        generation_validation_focus: {
          validation_focus_tags: {
            generation_context: ["first_segment"]
          }
        }
      },
      generationContext: {
        savedValue: "first_segment",
        requiredValue: "continuation_after_accepted_segment",
        acceptedSegmentCount: 1,
        coherent: false
      }
    });
    expect(body).not.toHaveProperty("defaults");
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
      kind: "malformed-draft",
      message: "The draft could not be saved because the request shape is invalid.",
      issues: expect.arrayContaining([
        expect.objectContaining({ path: "active_working_set.selected_records.0" })
      ])
    });
    expect(JSON.stringify(invalid.json())).not.toContain("not-a-uuid");

    const explicitNull = await fastify.inject({
      method: "PUT",
      url: "/api/generation-brief",
      payload: {
        stop_guidance: null
      }
    });
    expect(explicitNull.statusCode).toBe(400);
    expect(explicitNull.json()).toMatchObject({
      ok: false,
      kind: "malformed-draft",
      issues: expect.arrayContaining([expect.objectContaining({ path: "stop_guidance" })])
    });

    const unknownKey = await fastify.inject({
      method: "PUT",
      url: "/api/generation-brief",
      payload: {
        stop_guidance: {
          soft_unit_guidance: "Stop.",
          unknown: true
        }
      }
    });
    expect(unknownKey.statusCode).toBe(400);
    expect(unknownKey.json()).toMatchObject({
      ok: false,
      kind: "malformed-draft",
      issues: expect.arrayContaining([expect.objectContaining({ path: "stop_guidance" })])
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
            begin_after: "A waits"
          },
          manual_moment_directive: {
            must_render: [secretBriefText]
          },
          current_cast_voice_pressure: [
            {
              cast_member_id: idA,
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
