// @vitest-environment jsdom

import type { StoryNote } from "@loom/core";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createServer } from "../packages/server/src/server.js";
import { NoteEditor } from "../packages/web/src/notes/NoteEditor.js";

type Method = "GET" | "POST" | "PUT" | "DELETE";

interface RequestEvidence {
  method: Method;
  url: string;
  payload: unknown;
  statusCode?: number;
  returnedNoteId?: string;
}

interface PlannedResponse {
  method: Method;
  url: string;
  gate?: Promise<void>;
  failure?: { statusCode: number; body: unknown };
}

interface DraftFields {
  title: string;
  body: string;
  tag: string;
  pinned: boolean;
}

function deferred(): { promise: Promise<void>; resolve: () => void } {
  let resolve = (): void => undefined;
  const promise = new Promise<void>((nextResolve) => {
    resolve = nextResolve;
  });
  return { promise, resolve };
}

class RouteFetchBridge {
  readonly requests: RequestEvidence[] = [];
  readonly #plans: PlannedResponse[] = [];
  readonly #pending = new Set<Promise<Response>>();

  constructor(private readonly fastify: ReturnType<typeof createServer>) {}

  deferNext(method: Method, url: string): () => void {
    const gate = deferred();
    this.#plans.push({ method, url, gate: gate.promise });
    return gate.resolve;
  }

  failNext(method: Method, url: string): void {
    this.#plans.push({
      method,
      url,
      failure: {
        statusCode: 409,
        body: { ok: false, kind: "test-failure", message: "Deterministic test failure." }
      }
    });
  }

  readonly fetch = (input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> => {
    const request = this.#dispatch(input, init);
    this.#pending.add(request);
    void request.finally(() => this.#pending.delete(request));
    return request;
  };

  async waitForIdle(): Promise<void> {
    while (this.#pending.size > 0) {
      await Promise.all([...this.#pending]);
    }
  }

  async #dispatch(input: RequestInfo | URL, init: RequestInit): Promise<Response> {
    const method = (init.method ?? "GET") as Method;
    const inputUrl = typeof input === "string"
      ? input
      : input instanceof URL
        ? `${input.pathname}${input.search}`
        : input.url;
    const url = inputUrl.startsWith("http")
      ? `${new URL(inputUrl).pathname}${new URL(inputUrl).search}`
      : inputUrl;
    const payload = typeof init.body === "string" ? JSON.parse(init.body) as unknown : undefined;
    const evidence: RequestEvidence = { method, url, payload };
    this.requests.push(evidence);

    const planIndex = this.#plans.findIndex((plan) => plan.method === method && plan.url === url);
    const plan = planIndex < 0 ? undefined : this.#plans.splice(planIndex, 1)[0];
    if (plan?.gate) {
      await plan.gate;
    }

    if (plan?.failure) {
      evidence.statusCode = plan.failure.statusCode;
      return new Response(JSON.stringify(plan.failure.body), {
        status: plan.failure.statusCode,
        headers: { "Content-Type": "application/json" }
      });
    }

    const response = payload === undefined
      ? await this.fastify.inject({
          method,
          url,
          headers: { "content-type": "application/json" }
        })
      : await this.fastify.inject({
          method,
          url,
          headers: { "content-type": "application/json" },
          payload: JSON.stringify(payload)
        });
    evidence.statusCode = response.statusCode;
    const responseBody: { note?: { id?: string } } = response.json();
    if (responseBody.note?.id) {
      evidence.returnedNoteId = responseBody.note.id;
    }

    return new Response(response.body, {
      status: response.statusCode,
      headers: { "Content-Type": "application/json" }
    });
  }
}

const apps: ReturnType<typeof createServer>[] = [];
const projectParents: string[] = [];
let originalFetch: typeof globalThis.fetch;
let fastify: ReturnType<typeof createServer>;
let bridge: RouteFetchBridge;

async function advanceAutosave(): Promise<void> {
  await act(async () => {
    await new Promise((resolve) => window.setTimeout(resolve, 950));
  });
}

async function settleRequests(): Promise<void> {
  await act(async () => {
    await bridge.waitForIdle();
    await Promise.resolve();
  });
}

async function listStoredNotes(): Promise<StoryNote[]> {
  const list = await fastify.inject({ method: "GET", url: "/api/notes" });
  expect(list.statusCode).toBe(200);
  const listBody: { notes: Array<{ id: string }> } = list.json();
  const summaries = listBody.notes;

  return Promise.all(summaries.map(async ({ id }) => {
    const detail = await fastify.inject({ method: "GET", url: `/api/notes/${id}` });
    expect(detail.statusCode).toBe(200);
    const detailBody: { note: StoryNote } = detail.json();
    return detailBody.note;
  }));
}

function renderEditor(note: StoryNote | null): void {
  render(createElement(NoteEditor, {
    note,
    onSaved: vi.fn(),
    onDeleted: vi.fn(),
    onCancel: vi.fn()
  }));
}

function enterDraft(fields: DraftFields): void {
  fireEvent.change(screen.getByLabelText("Title"), { target: { value: fields.title } });
  fireEvent.change(screen.getByLabelText("Body"), { target: { value: fields.body } });
  fireEvent.change(screen.getByLabelText("Tags"), { target: { value: fields.tag } });

  const pinned = screen.getByLabelText<HTMLInputElement>("Pinned");
  if (pinned.checked !== fields.pinned) {
    fireEvent.click(pinned);
  }
}

function expectDraft(fields: DraftFields): void {
  expect(screen.getByLabelText<HTMLInputElement>("Title").value).toBe(fields.title);
  expect(screen.getByLabelText<HTMLTextAreaElement>("Body").value).toBe(fields.body);
  expect(screen.getByLabelText<HTMLInputElement>("Tags").value).toBe(fields.tag);
  expect(screen.getByLabelText<HTMLInputElement>("Pinned").checked).toBe(fields.pinned);
}

beforeEach(async () => {
  fastify = createServer();
  apps.push(fastify);
  const parentPath = await mkdtemp(join(tmpdir(), "loom-note-editor-persistence-"));
  projectParents.push(parentPath);
  const created = await fastify.inject({
    method: "POST",
    url: "/api/project/create",
    payload: { parentPath, folderName: "notes", title: "Note identity regression" }
  });
  expect(created.statusCode).toBe(201);

  originalFetch = globalThis.fetch;
  bridge = new RouteFetchBridge(fastify);
  globalThis.fetch = vi.fn(bridge.fetch);
});

afterEach(async () => {
  cleanup();
  globalThis.fetch = originalFetch;
  await Promise.all(apps.splice(0).map(async (app) => app.close()));
  await Promise.all(projectParents.splice(0).map(async (parentPath) => rm(parentPath, { recursive: true, force: true })));
});

describe("NoteEditor persistence identity", () => {
  it("keeps one identity when edits, blur, and Retry Save happen while first create is in flight", async () => {
    const releaseCreate = bridge.deferNext("POST", "/api/notes");
    renderEditor(null);

    fireEvent.change(screen.getByLabelText("Title"), {
      target: { value: "NOTE_IDENTITY_TITLE_SAFE_31b9" }
    });
    await advanceAutosave();

    expect(bridge.requests).toEqual([
      expect.objectContaining({ method: "POST", url: "/api/notes" })
    ]);

    fireEvent.change(screen.getByLabelText("Body"), {
      target: { value: "NOTE_IDENTITY_BODY_SAFE_31b9" }
    });
    fireEvent.change(screen.getByLabelText("Tags"), {
      target: { value: "NOTE_IDENTITY_TAG_SAFE_31b9" }
    });
    fireEvent.click(screen.getByLabelText("Pinned"));
    fireEvent.blur(screen.getByLabelText("Body"));
    fireEvent.click(screen.getByRole("button", { name: "Retry Save" }));

    expect(bridge.requests).toHaveLength(1);
    expect(screen.getByLabelText<HTMLInputElement>("Title").value).toBe("NOTE_IDENTITY_TITLE_SAFE_31b9");
    expect(screen.getByLabelText<HTMLTextAreaElement>("Body").value).toBe("NOTE_IDENTITY_BODY_SAFE_31b9");
    expect(screen.getByLabelText<HTMLInputElement>("Tags").value).toBe("NOTE_IDENTITY_TAG_SAFE_31b9");
    expect(screen.getByLabelText<HTMLInputElement>("Pinned").checked).toBe(true);

    releaseCreate();
    await settleRequests();
    expect(screen.getByRole("status").textContent).toBe("Unsaved changes");
    await advanceAutosave();
    await settleRequests();

    const creates = bridge.requests.filter((request) => request.method === "POST" && request.url === "/api/notes");
    const createId = creates[0]?.returnedNoteId;
    const updates = bridge.requests.filter((request) => request.method === "PUT");
    const stored = await listStoredNotes();
    const invariantEvidence = {
      requestOrder: bridge.requests.map((request, index) => ({
        ordinal: index + 1,
        method: request.method,
        url: request.url,
        returnedNoteId: request.returnedNoteId ?? null
      })),
      returnedCreateIds: creates.map((request) => request.returnedNoteId ?? null),
      persistedRows: stored.map((note) => ({ id: note.id, title: note.title, body: note.body, tags: note.tags, pinned: note.pinned }))
    };

    if (creates.length !== 1 || !createId || updates.some((request) => request.url !== `/api/notes/${createId}`) || stored.length !== 1) {
      throw new Error(`One-note identity invariant failed:\n${JSON.stringify(invariantEvidence, null, 2)}`);
    }

    expect(creates).toHaveLength(1);
    expect(createId).toEqual(expect.any(String));
    expect(updates.length).toBeGreaterThanOrEqual(1);
    expect(updates.every((request) => request.url === `/api/notes/${createId}`)).toBe(true);
    expect(stored).toHaveLength(1);
    expect(stored[0]).toMatchObject({
      id: createId,
      title: "NOTE_IDENTITY_TITLE_SAFE_31b9",
      body: "NOTE_IDENTITY_BODY_SAFE_31b9",
      tags: ["NOTE_IDENTITY_TAG_SAFE_31b9"],
      pinned: true
    });
  });

  it("retries a failed create without losing the local draft or creating two rows", async () => {
    const draft = {
      title: "NOTE_CREATE_RETRY_TITLE_SAFE_a817",
      body: "NOTE_CREATE_RETRY_BODY_SAFE_a817",
      tag: "NOTE_CREATE_RETRY_TAG_SAFE_a817",
      pinned: true
    };
    bridge.failNext("POST", "/api/notes");
    renderEditor(null);

    enterDraft(draft);
    await advanceAutosave();
    await settleRequests();

    expect(screen.getByRole("status").textContent).toBe("Save failed - retry");
    expectDraft(draft);
    expect(await listStoredNotes()).toHaveLength(0);

    fireEvent.click(screen.getByRole("button", { name: "Retry Save" }));
    await settleRequests();

    const stored = await listStoredNotes();
    expect(stored).toHaveLength(1);
    expect(stored[0]).toMatchObject({
      title: draft.title,
      body: draft.body,
      tags: [draft.tag],
      pinned: draft.pinned
    });
    expect(bridge.requests.filter((request) => request.method === "POST")).toHaveLength(2);
    expect(bridge.requests.filter((request) => request.returnedNoteId)).toHaveLength(1);
  });

  it("retries a failed update without losing local title, body, tags, or pinned state", async () => {
    const draft = {
      title: "NOTE_UPDATE_RETRY_TITLE_SAFE_e4c2",
      body: "NOTE_UPDATE_RETRY_BODY_SAFE_e4c2",
      tag: "NOTE_UPDATE_RETRY_TAG_SAFE_e4c2",
      pinned: true
    };
    const seed = await fastify.inject({
      method: "POST",
      url: "/api/notes",
      payload: { title: "Seed", body: "Seed body", tags: ["seed"], pinned: false }
    });
    const seedBody: { note: StoryNote } = seed.json();
    const note = seedBody.note;
    bridge.failNext("PUT", `/api/notes/${note.id}`);
    renderEditor(note);

    enterDraft(draft);
    await advanceAutosave();
    await settleRequests();

    expect(screen.getByRole("status").textContent).toBe("Save failed - retry");
    expectDraft(draft);

    fireEvent.click(screen.getByRole("button", { name: "Retry Save" }));
    await settleRequests();

    const stored = await listStoredNotes();
    expect(stored).toHaveLength(1);
    expect(stored[0]).toMatchObject({
      id: note.id,
      title: draft.title,
      body: draft.body,
      tags: [draft.tag],
      pinned: draft.pinned
    });
    expect(bridge.requests.filter((request) => request.method === "PUT")).toHaveLength(2);
    expect(bridge.requests.every((request) => request.method !== "PUT" || request.url === `/api/notes/${note.id}`)).toBe(true);
  });
});
