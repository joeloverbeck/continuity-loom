// @vitest-environment jsdom

import {
  IDEATION_FOCUS_MAX_CODE_POINTS,
  type GenerationReadiness,
  type ReadinessDiagnostic
} from "@loom/core";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  compileIdeation,
  ideate,
  readiness,
  type IdeateResponse
} from "../api.js";
import { accessibleDescriptionTexts } from "../test-accessibility.js";
import { IdeateView } from "./IdeateView.js";

vi.mock("../api.js", () => ({
  compileIdeation: vi.fn(),
  ideate: vi.fn(),
  readiness: vi.fn()
}));

beforeEach(() => {
  sessionStorage.clear();
  localStorage.clear();
  vi.mocked(compileIdeation).mockReset();
  vi.mocked(ideate).mockReset();
  vi.mocked(readiness).mockReset();
  vi.mocked(compileIdeation).mockResolvedValue(compileResult("# Grounded Ideation Prompt\n<ideation_slots>"));
  vi.mocked(readiness).mockResolvedValue(readinessFixture({}));
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("IdeateView", () => {
  it("keeps Assistance send unavailable when the inspected reasoning capability is unknown", async () => {
    const compiled = compileResult("# Grounded Ideation Prompt\n<ideation_slots>");
    vi.mocked(compileIdeation).mockResolvedValue({
      ...compiled,
      providerRequest: {
        ...compiled.providerRequest,
        admission: {
          ok: false,
          category: "structured-output-capability-unknown",
          message: "The selected model has no usable cached reasoning-effort capability data.",
          recovery: "Refresh the OpenRouter model list, then reinspect."
        }
      }
    });

    renderIdeate();

    const button = await screen.findByRole<HTMLButtonElement>("button", { name: "Get ideas" });
    expect(button.disabled).toBe(true);
    expect(screen.getByRole("alert", { name: "OpenRouter capability blocker" })).toBeTruthy();
    fireEvent.click(button);
    expect(ideate).not.toHaveBeenCalled();
  });

  it("shows the shared advisory while Get ideas remains enabled and display sends nothing", async () => {
    const compiled = compileResult("# Grounded Ideation Prompt\n<ideation_slots>");
    vi.mocked(compileIdeation).mockResolvedValue({
      ...compiled,
      providerRequest: {
        ...compiled.providerRequest,
        contextLength: 2200
      }
    });

    renderIdeate();

    const advisory = await screen.findByRole("status", { name: "Context-window advisory" });
    expect(screen.getByRole("status", { name: "Assistance-ceiling suitability advisory" })).toBeTruthy();
    expect(advisory.textContent).toContain("estimated at 7 tokens");
    expect(advisory.textContent).not.toContain("narrow the selected scope");
    expect(advisory.textContent).not.toContain("# Grounded Ideation Prompt");
    expect(screen.getByRole<HTMLButtonElement>("button", { name: "Get ideas" }).disabled).toBe(false);
    expect(ideate).not.toHaveBeenCalled();
  });

  it("shows the compiled ideation prompt before sending and keeps output quarantined", async () => {
    renderIdeate();

    expect(await screen.findByRole("heading", { name: "Ideate" })).toBeTruthy();
    expect((await screen.findByTestId("prompt-body")).textContent).toContain("# Grounded Ideation Prompt");
    expect(screen.getByText("template-ideation")).toBeTruthy();
    expect(screen.getAllByText("AI-suggested scratch - not story state.")).toHaveLength(1);
    expect(screen.getByText("No ideas yet.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /insert/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /accept/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /save/i })).toBeNull();
    expect(readiness).toHaveBeenCalledWith({ promptKind: "ideation" });
    expect(compileIdeation).toHaveBeenCalledWith({
      mode: "ideas",
      count: 5,
      dormantSlot: true,
      focus: "",
      avoidList: []
    });
  });

  it("renders shared rate-limit detail and retry timing without an automatic request", async () => {
    vi.mocked(ideate).mockResolvedValue({
      ok: false,
      category: "rate-limit",
      message: "OpenRouter rate limit reached. Wait before retrying.",
      providerStatus: 429,
      providerReason: "Quota window is still active.",
      retryAfter: 9
    });
    renderIdeate();

    await screen.findByTestId("prompt-body");
    fireEvent.click(screen.getByRole("button", { name: "Get ideas" }));

    expect((await screen.findByRole("alert")).textContent).toBe(
      "OpenRouter rate limit reached. Wait before retrying. Provider status: 429. " +
      "Provider reason: Quota window is still active. Wait at least 9 seconds, then use the existing action to try again. " +
      "No retry is automatic."
    );
    expect(ideate).toHaveBeenCalledTimes(1);
  });

  it("associates Author focus help, normalized code-point count, and recoverable limit error", async () => {
    renderIdeate();

    const focus = await screen.findByRole<HTMLTextAreaElement>("textbox", {
      name: "What do you need ideas or questions about?"
    });
    expect(focus.value).toBe("");
    expect(screen.getByText(`0 / ${IDEATION_FOCUS_MAX_CODE_POINTS}`)).toBeTruthy();
    const descriptions = accessibleDescriptionTexts(focus);
    expect(descriptions.length).toBeGreaterThanOrEqual(2);
    const accessibleDescription = descriptions.join(" ");
    expect(accessibleDescription).toContain("temporary, non-canonical request context");
    expect(accessibleDescription).toContain("inside already assigned response slots");
    expect(accessibleDescription).toContain("does not choose response kinds or operators");
    expect(accessibleDescription).toContain("change their grounding");
    expect(accessibleDescription).toContain("change the active working set");
    expect(accessibleDescription).toContain("creates neither canon nor story prose");

    const callsBeforeInvalidEdit = vi.mocked(compileIdeation).mock.calls.length;
    fireEvent.change(focus, { target: { value: "😀".repeat(501) } });

    expect(screen.getByText(`501 / ${IDEATION_FOCUS_MAX_CODE_POINTS}`)).toBeTruthy();
    expect(screen.getByRole("alert").textContent).toContain(
      "Author focus must be 500 Unicode code points or fewer."
    );
    expect(focus.getAttribute("aria-invalid")).toBe("true");
    expect(focus.getAttribute("aria-errormessage")).toBeTruthy();
    expect(screen.getByRole<HTMLButtonElement>("button", { name: "Get ideas" }).disabled).toBe(true);
    await act(async () => Promise.resolve());
    expect(compileIdeation).toHaveBeenCalledTimes(callsBeforeInvalidEdit);
    expect(ideate).not.toHaveBeenCalled();

    fireEvent.change(focus, { target: { value: "😀".repeat(500) } });

    expect(screen.getByText(`${IDEATION_FOCUS_MAX_CODE_POINTS} / ${IDEATION_FOCUS_MAX_CODE_POINTS}`)).toBeTruthy();
    await waitFor(() => expect(compileIdeation).toHaveBeenLastCalledWith({
      mode: "ideas",
      count: 5,
      dormantSlot: true,
      focus: "😀".repeat(500),
      avoidList: []
    }));
    await waitFor(() => {
      expect(screen.getByRole<HTMLButtonElement>("button", { name: "Get ideas" }).disabled).toBe(false);
    });
    expect(screen.queryByText("Author focus must be 500 Unicode code points or fewer.")).toBeNull();
    expect(ideate).not.toHaveBeenCalled();
  });

  it("makes focus editing the only available control while Author focus is over limit", async () => {
    vi.mocked(ideate).mockResolvedValue({
      ok: true,
      ideas: [
        ideaFixture({ slotNumber: 1, headline: "The sealed letter changes hands." }),
        ideaFixture({ slotNumber: 2, headline: "The latch interrupts the argument." })
      ],
      citations: {},
      metadata: generationMetadata()
    });
    renderIdeate();

    expect(await screen.findByTestId("prompt-body")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Get ideas" }));
    expect(await screen.findByRole("heading", { name: "The sealed letter changes hands." })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "The latch interrupts the argument." })).toBeTruthy();
    fireEvent.click(screen.getAllByRole("button", { name: "Keep" })[0]!);
    expect(screen.getByRole("button", { name: "Remove" })).toBeTruthy();

    const focus = screen.getByRole<HTMLTextAreaElement>("textbox", {
      name: "What do you need ideas or questions about?"
    });
    fireEvent.change(focus, { target: { value: "x".repeat(IDEATION_FOCUS_MAX_CODE_POINTS + 1) } });

    expect(focus.disabled).toBe(false);
    expect(screen.getByRole<HTMLButtonElement>("button", { name: "Ideas" }).disabled).toBe(true);
    expect(screen.getByRole<HTMLButtonElement>("button", { name: "Questions" }).disabled).toBe(true);
    expect(screen.getByLabelText<HTMLSelectElement>("Count").disabled).toBe(true);
    expect(screen.getByLabelText<HTMLInputElement>("Dormant slot").disabled).toBe(true);
    expect(screen.getByRole<HTMLButtonElement>("button", { name: "Get new slate" }).disabled).toBe(true);
    expect(screen.getByRole<HTMLButtonElement>("button", { name: "Regenerate all" }).disabled).toBe(true);
    expect(screen.getByRole<HTMLButtonElement>("button", { name: "Clear all" }).disabled).toBe(true);
    expect(screen.getByRole<HTMLButtonElement>("button", { name: "Refresh prompt" }).disabled).toBe(true);
    expect(screen.getAllByRole<HTMLButtonElement>("button", { name: /^(?:Keep|Kept)$/ })
      .every((button) => button.disabled)).toBe(true);
    expect(screen.getByRole<HTMLButtonElement>("button", { name: "Remove" }).disabled).toBe(true);
  });

  it("invalidates send immediately and ignores an older compile response after rapid focus edits", async () => {
    const first = deferred<ReturnType<typeof compileResult>>();
    const second = deferred<ReturnType<typeof compileResult>>();
    vi.mocked(compileIdeation).mockImplementation((request = {}) => {
      if (request.focus === "first question") {
        return first.promise;
      }
      if (request.focus === "second question") {
        return second.promise;
      }
      return Promise.resolve(compileResult("# Grounded Ideation Prompt\nblank", "fingerprint-blank"));
    });
    renderIdeate();

    const focus = await screen.findByRole<HTMLTextAreaElement>("textbox", {
      name: "What do you need ideas or questions about?"
    });
    fireEvent.change(focus, { target: { value: "first question" } });
    expect(screen.getByRole<HTMLButtonElement>("button", { name: "Get ideas" }).disabled).toBe(true);
    fireEvent.change(screen.getByRole("textbox", {
      name: "What do you need ideas or questions about?"
    }), { target: { value: "second question" } });

    await act(async () => {
      second.resolve(compileResult("# Grounded Ideation Prompt\nsecond question", "fingerprint-second"));
      await second.promise;
    });
    expect((await screen.findByTestId("prompt-body")).textContent).toContain("second question");
    expect(screen.getAllByText("fingerprint-second")).toHaveLength(2);

    await act(async () => {
      first.resolve(compileResult("# Grounded Ideation Prompt\nfirst question", "fingerprint-first"));
      await first.promise;
    });
    expect(screen.getByTestId("prompt-body").textContent).toContain("second question");
    expect(screen.getByTestId("prompt-body").textContent).not.toContain("first question");
    expect(screen.getAllByText("fingerprint-second")).toHaveLength(2);
    expect(screen.queryByText("fingerprint-first")).toBeNull();
  });

  it("sends the normalized current focus with only the inspected fingerprint", async () => {
    vi.mocked(compileIdeation).mockImplementation((request = {}) => Promise.resolve(compileResult(
      `# Grounded Ideation Prompt\nAuthor focus: ${request.focus ?? ""}`,
      `fingerprint:${request.focus ?? ""}`
    )));
    vi.mocked(ideate).mockResolvedValue({
      ok: true,
      ideas: [ideaFixture({ slotNumber: 1, headline: "The sealed letter changes hands." })],
      citations: {},
      metadata: generationMetadata()
    });
    renderIdeate();

    const focus = await screen.findByRole("textbox", {
      name: "What do you need ideas or questions about?"
    });
    fireEvent.change(focus, { target: { value: "  door pressure  " } });
    await waitFor(() => expect(screen.getByTestId("prompt-body").textContent).toContain("door pressure"));
    fireEvent.click(screen.getByRole("button", { name: "Get ideas" }));

    await waitFor(() => expect(ideate).toHaveBeenCalledWith({
      mode: "ideas",
      count: 5,
      dormantSlot: true,
      focus: "door pressure",
      avoidList: []
    }, "fingerprint:door pressure", "fingerprint:door pressure"));
    expect(ideate).toHaveBeenCalledTimes(1);
  });

  it("retains focus through existing controls without provider calls", async () => {
    renderIdeate();
    const focus = await screen.findByRole<HTMLTextAreaElement>("textbox", {
      name: "What do you need ideas or questions about?"
    });
    fireEvent.change(focus, { target: { value: "  pressure at the door  " } });
    fireEvent.click(screen.getByRole("button", { name: "Questions" }));
    fireEvent.change(screen.getByLabelText("Count"), { target: { value: "4" } });
    fireEvent.click(screen.getByLabelText("Dormant slot"));

    expect(focus.value).toBe("  pressure at the door  ");
    await waitFor(() => expect(compileIdeation).toHaveBeenLastCalledWith({
      mode: "questions",
      count: 4,
      dormantSlot: false,
      focus: "pressure at the door",
      avoidList: []
    }));
    expect(ideate).not.toHaveBeenCalled();
  });

  it("renders relaxed readiness warnings without disabling ideation", async () => {
    vi.mocked(readiness).mockResolvedValue(readinessFixture({
      warnings: [readinessDiagnostic({
        severity: "warning",
        code: "missing-manual-directive",
        legacyCode: "missing-manual-directive",
        title: "Manual directive is optional for ideation",
        group: "recommended-for-stronger-output"
      })]
    }));

    renderIdeate();

    expect(await screen.findByRole("heading", { name: "Manual directive is optional for ideation" })).toBeTruthy();
    expect(screen.getByRole<HTMLButtonElement>("button", { name: "Get ideas" }).disabled).toBe(false);
  });

  it("requests ideas and renders parsed scratch without durable insertion controls", async () => {
    vi.mocked(ideate).mockResolvedValue({
      ok: true,
      ideas: [{
        slotNumber: 1,
        operator: "Reveal",
        headline: "The sealed letter changes hands.",
        why: "The secret and handoff pressure support it.",
        grounds: ["[SECRET-1]"],
        unknownCitations: []
      }],
      citations: { "[SECRET-1]": "The letter names a ledger substitution" },
      metadata: generationMetadata()
    });

    renderIdeate();

    expect(await screen.findByTestId("prompt-body")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Get ideas" }));

    expect(await screen.findByRole("heading", { name: "The sealed letter changes hands." })).toBeTruthy();
    expect(screen.getByText("The letter names a ledger substitution")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /insert/i })).toBeNull();
    expect(ideate).toHaveBeenCalledWith({
      mode: "ideas",
      count: 5,
      dormantSlot: true,
      focus: "",
      avoidList: []
    }, "fingerprint-1", "fingerprint-1");
  });

  it("preserves current focus, avoid-list, and fingerprint through every slate action", async () => {
    const response = (headline: string) => ({
      ok: true as const,
      ideas: [ideaFixture({ slotNumber: 1, headline })],
      citations: { "[SECRET-1]": "The letter names a ledger substitution" },
      metadata: generationMetadata()
    });
    vi.mocked(compileIdeation).mockImplementation((request = {}) => Promise.resolve(compileResult(
      `# Grounded Ideation Prompt\nAuthor focus: ${request.focus ?? ""}`,
      `fingerprint:${request.focus ?? ""}:${request.avoidList?.join("|") ?? ""}`
    )));
    vi.mocked(ideate)
      .mockResolvedValueOnce(response("The sealed letter changes hands."))
      .mockResolvedValueOnce(response("The latch interrupts the argument."))
      .mockResolvedValueOnce(response("The lantern forces a choice."))
      .mockResolvedValueOnce(response("The stair bell exposes the delay."));

    renderIdeate();

    const focus = await screen.findByRole<HTMLTextAreaElement>("textbox", {
      name: "What do you need ideas or questions about?"
    });
    fireEvent.change(focus, { target: { value: "  pressure at the door  " } });
    await waitFor(() => expect(screen.getByTestId("prompt-body").textContent).toContain("pressure at the door"));

    fireEvent.click(screen.getByRole("button", { name: "Get ideas" }));
    expect(await screen.findByRole("heading", { name: "The sealed letter changes hands." })).toBeTruthy();
    expect(ideate).toHaveBeenNthCalledWith(1, {
      mode: "ideas",
      count: 5,
      dormantSlot: true,
      focus: "pressure at the door",
      avoidList: []
    }, "fingerprint:pressure at the door:", "fingerprint:pressure at the door:");

    const getNewSlate = screen.getByRole<HTMLButtonElement>("button", { name: "Get new slate" });
    await waitFor(() => expect(getNewSlate.disabled).toBe(false));
    fireEvent.click(getNewSlate);
    expect(await screen.findByRole("heading", { name: "The latch interrupts the argument." })).toBeTruthy();
    expect(ideate).toHaveBeenNthCalledWith(2, {
      mode: "ideas",
      count: 5,
      dormantSlot: true,
      focus: "pressure at the door",
      avoidList: ["The sealed letter changes hands."]
    }, "fingerprint:pressure at the door:The sealed letter changes hands.", "fingerprint:pressure at the door:The sealed letter changes hands.");

    const regenerateAll = screen.getByRole<HTMLButtonElement>("button", { name: "Regenerate all" });
    await waitFor(() => expect(regenerateAll.disabled).toBe(false));
    fireEvent.click(regenerateAll);
    expect(await screen.findByRole("heading", { name: "The lantern forces a choice." })).toBeTruthy();
    expect(ideate).toHaveBeenNthCalledWith(3, {
      mode: "ideas",
      count: 5,
      dormantSlot: true,
      focus: "pressure at the door",
      avoidList: ["The latch interrupts the argument."]
    }, "fingerprint:pressure at the door:The latch interrupts the argument.", "fingerprint:pressure at the door:The latch interrupts the argument.");

    const regenerateSlot = screen.getByRole<HTMLButtonElement>("button", { name: "Regenerate slot" });
    await waitFor(() => expect(regenerateSlot.disabled).toBe(false));
    fireEvent.click(regenerateSlot);
    expect(await screen.findByRole("heading", { name: "The stair bell exposes the delay." })).toBeTruthy();
    expect(ideate).toHaveBeenNthCalledWith(4, {
      mode: "ideas",
      count: 5,
      dormantSlot: true,
      focus: "pressure at the door",
      avoidList: ["The lantern forces a choice."]
    }, "fingerprint:pressure at the door:The lantern forces a choice.", "fingerprint:pressure at the door:The lantern forces a choice.");
    expect(focus.value).toBe("  pressure at the door  ");
  });

  it("clears the prior avoid-list without reverting focus when an in-flight response becomes stale", async () => {
    const staleResponse = deferred<IdeateResponse>();
    vi.mocked(compileIdeation).mockImplementation((request = {}) => Promise.resolve(compileResult(
      "# Grounded Ideation Prompt",
      `fingerprint:${request.focus ?? ""}:${request.avoidList?.join("|") ?? ""}`
    )));
    vi.mocked(ideate)
      .mockResolvedValueOnce({
        ok: true,
        ideas: [ideaFixture({ slotNumber: 1, headline: "The sealed letter changes hands." })],
        citations: {},
        metadata: generationMetadata()
      })
      .mockReturnValueOnce(staleResponse.promise);
    renderIdeate();

    expect(await screen.findByTestId("prompt-body")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Get ideas" }));
    expect(await screen.findByRole("heading", { name: "The sealed letter changes hands." })).toBeTruthy();
    const getNewSlate = screen.getByRole<HTMLButtonElement>("button", { name: "Get new slate" });
    await waitFor(() => expect(getNewSlate.disabled).toBe(false));
    fireEvent.click(getNewSlate);

    const focus = screen.getByRole<HTMLTextAreaElement>("textbox", {
      name: "What do you need ideas or questions about?"
    });
    fireEvent.change(focus, { target: { value: "new focus while sending" } });
    await waitFor(() => expect(compileIdeation).toHaveBeenLastCalledWith({
      mode: "ideas",
      count: 5,
      dormantSlot: true,
      focus: "new focus while sending",
      avoidList: ["The sealed letter changes hands."]
    }));

    await act(async () => {
      staleResponse.resolve({
        ok: true,
        ideas: [ideaFixture({ slotNumber: 1, headline: "Obsolete response" })],
        citations: {},
        metadata: generationMetadata()
      });
      await staleResponse.promise;
    });

    await waitFor(() => expect(compileIdeation).toHaveBeenLastCalledWith({
      mode: "ideas",
      count: 5,
      dormantSlot: true,
      focus: "new focus while sending",
      avoidList: []
    }));
    expect(focus.value).toBe("new focus while sending");
    expect(screen.queryByRole("heading", { name: "Obsolete response" })).toBeNull();
  });

  it.each([
    {
      outcome: "locally rejected output",
      response: {
        ok: true as const,
        quarantined: true as const,
        reasonCode: "local-parser-rejected",
        summary: "Candidate content failed local validation.",
        recovery: "Inspect the source before using the action again.",
        diagnostic: diagnosticReceipt()
      }
    },
    {
      outcome: "validation-blocked output",
      response: {
        ok: false as const,
        kind: "validation-blocked" as const,
        validation: { blockers: [], warnings: [], isBlocked: true },
        readiness: readinessFixture({})
      }
    },
    {
      outcome: "stale output",
      response: {
        ok: false as const,
        kind: "stale-ideation-prompt",
        message: "The ideation request changed."
      }
    },
    {
      outcome: "transport failure",
      response: {
        ok: false as const,
        category: "provider-unavailable" as const,
        message: "Provider unavailable."
      }
    },
    {
      outcome: "thrown request failure",
      response: new Error("network failed")
    }
  ])("clears the prior slate avoid-list after $outcome", async ({ response }) => {
    vi.mocked(compileIdeation).mockImplementation((request = {}) => Promise.resolve(compileResult(
      "# Grounded Ideation Prompt",
      `fingerprint:${request.avoidList?.join("|") ?? ""}`
    )));
    vi.mocked(ideate).mockResolvedValueOnce({
      ok: true,
      ideas: [ideaFixture({ slotNumber: 1, headline: "The sealed letter changes hands." })],
      citations: {},
      metadata: generationMetadata()
    });
    if (response instanceof Error) {
      vi.mocked(ideate).mockRejectedValueOnce(response);
    } else {
      vi.mocked(ideate).mockResolvedValueOnce(response);
    }
    renderIdeate();

    expect(await screen.findByTestId("prompt-body")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Get ideas" }));
    expect(await screen.findByRole("heading", { name: "The sealed letter changes hands." })).toBeTruthy();
    const getNewSlate = screen.getByRole<HTMLButtonElement>("button", { name: "Get new slate" });
    await waitFor(() => expect(getNewSlate.disabled).toBe(false));
    fireEvent.click(getNewSlate);

    await waitFor(() => expect(compileIdeation).toHaveBeenLastCalledWith({
      mode: "ideas",
      count: 5,
      dormantSlot: true,
      focus: "",
      avoidList: []
    }));
  });

  it("keeps ideas in session scratch and clear-all removes slate and keepers", async () => {
    vi.mocked(ideate).mockResolvedValue({
      ok: true,
      ideas: [ideaFixture({ slotNumber: 1, headline: "The sealed letter changes hands." })],
      citations: { "[SECRET-1]": "The letter names a ledger substitution" },
      metadata: generationMetadata()
    });

    const rendered = renderIdeate();

    expect(await screen.findByTestId("prompt-body")).toBeTruthy();
    const focus = screen.getByRole<HTMLTextAreaElement>("textbox", {
      name: "What do you need ideas or questions about?"
    });
    fireEvent.change(focus, { target: { value: "clear-remount focus canary" } });
    await waitFor(() => expect(screen.getByRole<HTMLButtonElement>("button", { name: "Get ideas" }).disabled).toBe(false));
    fireEvent.click(screen.getByRole("button", { name: "Get ideas" }));
    expect(await screen.findByRole("heading", { name: "The sealed letter changes hands." })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Keep" }));

    expect(screen.getByRole("button", { name: "Kept" })).toBeTruthy();
    expect(sessionStorage.getItem("loom.ideate.keepers.v1")).toContain("The sealed letter changes hands.");
    expect(sessionStorage.getItem("loom.ideate.keepers.v1")).toContain("The letter names a ledger substitution");

    // The rail is too narrow for a resolved label, so it shows the bare key. The stored keeper
    // payload is unchanged - only what the rail renders is.
    const keptGrounds = screen.getByLabelText("Grounds for kept The sealed letter changes hands.");
    expect(within(keptGrounds).getByText("SECRET-1")).toBeTruthy();
    expect(within(keptGrounds).queryByText("The letter names a ledger substitution")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Clear all" }));

    expect(screen.queryByRole("heading", { name: "The sealed letter changes hands." })).toBeNull();
    expect(screen.getByText("No ideas yet.")).toBeTruthy();
    expect(screen.getByText("No keepers yet.")).toBeTruthy();
    expect(focus.value).toBe("clear-remount focus canary");
    expect(sessionStorage.getItem("loom.ideate.keepers.v1")).toBeNull();
    expect(localStorage.length).toBe(0);
    expect(JSON.stringify({ ...sessionStorage, ...localStorage })).not.toContain("clear-remount focus canary");

    rendered.unmount();
    renderIdeate();
    expect((await screen.findByRole<HTMLTextAreaElement>("textbox", {
      name: "What do you need ideas or questions about?"
    })).value).toBe("");
    expect(screen.getByText(`0 / ${IDEATION_FOCUS_MAX_CODE_POINTS}`)).toBeTruthy();
  });

  it("renders and copies the safe structural reason without retrying or exposing rejected text", async () => {
    const writeText = vi.fn<(text: string) => Promise<void>>(() => Promise.resolve());
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    vi.mocked(ideate).mockResolvedValue({
      ok: true,
      quarantined: true,
      reasonCode: "local-parser-rejected",
      summary: "Candidate content failed local Ideate validation.",
      recovery: "Review the safe structural reason, then use the existing Ideate action manually if you want another attempt. No retry is automatic.",
      diagnostic: {
        ...diagnosticReceipt(),
        recovery: "Review the safe structural reason, then use the existing Ideate action manually if you want another attempt. No retry is automatic.",
        structuralReason: {
          code: "mismatched-operator",
          message: "Assigned slot 1: the operator did not match the compiled assignment.",
          slotNumber: 1
        }
      }
    });

    renderIdeate();

    expect(await screen.findByTestId("prompt-body")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Get ideas" }));

    expect(await screen.findByRole("alert", { name: "OpenRouter diagnostic" })).toBeTruthy();
    expect(screen.getByText("Candidate content failed local validation.")).toBeTruthy();
    expect(screen.getByText("Safe structural reason:").parentElement?.textContent).toContain(
      "Assigned slot 1: the operator did not match the compiled assignment."
    );
    expect(screen.getAllByText(/use the existing Ideate action manually/i)).toHaveLength(2);
    expect(screen.queryByText("freeform answer")).toBeNull();
    expect(screen.getAllByText("AI-suggested scratch - not story state.")).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Copy diagnostic receipt" }));
    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    expect(writeText.mock.calls[0]?.[0]).toContain("Structural rule: mismatched-operator");
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });
    expect(ideate).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("heading", { level: 4 })).toBeNull();
  });

  it("presents shared Assistance output-limit recovery after one explicit Ideate request", async () => {
    vi.mocked(ideate).mockResolvedValue({
      ok: false,
      category: "output-limit",
      message: "OpenRouter stopped at the output limit.",
      classification: "incomplete-generation",
      diagnostic: assistanceOutputLimitReceipt()
    });

    renderIdeate();
    expect(await screen.findByTestId("prompt-body")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Get ideas" }));

    expect(await screen.findByRole("button", { name: "Lower Assistance effort" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Raise Assistance ceiling" })).toBeTruthy();
    expect(ideate).toHaveBeenCalledTimes(1);
  });
});

function assistanceOutputLimitReceipt() {
  return {
    classification: "incomplete-generation" as const,
    summary: "Generation stopped before the workflow received a complete result.",
    recovery: "Reasoning may have consumed part or all of the completion allowance.",
    sentPolicy: {
      outputClass: "assistance" as const,
      completionCeiling: 8192,
      reasoningEnabled: true as const,
      reasoningEffort: "high" as const,
      reasoningExcluded: true as const,
      supportedLowerEfforts: ["low" as const]
    },
    details: {
      httpStatus: 200,
      requestedModel: "anthropic/claude-sonnet-4",
      termination: "length" as const,
      nativeFinishReason: "length",
      choiceCount: 1,
      contentShape: "null" as const,
      structuralOutcome: "null-content" as const
    }
  };
}

function diagnosticReceipt() {
  return {
    classification: "local-validation" as const,
    summary: "Candidate content failed local validation.",
    recovery: "Inspect the source before using the action again.",
    details: {
      httpStatus: 200,
      requestedModel: "anthropic/claude-sonnet-4",
      termination: "normal" as const,
      choiceCount: 1,
      contentShape: "string" as const
    }
  };
}

function renderIdeate() {
  return render(
    <MemoryRouter>
      <IdeateView />
    </MemoryRouter>
  );
}

function compileResult(prompt: string, fingerprint = "fingerprint-1") {
  return {
    prompt,
    metadata: {
      versions: {
        template: "template-ideation",
        compiler: "compiler-1",
        contract: "contract-1"
      },
      fingerprint,
      lengthEstimate: prompt.length,
      tokenEstimate: 7
    },
    providerRequest: {
      model: "openai/gpt-4.1",
      temperatureMode: "explicit" as const,
      temperature: 0.4,
      completionCeilingClass: "assistance" as const,
      maxOutputTokens: 2200,
      reasoningEnabled: true as const,
      reasoningEffort: "low" as const,
      reasoningExcluded: true as const,
      capabilitySnapshot: {
        model: "openai/gpt-4.1",
        cacheEntryFound: true,
        supportedParameters: ["max_completion_tokens", "reasoning"],
        supportedEfforts: ["low" as const]
      },
      admission: { ok: true as const },
      requestFingerprint: fingerprint
    }
  };
}

function deferred<T>(): { promise: Promise<T>; resolve: (value: T) => void } {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((complete) => {
    resolve = complete;
  });
  return { promise, resolve };
}

function generationMetadata() {
  return {
    model: "openai/gpt-4.1",
    provider: "openrouter" as const,
    temperatureMode: "explicit" as const,
    temperature: 0.4,
    completionCeilingClass: "assistance" as const,
    maxOutputTokens: 2200,
    reasoningEnabled: true as const,
    reasoningEffort: "low" as const,
    reasoningExcluded: true as const,
    versions: {
      template: "template-ideation",
      compiler: "compiler-1",
      contract: "contract-1"
    }
  };
}

function ideaFixture(input: { slotNumber: number; headline: string }) {
  return {
    slotNumber: input.slotNumber,
    operator: "Reveal",
    headline: input.headline,
    why: "The secret and handoff pressure support it.",
    grounds: ["[SECRET-1]"],
    unknownCitations: []
  };
}

function readinessFixture(input: {
  blockers?: readonly ReadinessDiagnostic[];
  warnings?: readonly ReadinessDiagnostic[];
  providerConfigured?: boolean;
  providerBlockers?: readonly ReadinessDiagnostic[];
}): GenerationReadiness {
  const blockers = input.blockers ?? [];
  const warnings = input.warnings ?? [];
  const providerConfigured = input.providerConfigured ?? true;
  const providerBlockers = input.providerBlockers ?? [];

  return {
    status: blockers.length > 0 ? "blocked" : warnings.length > 0 ? "ready-with-warnings" : "ready",
    canSaveDraft: true,
    canPreview: blockers.length === 0,
    canGenerate: blockers.length === 0 && providerBlockers.length === 0,
    blockers,
    warnings,
    provider: { configured: providerConfigured, blockers: providerBlockers },
    unsavedDraft: { hasUnsavedChanges: false, readinessMayBeStale: false },
    summary: blockers.length > 0 || providerBlockers.length > 0
      ? { headline: "Ideate is blocked", nextAction: "Fix blockers." }
      : warnings.length > 0
        ? { headline: "Ready with recommendations", nextAction: "Review warnings if useful." }
        : { headline: "Ready to ideate", nextAction: "Prompt inspection and Ideate are available." }
  };
}

function readinessDiagnostic(input: {
  severity: "blocker" | "warning";
  code: string;
  legacyCode: string;
  title: string;
  group: ReadinessDiagnostic["group"];
}): ReadinessDiagnostic {
  return {
    severity: input.severity,
    code: input.code,
    title: input.title,
    group: input.group,
    summary: `${input.title} summary.`,
    whyItMatters: `${input.title} matters.`,
    fastestFix: `${input.title} fastest fix.`,
    affected: [],
    actions: [{ kind: "copy-technical-json", label: "Copy technical JSON" }],
    dedupeKey: `${input.severity}:${input.code}`,
    sortKey: `${input.severity}:${input.code}`,
    technical: {
      legacyCode: input.legacyCode,
      ruleId: input.legacyCode,
      rawPaths: []
    }
  };
}
