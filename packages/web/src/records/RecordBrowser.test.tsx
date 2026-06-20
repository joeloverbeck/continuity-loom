// @vitest-environment jsdom

import { allTypesColumns, recordColumnManifest, recordTypes } from "@loom/core";
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

const fullEmotionLabel =
  "Mara is furious that the cellar door was sealed before she arrived and that everyone pretended the lock was harmless.";

const projectedFixtures: RecordSummary[] = [
  {
    id: "fact-a",
    type: "FACT",
    displayLabel: "Critical fact",
    status: "active",
    salience: "critical",
    urgency: null,
    displayValues: {
      status: "active",
      fact_kind: "current_state",
      scope: "entity",
      salience: "critical",
      audience_visibility: "explicit"
    },
    archived: false,
    userOrder: null,
    createdAt: "2026-06-05T00:00:00.000Z",
    updatedAt: "2026-06-05T00:05:00.000Z"
  },
  {
    id: "fact-b",
    type: "FACT",
    displayLabel: "Low fact",
    status: "active",
    salience: "low",
    urgency: null,
    displayValues: {
      status: "active",
      fact_kind: "setting_fact",
      scope: "global",
      salience: "low",
      audience_visibility: "implied"
    },
    archived: false,
    userOrder: null,
    createdAt: "2026-06-05T00:00:00.000Z",
    updatedAt: "2026-06-05T00:04:00.000Z"
  },
  {
    id: "fact-c",
    type: "FACT",
    displayLabel: "Medium fact",
    status: "active",
    salience: "medium",
    urgency: null,
    displayValues: {
      status: "active",
      fact_kind: "hard_canon",
      scope: "current_segment",
      salience: "medium",
      audience_visibility: "explicit"
    },
    archived: false,
    userOrder: null,
    createdAt: "2026-06-05T00:00:00.000Z",
    updatedAt: "2026-06-05T00:03:00.000Z"
  },
  {
    id: "emotion-a",
    type: "EMOTION",
    displayLabel: "Mara is furious...",
    fullDisplayLabel: fullEmotionLabel,
    status: "active",
    salience: null,
    urgency: null,
    displayValues: {
      status: "active",
      affect_kind: "anger",
      intensity: "high",
      visibility: "visible"
    },
    archived: false,
    userOrder: null,
    createdAt: "2026-06-05T00:00:00.000Z",
    updatedAt: "2026-06-05T00:02:00.000Z"
  },
  {
    id: "emotion-b",
    type: "EMOTION",
    displayLabel: "Mara hides a low dread under practiced calm",
    status: "active",
    salience: null,
    urgency: null,
    displayValues: {
      status: "active",
      affect_kind: "dread",
      intensity: "low",
      visibility: "private"
    },
    archived: false,
    userOrder: null,
    createdAt: "2026-06-05T00:00:00.000Z",
    updatedAt: "2026-06-05T00:01:00.000Z"
  },
  {
    id: "entity-a",
    type: "ENTITY",
    displayLabel: "Mara",
    status: null,
    salience: null,
    urgency: null,
    displayValues: {
      entity_kind: "person",
      roles_in_story: "viewpoint, primary_actor"
    },
    archived: false,
    userOrder: null,
    createdAt: "2026-06-05T00:00:00.000Z",
    updatedAt: "2026-06-05T00:00:00.000Z"
  }
];

const referencedRecords = new Set(["fact-1"]);

const referenceEntityId = "019b0298-5c00-7000-8000-000000000101";
const referenceLocationId = "019b0298-5c00-7000-8000-000000000102";
const referenceObjectId = "019b0298-5c00-7000-8000-000000000103";

const referenceTargetFixtures: RecordSummary[] = [
  {
    id: referenceEntityId,
    type: "ENTITY",
    displayLabel: "Aster",
    status: "active",
    salience: null,
    urgency: null,
    archived: false,
    userOrder: null,
    createdAt: "2026-06-05T00:00:00.000Z",
    updatedAt: "2026-06-05T00:00:00.000Z"
  },
  {
    id: referenceLocationId,
    type: "LOCATION",
    displayLabel: "Vault",
    status: "active",
    salience: null,
    urgency: null,
    archived: false,
    userOrder: null,
    createdAt: "2026-06-05T00:00:00.000Z",
    updatedAt: "2026-06-05T00:00:00.000Z"
  },
  {
    id: referenceObjectId,
    type: "OBJECT",
    displayLabel: "Sealed letter",
    status: "active",
    salience: null,
    urgency: null,
    archived: false,
    userOrder: null,
    createdAt: "2026-06-05T00:00:00.000Z",
    updatedAt: "2026-06-05T00:00:00.000Z"
  }
];

const objectDetail = {
  ...referenceTargetFixtures[2]!,
  payload: {
    status: "active",
    label: "Sealed letter",
    description: "A folded letter sealed with blue wax.",
    owner: referenceEntityId,
    carried_by: referenceEntityId,
    current_location: referenceLocationId,
    visibility_to_pov: "visible",
    usable_affordances: [],
    constraints: [],
    durability: "continuity_relevant"
  }
};

function filterFixtures(filters: ListRecordsFilters): RecordSummary[] {
  return filterRecords(fixtures, filters);
}

function filterRecords(records: readonly RecordSummary[], filters: ListRecordsFilters): RecordSummary[] {
  return records.filter((record) => {
    const typeMatches = filters.type ? record.type === filters.type : true;
    const statusMatches = filters.status ? record.status === filters.status : true;
    const textMatches = filters.q ? record.displayLabel.toLowerCase().includes(filters.q.toLowerCase()) : true;
    const referenceMatches = filters.refRole && filters.targetId ? referencedRecords.has(record.id) : true;

    return typeMatches && statusMatches && textMatches && referenceMatches;
  });
}

function expectedLabels(records: readonly RecordSummary[], filters: ListRecordsFilters): string[] {
  return filterRecords(records, filters).map((record) => record.displayLabel);
}

function tableLabels(): string[] {
  return within(screen.getByRole("table"))
    .getAllByRole("button")
    .map((button) => button.textContent ?? "")
    .filter((label) => label !== "Add" && label !== "Selected");
}

function tableHeaders(): string[] {
  return within(screen.getByRole("table"))
    .getAllByRole("columnheader")
    .map((header) => header.textContent ?? "");
}

function expectedHeadersForType(recordType: string): string[] {
  const manifest = recordColumnManifest[recordType]!;

  return ["Working Set", manifest.primaryLabelHeader, ...manifest.additionalColumns.map((column) => column.header)];
}

function expectedAllTypesHeaders(): string[] {
  return ["Working Set", ...allTypesColumns.map((column) => column.header)];
}

function denseRecordFixtures(count: number): RecordSummary[] {
  const recordTypeCycle = ["FACT", "INTENTION", "ENTITY"] as const;
  const salienceCycle = ["critical", "high", "low"] as const;

  return Array.from({ length: count }, (_, index): RecordSummary => {
    const type = recordTypeCycle[index % recordTypeCycle.length]!;
    const isNeedle = type === "FACT" && index % 30 === 0;

    return {
      id: `dense-${String(index).padStart(3, "0")}`,
      type,
      displayLabel: `${isNeedle ? "Needle" : titleCase(type)} dense ${String(index).padStart(3, "0")}`,
      status: index % 2 === 0 ? "active" : "resolved",
      salience: type === "FACT" ? salienceCycle[index % salienceCycle.length]! : null,
      urgency: type === "INTENTION" ? (index % 4 === 0 ? "critical" : "steady") : null,
      archived: false,
      userOrder: null,
      createdAt: "2026-06-05T00:00:00.000Z",
      updatedAt: "2026-06-05T00:00:00.000Z"
    };
  });
}

function titleCase(value: string): string {
  return value.toLowerCase().replace(/^\w/, (match) => match.toUpperCase());
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function renderBrowser(initialEntry = "/records"): ReturnType<typeof render> {
  return render(
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
  it("renders per-type EMOTION columns from the manifest", async () => {
    mockWorkingSet();
    vi.mocked(getRecord).mockImplementation((id: string) =>
      Promise.resolve({
        ok: true,
        record: {
          ...projectedFixtures.find((record) => record.id === id)!,
          payload: { inspected: id }
        }
      })
    );
    vi.mocked(listRecords).mockImplementation((filters = {}) =>
      Promise.resolve({
        ok: true,
        records: filterRecords(projectedFixtures, filters)
      })
    );

    renderBrowser("/records?type=EMOTION");

    const emotionButton = await screen.findByRole("button", { name: "Mara is furious..." });
    expect(tableHeaders()).toEqual(expectedHeadersForType("EMOTION"));
    expect(tableHeaders()).toContain("Affect kind");
    expect(tableHeaders()).toContain("Intensity");
    expect(tableHeaders()).not.toContain("Salience");
    expect(tableHeaders()).not.toContain("Urgency");
    expect(emotionButton.getAttribute("title")).toBe(fullEmotionLabel);
    expect(screen.getByText("anger")).toBeTruthy();
    expect(screen.getByText("high")).toBeTruthy();

    fireEvent.click(emotionButton);
    expect(await screen.findByRole("heading", { name: fullEmotionLabel })).toBeTruthy();
  });

  it("renders the explicit All types view with the minimal shared manifest columns", async () => {
    mockWorkingSet();
    vi.mocked(listRecords).mockImplementation((filters = {}) =>
      Promise.resolve({
        ok: true,
        records: filterRecords(projectedFixtures, filters)
      })
    );

    renderBrowser("/records?type=FACT");
    await waitFor(() => expect(tableHeaders()).toEqual(expectedHeadersForType("FACT")));

    fireEvent.change(screen.getByLabelText("Type"), { target: { value: "" } });

    await waitFor(() => expect(tableHeaders()).toEqual(expectedAllTypesHeaders()));
    expect(tableHeaders()).not.toContain("Thread kind");
    expect(tableHeaders()).not.toContain("Salience");
    expect(tableHeaders()).not.toContain("Urgency");
  });

  it("defaults to the most-populated projected type and lets URL type override it", async () => {
    mockWorkingSet();
    vi.mocked(listRecords).mockImplementation((filters = {}) =>
      Promise.resolve({
        ok: true,
        records: filterRecords(projectedFixtures, filters)
      })
    );

    renderBrowser();

    await waitFor(() => expect(screen.getByLabelText<HTMLSelectElement>("Type").value).toBe("FACT"));
    expect(tableLabels()).toEqual(["Critical fact", "Medium fact", "Low fact"]);
    expect(tableHeaders()).toEqual(expectedHeadersForType("FACT"));

    cleanup();
    vi.clearAllMocks();
    mockWorkingSet();
    vi.mocked(listRecords).mockImplementation((filters = {}) =>
      Promise.resolve({
        ok: true,
        records: filterRecords(projectedFixtures, filters)
      })
    );

    renderBrowser("/records?type=EMOTION");

    await waitFor(() => expect(screen.getByLabelText<HTMLSelectElement>("Type").value).toBe("EMOTION"));
    expect(tableLabels()).toEqual(["Mara is furious...", "Mara hides a low dread under practiced calm"]);
    expect(tableHeaders()).toEqual(expectedHeadersForType("EMOTION"));
    expect(vi.mocked(listRecords)).toHaveBeenLastCalledWith({ type: "EMOTION" });
  });

  it("renders a scoped empty state for a projected type with no records", async () => {
    mockWorkingSet();
    vi.mocked(listRecords).mockImplementation((filters = {}) =>
      Promise.resolve({
        ok: true,
        records: filterRecords(projectedFixtures, filters)
      })
    );

    renderBrowser("/records?type=LOCATION");

    expect(await screen.findByText("No LOCATION records.")).toBeTruthy();
    expect(screen.getByText(/Location records hold the location continuity details/)).toBeTruthy();
    expect(screen.getAllByRole("button", { name: "Create LOCATION" }).length).toBeGreaterThan(0);
    expect(screen.queryByRole("table")).toBeNull();
  });

  it("keeps dense record filtering, search, and grouping correct without throwing", async () => {
    const denseRecords = denseRecordFixtures(500);
    const workingSetIds = denseRecords
      .filter((record) => record.type === "FACT" && record.status === "active")
      .slice(0, 25)
      .map((record) => record.id);
    mockWorkingSet(workingSetIds);
    vi.mocked(listRecords).mockImplementation((filters = {}) =>
      Promise.resolve({
        ok: true,
        records: filterRecords(denseRecords, filters)
      })
    );
    vi.mocked(getRecord).mockImplementation((id: string) =>
      Promise.resolve({
        ok: true,
        record: {
          ...denseRecords.find((record) => record.id === id)!,
          payload: { inspected: id }
        }
      })
    );

    const view = renderBrowser();

    expect(await screen.findByRole("heading", { name: "Records" })).toBeTruthy();
    await waitFor(() => expect(tableLabels()).toHaveLength(denseRecords.length));

    fireEvent.change(screen.getByLabelText("Type"), { target: { value: "FACT" } });
    fireEvent.change(screen.getByLabelText("Status"), { target: { value: "active" } });
    const activeFactLabels = expectedLabels(denseRecords, { type: "FACT", status: "active" });
    await waitFor(() => expect(tableLabels()).toEqual(activeFactLabels));

    fireEvent.change(screen.getByLabelText("Search"), { target: { value: "needle" } });
    const searchedFacts = expectedLabels(denseRecords, { type: "FACT", status: "active", q: "needle" });
    await waitFor(() => expect(tableLabels()).toEqual(searchedFacts));
    expect(searchedFacts.length).toBeGreaterThan(0);
    expect(within(screen.getByRole("table")).queryByText("Intent dense 001")).toBeNull();

    fireEvent.change(screen.getByLabelText("Search"), { target: { value: "" } });
    fireEvent.change(screen.getByLabelText("Group by"), { target: { value: "salience" } });
    const groupedFacts = [...activeFactLabels].sort((left, right) => {
      const leftRecord = denseRecords.find((record) => record.displayLabel === left)!;
      const rightRecord = denseRecords.find((record) => record.displayLabel === right)!;

      return (
        String(leftRecord.salience ?? "").localeCompare(String(rightRecord.salience ?? "")) ||
        leftRecord.displayLabel.localeCompare(rightRecord.displayLabel) ||
        leftRecord.id.localeCompare(rightRecord.id)
      );
    });
    await waitFor(() => expect(tableLabels()).toEqual(groupedFacts));

    view.rerender(
      <MemoryRouter initialEntries={["/records"]}>
        <RecordBrowser />
      </MemoryRouter>
    );
    await waitFor(() => expect(tableLabels()).toEqual(groupedFacts));
  }, 10_000);

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

  it("keeps editor reference targets independent of the active type filter", async () => {
    mockWorkingSet();
    vi.mocked(listRecords).mockImplementation((filters = {}) =>
      Promise.resolve({
        ok: true,
        records: filterRecords(referenceTargetFixtures, filters)
      })
    );
    vi.mocked(getRecord).mockResolvedValue({ ok: true, record: objectDetail });

    renderBrowser();

    expect(await screen.findByRole("button", { name: "Sealed letter" })).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Type"), { target: { value: "OBJECT" } });

    await waitFor(() => expect(tableLabels()).toEqual(["Sealed letter"]));
    expect(within(screen.getByRole("table")).queryByText("Aster")).toBeNull();
    expect(within(screen.getByRole("table")).queryByText("Vault")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Sealed letter" }));
    expect(await screen.findByRole("button", { name: "Edit Record" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Edit Record" }));

    const owner = await screen.findByLabelText<HTMLSelectElement>(/^owner/);
    const carriedBy = screen.getByLabelText<HTMLSelectElement>(/^carried_by/);
    const currentLocation = screen.getByLabelText<HTMLSelectElement>(/^current_location/);

    expect(within(owner).getByRole<HTMLOptionElement>("option", { name: "Aster" }).value).toBe(referenceEntityId);
    expect(within(carriedBy).getByRole<HTMLOptionElement>("option", { name: "Aster" }).value).toBe(referenceEntityId);
    expect(within(currentLocation).getByRole<HTMLOptionElement>("option", { name: "Vault" }).value).toBe(referenceLocationId);
    expect(owner.value).toBe(referenceEntityId);
    expect(carriedBy.value).toBe(referenceEntityId);
    expect(currentLocation.value).toBe(referenceLocationId);
  });

  it("preserves stored reference ids when saving an editor opened under a browse filter", async () => {
    mockWorkingSet();
    vi.mocked(listRecords).mockImplementation((filters = {}) =>
      Promise.resolve({
        ok: true,
        records: filterRecords(referenceTargetFixtures, filters)
      })
    );
    vi.mocked(getRecord).mockResolvedValue({ ok: true, record: objectDetail });
    vi.mocked(updateRecord).mockResolvedValue({ ok: true, record: objectDetail });

    renderBrowser();

    await screen.findByRole("button", { name: "Sealed letter" });
    fireEvent.change(screen.getByLabelText("Type"), { target: { value: "OBJECT" } });
    await waitFor(() => expect(tableLabels()).toEqual(["Sealed letter"]));
    fireEvent.click(screen.getByRole("button", { name: "Sealed letter" }));
    expect(await screen.findByRole("button", { name: "Edit Record" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Edit Record" }));

    expect((await screen.findByLabelText<HTMLSelectElement>(/^carried_by/)).value).toBe(referenceEntityId);
    fireEvent.click(screen.getByRole("button", { name: "Save Record" }));

    await waitFor(() => expect(updateRecord).toHaveBeenCalled());
    expect(vi.mocked(updateRecord).mock.calls[0]?.[1]).toMatchObject({
      payload: {
        owner: referenceEntityId,
        carried_by: referenceEntityId,
        current_location: referenceLocationId
      }
    });
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
    expect(screen.queryByRole("button", { name: "Create STORY CONTRACT" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Create UNIVERSAL CONTENT POLICY" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Create PROSE MODE" })).toBeNull();
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
