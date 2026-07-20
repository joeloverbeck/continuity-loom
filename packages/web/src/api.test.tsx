import { afterEach, describe, expect, it, vi } from "vitest";

import {
  acknowledgeDurableChangeReminder,
  acceptCandidate,
  archiveRecord,
  compile,
  createDemoProject,
  createProject,
  createRecord,
  deleteAcceptedSegment,
  deleteRecord,
  generate,
  getDurableChangeReminder,
  getGenerationBrief,
  getOpenRouterSettings,
  getRecord,
  getRecordReferences,
  getStoryConfig,
  getWorkingSet,
  ideate,
  listAcceptedSegments,
  listStoryConfig,
  listRecords,
  putOpenRouterSettings,
  refreshModels,
  setGenerationBrief,
  setStoryConfig,
  setWorkingSet,
  updateRecord,
  validate
} from "./api.js";
import type { AcceptedSegment, GenerationMetadata } from "./api.js";

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json"
    }
  });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("api client", () => {
  it("issues project create route requests", async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    const status = {
      folderPath: "/tmp/loom/letter-under-flour-bin-demo",
      title: "The Letter Under the Flour Bin",
      projectUuid: "019b0298-5c00-7000-8000-013000000099",
      databaseFilename: "loom.sqlite",
      isDemoFixture: true,
      appSchemaVersion: 1,
      storeUserVersion: 1,
      compatibility: "ok"
    };
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string, init?: RequestInit) => {
        calls.push({ url, ...(init !== undefined ? { init } : {}) });
        return Promise.resolve(jsonResponse(status));
      })
    );

    await expect(
      createProject({
        parentPath: "/tmp/loom",
        folderName: "alpha",
        title: "Alpha",
        description: "Draft"
      })
    ).resolves.toEqual(status);
    await expect(
      createDemoProject({
        parentPath: "/tmp/loom",
        folderName: "letter-under-flour-bin-demo"
      })
    ).resolves.toEqual(status);

    expect(calls.map((call) => [call.url, call.init?.method ?? "GET"])).toEqual([
      ["/api/project/create", "POST"],
      ["/api/project/create-demo", "POST"]
    ]);
    expect(calls[0]?.init?.body).toBe(
      JSON.stringify({
        parentPath: "/tmp/loom",
        folderName: "alpha",
        title: "Alpha",
        description: "Draft"
      })
    );
    expect(calls[1]?.init?.body).toBe(
      JSON.stringify({
        parentPath: "/tmp/loom",
        folderName: "letter-under-flour-bin-demo"
      })
    );
  });

  it("issues the correct record route requests", async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string, init?: RequestInit) => {
        calls.push({ url, ...(init !== undefined ? { init } : {}) });
        return Promise.resolve(jsonResponse({ ok: true, records: [], record: { id: "id" }, outgoing: [], incoming: [] }));
      })
    );

    await listRecords({ type: "FACT", status: "active", includeArchived: true, q: "door", refRole: "holder", targetId: "abc" });
    await getRecord("record/1");
    await createRecord({ type: "FACT", displayLabel: "Fact", payload: { id: "1" } });
    await updateRecord("record/1", { displayLabel: "Updated", payload: { id: "1" } });
    await archiveRecord("record/1");
    await deleteRecord("record/1");
    await getRecordReferences("record/1");

    expect(calls.map((call) => [call.url, call.init?.method ?? "GET"])).toEqual([
      ["/api/records?type=FACT&status=active&includeArchived=true&q=door&refRole=holder&targetId=abc", "GET"],
      ["/api/records/record%2F1", "GET"],
      ["/api/records", "POST"],
      ["/api/records/record%2F1", "PUT"],
      ["/api/records/record%2F1/archive", "POST"],
      ["/api/records/record%2F1", "DELETE"],
      ["/api/records/record%2F1/references", "GET"]
    ]);
    expect(calls[2]?.init?.body).toBe(JSON.stringify({ type: "FACT", displayLabel: "Fact", payload: { id: "1" } }));
    expect(calls[3]?.init?.body).toBe(JSON.stringify({ displayLabel: "Updated", payload: { id: "1" } }));
  });

  it("issues story-config and working-set route requests", async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string, init?: RequestInit) => {
        calls.push({ url, ...(init !== undefined ? { init } : {}) });
        return Promise.resolve(jsonResponse({ ok: true, payload: {}, selectedRecordIds: [] }));
      })
    );

    await listStoryConfig();
    await getStoryConfig("PROSE MODE");
    await setStoryConfig("STORY CONTRACT", { title: "Story" });
    await getWorkingSet();
    await setWorkingSet(["019b0298-5c00-7000-8000-000000000001"]);

    expect(calls.map((call) => [call.url, call.init?.method ?? "GET"])).toEqual([
      ["/api/story-config", "GET"],
      ["/api/story-config/PROSE%20MODE", "GET"],
      ["/api/story-config/STORY%20CONTRACT", "PUT"],
      ["/api/working-set", "GET"],
      ["/api/working-set", "PUT"]
    ]);
    expect(calls[2]?.init?.body).toBe(JSON.stringify({ payload: { title: "Story" } }));
    expect(calls[4]?.init?.body).toBe(
      JSON.stringify({ selectedRecordIds: ["019b0298-5c00-7000-8000-000000000001"] })
    );
  });

  it("issues generation-brief route requests", async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string, init?: RequestInit) => {
        calls.push({ url, ...(init !== undefined ? { init } : {}) });
        return Promise.resolve(jsonResponse({ ok: true, session: {} }));
      })
    );
    const partialSurface = {
      active_working_set: {
        selected_records: ["019b0298-5c00-7000-8000-000000000001"],
        selected_pov: "omniscient"
      }
    };

    await getGenerationBrief();
    await setGenerationBrief(partialSurface);

    expect(calls.map((call) => [call.url, call.init?.method ?? "GET"])).toEqual([
      ["/api/generation-brief", "GET"],
      ["/api/generation-brief", "PUT"]
    ]);
    expect(calls[1]?.init?.body).toBe(JSON.stringify(partialSurface));
  });

  it("issues validation route requests", async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string, init?: RequestInit) => {
        calls.push({ url, ...(init !== undefined ? { init } : {}) });
        return Promise.resolve(jsonResponse({ blockers: [], warnings: [], isBlocked: false }));
      })
    );

    await expect(validate()).resolves.toEqual({ blockers: [], warnings: [], isBlocked: false });

    expect(calls.map((call) => [call.url, call.init?.method ?? "GET"])).toEqual([
      ["/api/validate", "POST"]
    ]);
  });

  it("returns validation failure bodies without casting them to a validation result", async () => {
    const failureBody = {
      ok: false,
      kind: "no-open-project",
      message: "No project is open."
    };
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(jsonResponse(failureBody, 409)))
    );

    await expect(validate()).resolves.toEqual(failureBody);
  });

  it("returns a successful compile result from the bare success body", async () => {
    const resultBody = {
      prompt: "<role>\nWrite the next local prose segment.",
      metadata: {
        versions: {
          template: "prompt-template@1",
          compiler: "compiler@1",
          contract: "compiler-contract@1"
        },
        fingerprint: "7b9d",
        lengthEstimate: 42,
        tokenEstimate: 11
      }
    };
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string, init?: RequestInit) => {
        calls.push({ url, ...(init !== undefined ? { init } : {}) });
        return Promise.resolve(jsonResponse(resultBody));
      })
    );

    const result = await compile();

    expect(result).toEqual(resultBody);
    expect("prompt" in result).toBe(true);
    expect(calls.map((call) => [call.url, call.init?.method ?? "GET"])).toEqual([
      ["/api/compile", "POST"]
    ]);
    expect(calls[0]?.init?.body).toBeUndefined();
    expect(calls[0]?.init?.headers).toEqual({ Accept: "application/json" });
  });

  it("returns validation-blocked compile responses without a prompt branch", async () => {
    const blockedBody = {
      ok: false,
      kind: "validation-blocked",
      validation: {
        blockers: [{ code: "missing-current-state", message: "Current state is required.", severity: "blocker" }],
        warnings: [],
        isBlocked: true
      }
    };
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(jsonResponse(blockedBody, 409))));

    const result = await compile();

    expect(result).toEqual(blockedBody);
    expect("ok" in result).toBe(true);
    if ("ok" in result && result.ok === false) {
      expect(result.kind).toBe("validation-blocked");
      expect("prompt" in result).toBe(false);
      expect("validation" in result).toBe(true);
    }
  });

  it.each([
    ["no-open-project", "Open a project before compiling."],
    ["malformed-validation-source", "The validation source is malformed."]
  ])("returns structured compile failures for %s", async (kind, message) => {
    const failure = {
      ok: false,
      kind,
      message
    };
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(jsonResponse(failure, 400))));

    await expect(compile()).resolves.toEqual(failure);
  });

  it("issues OpenRouter settings client requests without exposing secret fields", async () => {
    const settingsBody = {
      model: "openai/gpt-4.1",
      temperature: 0.2,
      maxOutputTokens: 2048,
      topP: 0.8,
      cachedModels: [{ id: "openai/gpt-4.1", name: "GPT 4.1", contextLength: 128000 }],
      hasOpenRouterCredential: true
    };
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string, init?: RequestInit) => {
        calls.push({ url, ...(init !== undefined ? { init } : {}) });
        return Promise.resolve(jsonResponse(settingsBody));
      })
    );

    await expect(getOpenRouterSettings()).resolves.toEqual(settingsBody);
    await expect(
      putOpenRouterSettings({
        model: "openai/gpt-4.1",
        temperature: 0.2,
        maxOutputTokens: 2048,
        topP: 0.8
      })
    ).resolves.toEqual(settingsBody);

    expect(calls.map((call) => [call.url, call.init?.method ?? "GET"])).toEqual([
      ["/api/settings/openrouter", "GET"],
      ["/api/settings/openrouter", "PUT"]
    ]);
    expect(calls[0]?.init?.headers).toEqual({ Accept: "application/json" });
    expect(calls[0]?.init?.body).toBeUndefined();
    expect(calls[1]?.init?.headers).toEqual({
      Accept: "application/json",
      "Content-Type": "application/json"
    });
    expect(calls[1]?.init?.body).toBe(
      JSON.stringify({ model: "openai/gpt-4.1", temperature: 0.2, maxOutputTokens: 2048, topP: 0.8 })
    );
    expect(JSON.stringify(settingsBody)).not.toMatch(/OPENROUTER_API_KEY|openRouterApiKey|sk-|Bearer/);
  });

  it("refreshes OpenRouter models through a no-body POST", async () => {
    const responseBody = {
      ok: true,
      models: [{ id: "anthropic/claude-sonnet-4", name: "Claude Sonnet 4", contextLength: 200000 }]
    };
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string, init?: RequestInit) => {
        calls.push({ url, ...(init !== undefined ? { init } : {}) });
        return Promise.resolve(jsonResponse(responseBody));
      })
    );

    await expect(refreshModels()).resolves.toEqual(responseBody);

    expect(calls.map((call) => [call.url, call.init?.method ?? "GET"])).toEqual([
      ["/api/settings/openrouter/models", "POST"]
    ]);
    expect(calls[0]?.init?.headers).toEqual({ Accept: "application/json" });
    expect(calls[0]?.init?.body).toBeUndefined();
  });

  it("returns normalized model-refresh failures unchanged", async () => {
    const failure = {
      ok: false,
      category: "network",
      message: "Could not reach OpenRouter.",
      providerStatus: 502,
      providerReason: "Upstream connection closed.",
      retryAfter: 12
    };
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(jsonResponse(failure, 200))));

    await expect(refreshModels()).resolves.toEqual(failure);
  });

  it("returns a typed safe failure when an OpenRouter API response is not JSON", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(
          new Response("<html>provider gateway failure</html>", {
            status: 502,
            headers: { "Content-Type": "text/html" }
          })
        )
      )
    );

    await expect(generate({ expectedPromptFingerprint: "7b9d" })).resolves.toEqual({
      ok: false,
      category: "unknown",
      message: "OpenRouter request failed."
    });
  });

  it("returns successful generate responses", async () => {
    const metadata = {
      model: "openai/gpt-4.1",
      provider: "openrouter",
      temperature: 0.4,
      maxOutputTokens: 2200,
      topP: 0.9,
      versions: { template: "1.0.0", compiler: "1.0.0", contract: "1.0.0" }
    } satisfies GenerationMetadata;
    const success = {
      ok: true,
      candidate: { text: "Candidate prose." },
      metadata
    };
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string, init?: RequestInit) => {
        calls.push({ url, ...(init !== undefined ? { init } : {}) });
        return Promise.resolve(jsonResponse(success));
      })
    );

    await expect(generate({ expectedPromptFingerprint: "7b9d" })).resolves.toEqual(success);

    expect(calls.map((call) => [call.url, call.init?.method ?? "GET"])).toEqual([
      ["/api/generate", "POST"]
    ]);
    expect(calls[0]?.init?.headers).toEqual({ Accept: "application/json", "Content-Type": "application/json" });
    expect(calls[0]?.init?.body).toBe(JSON.stringify({ expectedPromptFingerprint: "7b9d" }));
  });

  it("sends the complete ideation request with its inspected fingerprint", async () => {
    const metadata = {
      model: "openai/gpt-4.1",
      provider: "openrouter",
      temperature: 0.4,
      maxOutputTokens: 2200,
      versions: { template: "1.0.0", compiler: "1.0.0", contract: "1.0.0" }
    } satisfies GenerationMetadata;
    const success = { ok: true, malformed: true, raw: "scratch", metadata } as const;
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string, init?: RequestInit) => {
        calls.push({ url, ...(init !== undefined ? { init } : {}) });
        return Promise.resolve(jsonResponse(success));
      })
    );

    await expect(ideate({
      mode: "questions",
      count: 4,
      dormantSlot: false,
      focus: "door pressure",
      avoidList: ["repeat"]
    }, "focused-fingerprint")).resolves.toEqual(success);

    expect(calls.map((call) => [call.url, call.init?.method ?? "GET"])).toEqual([
      ["/api/ideate", "POST"]
    ]);
    expect(calls[0]?.init?.body).toBe(JSON.stringify({
      mode: "questions",
      count: 4,
      dormantSlot: false,
      focus: "door pressure",
      avoidList: ["repeat"],
      expectedPromptFingerprint: "focused-fingerprint"
    }));
  });

  it("accepts a candidate with the generation metadata snapshot", async () => {
    const generationMetadata = {
      source: "openrouter",
      model: "openai/gpt-4.1",
      provider: "openrouter",
      temperature: 0.4,
      maxOutputTokens: 2200,
      versions: { template: "1.0.0", compiler: "1.0.0", contract: "1.0.0" }
    } satisfies AcceptedSegment["metadata"];
    const success = {
      ok: true,
      segment: { id: 7, sequence: 3, createdAt: "2026-06-06T07:56:00.000Z" }
    };
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string, init?: RequestInit) => {
        calls.push({ url, ...(init !== undefined ? { init } : {}) });
        return Promise.resolve(jsonResponse(success, 201));
      })
    );

    await expect(acceptCandidate({ text: "Edited accepted prose.", generationMetadata })).resolves.toEqual(success);

    expect(calls.map((call) => [call.url, call.init?.method ?? "GET"])).toEqual([
      ["/api/accepted-segments", "POST"]
    ]);
    expect(calls[0]?.init?.headers).toEqual({
      Accept: "application/json",
      "Content-Type": "application/json"
    });
    expect(calls[0]?.init?.body).toBe(JSON.stringify({ text: "Edited accepted prose.", generationMetadata }));
    expect(calls[0]?.init?.body).not.toMatch(/apiKey|api_key|OPENROUTER_API_KEY|sk-or-/);
  });

  it("returns accepted-segment failures unchanged", async () => {
    const generationMetadata = {
      source: "openrouter",
      model: "openai/gpt-4.1",
      provider: "openrouter",
      temperature: 0.4,
      maxOutputTokens: 2200,
      versions: { template: "1.0.0", compiler: "1.0.0", contract: "1.0.0" }
    } satisfies AcceptedSegment["metadata"];
    const failure = {
      ok: false,
      kind: "no-open-project",
      message: "No project is open."
    };
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(jsonResponse(failure, 409))));

    await expect(acceptCandidate({ text: "Accepted prose.", generationMetadata })).resolves.toEqual(failure);
  });

  it("lists accepted segments with text and metadata", async () => {
    const metadata = {
      source: "openrouter",
      model: "openai/gpt-4.1",
      provider: "openrouter",
      temperature: 0.4,
      maxOutputTokens: 2200,
      topP: 0.9,
      versions: { template: "1.0.0", compiler: "1.0.0", contract: "1.0.0" }
    } satisfies AcceptedSegment["metadata"];
    const success = {
      ok: true,
      segments: [
        {
          id: 7,
          sequence: 3,
          text: "Readable accepted prose.",
          metadata,
          createdAt: "2026-06-06T08:12:00.000Z"
        }
      ]
    };
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string, init?: RequestInit) => {
        calls.push({ url, ...(init !== undefined ? { init } : {}) });
        return Promise.resolve(jsonResponse(success));
      })
    );

    await expect(listAcceptedSegments()).resolves.toEqual(success);

    expect(calls.map((call) => [call.url, call.init?.method ?? "GET"])).toEqual([
      ["/api/accepted-segments", "GET"]
    ]);
    expect(calls[0]?.init?.headers).toEqual({ Accept: "application/json" });
    expect(calls[0]?.init?.body).toBeUndefined();
  });

  it("returns accepted-segment list failures unchanged", async () => {
    const failure = {
      ok: false,
      kind: "no-open-project",
      message: "No project is open."
    };
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(jsonResponse(failure, 409))));

    await expect(listAcceptedSegments()).resolves.toEqual(failure);
  });

  it("deletes accepted segments by id", async () => {
    const success = { ok: true, deleted: { id: 7 } };
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string, init?: RequestInit) => {
        calls.push({ url, ...(init !== undefined ? { init } : {}) });
        return Promise.resolve(jsonResponse(success));
      })
    );

    await expect(deleteAcceptedSegment(7)).resolves.toEqual(success);

    expect(calls.map((call) => [call.url, call.init?.method ?? "GET"])).toEqual([
      ["/api/accepted-segments/7", "DELETE"]
    ]);
    expect(calls[0]?.init?.headers).toEqual({ Accept: "application/json" });
    expect(calls[0]?.init?.body).toBeUndefined();
  });

  it("returns accepted-segment delete failures unchanged", async () => {
    const failure = {
      ok: false,
      kind: "not-found",
      message: "Accepted segment not found: 999.",
      id: 999
    };
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(jsonResponse(failure, 404))));

    await expect(deleteAcceptedSegment(999)).resolves.toEqual(failure);
  });

  it("reads active and inactive durable-change reminder states", async () => {
    const active = {
      ok: true,
      reminder: {
        active: true,
        latestSegment: { sequence: 3, createdAt: "2026-06-06T08:12:00.000Z" },
        acknowledgedThroughSequence: 2
      }
    };
    const inactive = {
      ok: true,
      reminder: {
        active: false,
        latestSegment: null,
        acknowledgedThroughSequence: 0
      }
    };
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string, init?: RequestInit) => {
        calls.push({ url, ...(init !== undefined ? { init } : {}) });
        return Promise.resolve(jsonResponse(calls.length === 1 ? active : inactive));
      })
    );

    await expect(getDurableChangeReminder()).resolves.toEqual(active);
    await expect(getDurableChangeReminder()).resolves.toEqual(inactive);

    expect(calls.map((call) => [call.url, call.init?.method ?? "GET"])).toEqual([
      ["/api/durable-change-reminder", "GET"],
      ["/api/durable-change-reminder", "GET"]
    ]);
    expect(calls[0]?.init?.headers).toEqual({ Accept: "application/json" });
    expect(calls[0]?.init?.body).toBeUndefined();
  });

  it("acknowledges durable-change reminders with an empty JSON body", async () => {
    const success = {
      ok: true,
      reminder: {
        active: false,
        latestSegment: { sequence: 3, createdAt: "2026-06-06T08:12:00.000Z" },
        acknowledgedThroughSequence: 3
      }
    };
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string, init?: RequestInit) => {
        calls.push({ url, ...(init !== undefined ? { init } : {}) });
        return Promise.resolve(jsonResponse(success));
      })
    );

    await expect(acknowledgeDurableChangeReminder()).resolves.toEqual(success);

    expect(calls.map((call) => [call.url, call.init?.method ?? "GET"])).toEqual([
      ["/api/durable-change-reminder/acknowledge", "POST"]
    ]);
    expect(calls[0]?.init?.headers).toEqual({
      Accept: "application/json",
      "Content-Type": "application/json"
    });
    expect(calls[0]?.init?.body).toBe(JSON.stringify({}));
  });

  it("returns durable-change reminder failures unchanged", async () => {
    const failure = {
      ok: false,
      kind: "no-open-project",
      message: "No project is open."
    };
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(jsonResponse(failure, 409))));

    await expect(getDurableChangeReminder()).resolves.toEqual(failure);
    await expect(acknowledgeDurableChangeReminder()).resolves.toEqual(failure);
  });

  it("returns validation-blocked generate responses", async () => {
    const blockedBody = {
      ok: false,
      kind: "validation-blocked",
      validation: {
        blockers: [{ code: "missing-current-state", message: "Current state is required.", severity: "blocker" }],
        warnings: [],
        isBlocked: true
      }
    };
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(jsonResponse(blockedBody, 200))));

    await expect(generate({ expectedPromptFingerprint: "7b9d" })).resolves.toEqual(blockedBody);
  });

  it("returns generate failures including missing-key unchanged", async () => {
    const failure = {
      ok: false,
      category: "missing-key",
      message: "OpenRouter API key is missing."
    };
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(jsonResponse(failure, 200))));

    await expect(generate({ expectedPromptFingerprint: "7b9d" })).resolves.toEqual(failure);
  });

  it("returns structured error envelopes from failed route responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(
          jsonResponse(
            {
              ok: false,
              kind: "malformed-payload",
              message: "Record payload is invalid.",
              issues: [{ path: ["status"] }]
            },
            400
          )
        )
      )
    );

    await expect(createRecord({ type: "FACT", payload: {} })).resolves.toEqual({
      ok: false,
      kind: "malformed-payload",
      message: "Record payload is invalid.",
      issues: [{ path: ["status"] }]
    });
  });

  it("returns structured generation-brief failures unchanged", async () => {
    const failure = {
      ok: false,
      kind: "malformed-draft",
      message: "The draft could not be saved because the request shape is invalid.",
      issues: [{ path: "active_working_set.selected_records.0" }]
    };
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(jsonResponse(failure, 400))));

    await expect(setGenerationBrief({ active_working_set: { selected_records: ["not-a-uuid"] } })).resolves.toEqual(
      failure
    );
  });
});
