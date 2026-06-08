// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { RecordEditor } from "./RecordEditor.js";
import { createRecord, updateRecord, type RecordDetail, type RecordSummary } from "../api.js";

vi.mock("../api.js", () => ({
  createRecord: vi.fn(),
  updateRecord: vi.fn()
}));

const idA = "019b0298-5c00-7000-8000-000000000001";
const idB = "019b0298-5c00-7000-8000-000000000002";

const entityRecords: RecordSummary[] = [
  {
    id: idA,
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
    id: idB,
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
    id: "019b0298-5c00-7000-8000-000000000003",
    type: "ENTITY",
    displayLabel: "Archived entity",
    status: null,
    salience: null,
    urgency: null,
    archived: true,
    userOrder: null,
    createdAt: "2026-06-05T00:00:00.000Z",
    updatedAt: "2026-06-05T00:00:00.000Z"
  }
];

const factRecord: RecordDetail = {
  id: idB,
  type: "FACT",
  displayLabel: "Door code",
  status: "active",
  salience: "medium",
  urgency: null,
  archived: false,
  userOrder: null,
  createdAt: "2026-06-05T00:00:00.000Z",
  updatedAt: "2026-06-05T00:00:00.000Z",
  payload: {
    id: idB,
    status: "active",
    fact_kind: "current_state",
    statement: "A knows the old door code.",
    scope: "entity",
    known_by: [],
    audience_visibility: "explicit",
    salience: "medium"
  }
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("RecordEditor", () => {
  it("renders a complete typed form for create and submits through the create route", async () => {
    const saved: RecordDetail = {
      id: idA,
      type: "ENTITY",
      displayLabel: "Aster",
      status: null,
      salience: null,
      urgency: null,
      archived: false,
      userOrder: null,
      createdAt: "2026-06-05T00:00:00.000Z",
      updatedAt: "2026-06-05T00:00:00.000Z",
      payload: {}
    };
    const onSaved = vi.fn();
    vi.mocked(createRecord).mockResolvedValue({ ok: true, record: saved });

    render(<RecordEditor recordType="ENTITY" onSaved={onSaved} />);

    expect(screen.queryByLabelText(/^id/)).toBeNull();
    fireEvent.change(screen.getByLabelText(/^display_name/), { target: { value: "Aster" } });
    fireEvent.change(screen.getByLabelText(/^short_description/), { target: { value: "A careful operator." } });
    fireEvent.click(screen.getByRole("button", { name: "Create Record" }));

    await waitFor(() =>
      expect(createRecord).toHaveBeenCalledWith({
        type: "ENTITY",
        displayLabel: "Aster",
        payload: {
          display_name: "Aster",
          entity_kind: "person",
          roles_in_story: [],
          short_description: "A careful operator."
        }
      })
    );
    expect(onSaved).toHaveBeenCalledWith(saved);
  });

  it("round-trips edits through the update route", async () => {
    vi.mocked(updateRecord).mockResolvedValue({ ok: true, record: { ...factRecord, displayLabel: "New fact" } });

    render(<RecordEditor recordType="FACT" record={factRecord} />);

    expect(screen.getByRole("button", { name: "Help for statement" })).toBeTruthy();
    fireEvent.change(screen.getByLabelText(/^statement/), { target: { value: "A knows the west door code." } });
    fireEvent.click(screen.getByRole("button", { name: "Save Record" }));

    await waitFor(() =>
      expect(updateRecord).toHaveBeenCalledWith(idB, {
        displayLabel: "A knows the west door code.",
        payload: {
          status: "active",
          fact_kind: "current_state",
          statement: "A knows the west door code.",
          scope: "entity",
          known_by: [],
          audience_visibility: "explicit",
          salience: "medium"
        }
      })
    );
  });

  it("renders descriptor field kinds as typed controls without a raw JSON editor", () => {
    render(<RecordEditor recordType="INTENTION" />);

    expect(screen.getByLabelText(/^holder/).tagName).toBe("SELECT");
    expect(screen.getByLabelText(/^status/).tagName).toBe("SELECT");
    expect(screen.getByLabelText(/^behavioral_pressure/).tagName).toBe("TEXTAREA");

    cleanup();
    render(<RecordEditor recordType="PLAN" />);
    expect(screen.getByLabelText<HTMLInputElement>(/^can_drive_prose/).type).toBe("checkbox");
    expect(screen.getByRole("button", { name: "Add resources" })).toBeTruthy();
    expect(screen.queryByLabelText(/json/i)).toBeNull();
    expect(screen.queryByLabelText(/payload/i)).toBeNull();

    cleanup();
    render(<RecordEditor recordType="CAST MEMBER" />);
    expect(screen.getByRole("group", { name: "identity" })).toBeTruthy();
  });

  it("writes enum card selections as the schema enum literal", async () => {
    const onSubmitPayload = vi.fn().mockResolvedValue({ ok: true });

    render(<RecordEditor recordType="SECRET" onSubmitPayload={onSubmitPayload} />);

    expect(screen.queryByLabelText(/^id/)).toBeNull();
    fireEvent.change(screen.getByLabelText(/^secret_claim/), { target: { value: "Aster carries the hidden seal." } });
    fireEvent.click(screen.getByDisplayValue("clue_only"));
    fireEvent.click(screen.getByRole("button", { name: "Create Record" }));

    await waitFor(() => expect(onSubmitPayload).toHaveBeenCalled());
    expect(onSubmitPayload.mock.calls[0]?.[0]).toMatchObject({
      reveal_permission: "clue_only"
    });
  });

  it("lists only eligible reference targets and stores selected ids", () => {
    vi.mocked(createRecord).mockResolvedValue({
      ok: true,
      record: { ...factRecord, id: "cast-1", type: "CAST MEMBER", payload: {} }
    });

    render(<RecordEditor recordType="CAST MEMBER" referenceRecords={entityRecords} />);

    const picker = screen.getByLabelText(/^entity_id/);
    const asterOption = within(picker).getByRole<HTMLOptionElement>("option", { name: "Aster" });
    expect(asterOption.value).toBe(idA);
    expect(within(picker).queryByRole("option", { name: "Vault" })).toBeNull();
    expect(within(picker).queryByRole("option", { name: "Archived entity" })).toBeNull();

    fireEvent.change(picker, { target: { value: idA } });
    expect((picker as HTMLSelectElement).value).toBe(idA);
  });

  it("renders SECRET holders as entity pickers and stores selected ids", async () => {
    const onSubmitPayload = vi.fn().mockResolvedValue({ ok: true });

    render(<RecordEditor recordType="SECRET" referenceRecords={entityRecords} onSubmitPayload={onSubmitPayload} />);

    fireEvent.click(screen.getByRole("button", { name: "Add holders" }));

    const picker = screen.getByLabelText(/^holders 1/);
    expect(picker.tagName).toBe("SELECT");
    expect(within(picker).getByRole<HTMLOptionElement>("option", { name: "Aster" }).value).toBe(idA);
    expect(within(picker).queryByRole("option", { name: "Vault" })).toBeNull();
    expect(screen.queryByRole("textbox", { name: /^holders 1/ })).toBeNull();

    fireEvent.change(picker, { target: { value: idA } });
    fireEvent.change(screen.getByLabelText(/^secret_claim/), {
      target: { value: "Aster carries the hidden seal." }
    });
    fireEvent.click(screen.getByRole("button", { name: "Create Record" }));

    await waitFor(() => expect(onSubmitPayload).toHaveBeenCalled());
    expect(onSubmitPayload.mock.calls[0]?.[0]).toMatchObject({
      holders: [idA]
    });
  });

  it("stores specific SECRET protected non-holders as selected entity ids", async () => {
    const onSubmitPayload = vi.fn().mockResolvedValue({ ok: true });

    render(<RecordEditor recordType="SECRET" referenceRecords={entityRecords} onSubmitPayload={onSubmitPayload} />);

    fireEvent.change(screen.getByLabelText(/^non_holders_to_protect mode/), {
      target: { value: "specific_entities" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Add non_holders_to_protect" }));

    const picker = screen.getByLabelText(/^non_holders_to_protect 1/);
    expect(picker.tagName).toBe("SELECT");
    expect(within(picker).getByRole<HTMLOptionElement>("option", { name: "Aster" }).value).toBe(idA);
    expect(within(picker).queryByRole("option", { name: "Vault" })).toBeNull();

    fireEvent.change(picker, { target: { value: idA } });
    fireEvent.change(screen.getByLabelText(/^secret_claim/), {
      target: { value: "Aster carries the hidden seal." }
    });
    fireEvent.click(screen.getByRole("button", { name: "Create Record" }));

    await waitFor(() => expect(onSubmitPayload).toHaveBeenCalled());
    expect(onSubmitPayload.mock.calls[0]?.[0]).toMatchObject({
      non_holders_to_protect: [idA]
    });
  });

  it("stores SECRET protected non-holder sentinel values verbatim", async () => {
    const onSubmitPayload = vi.fn().mockResolvedValue({ ok: true });

    render(<RecordEditor recordType="SECRET" referenceRecords={entityRecords} onSubmitPayload={onSubmitPayload} />);

    fireEvent.change(screen.getByLabelText(/^non_holders_to_protect mode/), {
      target: { value: "none" }
    });
    fireEvent.change(screen.getByLabelText(/^secret_claim/), {
      target: { value: "Aster carries the hidden seal." }
    });
    fireEvent.click(screen.getByRole("button", { name: "Create Record" }));

    await waitFor(() => expect(onSubmitPayload).toHaveBeenCalled());
    expect(onSubmitPayload.mock.calls[0]?.[0]).toMatchObject({
      non_holders_to_protect: "none"
    });
  });

  it("rejects invalid values client-side before submit", async () => {
    render(<RecordEditor recordType="ENTITY" />);

    fireEvent.click(screen.getByRole("button", { name: "Create Record" }));

    await waitFor(() => expect(createRecord).not.toHaveBeenCalled());
    expect(await screen.findAllByRole("alert")).not.toHaveLength(0);
  });

  it("shows server structural errors field-linked", async () => {
    vi.mocked(createRecord).mockResolvedValue({
      ok: false,
      kind: "malformed-payload",
      message: "Record payload is invalid.",
      issues: [{ path: ["display_name"], message: "Display name is already used." }]
    });

    render(<RecordEditor recordType="ENTITY" />);

    expect(screen.queryByLabelText(/^id/)).toBeNull();
    fireEvent.change(screen.getByLabelText(/^display_name/), { target: { value: "Aster" } });
    fireEvent.change(screen.getByLabelText(/^short_description/), { target: { value: "A careful operator." } });
    fireEvent.click(screen.getByRole("button", { name: "Create Record" }));

    expect(await screen.findByText("Display name is already used.")).toBeTruthy();
  });
});
