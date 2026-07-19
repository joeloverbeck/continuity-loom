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
  type RecordDetail,
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
  vi.resetAllMocks();
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
  it("browses CAST MEMBER records by linked human name with secondary context and collapsed exact payload", async () => {
    const firstPayload = {
      entity_id: "entity-mara-a",
      identity: { one_line: "Careful archivist under pressure." },
      exact_canary: "<raw>&payload-byte-canary"
    };
    const castRecords = [
      {
        ...fixtures[0]!,
        id: "cast-a",
        type: "CAST MEMBER",
        displayLabel: "Opaque dossier A",
        browseIdentity: {
          primaryLabel: "Mara Vey",
          secondaryLabel: "Careful archivist under pressure.",
          availability: "available" as const
        }
      },
      {
        ...fixtures[0]!,
        id: "cast-b",
        type: "CAST MEMBER",
        displayLabel: "Opaque dossier B",
        browseIdentity: {
          primaryLabel: "Mara Vey",
          secondaryLabel: "Reckless gatekeeper under pressure.",
          availability: "available" as const
        }
      },
      {
        ...fixtures[0]!,
        id: "cast-missing",
        type: "CAST MEMBER",
        displayLabel: "Opaque missing dossier",
        browseIdentity: {
          primaryLabel: null,
          secondaryLabel: "Unresolved identity context.",
          availability: "missing" as const
        }
      },
      {
        ...fixtures[0]!,
        id: "cast-archived-entity",
        type: "CAST MEMBER",
        displayLabel: "Opaque archived-link dossier",
        browseIdentity: {
          primaryLabel: "Archived Mara",
          secondaryLabel: "Archived identity context.",
          availability: "archived" as const
        }
      }
    ];
    mockWorkingSet();
    vi.mocked(listRecords).mockImplementation((filters = {}) => Promise.resolve({
      ok: true,
      records: castRecords.filter((record) => {
        if (filters.type && record.type !== filters.type) {
          return false;
        }
        const query = filters.q?.toLowerCase();
        return query
          ? `${record.browseIdentity.primaryLabel ?? ""} ${record.browseIdentity.secondaryLabel}`.toLowerCase().includes(query)
          : true;
      })
    }));
    vi.mocked(getRecord).mockImplementation((id: string) => Promise.resolve({
      ok: true,
      record: {
        ...castRecords.find((record) => record.id === id)!,
        payload: id === "cast-a" ? firstPayload : { entity_id: `entity-for-${id}` }
      }
    }));

    renderBrowser("/records?type=CAST%20MEMBER");

    const first = await screen.findByRole("button", { name: "Mara Vey Careful archivist under pressure." });
    expect(screen.getByRole("button", { name: "Mara Vey Reckless gatekeeper under pressure." })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Linked ENTITY unavailable Unresolved identity context." })).toBeTruthy();
    const archived = screen.getByRole("button", {
      name: "Archived Mara (linked ENTITY archived) Archived identity context."
    });
    expect(screen.queryByText("entity-mara-a")).toBeNull();

    fireEvent.click(archived);
    const archivedDetail = screen.getByLabelText("Record detail");
    expect(await within(archivedDetail).findByRole("heading", {
      name: "Archived Mara (linked ENTITY archived)"
    })).toBeTruthy();
    expect(within(archivedDetail).getByText("Archived identity context.")).toBeTruthy();
    expect(within(archivedDetail).getByText("The linked ENTITY is archived and unavailable for active use.")).toBeTruthy();

    fireEvent.change(screen.getByLabelText("Search"), { target: { value: "Mara Vey" } });
    await waitFor(() => expect(vi.mocked(listRecords)).toHaveBeenLastCalledWith({
      type: "CAST MEMBER",
      q: "Mara Vey"
    }));
    expect(screen.getAllByRole("button", { name: /Mara Vey/ })).toHaveLength(2);

    fireEvent.click(first);
    const detail = screen.getByLabelText("Record detail");
    expect(await within(detail).findByRole("heading", { name: "Mara Vey" })).toBeTruthy();
    expect(within(detail).getByText("Careful archivist under pressure.")).toBeTruthy();
    const disclosure = within(detail).getByText("Technical payload").closest("details");
    expect(disclosure?.open).toBe(false);
    fireEvent.click(within(detail).getByText("Technical payload"));
    expect(disclosure?.open).toBe(true);
    expect(detail.querySelector("pre")?.textContent).toBe(JSON.stringify(firstPayload, null, 2));
  });

  it("can include an archived CAST MEMBER whose linked ENTITY is unavailable without hiding its exact payload", async () => {
    const exactPayload = {
      entity_id: "entity-archived-mara",
      identity: { one_line: "Archivist whose source identity is no longer active." },
      exact_canary: "ARCHIVED_CAST_PAYLOAD_SAFE_5f2c"
    };
    const archivedCast = {
      ...fixtures[0]!,
      id: "cast-archived-mara",
      type: "CAST MEMBER",
      displayLabel: "Opaque archived dossier",
      archived: true,
      browseIdentity: {
        primaryLabel: "Archived Mara",
        secondaryLabel: "Archivist whose source identity is no longer active.",
        availability: "archived" as const
      }
    };
    mockWorkingSet();
    vi.mocked(listRecords).mockImplementation((filters = {}) => Promise.resolve({
      ok: true,
      records: filters.includeArchived ? [archivedCast] : []
    }));
    vi.mocked(getRecord).mockResolvedValue({
      ok: true,
      record: { ...archivedCast, payload: exactPayload }
    });

    renderBrowser("/records?type=CAST%20MEMBER");

    expect(await screen.findByText("No CAST MEMBER records.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Archived Mara/ })).toBeNull();

    fireEvent.click(screen.getByRole("checkbox", { name: "Include archived" }));

    await waitFor(() => expect(vi.mocked(listRecords)).toHaveBeenLastCalledWith({
      type: "CAST MEMBER",
      includeArchived: true
    }));
    const archived = await screen.findByRole("button", {
      name: "Archived Mara (linked ENTITY archived) Archivist whose source identity is no longer active."
    });
    fireEvent.click(archived);

    const detail = screen.getByLabelText("Record detail");
    expect(await within(detail).findByText("The linked ENTITY is archived and unavailable for active use.")).toBeTruthy();
    fireEvent.click(within(detail).getByText("Technical payload"));
    expect(detail.querySelector("pre")?.textContent).toBe(JSON.stringify(exactPayload, null, 2));
  });

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

  it("guides an empty project through failed and successful ENTITY save before explicit CAST MEMBER selection and save", async () => {
    const entityId = "019b0298-5c00-7000-8000-000000000301";
    const castId = "019b0298-5c00-7000-8000-000000000302";
    const entityRecord: RecordDetail = {
      id: entityId,
      type: "ENTITY",
      displayLabel: "Mara Vey",
      status: null,
      salience: null,
      urgency: null,
      archived: false,
      userOrder: null,
      createdAt: "2026-07-19T00:00:00.000Z",
      updatedAt: "2026-07-19T00:00:00.000Z",
      payload: {
        id: entityId,
        display_name: "Mara Vey",
        entity_kind: "person",
        roles_in_story: [],
        short_description: "An archivist at the lower gate."
      }
    };
    mockWorkingSet();
    vi.mocked(listRecords).mockResolvedValue({ ok: true, records: [] });
    vi.mocked(createRecord)
      .mockResolvedValueOnce({ ok: false, kind: "save-failed", message: "ENTITY save failed." })
      .mockResolvedValueOnce({ ok: true, record: entityRecord })
      .mockImplementationOnce((request) => Promise.resolve({
        ok: true,
        record: {
          id: castId,
          type: "CAST MEMBER",
          displayLabel: "Mara dossier",
          status: null,
          salience: null,
          urgency: null,
          archived: false,
          userOrder: null,
          createdAt: "2026-07-19T00:01:00.000Z",
          updatedAt: "2026-07-19T00:01:00.000Z",
          payload: request.payload
        }
      }));

    renderBrowser();
    await screen.findByText("No record selected.");
    fireEvent.click(screen.getByRole("button", { name: "Create CAST MEMBER" }));

    expect(await screen.findByRole("heading", { name: "ENTITY required before CAST MEMBER" })).toBeTruthy();
    expect(screen.getByRole("status").textContent).toContain("durable character identity");
    expect(screen.getByRole("button", { name: "Create ENTITY" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Back to records" })).toBeTruthy();
    expect(createRecord).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Create ENTITY" }));
    expect(await screen.findByRole("heading", { name: "ENTITY" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Back to prerequisite" })).toBeTruthy();
    fireEvent.change(screen.getByLabelText(/^display_name/), { target: { value: "Mara Vey" } });
    fireEvent.change(screen.getByLabelText(/^short_description/), {
      target: { value: "An archivist at the lower gate." }
    });
    fireEvent.click(screen.getByRole("button", { name: "Create Record" }));

    expect((await screen.findByRole("alert")).textContent).toBe("ENTITY save failed.");
    expect(screen.getByLabelText<HTMLInputElement>(/^display_name/).value).toBe("Mara Vey");
    expect(screen.getByLabelText<HTMLInputElement>(/^short_description/).value).toBe(
      "An archivist at the lower gate."
    );

    fireEvent.click(screen.getByRole("button", { name: "Create Record" }));

    expect(await screen.findByRole("heading", { name: "CAST MEMBER" })).toBeTruthy();
    const entityPicker = screen.getByLabelText<HTMLSelectElement>(/^entity_id/);
    expect(within(entityPicker).getByRole<HTMLOptionElement>("option", { name: "Mara Vey" }).value).toBe(entityId);
    expect(entityPicker.value).toBe("");
    expect(createRecord).toHaveBeenCalledTimes(2);

    fireEvent.change(entityPicker, { target: { value: entityId } });
    fillCastRequiredCore();
    fireEvent.click(screen.getByRole("button", { name: "Create Record" }));

    await waitFor(() => expect(createRecord).toHaveBeenCalledTimes(3));
    expect(vi.mocked(createRecord).mock.calls[2]?.[0]).toMatchObject({
      type: "CAST MEMBER",
      payload: { entity_id: entityId }
    });
    expect(await screen.findByRole("heading", { name: "Records" })).toBeTruthy();
  });

  it("does not let archived ENTITY records falsely satisfy the CAST MEMBER prerequisite", async () => {
    mockWorkingSet();
    vi.mocked(listRecords).mockResolvedValue({
      ok: true,
      records: [{ ...fixtures[0]!, archived: true, displayLabel: "Archived Aster" }]
    });

    renderBrowser();
    await screen.findByRole("button", { name: "Archived Aster" });
    fireEvent.click(screen.getByRole("button", { name: "Create CAST MEMBER" }));

    expect(await screen.findByRole("heading", { name: "ENTITY required before CAST MEMBER" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Back to records" }));
    expect(await screen.findByRole("heading", { name: "Records" })).toBeTruthy();
    expect(createRecord).not.toHaveBeenCalled();
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

  it("offers Create linked CAST MEMBER on a person ENTITY detail with no linked dossier but hides it on non-person entities", async () => {
    const personSummary: RecordSummary = { ...fixtures[0]!, id: "entity-person", displayLabel: "Iven" };
    const institutionSummary: RecordSummary = { ...fixtures[0]!, id: "entity-institution", displayLabel: "Harbor Board" };
    const personDetail: RecordDetail = {
      ...personSummary,
      payload: { id: "entity-person", display_name: "Iven", entity_kind: "person", roles_in_story: [], short_description: "An offstage supervisor." }
    };
    const institutionDetail: RecordDetail = {
      ...institutionSummary,
      payload: { id: "entity-institution", display_name: "Harbor Board", entity_kind: "institution", roles_in_story: ["authority"], short_description: "A licensing board." }
    };
    mockWorkingSet();
    vi.mocked(listRecords).mockImplementation((filters = {}) =>
      filters.type === "CAST MEMBER" && filters.refRole === "entity_id"
        ? Promise.resolve({ ok: true, records: [] })
        : Promise.resolve({ ok: true, records: [personSummary, institutionSummary] })
    );
    vi.mocked(getRecord).mockImplementation((id: string) =>
      Promise.resolve({ ok: true, record: id === "entity-institution" ? institutionDetail : personDetail })
    );

    renderBrowser();
    fireEvent.click(await screen.findByRole("button", { name: "Iven" }));
    expect(await screen.findByRole("button", { name: "Create linked CAST MEMBER" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Harbor Board" }));
    await waitFor(() => expect(screen.queryByRole("button", { name: "Create linked CAST MEMBER" })).toBeNull());
    expect(screen.getByRole("button", { name: "Edit Record" })).toBeTruthy();
  });

  it("does not expose the linked CAST MEMBER action on an archived person ENTITY", async () => {
    const archivedPerson: RecordSummary = { ...fixtures[0]!, id: "entity-archived", displayLabel: "Archived Iven", archived: true };
    const archivedDetail: RecordDetail = {
      ...archivedPerson,
      payload: { id: "entity-archived", display_name: "Archived Iven", entity_kind: "person", roles_in_story: [], short_description: "Retired supervisor." }
    };
    mockWorkingSet();
    vi.mocked(listRecords).mockImplementation((filters = {}) =>
      filters.type === "CAST MEMBER" && filters.refRole === "entity_id"
        ? Promise.resolve({ ok: true, records: [] })
        : Promise.resolve({ ok: true, records: [archivedPerson] })
    );
    vi.mocked(getRecord).mockResolvedValue({ ok: true, record: archivedDetail });

    renderBrowser();
    fireEvent.click(await screen.findByRole("button", { name: "Archived Iven" }));
    // Archived state is shown, but the linked-CAST action is not falsely exposed (#116 AC1).
    expect(await screen.findByRole("button", { name: "Edit Record" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Create linked CAST MEMBER" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Open linked CAST MEMBER" })).toBeNull();
  });

  it("opens the CAST MEMBER editor with the ENTITY relationship preselected and writes nothing before Create Record", async () => {
    const personSummary: RecordSummary = { ...fixtures[0]!, id: "entity-iven", displayLabel: "Iven" };
    const personDetail: RecordDetail = {
      ...personSummary,
      payload: { id: "entity-iven", display_name: "Iven", entity_kind: "person", roles_in_story: [], short_description: "Offstage supervisor." }
    };
    mockWorkingSet();
    vi.mocked(listRecords).mockImplementation((filters = {}) =>
      filters.type === "CAST MEMBER" && filters.refRole === "entity_id"
        ? Promise.resolve({ ok: true, records: [] })
        : Promise.resolve({ ok: true, records: [personSummary] })
    );
    vi.mocked(getRecord).mockResolvedValue({ ok: true, record: personDetail });

    renderBrowser();
    fireEvent.click(await screen.findByRole("button", { name: "Iven" }));
    fireEvent.click(await screen.findByRole("button", { name: "Create linked CAST MEMBER" }));

    expect(await screen.findByRole("heading", { name: "CAST MEMBER" })).toBeTruthy();
    expect(screen.getByText("Create linked CAST MEMBER")).toBeTruthy();
    expect(screen.getByLabelText<HTMLSelectElement>(/^entity_id/).value).toBe("entity-iven");
    expect(createRecord).not.toHaveBeenCalled();
  });

  it("offers Open linked CAST MEMBER when an active linked dossier already exists", async () => {
    const personSummary: RecordSummary = { ...fixtures[0]!, id: "entity-iven", displayLabel: "Iven" };
    const personDetail: RecordDetail = {
      ...personSummary,
      payload: { id: "entity-iven", display_name: "Iven", entity_kind: "person", roles_in_story: [], short_description: "Offstage." }
    };
    const linkedCast: RecordSummary = {
      ...fixtures[0]!,
      id: "cast-iven",
      type: "CAST MEMBER",
      displayLabel: "Iven dossier",
      browseIdentity: { primaryLabel: "Iven", secondaryLabel: "Supervisor.", availability: "available" }
    };
    mockWorkingSet();
    vi.mocked(listRecords).mockImplementation((filters = {}) =>
      filters.type === "CAST MEMBER" && filters.refRole === "entity_id"
        ? Promise.resolve({ ok: true, records: [linkedCast] })
        : Promise.resolve({ ok: true, records: [personSummary] })
    );
    vi.mocked(getRecord).mockResolvedValue({ ok: true, record: personDetail });

    renderBrowser();
    fireEvent.click(await screen.findByRole("button", { name: "Iven" }));
    expect(await screen.findByRole("button", { name: "Open linked CAST MEMBER" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Create linked CAST MEMBER" })).toBeNull();
  });

  it("shows archived-link recovery guidance when the only linked CAST MEMBER is archived", async () => {
    const personSummary: RecordSummary = { ...fixtures[0]!, id: "entity-iven", displayLabel: "Iven" };
    const personDetail: RecordDetail = {
      ...personSummary,
      payload: { id: "entity-iven", display_name: "Iven", entity_kind: "person", roles_in_story: [], short_description: "Offstage." }
    };
    const archivedCast: RecordSummary = {
      ...fixtures[0]!,
      id: "cast-archived",
      type: "CAST MEMBER",
      displayLabel: "Archived dossier",
      archived: true
    };
    mockWorkingSet();
    vi.mocked(listRecords).mockImplementation((filters = {}) =>
      filters.type === "CAST MEMBER" && filters.refRole === "entity_id"
        ? Promise.resolve({ ok: true, records: [archivedCast] })
        : Promise.resolve({ ok: true, records: [personSummary] })
    );
    vi.mocked(getRecord).mockResolvedValue({ ok: true, record: personDetail });

    renderBrowser();
    fireEvent.click(await screen.findByRole("button", { name: "Iven" }));
    expect(await screen.findByText(/linked CAST MEMBER dossier is archived/)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Create linked CAST MEMBER" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Open linked CAST MEMBER" })).toBeNull();
  });

  it("retains the preselected ENTITY relationship and authored values when the linked CAST MEMBER save fails", async () => {
    const ivenId = "019b0298-5c00-7000-8000-0000000004a1";
    const personSummary: RecordSummary = { ...fixtures[0]!, id: ivenId, displayLabel: "Iven" };
    const personDetail: RecordDetail = {
      ...personSummary,
      payload: { id: ivenId, display_name: "Iven", entity_kind: "person", roles_in_story: [], short_description: "Offstage." }
    };
    mockWorkingSet();
    vi.mocked(listRecords).mockImplementation((filters = {}) =>
      filters.type === "CAST MEMBER" && filters.refRole === "entity_id"
        ? Promise.resolve({ ok: true, records: [] })
        : Promise.resolve({ ok: true, records: [personSummary] })
    );
    vi.mocked(getRecord).mockResolvedValue({ ok: true, record: personDetail });
    vi.mocked(createRecord).mockResolvedValue({ ok: false, kind: "save-failed", message: "CAST MEMBER save failed." });

    renderBrowser();
    fireEvent.click(await screen.findByRole("button", { name: "Iven" }));
    fireEvent.click(await screen.findByRole("button", { name: "Create linked CAST MEMBER" }));
    fireEvent.change(await screen.findByLabelText<HTMLSelectElement>(/^entity_id/), { target: { value: ivenId } });
    fillCastRequiredCore();
    fireEvent.click(screen.getByRole("button", { name: "Create Record" }));

    expect((await screen.findByRole("alert")).textContent).toBe("CAST MEMBER save failed.");
    expect(screen.getByLabelText<HTMLSelectElement>(/^entity_id/).value).toBe(ivenId);
    expect(screen.getByLabelText<HTMLInputElement>(/^one_line/).value).toBe("A careful operator.");
    expect(screen.getByRole("button", { name: "Create Record" })).toBeTruthy();
  });

  it("confirms the linked identity and adds only the saved CAST MEMBER to the working set on explicit Add", async () => {
    const ivenId = "019b0298-5c00-7000-8000-0000000004a1";
    const castNewId = "019b0298-5c00-7000-8000-0000000004a2";
    const personSummary: RecordSummary = { ...fixtures[0]!, id: ivenId, displayLabel: "Iven" };
    const personDetail: RecordDetail = {
      ...personSummary,
      payload: { id: ivenId, display_name: "Iven", entity_kind: "person", roles_in_story: [], short_description: "Offstage." }
    };
    mockWorkingSet();
    vi.mocked(listRecords).mockImplementation((filters = {}) =>
      filters.type === "CAST MEMBER" && filters.refRole === "entity_id"
        ? Promise.resolve({ ok: true, records: [] })
        : Promise.resolve({ ok: true, records: [personSummary] })
    );
    vi.mocked(getRecord).mockResolvedValue({ ok: true, record: personDetail });
    vi.mocked(createRecord).mockResolvedValue({
      ok: true,
      record: { ...fixtures[0]!, id: castNewId, type: "CAST MEMBER", displayLabel: "Iven dossier", payload: { entity_id: ivenId } }
    });

    renderBrowser();
    fireEvent.click(await screen.findByRole("button", { name: "Iven" }));
    fireEvent.click(await screen.findByRole("button", { name: "Create linked CAST MEMBER" }));
    fireEvent.change(await screen.findByLabelText<HTMLSelectElement>(/^entity_id/), { target: { value: ivenId } });
    fillCastRequiredCore();
    fireEvent.click(screen.getByRole("button", { name: "Create Record" }));

    expect(await screen.findByRole("heading", { name: /Linked dossier ready for Iven/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Add to Active Working Set" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Open Active Working Set" })).toBeTruthy();
    // Creating the record wrote no working-set membership.
    expect(setWorkingSet).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Add to Active Working Set" }));
    await waitFor(() => expect(setWorkingSet).toHaveBeenCalledWith([castNewId]));
    expect(await screen.findByText("Added to the active working set.")).toBeTruthy();
  });
});

function fillCastRequiredCore(): void {
  for (const [label, value] of [
    ["one_line", "A careful operator."],
    ["public_face", "Composed and exacting."],
    ["private_pressure", "Afraid of losing control."],
    ["core_voice", "formal"],
    ["rhythm_and_syntax", "measured clauses"],
    ["register_and_diction", "precise diction"],
    ["vocabulary_and_metaphor_pools", "weather and contracts"],
    ["profanity_and_intensity", "low profanity"],
    ["taboo_and_avoidance_patterns", "avoids family"],
    ["dialogue_tactics_and_speech_functions", "deflects with procedure"],
    ["address_terms_and_naming", "uses titles"],
    ["silence_interruption_and_turntaking", "strategic pauses"],
    ["under_pressure_voice", "clipped"],
    ["suppression_or_evasion_rule", "redirects questions"],
    ["cornered", "narrows choices"],
    ["tempted_or_offered_power", "asks for terms"],
    ["protecting_attachment", "deflects danger"],
    ["physicality", "very still"],
    ["habitual_gestures_or_presence", "folded hands"],
    ["social_presentation", "controlled"],
    ["default_strategy", "delay and document"],
    ["risk_style", "calculated"]
  ] as const) {
    fireEvent.change(screen.getByLabelText(new RegExp(`^${label}`)), { target: { value } });
  }
}
