import { afterEach, describe, expect, it, vi } from "vitest";

import {
  archiveRecord,
  createRecord,
  deleteRecord,
  getGenerationBrief,
  getRecord,
  getRecordReferences,
  getStoryConfig,
  getWorkingSet,
  listRecords,
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
