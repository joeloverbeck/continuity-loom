// @vitest-environment jsdom

import { getEditorDescriptor, type FieldDescriptor } from "@loom/core";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CastMemberEditor } from "./CastMemberEditor.js";
import { createRecord, updateRecord, type RecordDetail, type RecordSummary } from "../api.js";

vi.mock("../api.js", () => ({
  createRecord: vi.fn(),
  updateRecord: vi.fn()
}));

const entityId = "019b0298-5c00-7000-8000-000000000001";
const castId = "019b0298-5c00-7000-8000-000000000002";

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

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("CastMemberEditor", () => {
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
});
