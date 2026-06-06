import { afterEach, describe, expect, it, vi } from "vitest";

import {
  archiveRecord,
  compile,
  createRecord,
  deleteRecord,
  generate,
  getGenerationBrief,
  getOpenRouterSettings,
  getRecord,
  getRecordReferences,
  getStoryConfig,
  getWorkingSet,
  listRecords,
  putOpenRouterSettings,
  refreshModels,
  setGenerationBrief,
  setStoryConfig,
  setWorkingSet,
  updateRecord,
  validate
} from "./api.js";

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

    await getStoryConfig("PROSE MODE");
    await setStoryConfig("STORY CONTRACT", { title: "Story" });
    await getWorkingSet();
    await setWorkingSet(["019b0298-5c00-7000-8000-000000000001"]);

    expect(calls.map((call) => [call.url, call.init?.method ?? "GET"])).toEqual([
      ["/api/story-config/PROSE%20MODE", "GET"],
      ["/api/story-config/STORY%20CONTRACT", "PUT"],
      ["/api/working-set", "GET"],
      ["/api/working-set", "PUT"]
    ]);
    expect(calls[1]?.init?.body).toBe(JSON.stringify({ payload: { title: "Story" } }));
    expect(calls[3]?.init?.body).toBe(
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
      message: "Could not reach OpenRouter."
    };
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(jsonResponse(failure, 200))));

    await expect(refreshModels()).resolves.toEqual(failure);
  });

  it("returns successful generate responses", async () => {
    const success = {
      ok: true,
      candidate: { text: "Candidate prose." },
      metadata: {
        model: "openai/gpt-4.1",
        versions: { template: "1.0.0", compiler: "1.0.0", contract: "1.0.0" }
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

    await expect(generate()).resolves.toEqual(success);

    expect(calls.map((call) => [call.url, call.init?.method ?? "GET"])).toEqual([
      ["/api/generate", "POST"]
    ]);
    expect(calls[0]?.init?.headers).toEqual({ Accept: "application/json" });
    expect(calls[0]?.init?.body).toBeUndefined();
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

    await expect(generate()).resolves.toEqual(blockedBody);
  });

  it("returns generate failures including missing-key unchanged", async () => {
    const failure = {
      ok: false,
      category: "missing-key",
      message: "OpenRouter API key is missing."
    };
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(jsonResponse(failure, 200))));

    await expect(generate()).resolves.toEqual(failure);
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
      kind: "invalid-request",
      message: "Generation brief request is invalid.",
      issues: [{ path: ["active_working_set", "selected_records", 0] }]
    };
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(jsonResponse(failure, 400))));

    await expect(setGenerationBrief({ active_working_set: { selected_records: ["not-a-uuid"] } })).resolves.toEqual(
      failure
    );
  });
});
