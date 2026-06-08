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
const archivedEntityId = "019b0298-5c00-7000-8000-000000000003";
const missingEntityId = "019b0298-5c00-7000-8000-000000000004";

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
    id: archivedEntityId,
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

const archivedOwnerObjectRecord: RecordDetail = {
  id: "019b0298-5c00-7000-8000-000000000005",
  type: "OBJECT",
  displayLabel: "Archived-owner letter",
  status: "active",
  salience: null,
  urgency: null,
  archived: false,
  userOrder: null,
  createdAt: "2026-06-05T00:00:00.000Z",
  updatedAt: "2026-06-05T00:00:00.000Z",
  payload: {
    status: "active",
    label: "Archived-owner letter",
    description: "A letter whose owner was archived.",
    owner: archivedEntityId,
    carried_by: "none",
    current_location: idB,
    visibility_to_pov: "visible",
    usable_affordances: [],
    constraints: [],
    durability: "continuity_relevant"
  }
};

const missingEntityStatusRecord: RecordDetail = {
  id: "019b0298-5c00-7000-8000-000000000006",
  type: "ENTITY STATUS",
  displayLabel: "Missing entity status",
  status: null,
  salience: null,
  urgency: null,
  archived: false,
  userOrder: null,
  createdAt: "2026-06-05T00:00:00.000Z",
  updatedAt: "2026-06-05T00:00:00.000Z",
  payload: {
    entity_id: missingEntityId,
    life: "alive",
    agency: "free",
    location: "unknown",
    visibility_to_pov: "visible",
    current_activity: "Waiting outside the vault."
  }
};

function optionValues(select: HTMLElement): string[] {
  return within(select)
    .getAllByRole<HTMLOptionElement>("option")
    .map((option) => option.value);
}

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
    expect(optionValues(picker).filter((value) => value === idA)).toHaveLength(1);
    expect(within(picker).queryByText(/unresolved/)).toBeNull();
  });

  it("shows and preserves an archived stored value in a sentinel reference picker", async () => {
    const onSubmitPayload = vi.fn().mockResolvedValue({ ok: true });

    render(
      <RecordEditor
        recordType="OBJECT"
        record={archivedOwnerObjectRecord}
        referenceRecords={entityRecords}
        onSubmitPayload={onSubmitPayload}
      />
    );

    const owner = screen.getByLabelText<HTMLSelectElement>(/^owner/);
    expect(within(owner).getByRole<HTMLOptionElement>("option", { name: "Archived entity (unresolved/archived)" }).value)
      .toBe(archivedEntityId);
    expect(owner.value).toBe(archivedEntityId);
    expect(optionValues(owner).filter((value) => value === archivedEntityId)).toHaveLength(1);

    fireEvent.click(screen.getByRole("button", { name: "Save Record" }));

    await waitFor(() => expect(onSubmitPayload).toHaveBeenCalled());
    expect(onSubmitPayload.mock.calls[0]?.[0]).toMatchObject({
      owner: archivedEntityId
    });
  });

  it("shows and preserves a missing stored value in a pure reference picker", async () => {
    const onSubmitPayload = vi.fn().mockResolvedValue({ ok: true });

    render(
      <RecordEditor
        recordType="ENTITY STATUS"
        record={missingEntityStatusRecord}
        referenceRecords={entityRecords}
        onSubmitPayload={onSubmitPayload}
      />
    );

    const entityPicker = screen.getByLabelText<HTMLSelectElement>(/^entity_id/);
    expect(within(entityPicker).getByRole<HTMLOptionElement>("option", {
      name: `${missingEntityId} (unresolved/missing)`
    }).value).toBe(missingEntityId);
    expect(entityPicker.value).toBe(missingEntityId);
    expect(optionValues(entityPicker).filter((value) => value === missingEntityId)).toHaveLength(1);

    fireEvent.click(screen.getByRole("button", { name: "Save Record" }));

    await waitFor(() => expect(onSubmitPayload).toHaveBeenCalled());
    expect(onSubmitPayload.mock.calls[0]?.[0]).toMatchObject({
      entity_id: missingEntityId
    });
  });

  it("does not render a fallback option when the stored reference is eligible", () => {
    render(
      <RecordEditor
        recordType="ENTITY STATUS"
        record={{
          ...missingEntityStatusRecord,
          payload: {
            ...(missingEntityStatusRecord.payload as Record<string, unknown>),
            entity_id: idA
          }
        }}
        referenceRecords={entityRecords}
      />
    );

    const entityPicker = screen.getByLabelText<HTMLSelectElement>(/^entity_id/);
    expect(entityPicker.value).toBe(idA);
    expect(optionValues(entityPicker).filter((value) => value === idA)).toHaveLength(1);
    expect(within(entityPicker).queryByText(/unresolved/)).toBeNull();
  });

  it("stores VISIBLE AFFORDANCE availability sentinel values from a single select", async () => {
    const onSubmitPayload = vi.fn().mockResolvedValue({ ok: true });

    render(
      <RecordEditor recordType="VISIBLE AFFORDANCE" referenceRecords={entityRecords} onSubmitPayload={onSubmitPayload} />
    );

    const picker = screen.getByLabelText<HTMLSelectElement>(/^available_to/);
    expect(within(picker).getByRole<HTMLOptionElement>("option", { name: "group" }).value).toBe("group");
    expect(within(picker).getByRole<HTMLOptionElement>("option", { name: "any_onstage" }).value).toBe("any_onstage");
    expect(within(picker).getByRole<HTMLOptionElement>("option", { name: "Aster" }).value).toBe(idA);
    expect(within(picker).queryByRole("option", { name: "Vault" })).toBeNull();
    expect(within(picker).queryByRole("option", { name: "Select record" })).toBeNull();

    fireEvent.change(picker, { target: { value: "any_onstage" } });
    fireEvent.change(picker, { target: { value: "group" } });
    fireEvent.change(screen.getByLabelText(/^label/), { target: { value: "Shared ladder" } });
    fireEvent.change(screen.getByLabelText(/^prompt_text/), {
      target: { value: "The ladder can be raised against the wall." }
    });
    fireEvent.click(screen.getByRole("button", { name: "Create Record" }));

    await waitFor(() => expect(onSubmitPayload).toHaveBeenCalled());
    expect(onSubmitPayload.mock.calls[0]?.[0]).toMatchObject({
      available_to: "group"
    });
  });

  it("renders OBJECT sentinel references while preserving entity-owner saves", async () => {
    const onSubmitPayload = vi.fn().mockResolvedValue({ ok: true });

    render(<RecordEditor recordType="OBJECT" referenceRecords={entityRecords} onSubmitPayload={onSubmitPayload} />);

    const owner = screen.getByLabelText<HTMLSelectElement>(/^owner/);
    const carriedBy = screen.getByLabelText<HTMLSelectElement>(/^carried_by/);
    const currentLocation = screen.getByLabelText<HTMLSelectElement>(/^current_location/);

    expect(within(owner).getByRole<HTMLOptionElement>("option", { name: "none" }).value).toBe("none");
    expect(within(owner).getByRole<HTMLOptionElement>("option", { name: "unknown" }).value).toBe("unknown");
    expect(within(owner).getByRole<HTMLOptionElement>("option", { name: "Aster" }).value).toBe(idA);
    expect(within(owner).queryByRole("option", { name: "Vault" })).toBeNull();
    expect(within(carriedBy).getByRole<HTMLOptionElement>("option", { name: "none" }).value).toBe("none");
    expect(within(currentLocation).getByRole<HTMLOptionElement>("option", { name: "carried_by_holder" }).value)
      .toBe("carried_by_holder");
    expect(within(currentLocation).getByRole<HTMLOptionElement>("option", { name: "unknown" }).value).toBe("unknown");
    expect(within(currentLocation).getByRole<HTMLOptionElement>("option", { name: "offstage" }).value).toBe("offstage");
    expect(within(currentLocation).getByRole<HTMLOptionElement>("option", { name: "Vault" }).value).toBe(idB);

    fireEvent.change(screen.getByLabelText(/^label/), { target: { value: "Lantern" } });
    fireEvent.change(screen.getByLabelText(/^description/), { target: { value: "A smoky hand lantern." } });
    fireEvent.change(owner, { target: { value: idA } });
    fireEvent.change(currentLocation, { target: { value: idB } });
    fireEvent.click(screen.getByRole("button", { name: "Create Record" }));

    await waitFor(() => expect(onSubmitPayload).toHaveBeenCalled());
    expect(onSubmitPayload.mock.calls[0]?.[0]).toMatchObject({
      owner: idA,
      current_location: idB
    });
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

  it("stores EVENT causes as record-link arrays from reference pickers", async () => {
    const onSubmitPayload = vi.fn().mockResolvedValue({ ok: true });

    render(<RecordEditor recordType="EVENT" referenceRecords={entityRecords} onSubmitPayload={onSubmitPayload} />);

    expect(screen.queryByRole("textbox", { name: /^causes/ })).toBeNull();
    expect(screen.queryByRole("textbox", { name: /^effects/ })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Add causes" }));
    fireEvent.click(screen.getByRole("button", { name: "Add causes" }));

    const firstCause = screen.getByLabelText<HTMLSelectElement>(/^causes 1/);
    const secondCause = screen.getByLabelText<HTMLSelectElement>(/^causes 2/);
    expect(firstCause.tagName).toBe("SELECT");
    expect(within(firstCause).getByRole<HTMLOptionElement>("option", { name: "Aster" }).value).toBe(idA);
    expect(within(firstCause).getByRole<HTMLOptionElement>("option", { name: "Vault" }).value).toBe(idB);

    fireEvent.change(firstCause, { target: { value: idA } });
    fireEvent.change(secondCause, { target: { value: idB } });
    fireEvent.change(screen.getByLabelText(/^description/), {
      target: { value: "The vault door opens under pressure." }
    });
    fireEvent.click(screen.getByRole("button", { name: "Create Record" }));

    await waitFor(() => expect(onSubmitPayload).toHaveBeenCalled());
    expect(onSubmitPayload.mock.calls[0]?.[0]).toMatchObject({
      causes: [idA, idB],
      effects: []
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

  it("stores SECRET forbidden-reveal sentinel values verbatim", async () => {
    const onSubmitPayload = vi.fn().mockResolvedValue({ ok: true });

    render(<RecordEditor recordType="SECRET" referenceRecords={entityRecords} onSubmitPayload={onSubmitPayload} />);

    fireEvent.change(screen.getByLabelText(/^forbidden_reveals mode/), {
      target: { value: "none" }
    });
    fireEvent.change(screen.getByLabelText(/^secret_claim/), {
      target: { value: "Aster carries the hidden seal." }
    });
    fireEvent.click(screen.getByRole("button", { name: "Create Record" }));

    await waitFor(() => expect(onSubmitPayload).toHaveBeenCalled());
    expect(onSubmitPayload.mock.calls[0]?.[0]).toMatchObject({
      forbidden_reveals: "none"
    });
  });

  it("switches SECRET forbidden reveals back to an editable prose list", async () => {
    const onSubmitPayload = vi.fn().mockResolvedValue({ ok: true });

    render(<RecordEditor recordType="SECRET" referenceRecords={entityRecords} onSubmitPayload={onSubmitPayload} />);

    const mode = screen.getByLabelText<HTMLSelectElement>(/^forbidden_reveals mode/);
    expect(mode.value).toBe("specific_reveals");
    expect(screen.getByRole("button", { name: "Add forbidden_reveals" })).toBeTruthy();

    fireEvent.change(mode, { target: { value: "none" } });
    expect(mode.value).toBe("none");
    expect(screen.queryByRole("button", { name: "Add forbidden_reveals" })).toBeNull();

    fireEvent.change(mode, { target: { value: "specific_reveals" } });
    expect(mode.value).toBe("specific_reveals");
    expect(screen.getByRole("button", { name: "Add forbidden_reveals" })).toBeTruthy();

    fireEvent.change(screen.getByLabelText(/^secret_claim/), {
      target: { value: "Aster carries the hidden seal." }
    });
    fireEvent.click(screen.getByRole("button", { name: "Create Record" }));

    await waitFor(() => expect(onSubmitPayload).toHaveBeenCalled());
    expect(onSubmitPayload.mock.calls[0]?.[0]).toMatchObject({
      forbidden_reveals: []
    });
  });

  it("loads SECRET forbidden-reveal sentinel values in sentinel mode", () => {
    const record: RecordDetail = {
      id: idA,
      type: "SECRET",
      displayLabel: "Hidden seal",
      status: "hidden",
      salience: "critical",
      urgency: null,
      archived: false,
      userOrder: null,
      createdAt: "2026-06-05T00:00:00.000Z",
      updatedAt: "2026-06-05T00:00:00.000Z",
      payload: {
        id: idA,
        status: "hidden",
        secret_kind: "identity",
        secret_claim: "Aster carries the hidden seal.",
        holders: [],
        non_holders_to_protect: "none",
        audience_visibility: "hidden",
        pov_access: "hidden",
        salience: "critical",
        allowed_surface_cues: [],
        forbidden_reveals: "none",
        reveal_permission: "natural_reveal_allowed",
        reveal_triggers: [],
        clue_carriers: []
      }
    };

    render(<RecordEditor recordType="SECRET" record={record} referenceRecords={entityRecords} />);

    expect(screen.getByLabelText<HTMLSelectElement>(/^forbidden_reveals mode/).value).toBe("none");
    expect(screen.queryByRole("button", { name: "Add forbidden_reveals" })).toBeNull();
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
