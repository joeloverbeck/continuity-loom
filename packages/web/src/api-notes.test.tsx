import { afterEach, describe, expect, it, vi } from "vitest";

import {
  createNote,
  deleteNote,
  getNote,
  listNotes,
  updateNote
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

describe("notes api client", () => {
  it("issues notes route requests with the expected methods, urls, and bodies", async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string, init?: RequestInit) => {
        calls.push({ url, ...(init !== undefined ? { init } : {}) });
        return Promise.resolve(jsonResponse({ ok: true, notes: [], tags: [], note: { id: "note/1" } }));
      })
    );

    await listNotes({ q: "bridge toll", tag: "worldbuilding", pinned: "only", sort: "title-asc" });
    await getNote("note/1");
    await createNote({ title: "Bridge", body: "", tags: ["worldbuilding"], pinned: false });
    await updateNote("note/1", { title: "Bridge updated", body: "Body", tags: ["research"], pinned: true });
    await deleteNote("note/1");

    expect(calls.map((call) => [call.url, call.init?.method ?? "GET"])).toEqual([
      ["/api/notes?q=bridge+toll&tag=worldbuilding&pinned=only&sort=title-asc", "GET"],
      ["/api/notes/note%2F1", "GET"],
      ["/api/notes", "POST"],
      ["/api/notes/note%2F1", "PUT"],
      ["/api/notes/note%2F1", "DELETE"]
    ]);
    expect(calls[2]?.init?.body).toBe(
      JSON.stringify({ title: "Bridge", body: "", tags: ["worldbuilding"], pinned: false })
    );
    expect(calls[3]?.init?.body).toBe(
      JSON.stringify({ title: "Bridge updated", body: "Body", tags: ["research"], pinned: true })
    );
  });

  it("omits empty list query values", async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string, init?: RequestInit) => {
        calls.push({ url, ...(init !== undefined ? { init } : {}) });
        return Promise.resolve(jsonResponse({ ok: true, notes: [], tags: [] }));
      })
    );

    await listNotes({ q: "", pinned: "all" });

    expect(calls.map((call) => [call.url, call.init?.method ?? "GET"])).toEqual([
      ["/api/notes?pinned=all", "GET"]
    ]);
  });
});
