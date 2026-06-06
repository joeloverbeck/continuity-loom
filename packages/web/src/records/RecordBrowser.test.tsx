// @vitest-environment jsdom

import { recordTypes } from "@loom/core";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import { RecordBrowser } from "./RecordBrowser.js";
import {
  createRecord,
  getRecord,
  getWorkingSet,
  listRecords,
  setWorkingSet,
  updateRecord,
  type ListRecordsFilters,
  type RecordSummary
} from "../api.js";

vi.mock("../api.js", () => ({
  createRecord: vi.fn(),
  getRecord: vi.fn(),
  getWorkingSet: vi.fn(),
  listRecords: vi.fn(),
  setWorkingSet: vi.fn(),
  updateRecord: vi.fn()
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

function renderBrowser(initialEntry = "/records"): void {
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <RecordBrowser />
    </MemoryRouter>
  );
}

function mockWorkingSet(ids: string[] = []): void {
  vi.mocked(getWorkingSet).mockResolvedValue({ ok: true, selectedRecordIds: ids });
  vi.mocked(setWorkingSet).mockImplementation((selectedRecordIds: string[]) =>
    Promise.resolve({ ok: true, selectedRecordIds })
  );
}

describe("RecordBrowser", () => {
  it("renders a dense list and filters by type, status, search, and reference", async () => {
    mockWorkingSet();
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

    renderBrowser();

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
    mockWorkingSet();
    vi.mocked(listRecords).mockResolvedValue({ ok: true, records: fixtures });

    renderBrowser();
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
    mockWorkingSet();
    vi.mocked(listRecords).mockResolvedValue({ ok: true, records: [] });

    renderBrowser();
    await screen.findByText("No record selected.");

    for (const recordType of recordTypes) {
      expect(screen.getByRole("button", { name: `Create ${recordType}` })).toBeTruthy();
    }
  });

  it("opens typed editors from create actions instead of leaving inert buttons", async () => {
    mockWorkingSet();
    vi.mocked(listRecords).mockResolvedValue({ ok: true, records: fixtures });
    vi.mocked(createRecord).mockResolvedValue({ ok: true, record: { ...fixtures[0]!, payload: { inspected: "create" } } });
    vi.mocked(updateRecord).mockResolvedValue({ ok: true, record: { ...fixtures[0]!, payload: { inspected: "update" } } });

    renderBrowser();
    await screen.findByRole("button", { name: "Aster" });

    fireEvent.click(screen.getByRole("button", { name: "Create ENTITY" }));

    expect(await screen.findByRole("heading", { name: "ENTITY" })).toBeTruthy();
    expect(screen.getByText("Create record")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Create Record" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Back to records" }));
    await screen.findByRole("button", { name: "Aster" });

    fireEvent.click(screen.getByRole("button", { name: "Create CAST MEMBER" }));

    expect(await screen.findByRole("heading", { name: "CAST MEMBER" })).toBeTruthy();
    expect(screen.getByRole("option", { name: "Aster" })).toBeTruthy();
  });

  it("opens typed editors from create search params without creating records", async () => {
    mockWorkingSet();
    vi.mocked(listRecords).mockResolvedValue({ ok: true, records: fixtures });

    renderBrowser("/records?create=EVENT");

    expect(await screen.findByRole("heading", { name: "EVENT" })).toBeTruthy();
    expect(screen.getByText("Create record")).toBeTruthy();
    expect(createRecord).not.toHaveBeenCalled();
    expect(updateRecord).not.toHaveBeenCalled();
    expect(setWorkingSet).not.toHaveBeenCalled();
  });

  it("opens the CAST MEMBER editor from the create search param", async () => {
    mockWorkingSet();
    vi.mocked(listRecords).mockResolvedValue({ ok: true, records: fixtures });

    renderBrowser("/records?create=CAST%20MEMBER");

    expect(await screen.findByRole("heading", { name: "CAST MEMBER" })).toBeTruthy();
    expect(screen.getByRole("option", { name: "Aster" })).toBeTruthy();
    expect(createRecord).not.toHaveBeenCalled();
    expect(updateRecord).not.toHaveBeenCalled();
  });

  it("ignores invalid and absent create search params", async () => {
    mockWorkingSet();
    vi.mocked(listRecords).mockResolvedValue({ ok: true, records: fixtures });

    renderBrowser("/records?create=NOT_A_TYPE");

    expect(await screen.findByRole("heading", { name: "Records" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Create EVENT" })).toBeTruthy();
    expect(screen.queryByText("Create record")).toBeNull();
    expect(screen.queryByRole("heading", { name: "EVENT" })).toBeNull();

    cleanup();
    vi.clearAllMocks();
    mockWorkingSet();
    vi.mocked(listRecords).mockResolvedValue({ ok: true, records: fixtures });

    renderBrowser();

    expect(await screen.findByRole("heading", { name: "Records" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Create EVENT" })).toBeTruthy();
    expect(screen.queryByText("Create record")).toBeNull();
  });

  it("toggles working-set membership and filters to selected records without implicit writes", async () => {
    vi.mocked(listRecords).mockResolvedValue({ ok: true, records: fixtures });
    mockWorkingSet(["fact-1"]);

    renderBrowser();

    expect(await screen.findByText("Door code")).toBeTruthy();
    expect(setWorkingSet).not.toHaveBeenCalled();
    expect(screen.getAllByRole("button", { name: "Selected" })).toHaveLength(1);

    fireEvent.change(screen.getByLabelText("Working set"), { target: { value: "selected" } });
    const table = screen.getByRole("table");
    await waitFor(() => expect(within(table).queryByText("Aster")).toBeNull());
    expect(within(table).getByText("Door code")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Selected" }));
    await waitFor(() => expect(setWorkingSet).toHaveBeenCalledWith([]));
    expect(within(table).queryByText("Door code")).toBeNull();

    fireEvent.change(screen.getByLabelText("Working set"), { target: { value: "all" } });
    await waitFor(() => expect(within(table).getByText("Aster")).toBeTruthy());
    const addButtons = screen.getAllByRole("button", { name: "Add" });
    expect(addButtons.length).toBeGreaterThan(0);
    fireEvent.click(addButtons[0]!);
    await waitFor(() => expect(setWorkingSet).toHaveBeenLastCalledWith(["entity-1"]));
  });
});
