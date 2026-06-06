import { DIAGNOSTIC_CODES } from "@loom/core";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { createServer } from "./server.js";

type FastifyApp = ReturnType<typeof createServer>;

interface RecordDetail {
  id: string;
  type: string;
  displayLabel: string;
  payload: unknown;
}

interface ValidationBody {
  blockers: Array<{ code: string; severity: string }>;
  isBlocked: boolean;
}

interface Recipe {
  name: string;
  code: string;
  apply(app: FastifyApp): Promise<void>;
}

const apps: FastifyApp[] = [];

const RECIPES: readonly Recipe[] = [
  {
    name: "letter has two holders",
    code: DIAGNOSTIC_CODES.objectCurrentHolderContradiction,
    async apply(app) {
      const letter = await recordByLabel(app, "Sealed letter");
      const niko = await recordByLabel(app, "Niko Bram");
      await updateRecord(app, letter, {
        ...objectPayload(letter.payload),
        carried_by: niko.id
      });
    }
  },
  {
    name: "Niko reads the hidden letter without physical context",
    code: DIAGNOSTIC_CODES.impossibleActionPhysicalContext,
    async apply(app) {
      const session = await generationSession(app);
      await putGenerationSession(app, {
        ...session,
        current_authoritative_state: {
          ...objectPayload(session.current_authoritative_state),
          routes_and_exits: []
        },
        manual_moment_directive: {
          ...objectPayload(session.manual_moment_directive),
          must_render: ["Niko reads the hidden letter before Elin can stop him."]
        }
      });
    }
  },
  {
    name: "Mara enters without an interruption route",
    code: DIAGNOSTIC_CODES.offstageInterruptionMissingRoute,
    async apply(app) {
      const session = await generationSession(app);
      const focus = validationFocus(session);
      await putGenerationSession(app, {
        ...session,
        current_authoritative_state: {
          ...objectPayload(session.current_authoritative_state),
          routes_and_exits: []
        },
        generation_validation_focus: {
          validation_focus_tags: {
            ...focus,
            expected_local_modes: [
              ...focus.expected_local_modes,
              "offstage_interruption_possible"
            ]
          }
        },
        manual_moment_directive: {
          ...objectPayload(session.manual_moment_directive),
          must_render: ["Mara enters the cellar and interrupts the exchange."]
        }
      });
    }
  },
  {
    name: "handoff contains pasted accepted prose",
    code: DIAGNOSTIC_CODES.promptFacingProseContamination,
    async apply(app) {
      const session = await generationSession(app);
      await putGenerationSession(app, {
        ...session,
        immediate_handoff: {
          ...objectPayload(session.immediate_handoff),
          recent_causal_context: "This contains copied accepted prose from an old candidate."
        }
      });
    }
  },
  {
    name: "Niko is protected from and modeled as knowing the secret",
    code: DIAGNOSTIC_CODES.hiddenTruthInPovKnowledge,
    async apply(app) {
      const secret = await recordByLabel(app, "The letter names a ledger substitution");
      const niko = await recordByLabel(app, "Niko Bram");
      const session = await generationSession(app);

      await updateRecord(app, secret, {
        ...objectPayload(secret.payload),
        holders: [niko.id],
        non_holders_to_protect: [niko.id],
        pov_access: "hidden"
      });
      await putGenerationSession(app, {
        ...session,
        active_working_set: {
          ...objectPayload(session.active_working_set),
          selected_pov: niko.id
        }
      });
    }
  },
  {
    name: "stop guidance asks for the whole chapter",
    code: DIAGNOSTIC_CODES.localProseScopeViolation,
    async apply(app) {
      const session = await generationSession(app);
      await putGenerationSession(app, {
        ...session,
        stop_guidance: {
          soft_unit_guidance: "Write the whole chapter and reveal the full mystery before stopping."
        }
      });
    }
  },
  {
    name: "active speaker lacks current voice pressure",
    code: DIAGNOSTIC_CODES.sparseVoicePressure,
    async apply(app) {
      const session = await generationSession(app);
      const activeSpeakerIds = activeSpeakerCastIds(session);
      await putGenerationSession(app, {
        ...session,
        current_cast_voice_pressure: (arrayPayload(session.current_cast_voice_pressure) as Array<Record<string, unknown>>)
          .filter((row) => !activeSpeakerIds.includes(String(row.cast_member_id)))
      });
    }
  },
  {
    name: "physical interaction lacks current locks",
    code: DIAGNOSTIC_CODES.matrixPhysicalInteractionIncomplete,
    async apply(app) {
      const session = await generationSession(app);
      await putGenerationSession(app, {
        ...session,
        current_authoritative_state: {
          ...objectPayload(session.current_authoritative_state),
          current_locks: []
        }
      });
    }
  }
];

async function tempParent(): Promise<string> {
  return mkdtemp(join(tmpdir(), "loom-demo-blockers-"));
}

function app(): FastifyApp {
  const fastify = createServer();
  apps.push(fastify);
  return fastify;
}

afterEach(async () => {
  await Promise.all(apps.splice(0).map((fastify) => fastify.close()));
});

describe("demo blocker recipes", () => {
  it.each(RECIPES)("$name fires $code and blocks compile", async (recipe) => {
    const fastify = app();
    await createDemo(fastify);
    await expectNoBaselineBlockers(fastify);

    await recipe.apply(fastify);

    const validation = await validate(fastify);
    expect(validation.isBlocked).toBe(true);
    expect(validation.blockers).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: recipe.code, severity: "blocker" })])
    );

    const compile = await fastify.inject({ method: "POST", url: "/api/compile" });
    const body = compile.json() as { kind?: string; prompt?: string; validation?: ValidationBody };
    expect(body.kind).toBe("validation-blocked");
    expect(body.validation?.isBlocked).toBe(true);
    expect(body).not.toHaveProperty("prompt");
  });
});

async function createDemo(fastify: FastifyApp): Promise<void> {
  const response = await fastify.inject({
    method: "POST",
    url: "/api/project/create-demo",
    payload: {
      parentPath: await tempParent(),
      folderName: "demo"
    }
  });

  expect(response.statusCode).toBe(201);
}

async function expectNoBaselineBlockers(fastify: FastifyApp): Promise<void> {
  const validation = await validate(fastify);
  expect(validation.blockers).toEqual([]);
  expect(validation.isBlocked).toBe(false);
}

async function validate(fastify: FastifyApp): Promise<ValidationBody> {
  const response = await fastify.inject({ method: "POST", url: "/api/validate" });
  expect(response.statusCode).toBe(200);
  return response.json() as ValidationBody;
}

async function recordByLabel(fastify: FastifyApp, displayLabel: string): Promise<RecordDetail> {
  const listResponse = await fastify.inject({ method: "GET", url: "/api/records" });
  const summaries = (listResponse.json() as { records: Array<{ id: string; displayLabel: string }> }).records;
  const summary = summaries.find((record) => record.displayLabel === displayLabel);
  expect(summary).toBeTruthy();

  const detailResponse = await fastify.inject({ method: "GET", url: `/api/records/${summary?.id ?? ""}` });
  const body = detailResponse.json() as { ok: true; record: RecordDetail };
  expect(body.ok).toBe(true);
  return body.record;
}

async function updateRecord(fastify: FastifyApp, record: RecordDetail, payload: unknown): Promise<void> {
  const response = await fastify.inject({
    method: "PUT",
    url: `/api/records/${record.id}`,
    payload: {
      displayLabel: record.displayLabel,
      payload
    }
  });
  expect(response.statusCode).toBe(200);
}

async function generationSession(fastify: FastifyApp): Promise<Record<string, unknown>> {
  const response = await fastify.inject({ method: "GET", url: "/api/generation-brief" });
  const body = response.json() as { ok: true; session: Record<string, unknown> };
  expect(body.ok).toBe(true);
  return body.session;
}

async function putGenerationSession(fastify: FastifyApp, session: Record<string, unknown>): Promise<void> {
  const response = await fastify.inject({
    method: "PUT",
    url: "/api/generation-brief",
    payload: session
  });
  expect(response.statusCode).toBe(200);
}

function objectPayload(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? { ...(value as Record<string, unknown>) } : {};
}

function arrayPayload(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function validationFocus(session: Record<string, unknown>): {
  generation_context: string[];
  expected_local_modes: string[];
  possible_durable_changes: string[];
} {
  const focus = objectPayload(session.generation_validation_focus);
  const tags = objectPayload(focus.validation_focus_tags);
  return {
    generation_context: arrayPayload(tags.generation_context).map(String),
    expected_local_modes: arrayPayload(tags.expected_local_modes).map(String),
    possible_durable_changes: arrayPayload(tags.possible_durable_changes).map(String)
  };
}

function activeSpeakerCastIds(session: Record<string, unknown>): string[] {
  const workingSet = objectPayload(session.active_working_set);
  return (arrayPayload(workingSet.active_onstage_cast_full) as Array<Record<string, unknown>>)
    .filter((entry) => entry.local_function === "active_speaker")
    .map((entry) => String(entry.cast_member_id));
}

