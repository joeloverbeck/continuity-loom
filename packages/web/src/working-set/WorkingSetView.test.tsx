// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { WorkingSetView } from "./WorkingSetView.js";
import { getWorkingSet, listRecords, setWorkingSet, type RecordSummary } from "../api.js";

vi.mock("../api.js", () => ({
  getWorkingSet: vi.fn(),
  listRecords: vi.fn(),
  setWorkingSet: vi.fn()
}));

const records: RecordSummary[] = [
  {
    id: "entity-1",
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
    id: "fact-1",
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
    id: "intent-1",
    type: "INTENTION",
    displayLabel: "Guard the west gate",
    status: "active",
    salience: null,
    urgency: "critical",
    archived: false,
    userOrder: null,
    createdAt: "2026-06-05T00:00:00.000Z",
    updatedAt: "2026-06-05T00:00:00.000Z"
  }
];

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("WorkingSetView", () => {
  it("lists selected records grouped by type and removes membership explicitly", async () => {
    vi.mocked(listRecords).mockResolvedValue({ ok: true, records });
    vi.mocked(getWorkingSet).mockResolvedValue({ ok: true, selectedRecordIds: ["fact-1", "entity-1"] });
    vi.mocked(setWorkingSet).mockImplementation((selectedRecordIds: string[]) =>
      Promise.resolve({ ok: true, selectedRecordIds })
    );

    render(<WorkingSetView />);

    expect(await screen.findByRole("heading", { name: "ENTITY" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "FACT" })).toBeTruthy();
    expect(screen.getByText("Aster")).toBeTruthy();
    expect(screen.getByText("Door code")).toBeTruthy();
    expect(screen.queryByText("Guard the west gate")).toBeNull();
    expect(setWorkingSet).not.toHaveBeenCalled();

    const factSection = screen.getByRole("heading", { name: "FACT" }).closest("section");
    expect(factSection).not.toBeNull();
    fireEvent.click(within(factSection as HTMLElement).getByRole("button", { name: "Remove" }));

    await waitFor(() => expect(setWorkingSet).toHaveBeenCalledWith(["entity-1"]));
    expect(screen.queryByText("Door code")).toBeNull();
  });

  it("renders an empty state and does not write on load", async () => {
    vi.mocked(listRecords).mockResolvedValue({ ok: true, records });
    vi.mocked(getWorkingSet).mockResolvedValue({ ok: true, selectedRecordIds: [] });

    render(<WorkingSetView />);

    expect(await screen.findByText("No records selected.")).toBeTruthy();
    expect(setWorkingSet).not.toHaveBeenCalled();
  });
});
