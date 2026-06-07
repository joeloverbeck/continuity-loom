// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import { GenerationBriefView } from "./GenerationBriefView.js";
import { getGenerationBrief, listStoryConfig, setGenerationBrief, validate } from "../api.js";

vi.mock("../api.js", () => ({
  getGenerationBrief: vi.fn(),
  listStoryConfig: vi.fn(),
  setGenerationBrief: vi.fn(),
  validate: vi.fn()
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
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
    vi.mocked(getGenerationBrief).mockResolvedValue({ ok: true, session: {} });
    vi.mocked(listStoryConfig).mockResolvedValue({
      ok: true,
      configs: {
        "PROSE MODE": { pov_character: "omniscient", person: "third", tense: "past" }
      }
    });
    vi.mocked(setGenerationBrief).mockResolvedValue({ ok: true });
    vi.mocked(validate).mockResolvedValue({ blockers: [], warnings: [], isBlocked: false });

    renderView();

    expect(await screen.findByText(/PROSE MODE source: omniscient \/ third \/ past/)).toBeTruthy();
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
  });

  it("shows deterministic non-blocking warnings while still saving", async () => {
    vi.mocked(getGenerationBrief).mockResolvedValue({ ok: true, session: {} });
    vi.mocked(listStoryConfig).mockResolvedValue({ ok: true, configs: {} });
    vi.mocked(setGenerationBrief).mockResolvedValue({ ok: true });
    vi.mocked(validate).mockResolvedValue({ blockers: [], warnings: [], isBlocked: false });

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
    fireEvent.click(screen.getByRole("button", { name: "Save Generation Brief" }));
    await waitFor(() => expect(setGenerationBrief).toHaveBeenCalled());
  });

  it("offers all current-cast local functions including present_minor_speaker", async () => {
    vi.mocked(getGenerationBrief).mockResolvedValue({ ok: true, session: {} });
    vi.mocked(listStoryConfig).mockResolvedValue({ ok: true, configs: {} });
    vi.mocked(validate).mockResolvedValue({ blockers: [], warnings: [], isBlocked: false });

    renderView();

    const selector = await screen.findByLabelText(/^local_function/);
    expect(within(selector).getByRole("option", { name: "present_minor_speaker" })).toBeTruthy();
    expect(within(selector).getAllByRole("option")).toHaveLength(7);
  });
});
