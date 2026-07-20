// @vitest-environment jsdom

import {
  CAST_MEMBER_DRAFT_PROMPT,
  getEditorDescriptor,
  type FieldDescriptor
} from "@loom/core";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CastMemberEditor } from "./CastMemberEditor.js";
import { createRecord, updateRecord, type RecordDetail, type RecordSummary } from "../api.js";

vi.mock("../api.js", () => ({
  createRecord: vi.fn(),
  updateRecord: vi.fn()
}));

const entityId = "019b0298-5c00-7000-8000-000000000001";
const castId = "019b0298-5c00-7000-8000-000000000002";
const clipboardWriteText = vi.fn();

const referenceRecords: RecordSummary[] = [
  {
    id: entityId,
    type: "ENTITY",
    displayLabel: "Aster",
    status: null,
    salience: null,
    urgency: null,
    archived: false,
    userOrder: null,
    createdAt: "2026-06-05T00:00:00.000Z",
    updatedAt: "2026-06-05T00:00:00.000Z"
  }
];

const castPayload = {
  entity_id: entityId,
  identity: {
    one_line: "A careful operator.",
    public_face: "Composed and exacting.",
    private_pressure: "Afraid of losing control."
  },
  voice_anchor: {
    core_voice: "formal",
    rhythm_and_syntax: "measured clauses",
    register_and_diction: "precise diction",
    vocabulary_and_metaphor_pools: "weather and contracts",
    profanity_and_intensity: "low profanity",
    taboo_and_avoidance_patterns: "avoids family",
    dialogue_tactics_and_speech_functions: "deflects with procedure",
    address_terms_and_naming: "uses titles",
    silence_interruption_and_turntaking: "strategic pauses",
    under_pressure_voice: "clipped",
    suppression_or_evasion_rule: "redirects questions",
    must_preserve: ["precision"],
    must_avoid: ["rambling"],
    anti_repetition_warnings: ["do not repeat weather metaphors"]
  },
  pressure_behavior_core: {
    cornered: "narrows choices",
    tempted_or_offered_power: "asks for terms",
    protecting_attachment: "deflects danger"
  },
  body_presence_core: {
    physicality: "very still",
    habitual_gestures_or_presence: "folded hands",
    social_presentation: "controlled"
  },
  agency_core: {
    default_strategy: "delay and document",
    risk_style: "calculated"
  },
  world_pressure_core: {
    world_produced_wound: "old betrayal",
    active_appetite: "control",
    self_mythology: "necessary custodian",
    irreconcilable_contradiction: "needs trust but withholds it"
  },
  relational_charge: "protective toward B",
  moral_psychological_edge: "pride under fear",
  voice_extended: {
    intimacy: "softens in private",
    anger: "quiet and procedural",
    lying: "over-explains dates",
    register_switching: "formal under observation",
    humor_or_irony_style: "dry understatement",
    idiom_or_sociolect_notes: "legal metaphors",
    anti_generic_warnings: ["do not make the voice broadly aristocratic"]
  },
  body_and_presence_extended: {
    body_limits: "old knee injury",
    clothing_presentation: "immaculate cuffs",
    sensory_or_appearance_signatures: "cold mint scent"
  },
  perception_and_embodiment: {
    notices: "locked windows",
    misses: "warm gestures",
    misreads: "politeness as leverage",
    sensory_bias: "tracks temperature"
  },
  pressure_behavior_extended: {
    humiliated: "becomes procedural",
    offered_power: "asks for terms",
    refused_power: "records the refusal"
  },
  agency_and_planning_extended: {
    fallback_style: "withdraw and document",
    planning_blind_spots: "assumes control matters most"
  },
  sample_utterances: [
    {
      text: "We have time.",
      situation: "delay",
      speech_function: "evasion",
      pressure_tags: ["control"],
      copy_policy: "never_copy_verbatim"
    }
  ]
};

const castRecord: RecordDetail = {
  id: castId,
  type: "CAST MEMBER",
  displayLabel: "Aster cast",
  status: null,
  salience: null,
  urgency: null,
  archived: false,
  userOrder: null,
  createdAt: "2026-06-05T00:00:00.000Z",
  updatedAt: "2026-06-05T00:00:00.000Z",
  payload: castPayload
};

function descriptorNames(fields: readonly FieldDescriptor[]): string[] {
  return fields.flatMap((field) => [
    field.name,
    ...(field.fields ? descriptorNames(field.fields) : []),
    ...(field.itemDescriptor?.fields ? descriptorNames(field.itemDescriptor.fields) : [])
  ]);
}

function fillRequiredCore(): void {
  fireEvent.change(screen.getByLabelText(/^entity_id/), { target: { value: entityId } });
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

function openDraftImport(): HTMLTextAreaElement {
  const importButton = screen.getByRole<HTMLButtonElement>("button", {
    name: "Import Cast Member draft"
  });
  importButton.focus();
  expect(document.activeElement).toBe(importButton);
  expect(importButton.tagName).toBe("BUTTON");
  fireEvent.click(importButton);

  const dialog = screen.getByRole("dialog", { name: "Import Cast Member draft" });
  const pasteSurface = within(dialog).getByRole<HTMLTextAreaElement>("textbox", {
    name: "External LLM response"
  });
  expect(pasteSurface.tagName).toBe("TEXTAREA");
  return pasteSurface;
}

function reviewDraftImport(pasteSurface: HTMLTextAreaElement, response: string): void {
  fireEvent.change(pasteSurface, { target: { value: response } });
  fireEvent.click(screen.getByRole("button", { name: "Review import" }));
}

function deferredVoid(): {
  promise: Promise<void>;
  resolve: () => void;
  reject: (reason: unknown) => void;
} {
  let resolve = (): void => undefined;
  let reject: (reason: unknown) => void = () => undefined;
  const promise = new Promise<void>((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });
  return { promise, resolve, reject };
}

beforeEach(() => {
  clipboardWriteText.mockReset();
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText: clipboardWriteText }
  });
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

describe("CastMemberEditor", () => {
  it("offers the same accessible copy control in create, linked-create, and edit modes", () => {
    const create = render(<CastMemberEditor referenceRecords={referenceRecords} />);
    expect(screen.getByRole("button", { name: "Copy Cast Member draft prompt" }).tagName).toBe("BUTTON");
    create.unmount();

    const linked = render(
      <CastMemberEditor payload={{ entity_id: entityId }} referenceRecords={referenceRecords} />
    );
    expect(screen.getByRole("button", { name: "Copy Cast Member draft prompt" })).toBeTruthy();
    expect(screen.getByLabelText<HTMLSelectElement>(/^entity_id/).value).toBe(entityId);
    linked.unmount();

    render(<CastMemberEditor record={castRecord} referenceRecords={referenceRecords} />);
    expect(screen.getByRole("button", { name: "Copy Cast Member draft prompt" })).toBeTruthy();
  });

  it("copies the current core template verbatim with truthful local-only feedback and no residue", async () => {
    const storageSetItem = vi.spyOn(Storage.prototype, "setItem");
    const fetchRequest = vi.fn();
    vi.stubGlobal("fetch", fetchRequest);
    clipboardWriteText.mockResolvedValue(undefined);

    render(<CastMemberEditor referenceRecords={referenceRecords} />);

    const copyButton = screen.getByRole("button", { name: "Copy Cast Member draft prompt" });
    copyButton.focus();
    expect(document.activeElement).toBe(copyButton);
    fireEvent.click(copyButton);

    await waitFor(() => expect(clipboardWriteText).toHaveBeenCalledWith(CAST_MEMBER_DRAFT_PROMPT));
    expect(screen.getByRole("status").textContent).toContain("Draft prompt copied");
    expect(createRecord).not.toHaveBeenCalled();
    expect(updateRecord).not.toHaveBeenCalled();
    expect(fetchRequest).not.toHaveBeenCalled();
    expect(storageSetItem).not.toHaveBeenCalled();
  });

  it("names clipboard failure, clears stale success, and recovers on retry", async () => {
    clipboardWriteText
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error("clipboard denied"))
      .mockResolvedValueOnce(undefined);

    render(<CastMemberEditor referenceRecords={referenceRecords} />);
    const copyButton = screen.getByRole("button", { name: "Copy Cast Member draft prompt" });

    fireEvent.click(copyButton);
    expect(await screen.findByText(/Draft prompt copied/)).toBeTruthy();

    fireEvent.click(copyButton);
    expect((await screen.findByRole("alert")).textContent).toBe(
      "Could not copy the Cast Member draft prompt to the clipboard. Retry Copy."
    );
    expect(screen.queryByText(/Draft prompt copied/)).toBeNull();

    fireEvent.click(copyButton);
    expect(await screen.findByText(/Draft prompt copied/)).toBeTruthy();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("keeps clipboard feedback owned by the newest overlapping attempt", async () => {
    const staleSuccess = deferredVoid();
    clipboardWriteText
      .mockImplementationOnce(() => staleSuccess.promise)
      .mockRejectedValueOnce(new Error("newest attempt denied"));

    render(<CastMemberEditor referenceRecords={referenceRecords} />);
    const copyButton = screen.getByRole("button", { name: "Copy Cast Member draft prompt" });
    fireEvent.click(copyButton);
    fireEvent.click(copyButton);
    expect((await screen.findByRole("alert")).textContent).toContain("Could not copy");

    await act(async () => {
      staleSuccess.resolve();
      await staleSuccess.promise;
    });
    expect(screen.getByRole("alert").textContent).toContain("Could not copy");
    expect(screen.queryByText(/Draft prompt copied/)).toBeNull();

    const staleFailure = deferredVoid();
    clipboardWriteText
      .mockImplementationOnce(() => staleFailure.promise)
      .mockResolvedValueOnce(undefined);
    fireEvent.click(copyButton);
    fireEvent.click(copyButton);
    expect(await screen.findByText(/Draft prompt copied/)).toBeTruthy();

    await act(async () => {
      staleFailure.reject(new Error("older attempt denied"));
      await staleFailure.promise.catch(() => undefined);
    });
    expect(screen.getByText(/Draft prompt copied/)).toBeTruthy();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("opens an accessible local paste surface in create, linked-create, and edit modes", () => {
    const create = render(<CastMemberEditor referenceRecords={referenceRecords} />);
    openDraftImport();
    expect(screen.getByRole("button", { name: "Cancel import" }).tagName).toBe("BUTTON");
    fireEvent.keyDown(screen.getByRole("dialog", { name: "Import Cast Member draft" }), { key: "Escape" });
    expect(screen.queryByRole("dialog", { name: "Import Cast Member draft" })).toBeNull();
    create.unmount();

    const linked = render(
      <CastMemberEditor payload={{ entity_id: entityId }} referenceRecords={referenceRecords} />
    );
    openDraftImport();
    expect(screen.getByLabelText<HTMLSelectElement>(/^entity_id/).value).toBe(entityId);
    fireEvent.click(screen.getByRole("button", { name: "Cancel import" }));
    linked.unmount();

    render(<CastMemberEditor record={castRecord} referenceRecords={referenceRecords} />);
    openDraftImport();
    expect(screen.getByLabelText<HTMLSelectElement>(/^entity_id/).value).toBe(entityId);
  });

  it("recovers from unparseable and zero-field responses, then renders all three report bands", async () => {
    const storageSetItem = vi.spyOn(Storage.prototype, "setItem");
    const fetchRequest = vi.fn();
    vi.stubGlobal("fetch", fetchRequest);

    render(<CastMemberEditor payload={{ entity_id: entityId }} referenceRecords={referenceRecords} />);
    const pasteSurface = openDraftImport();
    const oneLine = screen.getByLabelText<HTMLInputElement>(/^one_line/);

    reviewDraftImport(pasteSurface, "This is not JSON.");
    expect((await screen.findByRole("alert")).textContent).toContain(
      "Could not find and parse a complete JSON object"
    );
    expect(oneLine.value).toBe("");
    expect(pasteSurface.value).toBe("This is not JSON.");

    reviewDraftImport(pasteSurface, JSON.stringify({ entity_id: "foreign-link", unknown_key: "ignored" }));
    expect((await screen.findByRole("alert")).textContent).toBe(
      "No valid Cast Member fields were found. Correct the response and retry."
    );
    expect(oneLine.value).toBe("");

    reviewDraftImport(
      pasteSurface,
      `External model preface.\n\`\`\`json\n${JSON.stringify({
        entity_id: "foreign-link",
        identity: { one_line: "A watchful negotiator." },
        unknown_key: "ignored",
        uncertainties: ["Whether the public composure survives betrayal."],
        invented_fields: ["identity.one_line"]
      })}\n\`\`\`\nExternal model epilogue.`
    );

    await waitFor(() => expect(oneLine.value).toBe("A watchful negotiator."));
    expect(screen.getByLabelText<HTMLSelectElement>(/^entity_id/).value).toBe(entityId);
    const report = screen.getByRole("region", { name: "Cast Member draft import report" });
    expect(within(report).getByRole("heading", { name: "Filled fields" })).toBeTruthy();
    expect(within(report).getByRole("heading", { name: "Skipped fields" })).toBeTruthy();
    expect(within(report).getByRole("heading", { name: "Needs your attention" })).toBeTruthy();
    expect(within(report).getByText("identity.one_line")).toBeTruthy();
    expect(within(report).getByText(/entity_id.*protected field/i)).toBeTruthy();
    expect(within(report).getByText(/unknown_key.*unknown field/i)).toBeTruthy();
    expect(within(report).getByText(/Whether the public composure survives betrayal/)).toBeTruthy();
    expect(within(report).getByText(/identity.one_line.*declared invented field/i)).toBeTruthy();
    expect(within(report).getByText(/unsaved draft.*not a record.*not canon/i)).toBeTruthy();
    expect(createRecord).not.toHaveBeenCalled();
    expect(updateRecord).not.toHaveBeenCalled();
    expect(fetchRequest).not.toHaveBeenCalled();
    expect(storageSetItem).not.toHaveBeenCalled();
  });

  it("lists exact overwrites before applying, cancels unchanged, preserves absent fields and entity_id, then saves explicitly", async () => {
    const fetchRequest = vi.fn();
    vi.stubGlobal("fetch", fetchRequest);
    vi.mocked(updateRecord).mockResolvedValue({ ok: true, record: castRecord });

    render(<CastMemberEditor record={castRecord} referenceRecords={referenceRecords} />);
    const pasteSurface = openDraftImport();
    reviewDraftImport(
      pasteSurface,
      JSON.stringify({
        entity_id: "foreign-link",
        identity: { one_line: "A daring operator." },
        uncertainties: [],
        invented_fields: []
      })
    );

    const confirmation = await screen.findByRole("alertdialog", { name: "Confirm draft import overwrites" });
    expect(within(confirmation).getByText("identity.one_line")).toBeTruthy();
    expect(within(confirmation).getByRole("button", { name: "Cancel overwrite" }).tagName).toBe("BUTTON");
    expect(screen.getByLabelText<HTMLInputElement>(/^one_line/).value).toBe("A careful operator.");
    fireEvent.keyDown(confirmation, { key: "Escape" });
    expect(screen.queryByRole("alertdialog", { name: "Confirm draft import overwrites" })).toBeNull();
    expect(screen.getByLabelText<HTMLInputElement>(/^one_line/).value).toBe("A careful operator.");
    expect(screen.getByLabelText<HTMLInputElement>(/^public_face/).value).toBe("Composed and exacting.");
    expect(screen.getByRole("dialog", { name: "Import Cast Member draft" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Review import" }));
    const retryConfirmation = await screen.findByRole("alertdialog", {
      name: "Confirm draft import overwrites"
    });
    const confirmButton = within(retryConfirmation).getByRole<HTMLButtonElement>("button", {
      name: "Import and overwrite listed fields"
    });
    confirmButton.focus();
    expect(document.activeElement).toBe(confirmButton);
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(screen.getByLabelText<HTMLInputElement>(/^one_line/).value).toBe("A daring operator.");
    });
    expect(screen.getByLabelText<HTMLInputElement>(/^public_face/).value).toBe("Composed and exacting.");
    expect(screen.getByLabelText<HTMLSelectElement>(/^entity_id/).value).toBe(entityId);
    expect(screen.getByText(/entity_id.*protected field/i)).toBeTruthy();
    expect(screen.getByText(/unsaved draft.*explicit Save/i)).toBeTruthy();
    expect(updateRecord).not.toHaveBeenCalled();
    expect(fetchRequest).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Save Record" }));
    await waitFor(() => expect(updateRecord).toHaveBeenCalledTimes(1));
    expect(vi.mocked(updateRecord).mock.calls[0]?.[1].payload).toMatchObject({
      entity_id: entityId,
      identity: {
        one_line: "A daring operator.",
        public_face: "Composed and exacting."
      }
    });
  });

  it("discards imported values and leaves no paste or report residue after unmount", async () => {
    const storageSetItem = vi.spyOn(Storage.prototype, "setItem");
    const fetchRequest = vi.fn();
    vi.stubGlobal("fetch", fetchRequest);

    const view = render(
      <CastMemberEditor payload={{ entity_id: entityId }} referenceRecords={referenceRecords} />
    );
    let pasteSurface = openDraftImport();
    reviewDraftImport(pasteSurface, JSON.stringify({ identity: { one_line: "Temporary imported value." } }));
    await waitFor(() => {
      expect(screen.getByLabelText<HTMLInputElement>(/^one_line/).value).toBe("Temporary imported value.");
    });

    fireEvent.click(screen.getByRole("button", { name: "Discard imported draft" }));
    expect(screen.getByLabelText<HTMLInputElement>(/^one_line/).value).toBe("");
    expect(screen.getByLabelText<HTMLSelectElement>(/^entity_id/).value).toBe(entityId);
    expect(screen.queryByRole("region", { name: "Cast Member draft import report" })).toBeNull();

    pasteSurface = openDraftImport();
    reviewDraftImport(pasteSurface, JSON.stringify({ identity: { one_line: "Abandoned imported value." } }));
    await waitFor(() => expect(screen.getByRole("region", { name: "Cast Member draft import report" })).toBeTruthy());
    view.unmount();

    render(<CastMemberEditor payload={{ entity_id: entityId }} referenceRecords={referenceRecords} />);
    expect(screen.getByLabelText<HTMLInputElement>(/^one_line/).value).toBe("");
    expect(screen.queryByRole("region", { name: "Cast Member draft import report" })).toBeNull();
    expect(screen.queryByRole("dialog", { name: "Import Cast Member draft" })).toBeNull();
    expect(createRecord).not.toHaveBeenCalled();
    expect(updateRecord).not.toHaveBeenCalled();
    expect(fetchRequest).not.toHaveBeenCalled();
    expect(storageSetItem).not.toHaveBeenCalled();
  });

  it("keeps one import's provenance and original discard baseline until it is resolved", async () => {
    render(<CastMemberEditor payload={{ entity_id: entityId }} referenceRecords={referenceRecords} />);
    const pasteSurface = openDraftImport();
    reviewDraftImport(
      pasteSurface,
      JSON.stringify({
        identity: { one_line: "First imported value." },
        uncertainties: ["Whether the character trusts the offer."],
        invented_fields: ["identity.one_line"]
      })
    );

    await waitFor(() => {
      expect(screen.getByLabelText<HTMLInputElement>(/^one_line/).value).toBe("First imported value.");
    });
    const report = screen.getByRole("region", { name: "Cast Member draft import report" });
    expect(within(report).getByText("identity.one_line")).toBeTruthy();
    expect(within(report).getByText(/Whether the character trusts the offer/)).toBeTruthy();

    const importButton = screen.getByRole<HTMLButtonElement>("button", {
      name: "Import Cast Member draft"
    });
    expect(importButton.disabled).toBe(true);
    fireEvent.click(importButton);
    expect(screen.queryByRole("dialog", { name: "Import Cast Member draft" })).toBeNull();
    expect(screen.getByRole("region", { name: "Cast Member draft import report" })).toBe(report);

    fireEvent.click(screen.getByRole("button", { name: "Discard imported draft" }));
    expect(screen.getByLabelText<HTMLInputElement>(/^one_line/).value).toBe("");
    expect(screen.queryByRole("region", { name: "Cast Member draft import report" })).toBeNull();
    expect(importButton.disabled).toBe(false);
  });

  it("clears active import provenance only after a successful Save or Create", async () => {
    vi.mocked(updateRecord).mockResolvedValue({ ok: true, record: castRecord });
    const edit = render(<CastMemberEditor record={castRecord} referenceRecords={referenceRecords} />);
    let pasteSurface = openDraftImport();
    reviewDraftImport(
      pasteSurface,
      JSON.stringify({ identity: { one_line: "Imported before save." } })
    );
    fireEvent.click(
      within(await screen.findByRole("alertdialog", { name: "Confirm draft import overwrites" }))
        .getByRole("button", { name: "Import and overwrite listed fields" })
    );
    await waitFor(() => {
      expect(screen.getByRole("region", { name: "Cast Member draft import report" })).toBeTruthy();
    });

    fireEvent.click(screen.getByRole("button", { name: "Save Record" }));
    await waitFor(() => expect(updateRecord).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole("region", { name: "Cast Member draft import report" })).toBeNull();
    expect(screen.getByRole<HTMLButtonElement>("button", { name: "Import Cast Member draft" }).disabled)
      .toBe(false);
    edit.unmount();

    vi.mocked(createRecord).mockResolvedValue({ ok: true, record: castRecord });
    render(<CastMemberEditor referenceRecords={referenceRecords} />);
    pasteSurface = openDraftImport();
    reviewDraftImport(
      pasteSurface,
      JSON.stringify({ relational_charge: "Imported relationship pressure." })
    );
    await waitFor(() => {
      expect(screen.getByRole("region", { name: "Cast Member draft import report" })).toBeTruthy();
    });
    fillRequiredCore();

    fireEvent.click(screen.getByRole("button", { name: "Create Record" }));
    await waitFor(() => expect(createRecord).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole("region", { name: "Cast Member draft import report" })).toBeNull();
    expect(screen.getByRole<HTMLButtonElement>("button", { name: "Import Cast Member draft" }).disabled)
      .toBe(false);
  });

  it("renders every CAST MEMBER descriptor field without hiding populated fields", () => {
    render(<CastMemberEditor record={castRecord} referenceRecords={referenceRecords} />);

    const descriptor = getEditorDescriptor("CAST MEMBER");
    expect(descriptor).toBeDefined();
    for (const name of descriptorNames(descriptor?.fields ?? [])) {
      expect(screen.getAllByText(name).length).toBeGreaterThan(0);
    }
    expect(screen.queryByLabelText(/json/i)).toBeNull();
    expect(screen.queryByLabelText(/payload/i)).toBeNull();
  });

  it("shows entity reference labels while keeping ids as option values", () => {
    render(<CastMemberEditor referenceRecords={referenceRecords} />);

    const picker = screen.getByLabelText(/^entity_id/);
    const option = within(picker).getByRole<HTMLOptionElement>("option", { name: "Aster" });

    expect(option.value).toBe(entityId);
    expect(within(picker).queryByRole("option", { name: entityId })).toBeNull();
  });

  it("renders section navigation, durable/current distinction, and warning-only long-dossier guidance", () => {
    render(<CastMemberEditor record={castRecord} referenceRecords={referenceRecords} />);

    const nav = screen.getByRole("navigation", { name: "CAST MEMBER sections" });
    expect(within(nav).getByRole("link", { name: /Identity\s*Required core/ })).toBeTruthy();
    expect(within(nav).getByRole("link", { name: /Sample utterances\s*Optional/ })).toBeTruthy();
    expect(screen.getByText(/persistent cast dossier/i)).toBeTruthy();
    expect(screen.getAllByText(/generation-time brief/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/instead of automatic compression/i)).toBeTruthy();
    expect(screen.queryByRole("button", { name: /compress/i })).toBeNull();
    expect(screen.queryByLabelText(/^current_voice_pressure/)).toBeNull();
    expect(screen.queryByLabelText(/^override_text/)).toBeNull();
    expect(screen.getByRole("button", { name: "Help for core_voice" })).toBeTruthy();
    expect(screen.queryByText("voice_anchor.anti_repetition_warnings")).toBeNull();
    expect(screen.queryByText("voice_extended.anti_generic_warnings")).toBeNull();
    expect(screen.queryByText(/Default policy is never_copy_verbatim/)).toBeNull();
  });

  it("creates and edits CAST MEMBER payloads with populated extended fields and sample utterances", async () => {
    vi.mocked(createRecord).mockResolvedValue({ ok: true, record: castRecord });
    vi.mocked(updateRecord).mockResolvedValue({ ok: true, record: castRecord });

    render(<CastMemberEditor referenceRecords={referenceRecords} />);
    fillRequiredCore();
    fireEvent.change(screen.getByLabelText(/^relational_charge/), { target: { value: "protective toward B" } });
    fireEvent.change(screen.getByLabelText(/^intimacy/), { target: { value: "softens in private" } });
    fireEvent.click(screen.getByRole("button", { name: "Add sample_utterances" }));
    fireEvent.change(screen.getByLabelText(/^text/), { target: { value: "We have time." } });
    fireEvent.change(screen.getByLabelText(/^situation/), { target: { value: "delay" } });
    fireEvent.click(screen.getByRole("button", { name: "Add pressure_tags" }));
    fireEvent.change(screen.getByLabelText(/^pressure_tags 1/), { target: { value: "control" } });
    fireEvent.click(screen.getByRole("button", { name: "Create Record" }));

    await waitFor(() => expect(createRecord).toHaveBeenCalled());
    const createPayload = vi.mocked(createRecord).mock.calls[0]?.[0].payload as typeof castPayload;
    expect(vi.mocked(createRecord).mock.calls[0]?.[0].type).toBe("CAST MEMBER");
    expect(createPayload.entity_id).toBe(entityId);
    expect(createPayload.relational_charge).toBe("protective toward B");
    expect(createPayload.voice_extended?.intimacy).toBe("softens in private");
    expect(createPayload.sample_utterances?.[0]).toMatchObject({
      text: "We have time.",
      situation: "delay",
      pressure_tags: ["control"]
    });

    cleanup();
    render(<CastMemberEditor record={castRecord} referenceRecords={referenceRecords} />);
    fireEvent.change(screen.getByLabelText(/^moral_psychological_edge/), { target: { value: "pride under fear, revised" } });
    fireEvent.click(screen.getByRole("button", { name: "Save Record" }));

    await waitFor(() => expect(updateRecord).toHaveBeenCalled());
    const updatePayload = vi.mocked(updateRecord).mock.calls[0]?.[1].payload as typeof castPayload;
    expect(vi.mocked(updateRecord).mock.calls[0]?.[0]).toBe(castId);
    expect(updatePayload).toMatchObject({
      ...castPayload,
      moral_psychological_edge: "pride under fear, revised",
      sample_utterances: castPayload.sample_utterances
    });
  });

  it("supports add and remove for CAST MEMBER scalar and nested list fields", () => {
    render(<CastMemberEditor record={castRecord} referenceRecords={referenceRecords} />);

    expect(screen.getByLabelText(/^must_avoid 1/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Add must_avoid" }));
    expect(screen.getByLabelText(/^must_avoid 2/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Remove must_avoid 1" }));
    expect(screen.queryByLabelText(/^must_avoid 2/)).toBeNull();

    const sampleGroup = screen.getByRole("group", { name: "sample_utterances 1" });
    expect(within(sampleGroup).getByLabelText(/^text/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Add sample_utterances" }));
    expect(screen.getByRole("group", { name: "sample_utterances 2" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Remove sample_utterances 1" }));
    expect(screen.queryByRole("group", { name: "sample_utterances 2" })).toBeNull();
  });

  it("removes every imported nested-list item and saves the lawful empty list", async () => {
    vi.mocked(updateRecord).mockResolvedValue({
      ok: true,
      record: { ...castRecord, payload: { ...castPayload, sample_utterances: [] } }
    });
    render(<CastMemberEditor record={castRecord} referenceRecords={referenceRecords} />);

    reviewDraftImport(
      openDraftImport(),
      JSON.stringify({
        sample_utterances: [
          ...castPayload.sample_utterances,
          { ...castPayload.sample_utterances[0], text: "The second sample." }
        ],
        uncertainties: [],
        invented_fields: []
      })
    );
    fireEvent.click(
      within(await screen.findByRole("alertdialog", { name: "Confirm draft import overwrites" }))
        .getByRole("button", { name: "Import and overwrite listed fields" })
    );
    await waitFor(() => {
      expect(screen.getByRole("region", { name: "Cast Member draft import report" })).toBeTruthy();
    });

    let removeSample = screen.getByRole<HTMLButtonElement>("button", { name: "Remove sample_utterances 1" });
    expect(removeSample.closest("label")).toBeNull();
    removeSample.focus();
    fireEvent.click(removeSample);
    expect(screen.getAllByRole("group", { name: /^sample_utterances \d+$/ })).toHaveLength(1);
    removeSample = screen.getByRole<HTMLButtonElement>("button", { name: "Remove sample_utterances 1" });
    removeSample.focus();
    fireEvent.click(removeSample);
    expect(screen.queryByRole("group", { name: "sample_utterances 1" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Save Record" }));

    await waitFor(() => expect(updateRecord).toHaveBeenCalledTimes(1));
    expect(vi.mocked(updateRecord).mock.calls[0]?.[1].payload).toMatchObject({
      sample_utterances: []
    });
  });

  it("marks required CAST MEMBER core guardrail lists as may-be-empty", () => {
    render(<CastMemberEditor referenceRecords={referenceRecords} />);

    // must_avoid is a required voice-anchor guardrail list that lawfully accepts an empty array (#114 / F003).
    const mustAvoidGroup = screen.getByRole("group", { name: "must_avoid" });
    const note = within(mustAvoidGroup).getByText(
      "This list is required as a property, but it may be left empty."
    );
    expect(mustAvoidGroup.getAttribute("aria-describedby")?.split(" ")).toContain(note.getAttribute("id"));
  });

  it("keeps copy_policy radio names unique per sample utterance", () => {
    render(<CastMemberEditor record={castRecord} referenceRecords={referenceRecords} />);

    fireEvent.click(screen.getByRole("button", { name: "Add sample_utterances" }));

    const firstSample = screen.getByRole("group", { name: "sample_utterances 1" });
    const secondSample = screen.getByRole("group", { name: "sample_utterances 2" });
    const firstRadios = within(firstSample).getAllByRole<HTMLInputElement>("radio");
    const secondRadios = within(secondSample).getAllByRole<HTMLInputElement>("radio");
    const firstGroupName = firstRadios[0]?.name;
    const secondGroupName = secondRadios[0]?.name;

    expect(firstRadios.length).toBeGreaterThan(1);
    expect(secondRadios.length).toBeGreaterThan(1);
    expect(firstGroupName).toBeTruthy();
    expect(secondGroupName).toBeTruthy();
    expect(firstRadios.every((radio) => radio.name === firstGroupName)).toBe(true);
    expect(secondRadios.every((radio) => radio.name === secondGroupName)).toBe(true);
    expect(firstGroupName).not.toBe(secondGroupName);
  });
});
