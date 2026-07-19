// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { WorkingSetView } from "./WorkingSetView.js";
import { getGenerationBrief, getWorkingSet, listRecords, setGenerationBrief, setWorkingSet, type RecordSummary } from "../api.js";

vi.mock("../api.js", () => ({
  getGenerationBrief: vi.fn(),
  getWorkingSet: vi.fn(),
  listRecords: vi.fn(),
  setGenerationBrief: vi.fn(),
  setWorkingSet: vi.fn()
}));

const records: RecordSummary[] = [
  {
    id: "019b0298-5c00-7000-8000-000000000011",
    type: "ENTITY",
    displayLabel: "Aster",
    status: null,
    salience: null,
    urgency: null,
    archived: false,
    userOrder: null,
    createdAt: "2026-06-05T00:00:00.000Z",
    updatedAt: "2026-06-05T00:00:00.000Z"
  },
  {
    id: "019b0298-5c00-7000-8000-000000000012",
    type: "FACT",
    displayLabel: "Door code",
    status: "active",
    salience: "high",
    urgency: null,
    archived: false,
    userOrder: null,
    createdAt: "2026-06-05T00:00:00.000Z",
    updatedAt: "2026-06-05T00:00:00.000Z"
  },
  {
    id: "019b0298-5c00-7000-8000-000000000013",
    type: "INTENTION",
    displayLabel: "Guard the west gate",
    status: "active",
    salience: null,
    urgency: "critical",
    archived: false,
    userOrder: null,
    createdAt: "2026-06-05T00:00:00.000Z",
    updatedAt: "2026-06-05T00:00:00.000Z"
  },
  {
    id: "019b0298-5c00-7000-8000-000000000014",
    type: "CAST MEMBER",
    displayLabel: "Aster cast",
    status: null,
    salience: null,
    urgency: null,
    archived: false,
    userOrder: null,
    createdAt: "2026-06-05T00:00:00.000Z",
    updatedAt: "2026-06-05T00:00:00.000Z"
  }
];

const briefGenerationContext = {
  savedValue: null,
  requiredValue: "first_segment" as const,
  acceptedSegmentCount: 0,
  coherent: true
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("WorkingSetView", () => {
  it("lists selected records grouped by type and removes membership explicitly", async () => {
    vi.mocked(listRecords).mockResolvedValue({ ok: true, records });
    vi.mocked(getWorkingSet).mockResolvedValue({
      ok: true,
      selectedRecordIds: ["019b0298-5c00-7000-8000-000000000012", "019b0298-5c00-7000-8000-000000000011"]
    });
    vi.mocked(getGenerationBrief).mockResolvedValue({ ok: true, session: {}, generationContext: briefGenerationContext });
    vi.mocked(setWorkingSet).mockImplementation((selectedRecordIds: string[]) =>
      Promise.resolve({ ok: true, selectedRecordIds })
    );

    render(<WorkingSetView />);

    expect(await screen.findByRole("heading", { name: "ENTITY" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "FACT" })).toBeTruthy();
    expect(screen.getAllByText("Aster").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Door code").length).toBeGreaterThan(0);
    expect(screen.queryByText("Guard the west gate")).toBeNull();
    expect(setWorkingSet).not.toHaveBeenCalled();

    const factSection = screen.getByRole("heading", { name: "FACT" }).closest("section");
    expect(factSection).not.toBeNull();
    fireEvent.click(within(factSection as HTMLElement).getByRole("button", { name: "Remove" }));

    await waitFor(() => expect(setWorkingSet).toHaveBeenCalledWith(["019b0298-5c00-7000-8000-000000000011"]));
    expect(screen.queryByText("Door code")).toBeNull();
  });

  it("renders an empty state and does not write on load", async () => {
    vi.mocked(listRecords).mockResolvedValue({ ok: true, records });
    vi.mocked(getWorkingSet).mockResolvedValue({ ok: true, selectedRecordIds: [] });
    vi.mocked(getGenerationBrief).mockResolvedValue({ ok: true, session: {}, generationContext: briefGenerationContext });

    render(<WorkingSetView />);

    expect(await screen.findByText("No records selected.")).toBeTruthy();
    expect(setWorkingSet).not.toHaveBeenCalled();
    expect(setGenerationBrief).not.toHaveBeenCalled();
  });

  it("surfaces records-list API failures with their own message", async () => {
    vi.mocked(listRecords).mockResolvedValue({
      ok: false,
      kind: "records-unavailable",
      message: "Records list is unavailable."
    });
    vi.mocked(getWorkingSet).mockResolvedValue({ ok: true, selectedRecordIds: [] });
    vi.mocked(getGenerationBrief).mockResolvedValue({ ok: true, session: {}, generationContext: briefGenerationContext });

    render(<WorkingSetView />);

    expect((await screen.findByRole("alert")).textContent).toBe("Records could not load: Records list is unavailable.");
    expect(screen.queryByText("Could not load active working set.")).toBeNull();
  });

  it("surfaces working-set membership API failures with their own message", async () => {
    vi.mocked(listRecords).mockResolvedValue({ ok: true, records });
    vi.mocked(getWorkingSet).mockResolvedValue({
      ok: false,
      kind: "working-set-unavailable",
      message: "Working-set membership is unavailable."
    });
    vi.mocked(getGenerationBrief).mockResolvedValue({ ok: true, session: {}, generationContext: briefGenerationContext });

    render(<WorkingSetView />);

    expect((await screen.findByRole("alert")).textContent).toBe(
      "Working-set membership could not load: Working-set membership is unavailable."
    );
    expect(screen.queryByText("Could not load active working set.")).toBeNull();
  });

  it("surfaces generation brief API failures with their own message", async () => {
    vi.mocked(listRecords).mockResolvedValue({ ok: true, records });
    vi.mocked(getWorkingSet).mockResolvedValue({ ok: true, selectedRecordIds: [] });
    vi.mocked(getGenerationBrief).mockResolvedValue({
      ok: false,
      kind: "brief-unavailable",
      message: "Generation brief is unavailable."
    });

    render(<WorkingSetView />);

    expect((await screen.findByRole("alert")).textContent).toBe(
      "Generation brief could not load: Generation brief is unavailable."
    );
    expect(screen.queryByText("Could not load active working set.")).toBeNull();
  });

  it("surfaces a distinct fallback for thrown load failures", async () => {
    vi.mocked(listRecords).mockRejectedValue(new Error("Network unavailable"));
    vi.mocked(getWorkingSet).mockResolvedValue({ ok: true, selectedRecordIds: [] });
    vi.mocked(getGenerationBrief).mockResolvedValue({ ok: true, session: {}, generationContext: briefGenerationContext });

    render(<WorkingSetView />);

    expect((await screen.findByRole("alert")).textContent).toBe("Unexpected error while loading active working set.");
    expect(screen.queryByText("Could not load active working set.")).toBeNull();
  });

  it("persists explicit cast bands and local_function through the generation brief client", async () => {
    const castId = "019b0298-5c00-7000-8000-000000000014";
    vi.mocked(listRecords).mockResolvedValue({ ok: true, records });
    vi.mocked(getWorkingSet).mockResolvedValue({ ok: true, selectedRecordIds: [castId] });
    vi.mocked(getGenerationBrief).mockResolvedValue({ ok: true, session: {}, generationContext: briefGenerationContext });
    vi.mocked(setGenerationBrief).mockResolvedValue({ ok: true, session: {} });

    render(<WorkingSetView />);

    const castSection = await screen.findByRole("heading", { name: "CAST MEMBER" });
    const section = castSection.closest("section");
    expect(section).not.toBeNull();
    fireEvent.change(within(section as HTMLElement).getByLabelText("Cast band for Aster cast"), {
      target: { value: "active" }
    });

    await waitFor(() => expect(setGenerationBrief).toHaveBeenCalled());
    const firstPayload = vi.mocked(setGenerationBrief).mock.calls[0]?.[0] as {
      active_working_set?: Record<string, unknown>;
    };
    expect(firstPayload.active_working_set).toMatchObject({
      selected_records: [castId],
      active_onstage_cast_full: [{ cast_member_id: castId, local_function: "active_speaker" }]
    });
    fireEvent.change(await screen.findByLabelText("Local function for Aster cast"), {
      target: { value: "physically_active" }
    });
    await waitFor(() => expect(setGenerationBrief).toHaveBeenCalledTimes(2));
    const secondPayload = vi.mocked(setGenerationBrief).mock.calls[1]?.[0] as {
      active_working_set?: Record<string, unknown>;
    };
    expect(secondPayload.active_working_set).toMatchObject({
      active_onstage_cast_full: [{ cast_member_id: castId, local_function: "physically_active" }]
    });
  });

  it("loads persisted working-set metadata from a partially authored generation brief draft", async () => {
    const castId = "019b0298-5c00-7000-8000-000000000014";
    vi.mocked(listRecords).mockResolvedValue({ ok: true, records });
    vi.mocked(getWorkingSet).mockResolvedValue({ ok: true, selectedRecordIds: [castId] });
    vi.mocked(getGenerationBrief).mockResolvedValue({
      ok: true,
      session: {
        current_authoritative_state: {
          current_time: "Before dawn.",
          immediate_situation_summary: "Aster waits at the west gate."
        },
        immediate_handoff: {
          recent_causal_context: "The door code changed before dawn."
        },
        active_working_set: {
          selected_records: [castId],
          selected_pov: castId,
          active_onstage_cast_full: [{ cast_member_id: castId, local_function: "active_speaker" }],
          present_minor_cast_compressed: [],
          offstage_relevant_cast: []
        }
      },
      generationContext: briefGenerationContext
    });

    render(<WorkingSetView />);

    const castBand = await screen.findByLabelText("Cast band for Aster cast");
    expect((castBand as HTMLSelectElement).value).toBe("active");
    expect(screen.queryByRole("alert")).toBeNull();
    expect(setWorkingSet).not.toHaveBeenCalled();
    expect(setGenerationBrief).not.toHaveBeenCalled();
  });

  it("renders the conceptual what-will-compile preview without mutating membership", async () => {
    vi.mocked(listRecords).mockResolvedValue({ ok: true, records });
    vi.mocked(getWorkingSet).mockResolvedValue({
      ok: true,
      selectedRecordIds: ["019b0298-5c00-7000-8000-000000000012", "019b0298-5c00-7000-8000-000000000014"]
    });
    vi.mocked(getGenerationBrief).mockResolvedValue({
      ok: true,
      session: {
        active_working_set: {
          selected_records: ["019b0298-5c00-7000-8000-000000000012", "019b0298-5c00-7000-8000-000000000014"],
          active_onstage_cast_full: [
            { cast_member_id: "019b0298-5c00-7000-8000-000000000014", local_function: "active_speaker" }
          ]
        }
      },
      generationContext: briefGenerationContext
    });

    render(<WorkingSetView />);

    expect(await screen.findByRole("heading", { name: "What Will Compile" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Rich active cast dossiers" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Facts, beliefs, and events" })).toBeTruthy();
    expect(screen.getAllByText("Aster cast").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Door code").length).toBeGreaterThan(0);
    expect(setWorkingSet).not.toHaveBeenCalled();
    expect(setGenerationBrief).not.toHaveBeenCalled();
  });

  it("leads CAST MEMBER rows with the linked ENTITY identity and names cast controls by it", async () => {
    const castId = "019b0298-5c00-7000-8000-000000000014";
    const castRecords: RecordSummary[] = [
      {
        id: castId,
        type: "CAST MEMBER",
        displayLabel: "the reluctant courier",
        status: null,
        salience: null,
        urgency: null,
        archived: false,
        userOrder: null,
        createdAt: "2026-06-05T00:00:00.000Z",
        updatedAt: "2026-06-05T00:00:00.000Z",
        browseIdentity: {
          primaryLabel: "Aster Vale",
          secondaryLabel: "the reluctant courier",
          availability: "available"
        }
      }
    ];
    vi.mocked(listRecords).mockResolvedValue({ ok: true, records: castRecords });
    vi.mocked(getWorkingSet).mockResolvedValue({ ok: true, selectedRecordIds: [castId] });
    vi.mocked(getGenerationBrief).mockResolvedValue({ ok: true, session: {}, generationContext: briefGenerationContext });
    vi.mocked(setGenerationBrief).mockResolvedValue({ ok: true, session: {} });

    render(<WorkingSetView />);

    const castHeading = await screen.findByRole("heading", { name: "CAST MEMBER" });
    const section = castHeading.closest("section") as HTMLElement;
    expect(within(section).getByText("Aster Vale")).toBeTruthy();
    expect(within(section).getByText("the reluctant courier")).toBeTruthy();
    expect(within(section).getByLabelText("Cast band for Aster Vale")).toBeTruthy();
    expect(screen.queryByText(castId)).toBeNull();
    expect(screen.queryByLabelText("Cast band for the reluctant courier")).toBeNull();
  });

  it("renders archived and missing linked ENTITY fallbacks without exposing a raw id", async () => {
    const archivedId = "019b0298-5c00-7000-8000-000000000015";
    const missingId = "019b0298-5c00-7000-8000-000000000016";
    const castRecords: RecordSummary[] = [
      {
        id: archivedId,
        type: "CAST MEMBER",
        displayLabel: "the exiled brother",
        status: null,
        salience: null,
        urgency: null,
        archived: false,
        userOrder: null,
        createdAt: "2026-06-05T00:00:00.000Z",
        updatedAt: "2026-06-05T00:00:00.000Z",
        browseIdentity: {
          primaryLabel: "Bram Vale",
          secondaryLabel: "the exiled brother",
          availability: "archived"
        }
      },
      {
        id: missingId,
        type: "CAST MEMBER",
        displayLabel: "an unnamed informant",
        status: null,
        salience: null,
        urgency: null,
        archived: false,
        userOrder: null,
        createdAt: "2026-06-05T00:00:00.000Z",
        updatedAt: "2026-06-05T00:00:00.000Z",
        browseIdentity: {
          primaryLabel: null,
          secondaryLabel: "an unnamed informant",
          availability: "missing"
        }
      }
    ];
    vi.mocked(listRecords).mockResolvedValue({ ok: true, records: castRecords });
    vi.mocked(getWorkingSet).mockResolvedValue({ ok: true, selectedRecordIds: [archivedId, missingId] });
    vi.mocked(getGenerationBrief).mockResolvedValue({ ok: true, session: {}, generationContext: briefGenerationContext });

    render(<WorkingSetView />);

    expect((await screen.findAllByText("Bram Vale (linked ENTITY archived)")).length).toBeGreaterThan(0);
    expect(screen.getAllByText("Linked ENTITY unavailable").length).toBeGreaterThan(0);
    expect(screen.queryByText(archivedId)).toBeNull();
    expect(screen.queryByText(missingId)).toBeNull();
  });

  it("leads What Will Compile cast summaries with the linked ENTITY identity", async () => {
    const castId = "019b0298-5c00-7000-8000-000000000014";
    const castRecords: RecordSummary[] = [
      {
        id: castId,
        type: "CAST MEMBER",
        displayLabel: "the reluctant courier",
        status: null,
        salience: null,
        urgency: null,
        archived: false,
        userOrder: null,
        createdAt: "2026-06-05T00:00:00.000Z",
        updatedAt: "2026-06-05T00:00:00.000Z",
        browseIdentity: {
          primaryLabel: "Aster Vale",
          secondaryLabel: "the reluctant courier",
          availability: "available"
        }
      }
    ];
    vi.mocked(listRecords).mockResolvedValue({ ok: true, records: castRecords });
    vi.mocked(getWorkingSet).mockResolvedValue({ ok: true, selectedRecordIds: [castId] });
    vi.mocked(getGenerationBrief).mockResolvedValue({
      ok: true,
      session: {
        active_working_set: {
          selected_records: [castId],
          active_onstage_cast_full: [{ cast_member_id: castId, local_function: "active_speaker" }]
        }
      },
      generationContext: briefGenerationContext
    });

    render(<WorkingSetView />);

    const compileHeading = await screen.findByRole("heading", { name: "Rich active cast dossiers" });
    const compileSection = compileHeading.closest("section") as HTMLElement;
    expect(within(compileSection).getByText("Aster Vale")).toBeTruthy();
    expect(setWorkingSet).not.toHaveBeenCalled();
    expect(setGenerationBrief).not.toHaveBeenCalled();
  });
});
