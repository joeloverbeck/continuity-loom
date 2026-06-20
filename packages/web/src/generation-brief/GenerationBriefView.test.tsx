// @vitest-environment jsdom

import { generationSessionDraftSchema, type GenerationReadiness, type ReadinessDiagnostic } from "@loom/core";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { GenerationBriefView } from "./GenerationBriefView.js";
import { BriefFieldRow } from "./BriefFieldRow.js";
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
  it("renders editable widgets for every current authoritative state field", async () => {
    const jonId = "019ea213-8f7e-73dc-8e5b-67ba95ca94fe";
    vi.mocked(getGenerationBrief).mockResolvedValue({ ok: true, session: {}, defaults: briefDefaults });
    vi.mocked(listStoryConfig).mockResolvedValue({ ok: true, configs: {} });
    vi.mocked(listRecords).mockResolvedValue({
      ok: true,
      records: [recordSummary({ id: jonId, displayLabel: "Jon Ureña" })]
    });
    vi.mocked(readiness).mockResolvedValue(readinessFixture({}));

    renderView();

    await screen.findByRole("heading", { name: "Generation Brief" });
    for (const field of [
      "current_time",
      "current_location",
      "onstage_entities",
      "immediate_situation_summary",
      "offstage_pressuring_entities",
      "positions",
      "possessions",
      "visible_conditions",
      "environmental_conditions",
      "entity_statuses",
      "line_of_sight_and_visibility",
      "pov_cannot_perceive_now",
      "routes_and_exits",
      "available_time",
      "consent_or_force_conditions",
      "current_locks"
    ]) {
      expect(screen.getByLabelText(new RegExp(field))).toBeTruthy();
    }
  });

  it("links to Ideate from the brief shell", async () => {
    vi.mocked(getGenerationBrief).mockResolvedValue({ ok: true, session: {}, defaults: briefDefaults });
    vi.mocked(listStoryConfig).mockResolvedValue({ ok: true, configs: {} });
    vi.mocked(readiness).mockResolvedValue(readinessFixture({}));

    renderView();

    await screen.findByRole("heading", { name: "Generation Brief" });
    expect(screen.getByRole("link", { name: "Stuck? Get ideas" }).getAttribute("href")).toBe("/ideate");
  });

  it("shows an always-required marker on required generation-brief fields", async () => {
    vi.mocked(getGenerationBrief).mockResolvedValue({ ok: true, session: {}, defaults: briefDefaults });
    vi.mocked(listStoryConfig).mockResolvedValue({ ok: true, configs: {} });
    vi.mocked(readiness).mockResolvedValue(readinessFixture({}));

    renderView();

    await screen.findByRole("heading", { name: "Generation Brief" });
    const immediateSituationLabel = labelFor(/immediate_situation_summary/);

    expect(within(immediateSituationLabel).getByLabelText("required")).toBeTruthy();
  });

  it("renders a section rail whose links resolve to the brief headings", async () => {
    vi.mocked(getGenerationBrief).mockResolvedValue({ ok: true, session: {}, defaults: briefDefaults });
    vi.mocked(listStoryConfig).mockResolvedValue({ ok: true, configs: {} });
    vi.mocked(readiness).mockResolvedValue(readinessFixture({}));

    renderView();

    await screen.findByRole("heading", { name: "Generation Brief" });
    const nav = screen.getByRole("navigation", { name: "Generation brief sections" });
    const links = within(nav).getAllByRole("link");

    expect(links).toHaveLength(9);
    for (const link of links) {
      const targetId = link.getAttribute("href")?.replace(/^#/, "");

      expect(targetId).toBeTruthy();
      expect(document.getElementById(targetId!)).not.toBeNull();
    }
    expect(within(nav).getByRole("link", { name: /current state.*4 required empty/i })).toBeTruthy();
  });

  it("does not render the contextual save bar before edits", async () => {
    vi.mocked(getGenerationBrief).mockResolvedValue({ ok: true, session: {}, defaults: briefDefaults });
    vi.mocked(listStoryConfig).mockResolvedValue({ ok: true, configs: {} });
    vi.mocked(readiness).mockResolvedValue(readinessFixture({}));

    renderView();

    await screen.findByRole("heading", { name: "Generation Brief" });

    expect(screen.queryByText("Unsaved changes - readiness shown above may be stale.")).toBeNull();
    expect(screen.queryByRole("button", { name: "Save Generation Brief" })).toBeNull();
  });

  it("flips continuation-field markers from first-segment optional to continuation required locally", async () => {
    vi.mocked(getGenerationBrief).mockResolvedValue({ ok: true, session: {}, defaults: briefDefaults });
    vi.mocked(listStoryConfig).mockResolvedValue({ ok: true, configs: {} });
    vi.mocked(readiness).mockResolvedValue(readinessFixture({}));

    renderView();

    await screen.findByRole("heading", { name: "Generation Brief" });
    expect(within(labelFor(/recent_causal_context/)).getByText("Optional for a first segment")).toBeTruthy();

    vi.mocked(readiness).mockClear();
    fireEvent.change(screen.getByLabelText(/generation_context/), {
      target: { value: "continuation_after_accepted_segment" }
    });

    const recentCausalContextLabel = labelFor(/recent_causal_context/);
    expect(within(recentCausalContextLabel).getByLabelText("required")).toBeTruthy();
    expect(within(recentCausalContextLabel).queryByText("Optional for a first segment")).toBeNull();
    expect(readiness).not.toHaveBeenCalled();
  });

  it("shows conditional and optional markers without treating conditional fields as required", async () => {
    vi.mocked(getGenerationBrief).mockResolvedValue({ ok: true, session: {}, defaults: briefDefaults });
    vi.mocked(listStoryConfig).mockResolvedValue({ ok: true, configs: {} });
    vi.mocked(readiness).mockResolvedValue(readinessFixture({}));

    renderView();

    await screen.findByRole("heading", { name: "Generation Brief" });
    const positionsLabel = labelFor(/positions/);
    expect(within(positionsLabel).getByLabelText("conditional")).toBeTruthy();
    expect(within(positionsLabel).queryByLabelText("required")).toBeNull();

    expect(within(labelFor(/soft_unit_guidance/)).getByText("Optional")).toBeTruthy();
  });

  it("persists a new current-state array field and displays it after reload", async () => {
    vi.mocked(getGenerationBrief).mockResolvedValue({ ok: true, session: {}, defaults: briefDefaults });
    vi.mocked(listStoryConfig).mockResolvedValue({ ok: true, configs: {} });
    vi.mocked(setGenerationBrief).mockResolvedValue({ ok: true, session: {} });
    vi.mocked(readiness).mockResolvedValue(readinessFixture({}));

    renderView();

    const routesAndExits = await screen.findByLabelText(/routes_and_exits/);
    fireEvent.change(routesAndExits, { target: { value: "cellar stairs\nblocked delivery hatch" } });
    fireEvent.click(screen.getByRole("button", { name: "Save Generation Brief" }));

    await waitFor(() => expect(setGenerationBrief).toHaveBeenCalled());
    const payload = vi.mocked(setGenerationBrief).mock.calls[0]?.[0] as Record<string, unknown>;
    expect(payload).toMatchObject({
      current_authoritative_state: {
        routes_and_exits: ["cellar stairs", "blocked delivery hatch"]
      }
    });
    expect(() => generationSessionDraftSchema.parse(payload)).not.toThrow();

    cleanup();
    vi.mocked(getGenerationBrief).mockResolvedValue({
      ok: true,
      session: {
        current_authoritative_state: {
          routes_and_exits: ["cellar stairs", "blocked delivery hatch"]
        }
      },
      defaults: briefDefaults
    });

    renderView();

    const reloadedRoutes = await screen.findByLabelText(/routes_and_exits/);
    expect((reloadedRoutes as HTMLTextAreaElement).value).toBe("cellar stairs\nblocked delivery hatch");
  });

  it("edits and reloads all handoff and directive detail fields", async () => {
    vi.mocked(getGenerationBrief).mockResolvedValue({ ok: true, session: {}, defaults: briefDefaults });
    vi.mocked(listStoryConfig).mockResolvedValue({ ok: true, configs: {} });
    vi.mocked(setGenerationBrief).mockResolvedValue({ ok: true, session: {} });
    vi.mocked(readiness).mockResolvedValue(readinessFixture({}));

    renderView();

    const lastVisibleMoment = await screen.findByLabelText(/last_visible_moment/);
    const beginAfter = screen.getByLabelText(/begin_after/);
    const mayRender = screen.getByLabelText(/may_render_if_naturally_caused/);
    const doNotForce = screen.getByLabelText(/do_not_force/);

    fireEvent.change(lastVisibleMoment, { target: { value: "Mara lowers the lamp." } });
    fireEvent.change(beginAfter, { target: { value: "Begin after Jon hears the latch." } });
    fireEvent.change(mayRender, { target: { value: "  Rain may interrupt.\n\nThe latch may stick.  " } });
    fireEvent.change(doNotForce, { target: { value: "  Do not reveal the caller.\n\tDo not leave the room.  " } });

    expect((lastVisibleMoment as HTMLTextAreaElement).value).toBe("Mara lowers the lamp.");
    expect((beginAfter as HTMLTextAreaElement).value).toBe("Begin after Jon hears the latch.");
    expect((mayRender as HTMLTextAreaElement).value).toBe("  Rain may interrupt.\n\nThe latch may stick.  ");
    expect((doNotForce as HTMLTextAreaElement).value).toBe("  Do not reveal the caller.\n\tDo not leave the room.  ");

    fireEvent.click(screen.getByRole("button", { name: "Save Generation Brief" }));

    await waitFor(() => expect(setGenerationBrief).toHaveBeenCalled());
    const payload = vi.mocked(setGenerationBrief).mock.calls[0]?.[0] as Record<string, unknown>;
    expect(payload).toMatchObject({
      immediate_handoff: {
        last_visible_moment: "Mara lowers the lamp.",
        begin_after: "Begin after Jon hears the latch."
      },
      manual_moment_directive: {
        may_render_if_naturally_caused: ["Rain may interrupt.", "The latch may stick."],
        do_not_force: ["Do not reveal the caller.", "Do not leave the room."]
      }
    });
    expect(() => generationSessionDraftSchema.parse(payload)).not.toThrow();

    cleanup();
    vi.mocked(getGenerationBrief).mockResolvedValue({
      ok: true,
      session: {
        immediate_handoff: {
          last_visible_moment: "Mara lowers the lamp.",
          begin_after: "Begin after Jon hears the latch."
        },
        manual_moment_directive: {
          may_render_if_naturally_caused: ["Rain may interrupt.", "The latch may stick."],
          do_not_force: ["Do not reveal the caller.", "Do not leave the room."]
        }
      },
      defaults: briefDefaults
    });

    renderView();

    expect(await screen.findByLabelText(/last_visible_moment/)).toMatchObject({ value: "Mara lowers the lamp." });
    expect(screen.getByLabelText(/begin_after/)).toMatchObject({ value: "Begin after Jon hears the latch." });
    expect(screen.getByLabelText(/may_render_if_naturally_caused/)).toMatchObject({
      value: "Rain may interrupt.\nThe latch may stick."
    });
    expect(screen.getByLabelText(/do_not_force/)).toMatchObject({
      value: "Do not reveal the caller.\nDo not leave the room."
    });
  });

  it("edits all eight surfaces and persists them through the brief client", async () => {
    const jonId = "019ea213-8f7e-73dc-8e5b-67ba95ca94fe";
    vi.mocked(getGenerationBrief).mockResolvedValue({ ok: true, session: {}, defaults: briefDefaults });
    vi.mocked(listStoryConfig).mockResolvedValue({
      ok: true,
      configs: {
        "PROSE MODE": { pov_character: "omniscient", person: "third", tense: "past" }
      }
    });
    vi.mocked(listRecords).mockResolvedValue({
      ok: true,
      records: [recordSummary({ id: jonId, displayLabel: "Jon Ureña" })]
    });
    vi.mocked(setGenerationBrief).mockResolvedValue({ ok: true, session: {} });
    vi.mocked(readiness).mockResolvedValue(readinessFixture({}));

    renderView();

    expect(await screen.findByText(/PROSE MODE source: omniscient \/ third \/ past/)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Help for Prior accepted-prose status / handoff note" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Help for Last visible moment" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Help for Begin after" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Help for Must render" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Help for May render if naturally caused" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Help for Do not force" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Help for Generation context checks" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Help for Soft unit guidance" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Help for Current location" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Help for Onstage entities" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Help for Immediate situation summary" })).toBeTruthy();
    expect(screen.getByRole("option", { name: "Use PROSE MODE default" })).toBeTruthy();
    expect(screen.getByRole("option", { name: "Omniscient" })).toBeTruthy();
    fireEvent.change(screen.getByLabelText(/selected_pov/), { target: { value: "omniscient" } });
    fireEvent.change(screen.getByLabelText(/current_time/), { target: { value: "midnight" } });
    fireEvent.change(screen.getByLabelText(/current_location/), { target: { value: "loading dock" } });
    const onstageEntities = screen.getByLabelText(/onstage_entities/);
    const jonOption = within(onstageEntities).getByRole<HTMLOptionElement>("option", { name: "Jon Ureña" });
    jonOption.selected = true;
    fireEvent.change(onstageEntities);
    fireEvent.change(screen.getByLabelText(/immediate_situation_summary/), {
      target: { value: "Jon is at the loading dock with the door half open." }
    });
    fireEvent.change(screen.getByLabelText(/recent_causal_context/), { target: { value: "A reached the gate." } });
    fireEvent.change(screen.getByLabelText(/last_visible_moment/), { target: { value: "A stood at the gate." } });
    fireEvent.change(screen.getByLabelText(/prior_accepted_prose_status_or_handoff_note/), { target: { value: "handoff only" } });
    fireEvent.change(screen.getByLabelText(/begin_after/), { target: { value: "Begin with the gate latch." } });
    fireEvent.change(screen.getByLabelText(/must_render/), { target: { value: "The lock opens." } });
    fireEvent.change(screen.getByLabelText(/may_render_if_naturally_caused/), { target: { value: "The hinge complains." } });
    fireEvent.change(screen.getByLabelText(/do_not_force/), { target: { value: "Do not leave the dock." } });
    fireEvent.change(screen.getByLabelText(/cast_member_id/), { target: { value: "019b0298-5c00-7000-8000-000000000001" } });
    fireEvent.change(screen.getByLabelText(/current_voice_pressure/), { target: { value: "clipped and wary" } });
    fireEvent.change(screen.getByLabelText(/override_text/), { target: { value: "shorter answers only" } });
    fireEvent.change(screen.getByLabelText(/generation_context/), { target: { value: "continuation_after_accepted_segment" } });
    fireEvent.change(screen.getByLabelText(/soft_unit_guidance/), { target: { value: "Stop after the reply." } });
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
      current_authoritative_state: {
        current_time: "midnight",
        current_location: "loading dock",
        onstage_entities: [jonId],
        immediate_situation_summary: "Jon is at the loading dock with the door half open."
      },
      immediate_handoff: {
        recent_causal_context: "A reached the gate.",
        last_visible_moment: "A stood at the gate.",
        begin_after: "Begin with the gate latch."
      },
      manual_moment_directive: {
        must_render: ["The lock opens."],
        may_render_if_naturally_caused: ["The hinge complains."],
        do_not_force: ["Do not leave the dock."]
      },
      current_cast_voice_pressure: [{ current_voice_pressure: "clipped and wary" }],
      cast_voice_overrides: [{ override_text: "shorter answers only" }],
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

    const selectedPov = await screen.findByLabelText(/selected_pov/);
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

    const selectedPov = await screen.findByLabelText(/selected_pov/);
    expect((selectedPov as HTMLSelectElement).value).toBe(missingId);
    expect(within(selectedPov).getByRole("option", { name: `Unknown entity (${missingId.slice(0, 8)})` })).toBeTruthy();
  });

  it("uses canonical generation-brief guidance keys and reconciles static doctrine hints", async () => {
    vi.mocked(getGenerationBrief).mockResolvedValue({ ok: true, session: {}, defaults: briefDefaults });
    vi.mocked(listStoryConfig).mockResolvedValue({ ok: true, configs: {} });
    vi.mocked(readiness).mockResolvedValue(readinessFixture({}));

    renderView();

    await screen.findByRole("heading", { name: "Generation Brief" });
    const handoffHelp = screen.getByRole("button", { name: "Help for Prior accepted-prose status / handoff note" });

    expect(handoffHelp.getAttribute("aria-controls")).toBe(
      "field-help-generation-brief-immediate-handoff-prior-accepted-prose-status-or-handoff-note"
    );
    expect(screen.getAllByText("Completeness checks, not plot beats.")).toHaveLength(1);
    expect(screen.getAllByText("Stop at the next local response point; do not ask for downstream consequences."))
      .toHaveLength(1);

    fireEvent.click(handoffHelp);

    expect(screen.getAllByText("A handoff note about accepted prose status, not prose authority.").length).toBeGreaterThan(1);
    expect(screen.getAllByText("Accepted prose is readable output, not continuity authority.")).toHaveLength(1);
  });

  it("renders helper text inline and wires controls with aria-describedby", async () => {
    vi.mocked(getGenerationBrief).mockResolvedValue({ ok: true, session: {}, defaults: briefDefaults });
    vi.mocked(listStoryConfig).mockResolvedValue({ ok: true, configs: {} });
    vi.mocked(readiness).mockResolvedValue(readinessFixture({}));

    renderView();

    const summary = await screen.findByLabelText(/immediate_situation_summary/);
    const helperId = summary.getAttribute("aria-describedby");

    expect(helperId).toBeTruthy();
    expect(document.getElementById(helperId!)?.textContent).toBe("Short user-authored summary of the immediate local situation.");
  });

  it("falls back to the schema leaf when displayLabel metadata is absent", () => {
    render(
      <BriefFieldRow path="unknown_branch.fallback_label" schemaLabel="fallback_label" generationContext="first_segment">
        <input />
      </BriefFieldRow>
    );

    expect(screen.getByLabelText(/fallback_label/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Help for/ })).toBeNull();
  });

  it("preserves in-progress trailing spaces while editing must_render", async () => {
    vi.mocked(getGenerationBrief).mockResolvedValue({ ok: true, session: {}, defaults: briefDefaults });
    vi.mocked(listStoryConfig).mockResolvedValue({ ok: true, configs: {} });
    vi.mocked(readiness).mockResolvedValue(readinessFixture({}));

    renderView();

    const mustRender = await screen.findByLabelText(/must_render/);
    fireEvent.change(mustRender, { target: { value: "door closing " } });

    expect((mustRender as HTMLTextAreaElement).value).toBe("door closing ");
  });

  it("normalizes must_render lines only when saving the draft", async () => {
    vi.mocked(getGenerationBrief).mockResolvedValue({ ok: true, session: {}, defaults: briefDefaults });
    vi.mocked(listStoryConfig).mockResolvedValue({ ok: true, configs: {} });
    vi.mocked(setGenerationBrief).mockResolvedValue({ ok: true, session: {} });
    vi.mocked(readiness).mockResolvedValue(readinessFixture({}));

    renderView();

    const mustRender = await screen.findByLabelText(/must_render/);
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
    fireEvent.change(screen.getByLabelText(/prior_accepted_prose_status_or_handoff_note/), {
      target: {
        value: "This is a long paragraph. It reads like finished prose. It keeps going. It should be summarized instead."
      }
    });
    fireEvent.change(screen.getByLabelText(/soft_unit_guidance/), { target: { value: "Write the whole chapter." } });

    expect(screen.getByText(/looks like pasted prose/i)).toBeTruthy();
    expect(screen.getByText(/sounds non-local/i)).toBeTruthy();
    expect(screen.getAllByText("Current state is required.").length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("button", { name: "Save Generation Brief" }));
    await waitFor(() => expect(setGenerationBrief).toHaveBeenCalled());
    expect(await screen.findByText("Draft saved.")).toBeTruthy();
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
    fireEvent.change(screen.getByLabelText(/soft_unit_guidance/), { target: { value: "Stop after one local beat." } });
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
    fireEvent.change(screen.getByLabelText(/soft_unit_guidance/), { target: { value: "Stop after one local beat." } });
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
    fireEvent.change(screen.getByLabelText(/soft_unit_guidance/), { target: { value: "Stop." } });
    expect(screen.getByText("Unsaved changes - readiness shown above may be stale.")).toBeTruthy();
    expect(readiness).toHaveBeenCalledTimes(initialValidationCalls);

    fireEvent.click(screen.getByRole("button", { name: "Save Generation Brief" }));

    await waitFor(() => expect(readiness).toHaveBeenCalledTimes(initialValidationCalls + 1));
    expect(screen.queryByText("Unsaved changes - readiness shown above may be stale.")).toBeNull();
    expect(screen.queryByRole("button", { name: "Save Generation Brief" })).toBeNull();
    expect(await screen.findByText("Draft saved.")).toBeTruthy();
  });
});

function labelFor(name: RegExp): HTMLLabelElement {
  const control = screen.getByLabelText(name);
  const label = control.id ? document.querySelector(`label[for="${control.id}"]`) : control.closest("label");

  if (!(label instanceof HTMLLabelElement)) {
    throw new Error(`Could not find label for ${name}`);
  }

  return label;
}

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
