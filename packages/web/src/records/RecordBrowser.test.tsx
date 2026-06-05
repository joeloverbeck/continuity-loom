// @vitest-environment jsdom

import { recordTypes } from "@loom/core";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { RecordBrowser } from "./RecordBrowser.js";
import { getRecord, listRecords, type ListRecordsFilters, type RecordSummary } from "../api.js";

vi.mock("../api.js", () => ({
  getRecord: vi.fn(),
  listRecords: vi.fn()
}));

const fixtures: RecordSummary[] = [
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
  },
  {
    id: "fact-2",
    type: "FACT",
    displayLabel: "Archived clue",
    status: "resolved",
    salience: "low",
    urgency: null,
    archived: true,
    userOrder: null,
    createdAt: "2026-06-05T00:00:00.000Z",
    updatedAt: "2026-06-05T00:00:00.000Z"
  }
];

const referencedRecords = new Set(["fact-1"]);

function filterFixtures(filters: ListRecordsFilters): RecordSummary[] {
  return fixtures.filter((record) => {
    const typeMatches = filters.type ? record.type === filters.type : true;
    const statusMatches = filters.status ? record.status === filters.status : true;
    const textMatches = filters.q ? record.displayLabel.toLowerCase().includes(filters.q.toLowerCase()) : true;
    const referenceMatches = filters.refRole && filters.targetId ? referencedRecords.has(record.id) : true;

    return typeMatches && statusMatches && textMatches && referenceMatches;
  });
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("RecordBrowser", () => {
  it("renders a dense list and filters by type, status, search, and reference", async () => {
    vi.mocked(listRecords).mockImplementation((filters = {}) =>
      Promise.resolve({
        ok: true,
        records: filterFixtures(filters)
      })
    );
    vi.mocked(getRecord).mockImplementation((id: string) =>
      Promise.resolve({
        ok: true,
        record: {
          ...fixtures.find((record) => record.id === id)!,
          payload: { inspected: id }
        }
      })
    );

    render(<RecordBrowser />);

    expect(await screen.findByRole("heading", { name: "Records" })).toBeTruthy();
    expect(await screen.findByText("Door code")).toBeTruthy();
    expect(screen.getByText("Guard the west gate")).toBeTruthy();

    fireEvent.change(screen.getByLabelText("Type"), { target: { value: "FACT" } });
    await waitFor(() => expect(screen.queryByText("Guard the west gate")).toBeNull());
    expect(screen.getByText("Door code")).toBeTruthy();

    fireEvent.change(screen.getByLabelText("Status"), { target: { value: "resolved" } });
    await waitFor(() => expect(screen.getByText("Archived clue")).toBeTruthy());
    expect(screen.queryByText("Door code")).toBeNull();

    fireEvent.change(screen.getByLabelText("Search"), { target: { value: "door" } });
    await waitFor(() => expect(screen.queryByText("Archived clue")).toBeNull());

    fireEvent.change(screen.getByLabelText("Status"), { target: { value: "" } });
    fireEvent.change(screen.getByLabelText("Reference role"), { target: { value: "holder" } });
    fireEvent.change(screen.getByLabelText("Reference target"), { target: { value: "entity-1" } });
    await waitFor(() =>
      expect(vi.mocked(listRecords)).toHaveBeenLastCalledWith({
        type: "FACT",
        q: "door",
        refRole: "holder",
        targetId: "entity-1"
      })
    );
    expect(await screen.findByText("Door code")).toBeTruthy();
  });

  it("offers salience and urgency grouping only when descriptors expose those fields", async () => {
    vi.mocked(listRecords).mockResolvedValue({ ok: true, records: fixtures });

    render(<RecordBrowser />);
    await screen.findByText("Door code");

    const groupSelect = screen.getByLabelText("Group by");
    expect(within(groupSelect).getByRole("option", { name: "salience" })).toBeTruthy();
    expect(within(groupSelect).getByRole("option", { name: "urgency" })).toBeTruthy();

    fireEvent.change(screen.getByLabelText("Type"), { target: { value: "ENTITY" } });
    await waitFor(() => expect(within(groupSelect).queryByRole("option", { name: "salience" })).toBeNull());
    expect(within(groupSelect).queryByRole("option", { name: "urgency" })).toBeNull();

    fireEvent.change(screen.getByLabelText("Type"), { target: { value: "FACT" } });
    await waitFor(() => expect(within(groupSelect).getByRole("option", { name: "salience" })).toBeTruthy());
    expect(within(groupSelect).queryByRole("option", { name: "urgency" })).toBeNull();
  });

  it("renders one create-from-template action for every registered record type", async () => {
    vi.mocked(listRecords).mockResolvedValue({ ok: true, records: [] });

    render(<RecordBrowser />);
    await screen.findByText("No record selected.");

    for (const recordType of recordTypes) {
      expect(screen.getByRole("button", { name: `Create ${recordType}` })).toBeTruthy();
    }
  });
});
