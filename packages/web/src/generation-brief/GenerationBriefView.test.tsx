// @vitest-environment jsdom

import { generationSessionDraftSchema, type GenerationReadiness, type ReadinessDiagnostic } from "@loom/core";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { GenerationBriefView } from "./GenerationBriefView.js";
import { getGenerationBrief, listRecords, listStoryConfig, readiness, setGenerationBrief } from "../api.js";

vi.mock("../api.js", () => ({
  getGenerationBrief: vi.fn(),
  listRecords: vi.fn(),
  listStoryConfig: vi.fn(),
  readiness: vi.fn(),
  setGenerationBrief: vi.fn(),
}));

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

const originalResizeObserver = globalThis.ResizeObserver;
const briefDefaults = {
  generation_context: {
    value: "first_segment" as const,
    source: "accepted-segment-count" as const,
    acceptedSegmentCount: 0
  }
};

beforeAll(() => {
  globalThis.ResizeObserver = ResizeObserverStub;
});

beforeEach(() => {
  vi.mocked(listRecords).mockResolvedValue({ ok: true, records: [] });
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

afterAll(() => {
  globalThis.ResizeObserver = originalResizeObserver;
});

function renderView(): void {
  render(
    <MemoryRouter>
      <GenerationBriefView />
    </MemoryRouter>
  );
}

describe("GenerationBriefView", () => {
  it("edits all eight surfaces and persists them through the brief client", async () => {
    vi.mocked(getGenerationBrief).mockResolvedValue({ ok: true, session: {}, defaults: briefDefaults });
    vi.mocked(listStoryConfig).mockResolvedValue({
      ok: true,
      configs: {
        "PROSE MODE": { pov_character: "omniscient", person: "third", tense: "past" }
      }
    });
    vi.mocked(setGenerationBrief).mockResolvedValue({ ok: true, session: {} });
    vi.mocked(readiness).mockResolvedValue(readinessFixture({}));

    renderView();

    expect(await screen.findByText(/PROSE MODE source: omniscient \/ third \/ past/)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Help for prior_accepted_prose_status_or_handoff_note" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Help for must_render" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Help for generation_context" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Help for soft_unit_guidance" })).toBeTruthy();
    expect(screen.getByRole("option", { name: "Use PROSE MODE default" })).toBeTruthy();
    expect(screen.getByRole("option", { name: "Omniscient" })).toBeTruthy();
    fireEvent.change(screen.getByLabelText(/^selected_pov/), { target: { value: "omniscient" } });
    fireEvent.change(screen.getByLabelText(/^current_time/), { target: { value: "midnight" } });
    fireEvent.change(screen.getByLabelText(/^recent_causal_context/), { target: { value: "A reached the gate." } });
    fireEvent.change(screen.getByLabelText(/^prior_accepted_prose_status_or_handoff_note/), { target: { value: "handoff only" } });
    fireEvent.change(screen.getByLabelText(/^must_render/), { target: { value: "The lock opens." } });
    fireEvent.change(screen.getByLabelText(/^cast_member_id/), { target: { value: "019b0298-5c00-7000-8000-000000000001" } });
    fireEvent.change(screen.getByLabelText(/^local_function/), { target: { value: "present_minor_speaker" } });
    fireEvent.change(screen.getByLabelText(/^current_voice_pressure/), { target: { value: "clipped and wary" } });
    fireEvent.change(screen.getByLabelText(/^override_text/), { target: { value: "shorter answers only" } });
    fireEvent.change(screen.getByLabelText(/^generation_context/), { target: { value: "continuation_after_accepted_segment" } });
    fireEvent.change(screen.getByLabelText(/^soft_unit_guidance/), { target: { value: "Stop after the reply." } });
    fireEvent.click(screen.getByRole("button", { name: "Save Generation Brief" }));

    await waitFor(() => expect(setGenerationBrief).toHaveBeenCalled());
    const payload = vi.mocked(setGenerationBrief).mock.calls[0]?.[0] as Record<string, unknown>;
    expect(Object.keys(payload).sort()).toEqual([
      "active_working_set",
      "cast_voice_overrides",
      "current_authoritative_state",
      "current_cast_voice_pressure",
      "generation_validation_focus",
      "immediate_handoff",
      "manual_moment_directive",
      "stop_guidance"
    ].sort());
    expect(payload).toMatchObject({
      active_working_set: { selected_pov: "omniscient" },
      current_authoritative_state: { current_time: "midnight" },
      immediate_handoff: { recent_causal_context: "A reached the gate." },
      manual_moment_directive: { must_render: ["The lock opens."] },
      current_cast_voice_pressure: [{ local_function: "present_minor_speaker", current_voice_pressure: "clipped and wary" }],
      cast_voice_overrides: [{ scope: "current_generation_only", override_text: "shorter answers only" }],
      generation_validation_focus: {
        validation_focus_tags: { generation_context: ["continuation_after_accepted_segment"] }
      },
      stop_guidance: { soft_unit_guidance: "Stop after the reply." }
    });
    expect(await screen.findByText("Draft saved.")).toBeTruthy();
  });

  it("shows entity POV options, saves canonical selected_pov values, and supports the prose-mode default", async () => {
    const jonId = "019ea213-8f7e-73dc-8e5b-67ba95ca94fe";
    const aneId = "019ea213-8f7e-73dc-8e5b-67ba95ca9500";
    vi.mocked(getGenerationBrief).mockResolvedValue({ ok: true, session: {}, defaults: briefDefaults });
    vi.mocked(listStoryConfig).mockResolvedValue({
      ok: true,
      configs: {
        "PROSE MODE": { pov_character: "omniscient", person: "third", tense: "past" }
      }
    });
    vi.mocked(listRecords).mockResolvedValue({
      ok: true,
      records: [
        recordSummary({ id: jonId, displayLabel: "Jon Ureña" }),
        recordSummary({ id: aneId, displayLabel: "Ane Arrieta" })
      ]
    });
    vi.mocked(setGenerationBrief).mockResolvedValue({ ok: true, session: {} });
    vi.mocked(readiness).mockResolvedValue(readinessFixture({}));

    renderView();

    const selectedPov = await screen.findByLabelText(/^selected_pov/);
    expect(within(selectedPov).getByRole("option", { name: "Use PROSE MODE default" })).toBeTruthy();
    expect(within(selectedPov).getByRole("option", { name: "Omniscient" })).toBeTruthy();
    expect(within(selectedPov).getByRole("option", { name: "Ane Arrieta" })).toBeTruthy();
    expect(within(selectedPov).getByRole("option", { name: "Jon Ureña" })).toBeTruthy();

    fireEvent.change(selectedPov, { target: { value: jonId } });
    fireEvent.click(screen.getByRole("button", { name: "Save Generation Brief" }));

    await waitFor(() => expect(setGenerationBrief).toHaveBeenCalledTimes(1));
    const entityPayload = vi.mocked(setGenerationBrief).mock.calls[0]?.[0] as Record<string, unknown>;
    expect(entityPayload).toMatchObject({ active_working_set: { selected_pov: jonId } });
    expect(() => generationSessionDraftSchema.parse(entityPayload)).not.toThrow();

    fireEvent.change(selectedPov, { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "Save Generation Brief" }));

    await waitFor(() => expect(setGenerationBrief).toHaveBeenCalledTimes(2));
    const defaultPayload = vi.mocked(setGenerationBrief).mock.calls[1]?.[0] as Record<string, unknown>;
    expect((defaultPayload.active_working_set as { selected_pov?: unknown }).selected_pov).toBeUndefined();
    expect(() => generationSessionDraftSchema.parse(defaultPayload)).not.toThrow();
  });

  it("renders matching PROSE MODE pov_character UUIDs by entity display label and preserves literals", async () => {
    const jonId = "019ea213-8f7e-73dc-8e5b-67ba95ca94fe";
    vi.mocked(getGenerationBrief).mockResolvedValue({ ok: true, session: {}, defaults: briefDefaults });
    vi.mocked(listStoryConfig).mockResolvedValue({
      ok: true,
      configs: {
        "PROSE MODE": { pov_character: jonId, person: "first", tense: "present" }
      }
    });
    vi.mocked(listRecords).mockResolvedValue({
      ok: true,
      records: [recordSummary({ id: jonId, displayLabel: "Jon Ureña" })]
    });
    vi.mocked(readiness).mockResolvedValue(readinessFixture({}));

    renderView();

    expect(await screen.findByText("PROSE MODE source: Jon Ureña / first / present")).toBeTruthy();
    expect(screen.queryByText(new RegExp(jonId))).toBeNull();
  });

  it("renders variable PROSE MODE pov_character literally", async () => {
    vi.mocked(getGenerationBrief).mockResolvedValue({ ok: true, session: {}, defaults: briefDefaults });
    vi.mocked(listStoryConfig).mockResolvedValue({
      ok: true,
      configs: {
        "PROSE MODE": { pov_character: "variable", person: "third", tense: "present" }
      }
    });
    vi.mocked(readiness).mockResolvedValue(readinessFixture({}));

    renderView();

    expect(await screen.findByText("PROSE MODE source: variable / third / present")).toBeTruthy();
  });

  it("keeps a dangling selected_pov UUID selectable without relabeling it as a known entity", async () => {
    const missingId = "019ea213-8f7e-73dc-8e5b-67ba95ca94fe";
    vi.mocked(getGenerationBrief).mockResolvedValue({
      ok: true,
      session: { active_working_set: { selected_pov: missingId } },
      defaults: briefDefaults
    });
    vi.mocked(listStoryConfig).mockResolvedValue({ ok: true, configs: {} });
    vi.mocked(readiness).mockResolvedValue(readinessFixture({}));

    renderView();

    const selectedPov = await screen.findByLabelText(/^selected_pov/);
    expect((selectedPov as HTMLSelectElement).value).toBe(missingId);
    expect(within(selectedPov).getByRole("option", { name: `Unknown entity (${missingId.slice(0, 8)})` })).toBeTruthy();
  });

  it("uses canonical generation-brief guidance keys and reconciles static doctrine hints", async () => {
    vi.mocked(getGenerationBrief).mockResolvedValue({ ok: true, session: {}, defaults: briefDefaults });
    vi.mocked(listStoryConfig).mockResolvedValue({ ok: true, configs: {} });
    vi.mocked(readiness).mockResolvedValue(readinessFixture({}));

    renderView();

    await screen.findByRole("heading", { name: "Generation Brief" });
    const handoffHelp = screen.getByRole("button", { name: "Help for prior_accepted_prose_status_or_handoff_note" });

    expect(handoffHelp.getAttribute("aria-controls")).toBe(
      "field-help-generation-brief-immediate-handoff-prior-accepted-prose-status-or-handoff-note"
    );
    expect(screen.getAllByText("Completeness checks, not plot beats.")).toHaveLength(1);
    expect(screen.getAllByText("Stop at the next local response point; do not ask for downstream consequences."))
      .toHaveLength(1);

    fireEvent.click(handoffHelp);

    expect(await screen.findByText("A handoff note about accepted prose status, not prose authority.")).toBeTruthy();
    expect(screen.getAllByText("Accepted prose is readable output, not continuity authority.")).toHaveLength(1);
  });

  it("preserves in-progress trailing spaces while editing must_render", async () => {
    vi.mocked(getGenerationBrief).mockResolvedValue({ ok: true, session: {}, defaults: briefDefaults });
    vi.mocked(listStoryConfig).mockResolvedValue({ ok: true, configs: {} });
    vi.mocked(readiness).mockResolvedValue(readinessFixture({}));

    renderView();

    const mustRender = await screen.findByLabelText(/^must_render/);
    fireEvent.change(mustRender, { target: { value: "door closing " } });

    expect((mustRender as HTMLTextAreaElement).value).toBe("door closing ");
  });

  it("normalizes must_render lines only when saving the draft", async () => {
    vi.mocked(getGenerationBrief).mockResolvedValue({ ok: true, session: {}, defaults: briefDefaults });
    vi.mocked(listStoryConfig).mockResolvedValue({ ok: true, configs: {} });
    vi.mocked(setGenerationBrief).mockResolvedValue({ ok: true, session: {} });
    vi.mocked(readiness).mockResolvedValue(readinessFixture({}));

    renderView();

    const mustRender = await screen.findByLabelText(/^must_render/);
    fireEvent.change(mustRender, {
      target: {
        value: "  the door closing  \n\n  the candle guttering\t\n   "
      }
    });
    expect((mustRender as HTMLTextAreaElement).value).toBe("  the door closing  \n\n  the candle guttering\t\n   ");

    fireEvent.click(screen.getByRole("button", { name: "Save Generation Brief" }));

    await waitFor(() => expect(setGenerationBrief).toHaveBeenCalled());
    const payload = vi.mocked(setGenerationBrief).mock.calls[0]?.[0] as Record<string, unknown>;
    expect(payload).toMatchObject({
      manual_moment_directive: { must_render: ["the door closing", "the candle guttering"] }
    });
  });

  it("shows deterministic warnings and readiness blockers while still saving", async () => {
    vi.mocked(getGenerationBrief).mockResolvedValue({ ok: true, session: {}, defaults: briefDefaults });
    vi.mocked(listStoryConfig).mockResolvedValue({ ok: true, configs: {} });
    vi.mocked(setGenerationBrief).mockResolvedValue({ ok: true, session: {} });
    vi.mocked(readiness).mockResolvedValue(readinessFixture({
      blockers: [readinessDiagnostic({
        severity: "blocker",
        code: "missing-current-state",
        legacyCode: "missing-current-authoritative-state",
        title: "Current state is required.",
        group: "required-before-prompt-generation"
      })]
    }));

    renderView();

    await screen.findByRole("heading", { name: "Generation Brief" });
    fireEvent.change(screen.getByLabelText(/^prior_accepted_prose_status_or_handoff_note/), {
      target: {
        value: "This is a long paragraph. It reads like finished prose. It keeps going. It should be summarized instead."
      }
    });
    fireEvent.change(screen.getByLabelText(/^soft_unit_guidance/), { target: { value: "Write the whole chapter." } });

    expect(screen.getByText(/looks like pasted prose/i)).toBeTruthy();
    expect(screen.getByText(/sounds non-local/i)).toBeTruthy();
    expect(screen.getAllByText("Current state is required.").length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("button", { name: "Save Generation Brief" }));
    await waitFor(() => expect(setGenerationBrief).toHaveBeenCalled());
    expect(await screen.findByText("Draft saved.")).toBeTruthy();
  });

  it("offers all current-cast local functions including present_minor_speaker", async () => {
    vi.mocked(getGenerationBrief).mockResolvedValue({ ok: true, session: {}, defaults: briefDefaults });
    vi.mocked(listStoryConfig).mockResolvedValue({ ok: true, configs: {} });
    vi.mocked(readiness).mockResolvedValue(readinessFixture({}));

    renderView();

    const selector = await screen.findByLabelText(/^local_function/);
    expect(within(selector).getByRole("option", { name: "present_minor_speaker" })).toBeTruthy();
    expect(within(selector).getAllByRole("option")).toHaveLength(7);
  });

  it("saves a blank directive draft without fabricating a launch directive", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(getGenerationBrief).mockResolvedValue({ ok: true, session: {}, defaults: briefDefaults });
    vi.mocked(listStoryConfig).mockResolvedValue({ ok: true, configs: {} });
    vi.mocked(setGenerationBrief).mockResolvedValue({
      ok: true,
      session: {
        generation_validation_focus: {
          validation_focus_tags: { generation_context: ["first_segment"] }
        }
      }
    });
    vi.mocked(readiness).mockResolvedValue(readinessFixture({}));

    renderView();

    await screen.findByRole("heading", { name: "Generation Brief" });
    await waitFor(() => expect(readiness).toHaveBeenCalled());
    const initialValidationCalls = vi.mocked(readiness).mock.calls.length;
    expect(screen.getByText("Default: first segment because no accepted prose exists yet.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Save Generation Brief" }));

    await waitFor(() => expect(setGenerationBrief).toHaveBeenCalled());
    const payload = vi.mocked(setGenerationBrief).mock.calls[0]?.[0] as Record<string, unknown>;
    expect(payload).toMatchObject({
      manual_moment_directive: { must_render: [] }
    });
    expect(JSON.stringify(payload)).not.toContain("Continue the immediate moment.");
    expect(await screen.findByText("Draft saved.")).toBeTruthy();
    await waitFor(() => expect(readiness).toHaveBeenCalledTimes(initialValidationCalls + 1));
    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it("shows malformed-draft failures with technical issue paths", async () => {
    vi.mocked(getGenerationBrief).mockResolvedValue({ ok: true, session: {}, defaults: briefDefaults });
    vi.mocked(listStoryConfig).mockResolvedValue({ ok: true, configs: {} });
    vi.mocked(setGenerationBrief).mockResolvedValue({
      ok: false,
      kind: "malformed-draft",
      message: "The draft could not be saved because the request shape is invalid.",
      issues: [{ path: "active_working_set.selected_records.0", message: "Invalid UUID" }]
    });
    vi.mocked(readiness).mockResolvedValue(readinessFixture({}));

    renderView();

    await screen.findByRole("heading", { name: "Generation Brief" });
    fireEvent.click(screen.getByRole("button", { name: "Save Generation Brief" }));

    expect(await screen.findByText("The draft could not be saved because the request shape is invalid.")).toBeTruthy();
    fireEvent.click(screen.getByText("Technical details"));
    expect(screen.getByText("active_working_set.selected_records.0")).toBeTruthy();
  });

  it("marks readiness stale on unsaved edits and refreshes after save", async () => {
    vi.mocked(getGenerationBrief).mockResolvedValue({ ok: true, session: {}, defaults: briefDefaults });
    vi.mocked(listStoryConfig).mockResolvedValue({ ok: true, configs: {} });
    vi.mocked(setGenerationBrief).mockResolvedValue({ ok: true, session: {} });
    vi.mocked(readiness).mockResolvedValue(readinessFixture({}));

    renderView();

    await waitFor(() => expect(readiness).toHaveBeenCalled());
    const initialValidationCalls = vi.mocked(readiness).mock.calls.length;
    fireEvent.change(screen.getByLabelText(/^soft_unit_guidance/), { target: { value: "Stop." } });
    expect(screen.getByText("Displayed readiness may be stale until you save this draft.")).toBeTruthy();
    expect(readiness).toHaveBeenCalledTimes(initialValidationCalls);

    fireEvent.click(screen.getByRole("button", { name: "Save Generation Brief" }));

    await waitFor(() => expect(readiness).toHaveBeenCalledTimes(initialValidationCalls + 1));
    expect(screen.queryByText("Displayed readiness may be stale until you save this draft.")).toBeNull();
  });
});

function readinessFixture(input: {
  blockers?: readonly ReadinessDiagnostic[];
  warnings?: readonly ReadinessDiagnostic[];
}): GenerationReadiness {
  const blockers = input.blockers ?? [];
  const warnings = input.warnings ?? [];

  return {
    status: blockers.length > 0 ? "blocked" : warnings.length > 0 ? "ready-with-warnings" : "ready",
    canSaveDraft: true,
    canPreview: blockers.length === 0,
    canGenerate: blockers.length === 0,
    blockers,
    warnings,
    provider: { configured: true, blockers: [] },
    unsavedDraft: { hasUnsavedChanges: false, readinessMayBeStale: false },
    summary: blockers.length > 0
      ? { headline: "Generation is blocked", nextAction: "Fix blockers." }
      : { headline: "Ready to generate", nextAction: "Preview and Generate are available." }
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
    summary: input.title,
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

function recordSummary(input: { id: string; displayLabel: string }) {
  return {
    id: input.id,
    type: "ENTITY",
    displayLabel: input.displayLabel,
    status: null,
    salience: null,
    urgency: null,
    archived: false,
    userOrder: null,
    createdAt: "2026-06-08T00:00:00.000Z",
    updatedAt: "2026-06-08T00:00:00.000Z"
  };
}
