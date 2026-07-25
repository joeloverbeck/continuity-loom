// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import type { CastPossibilitiesCard, CastPossibilitiesOutput } from "@loom/core";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  CastPossibilitiesView,
  type CastPossibilitiesClient
} from "./CastPossibilitiesView.js";
import {
  clearCastPossibilitiesScratch,
  saveCastPossibilitiesScratch
} from "./session-scratch.js";

const writeTextMock = vi.fn<(value: string) => Promise<void>>();

beforeEach(() => {
  writeTextMock.mockReset();
  writeTextMock.mockResolvedValue();
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText: writeTextMock }
  });
});

afterEach(() => {
  cleanup();
  sessionStorage.clear();
});

describe("Cast Possibilities browser workflow", () => {
  it("previews the saved source, sends only after confirmation, and renders ordered accessible cards", async () => {
    const client = fixtureClient("fnv1a32:source-a");
    renderView(client);

    expect(await screen.findByRole("heading", { name: "Cast Possibilities" })).not.toBeNull();
    expect(screen.getByText(/most recently saved Generation Brief/i)).not.toBeNull();
    expect(screen.getByText(/unsaved edits/i)).not.toBeNull();
    expect(screen.getByTestId("prompt-body").textContent).toContain("# Cast Possibilities Prompt");
    expect(client.analyze).not.toHaveBeenCalled();

    const analyze = screen.getByRole("button", { name: "Analyze with OpenRouter" });
    expect((analyze as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole("checkbox", { name: /confirm this one-time send/i }));
    fireEvent.click(analyze);

    await waitFor(() => expect(client.analyze).toHaveBeenCalledTimes(1));
    expect(client.analyze).toHaveBeenCalledWith({
      expectedPromptFingerprint: "fnv1a32:source-a",
      expectedRequestFingerprint: "request:fnv1a32:source-a"
    });
    const character = await screen.findByRole("group", { name: "Elian possibilities" });
    expect(within(character).getAllByRole("article")).toHaveLength(3);
    expect(within(character).getByText("Observable move 1")).not.toBeNull();
    await waitFor(() => expect(document.activeElement).toBe(
      screen.getByRole("heading", { name: "Session scratch" })
    ));
    expect(screen.getByText(/non-canonical/i)).not.toBeNull();
  });

  it("shows the shared advisory without changing explicit Analyze availability or sending", async () => {
    const client = fixtureClient("fnv1a32:source-a");
    const compiled = fixtureCompileResult("fnv1a32:source-a");
    vi.mocked(client.compile).mockResolvedValue({
      ...compiled,
      providerRequest: {
        ...compiled.providerRequest,
        contextLength: 4096
      }
    });
    renderView(client);

    const advisory = await screen.findByRole("status", { name: "Context-window advisory" });
    expect(advisory.textContent).toContain("estimated at 7 tokens");
    expect(advisory.textContent).not.toContain("narrow the selected scope");
    expect(advisory.textContent).not.toContain("# Cast Possibilities Prompt");

    const analyze = screen.getByRole<HTMLButtonElement>("button", { name: "Analyze with OpenRouter" });
    expect(analyze.disabled).toBe(true);
    fireEvent.click(screen.getByRole("checkbox", { name: /confirm this one-time send/i }));
    expect(analyze.disabled).toBe(false);
    expect(client.analyze).not.toHaveBeenCalled();
  });

  it("keeps only session scratch and preserves stale cards as readable and copyable without regeneration", async () => {
    const firstClient = fixtureClient("fnv1a32:source-a");
    const first = renderView(firstClient);
    fireEvent.click(await screen.findByRole("checkbox", { name: /confirm this one-time send/i }));
    fireEvent.click(screen.getByRole("button", { name: "Analyze with OpenRouter" }));
    fireEvent.click(await screen.findByRole("button", { name: "Keep card 1 for Elian" }));
    first.unmount();

    const secondClient = fixtureClient("fnv1a32:source-b");
    renderView(secondClient);

    expect(await screen.findByText(/saved source changed/i)).not.toBeNull();
    expect(screen.getByText("Observable move 1")).not.toBeNull();
    const copy = screen.getByRole("button", { name: "Copy card 1 for Elian" });
    const regenerate = screen.getByRole("button", { name: /Regenerate Elian/ });
    expect(copy).toBeInstanceOf(HTMLButtonElement);
    expect(regenerate).toBeInstanceOf(HTMLButtonElement);
    if (!(copy instanceof HTMLButtonElement) || !(regenerate instanceof HTMLButtonElement)) {
      throw new Error("Expected Cast Possibilities actions to render as buttons.");
    }
    expect(copy.disabled).toBe(false);
    expect(regenerate.disabled).toBe(true);
    expect(secondClient.analyze).not.toHaveBeenCalled();
    expect(localStorage.length).toBe(0);
  });

  it("loads prior scratch as stale when the newly saved source is not ready to compile", async () => {
    const firstClient = fixtureClient("fnv1a32:source-a");
    const first = renderView(firstClient);
    await sendAnalyze();
    await screen.findByText("Observable move 1");
    first.unmount();

    const notReadyClient = fixtureClient("fnv1a32:source-b");
    vi.mocked(notReadyClient.compile).mockResolvedValue({
      ok: false,
      kind: "cast-possibilities-not-ready",
      projectIdentity: "project-one",
      blockers: [{ code: "cast-possibilities-no-eligible-character", message: "No eligible cast." }],
      warnings: []
    });
    renderView(notReadyClient);

    expect((await screen.findByRole("alert")).textContent).toContain("No eligible cast.");
    expect(screen.getByText(/saved source changed/i)).not.toBeNull();
    expect(screen.getByText("Observable move 1")).not.toBeNull();
    expect(screen.getByRole<HTMLButtonElement>("button", { name: /Regenerate Elian/ }).disabled).toBe(true);
    expect(notReadyClient.analyze).not.toHaveBeenCalled();
  });

  it("replaces only the regenerated character while preserving the full-cast source identity", async () => {
    const client = fixtureClient("fnv1a32:source-a");
    const first = renderView(client);
    fireEvent.click(await screen.findByRole("checkbox", { name: /confirm this one-time send/i }));
    fireEvent.click(screen.getByRole("button", { name: "Analyze with OpenRouter" }));
    fireEvent.click(await screen.findByRole("button", { name: /Regenerate Elian/ }));
    fireEvent.click(await screen.findByRole("checkbox", { name: /confirm one regeneration request/i }));
    fireEvent.click(screen.getByRole("button", { name: "Send regeneration" }));

    expect(await screen.findByText("Regenerated observable move 1")).not.toBeNull();
    first.unmount();
    renderView(fixtureClient("fnv1a32:source-a"));

    expect(await screen.findByText("Regenerated observable move 1")).not.toBeNull();
    expect(screen.queryByText(/saved source changed/i)).toBeNull();
    const regenerate = screen.getByRole("button", { name: /Regenerate Elian/ });
    if (!(regenerate instanceof HTMLButtonElement)) {
      throw new Error("Expected target regeneration to render as a button.");
    }
    expect(regenerate.disabled).toBe(false);
  });

  it("marks current scratch stale when target preview detects a cross-view saved-source change", async () => {
    const client = fixtureClient("fnv1a32:source-a");
    vi.mocked(client.compile).mockImplementation((request = {}) => Promise.resolve(request.targetCharacterId
      ? {
          ok: false,
          kind: "cast-possibilities-source-changed",
          message: "The full-cast source changed."
        }
      : fixtureCompileResult("fnv1a32:source-a")));
    renderView(client);
    fireEvent.click(await screen.findByRole("checkbox", { name: /confirm this one-time send/i }));
    fireEvent.click(screen.getByRole("button", { name: "Analyze with OpenRouter" }));
    fireEvent.click(await screen.findByRole("button", { name: /Regenerate Elian/ }));

    expect(await screen.findByText(/saved source changed/i)).not.toBeNull();
    const regenerate = screen.getByRole("button", { name: /Regenerate Elian/ });
    expect((regenerate as HTMLButtonElement).disabled).toBe(true);
    expect(client.compile).toHaveBeenLastCalledWith(expect.objectContaining({
      baseSourceFingerprint: "fnv1a32:source-a"
    }));
    expect(client.analyze).toHaveBeenCalledTimes(1);
  });

  it("marks displayed scratch stale when full-cast Analyze detects a cross-view saved-source change", async () => {
    const client = fixtureClient("fnv1a32:source-a");
    renderView(client);
    await sendAnalyze();
    await screen.findByText("Observable move 1");
    vi.mocked(client.analyze).mockResolvedValue({
      ok: false,
      kind: "cast-possibilities-source-changed",
      message: "The saved source changed."
    });

    await sendAnalyze();

    expect(await screen.findAllByText(/saved source changed/i)).toHaveLength(2);
    const regenerate = screen.getByRole("button", { name: /Regenerate Elian/ });
    expect((regenerate as HTMLButtonElement).disabled).toBe(true);
    expect(client.analyze).toHaveBeenCalledTimes(2);
  });

  it("marks displayed scratch stale when full-cast Analyze detects newly unready saved source", async () => {
    const client = fixtureClient("fnv1a32:source-a");
    renderView(client);
    await sendAnalyze();
    await screen.findByText("Observable move 1");
    vi.mocked(client.analyze).mockResolvedValue({
      ok: false,
      kind: "cast-possibilities-not-ready",
      projectIdentity: "project-one",
      blockers: [{ code: "cast-possibilities-current-time-required", message: "Current time is required." }],
      warnings: []
    });

    await sendAnalyze();

    expect(await screen.findByText("Current time is required.")).not.toBeNull();
    expect(screen.getByText(/older cards remain readable and copyable/i)).not.toBeNull();
    expect(screen.getByRole<HTMLButtonElement>("button", { name: /Regenerate Elian/ }).disabled).toBe(true);
    expect(client.analyze).toHaveBeenCalledTimes(2);
  });

  it("keeps stale capability refresh distinct from incompatible-model recovery and never auto-resends", async () => {
    const staleClient = fixtureClient("fnv1a32:source-a");
    vi.mocked(staleClient.analyze).mockResolvedValue({
      ok: false,
      category: "structured-output-capability-unknown",
      message: "Cached capability data is stale."
    });
    vi.mocked(staleClient.refreshModels).mockResolvedValue({ ok: true, models: [] });
    const first = renderView(staleClient);
    await sendAnalyze();

    expect(await screen.findByRole("heading", { name: "Model capability data needs a refresh" })).not.toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Refresh model list" }));
    expect(await screen.findByText(/Refreshed 0 models/i)).not.toBeNull();
    expect(staleClient.analyze).toHaveBeenCalledTimes(1);
    first.unmount();

    const incompatibleClient = fixtureClient("fnv1a32:source-a");
    vi.mocked(incompatibleClient.analyze).mockResolvedValue({
      ok: false,
      category: "structured-output-incompatible-model",
      message: "The selected model is incompatible."
    });
    renderView(incompatibleClient);
    await sendAnalyze();

    expect(await screen.findByRole("heading", { name: "Model cannot satisfy this request" })).not.toBeNull();
    expect(screen.getByRole("link", { name: "Open Settings" }).getAttribute("href")).toBe("/settings");
    expect(screen.queryByRole("button", { name: "Refresh model list" })).toBeNull();
  });

  it("copies and clears visible scratch, including every project-scoped stored fingerprint", async () => {
    const client = fixtureClient("fnv1a32:source-a");
    renderView(client);
    await sendAnalyze();
    fireEvent.click(await screen.findByRole("button", { name: "Copy card 1 for Elian" }));
    expect(writeTextMock).toHaveBeenCalledWith(expect.stringContaining("Observable move 1"));

    const current = JSON.parse(sessionStorage.getItem(
      "continuity-loom:cast-possibilities:v1:project-one:fnv1a32:source-a"
    )!) as Parameters<typeof saveCastPossibilitiesScratch>[1];
    saveCastPossibilitiesScratch(sessionStorage, {
      ...current,
      sourceFingerprint: "fnv1a32:older-source"
    });
    saveCastPossibilitiesScratch(sessionStorage, current);
    clearCastPossibilitiesScratch(sessionStorage, current);
    expect(sessionStorage.length).toBe(0);

    saveCastPossibilitiesScratch(sessionStorage, current);
    fireEvent.click(screen.getByRole("button", { name: "Clear session scratch" }));
    expect(await screen.findByText("Session scratch cleared.")).not.toBeNull();
    expect(screen.queryByRole("heading", { name: "Session scratch" })).toBeNull();
    expect(sessionStorage.length).toBe(0);
  });

  it("reports a post-provider scratch-storage failure without implying that no request was sent", async () => {
    const client = fixtureClient("fnv1a32:source-a");
    renderView(client);
    await screen.findByRole("heading", { name: "Cast Possibilities" });
    const setItem = vi.spyOn(Storage.prototype, "setItem")
      .mockImplementationOnce(() => {
        throw new DOMException("Quota exceeded", "QuotaExceededError");
      });
    await sendAnalyze();

    expect(await screen.findByText(/provider request completed.*could not be stored/i)).not.toBeNull();
    expect(screen.getByText("Observable move 1")).not.toBeNull();
    expect(client.analyze).toHaveBeenCalledTimes(1);
    setItem.mockRestore();
  });

  it("renders unavailable and quarantined outcomes without a provider retry or forged metadata", async () => {
    const unavailable = fixtureClient("fnv1a32:source-a");
    vi.mocked(unavailable.compile).mockResolvedValue({
      ok: false,
      kind: "cast-possibilities-not-ready",
      projectIdentity: "project-one",
      blockers: [{ code: "cast-possibilities-no-eligible-character", message: "No eligible cast." }],
      warnings: []
    });
    const first = renderView(unavailable);
    expect((await screen.findByRole("alert")).textContent).toContain("No eligible cast.");
    expect(unavailable.analyze).not.toHaveBeenCalled();
    first.unmount();

    const quarantined = fixtureClient("fnv1a32:source-a");
    vi.mocked(quarantined.analyze).mockResolvedValue({
      ok: true,
      quarantined: true,
      reasonCode: "schema-mismatch",
      summary: "The whole response was rejected.",
      recovery: "inspect-source-and-response"
    });
    renderView(quarantined);
    await sendAnalyze();
    expect((await screen.findByRole("alert")).textContent).toMatch(/No partial cards were kept/i);
    expect(quarantined.analyze).toHaveBeenCalledTimes(1);
  });

  it("prevents overlapping regeneration sends while one target request is pending", async () => {
    const client = fixtureClient("fnv1a32:source-a");
    const originalAnalyze = vi.mocked(client.analyze).getMockImplementation()!;
    let resolveTarget: ((value: Awaited<ReturnType<CastPossibilitiesClient["analyze"]>>) => void) | undefined;
    vi.mocked(client.analyze).mockImplementation((request) => request.targetCharacterId
      ? new Promise((resolve) => {
          resolveTarget = resolve;
        })
      : originalAnalyze(request));
    renderView(client);
    await sendAnalyze();
    fireEvent.click(await screen.findByRole("button", { name: /Regenerate Elian/ }));
    fireEvent.click(await screen.findByRole("checkbox", { name: /confirm one regeneration request/i }));
    const send = screen.getByRole("button", { name: "Send regeneration" });
    fireEvent.click(send);
    await waitFor(() => expect(client.analyze).toHaveBeenCalledTimes(2));
    expect((send as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(send);
    expect(client.analyze).toHaveBeenCalledTimes(2);
    expect(resolveTarget).toBeDefined();
    resolveTarget?.({
      ok: true,
      replacement: {
        character_key: "[CHARACTER-1]",
        cards: ([1, 2, 3] as const).map((number) => ({
          observable_move: `Replacement ${number}`,
          character_fit: `Fit ${number}`,
          moment_fit: `Moment ${number}`,
          local_effect: `Effect ${number}`,
          dossier_keys: ["[DOSSIER-1]"],
          context_keys: ["[BRIEF-current_time]"],
          distinction: `Distinct ${number}`
        })) as unknown as [CastPossibilitiesCard, CastPossibilitiesCard, CastPossibilitiesCard]
      },
      advisory: { verified: false, canonical: false, prose: false },
      metadata: {
        projectIdentity: "project-one",
        savedDraftIdentity: "generation-brief:fnv1a32:source-a",
        sourceProfile: "cast-possibilities",
        character: "cast-elian",
        versions: { template: "1.0.0", compiler: "1.0.5", contract: "1.0.0" },
        fingerprint: "fnv1a32:regeneration",
        model: "test/model",
        provider: "openrouter"
      }
    });
    expect(await screen.findByText("Replacement 1")).not.toBeNull();
  });

  it("keeps deterministic multi-character group order and distinguishes provider from local request failure", async () => {
    const client = fixtureClient("fnv1a32:source-a");
    const compiled = fixtureCompileResult("fnv1a32:source-a");
    const secondCharacter = {
      characterKey: "[CHARACTER-2]",
      castMemberId: "cast-bera",
      entityId: "entity-bera",
      label: "Bera",
      dossierKeys: ["[DOSSIER-2]"]
    };
    vi.mocked(client.compile).mockResolvedValue({
      ...compiled,
      disclosure: {
        ...compiled.disclosure,
        eligibleCharacters: [...compiled.disclosure.eligibleCharacters, secondCharacter],
        citationMap: {
          ...compiled.disclosure.citationMap,
          "[DOSSIER-2]": "Complete dossier for Bera"
        }
      }
    });
    const firstResponse = await fixtureClient("fnv1a32:source-a").analyze({
      expectedPromptFingerprint: "fnv1a32:source-a",
      expectedRequestFingerprint: "request:fnv1a32:source-a"
    });
    if (!firstResponse.ok || !("possibilities" in firstResponse)) {
      throw new Error("Expected a full-cast fixture response.");
    }
    vi.mocked(client.analyze).mockResolvedValue({
      ...firstResponse,
      possibilities: {
        ...firstResponse.possibilities,
        characters: [
          firstResponse.possibilities.characters[0]!,
          {
            character_key: "[CHARACTER-2]",
            cards: firstResponse.possibilities.characters[0]!.cards.map((card) => ({
              ...card,
              dossier_keys: ["[DOSSIER-2]"]
            })) as unknown as [CastPossibilitiesCard, CastPossibilitiesCard, CastPossibilitiesCard]
          }
        ]
      }
    });
    const first = renderView(client);
    await sendAnalyze();
    expect((await screen.findAllByRole("group")).map((group) => group.getAttribute("aria-label"))).toEqual([
      "Elian possibilities",
      "Bera possibilities"
    ]);
    first.unmount();

    const providerFailure = fixtureClient("fnv1a32:source-a");
    vi.mocked(providerFailure.analyze).mockResolvedValue({
      ok: false,
      category: "rate-limit",
      message: "Provider rate limit."
    });
    const second = renderView(providerFailure);
    await sendAnalyze();
    expect((await screen.findByRole("alert")).textContent).toContain("Provider rate limit.");
    second.unmount();

    const localFailure = fixtureClient("fnv1a32:source-a");
    vi.mocked(localFailure.analyze).mockRejectedValue(new Error("offline"));
    renderView(localFailure);
    await sendAnalyze();
    expect((await screen.findByRole("alert")).textContent).toContain("local request failed");
    expect(localFailure.analyze).toHaveBeenCalledTimes(1);
  });
});

async function sendAnalyze(): Promise<void> {
  fireEvent.click(await screen.findByRole("checkbox", { name: /confirm this one-time send/i }));
  fireEvent.click(screen.getByRole("button", { name: "Analyze with OpenRouter" }));
}

function renderView(client: CastPossibilitiesClient) {
  return render(
    <MemoryRouter>
      <CastPossibilitiesView client={client} />
    </MemoryRouter>
  );
}

function fixtureClient(fingerprint: string): CastPossibilitiesClient {
  const compileResult = fixtureCompileResult(fingerprint);
  const disclosure = compileResult.disclosure;
  const makeCard = (number: number): CastPossibilitiesCard => ({
    observable_move: `Observable move ${number}`,
    character_fit: `Character fit ${number}`,
    moment_fit: `Moment fit ${number}`,
    local_effect: `Local effect ${number}`,
    dossier_keys: ["[DOSSIER-1]"],
    context_keys: ["[BRIEF-current_time]"],
    distinction: `Distinction ${number}`
  });
  const possibilities: CastPossibilitiesOutput = {
    contract: "cast_possibilities.v1" as const,
    characters: [{
      character_key: "[CHARACTER-1]",
      cards: [makeCard(1), makeCard(2), makeCard(3)]
    }]
  };
  return {
    compile: vi.fn<CastPossibilitiesClient["compile"]>((request = {}) => Promise.resolve(request.targetCharacterId
      ? {
          ...compileResult,
          prompt: "# Cast Possibilities Prompt\nTarget regeneration",
          disclosure: {
            ...disclosure,
            eligibleCharacters: disclosure.eligibleCharacters.slice(0, 1),
            fingerprint: "fnv1a32:regeneration"
          },
          fingerprint: "fnv1a32:regeneration"
        }
      : compileResult)),
    analyze: vi.fn<CastPossibilitiesClient["analyze"]>((request) => Promise.resolve(request.targetCharacterId
      ? {
          ok: true as const,
          replacement: {
            ...possibilities.characters[0]!,
            cards: [
              { ...possibilities.characters[0]!.cards[0], observable_move: "Regenerated observable move 1" },
              { ...possibilities.characters[0]!.cards[1], observable_move: "Regenerated observable move 2" },
              { ...possibilities.characters[0]!.cards[2], observable_move: "Regenerated observable move 3" }
            ]
          },
          advisory: { verified: false as const, canonical: false as const, prose: false as const },
          metadata: {
            projectIdentity: "project-one",
            savedDraftIdentity: disclosure.savedDraftIdentity,
            sourceProfile: "cast-possibilities" as const,
            character: request.targetCharacterId,
            versions: disclosure.versions,
            fingerprint: request.expectedPromptFingerprint,
            model: "test/model",
            provider: "openrouter" as const
          }
        }
      : {
          ok: true,
          possibilities,
          advisory: { verified: false, canonical: false, prose: false },
          metadata: {
            projectIdentity: "project-one",
            savedDraftIdentity: disclosure.savedDraftIdentity,
            sourceProfile: "cast-possibilities",
            character: "all-eligible-characters",
            versions: disclosure.versions,
            fingerprint,
            model: "test/model",
            provider: "openrouter"
          }
        }
    )),
    refreshModels: vi.fn()
  };
}

function fixtureCompileResult(fingerprint: string) {
  const disclosure = {
    sourceProfile: "cast-possibilities" as const,
    savedDraftIdentity: `generation-brief:${fingerprint}`,
    selectedPov: { entityId: "pov-entity", label: "Mara" },
    eligibleCharacters: [{
      characterKey: "[CHARACTER-1]",
      castMemberId: "cast-elian",
      entityId: "entity-elian",
      label: "Elian",
      dossierKeys: ["[DOSSIER-1]"]
    }],
    recordCountsByType: { "CAST MEMBER": 2, ENTITY: 2 },
    includesSecrets: false,
    promptLength: 28,
    tokenEstimate: 7,
    versions: { template: "1.0.0", compiler: "1.0.5", contract: "1.0.0" } as const,
    fingerprint,
    citationMap: {
      "[DOSSIER-1]": "Complete dossier for Elian",
      "[BRIEF-current_time]": "Generation Brief current_time"
    }
  };
  return {
      ok: true,
      projectIdentity: "project-one",
      prompt: "# Cast Possibilities Prompt",
      disclosure,
      citations: disclosure.citationMap,
      outputSchema: {},
      versions: disclosure.versions,
      fingerprint,
      providerRequest: {
        model: "test/model",
        temperatureMode: "explicit",
        temperature: 0,
        maxOutputTokens: 4096,
        requestFingerprint: `request:${fingerprint}`
      }
  } as const;
}
