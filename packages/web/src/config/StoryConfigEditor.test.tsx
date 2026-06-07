// @vitest-environment jsdom

import { getEditorDescriptor, type FieldDescriptor } from "@loom/core";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { StoryConfigEditor } from "./StoryConfigEditor.js";
import { listRecords, listStoryConfig, setStoryConfig, type StoryConfigKind } from "../api.js";

vi.mock("../api.js", () => ({
  listRecords: vi.fn(),
  listStoryConfig: vi.fn(),
  setStoryConfig: vi.fn()
}));

const entityId = "019b0298-5c00-7000-8000-000000000001";

const payloads: Record<StoryConfigKind, unknown> = {
  "STORY CONTRACT": {
    title: "Continuity Test",
    premise: "A city keeps its promises badly.",
    genre_mode: "urban fantasy",
    tone: "tense and intimate",
    continuity_philosophy: "continuity_first",
    setting_baseline: "Rainy districts under old bargains.",
    content_intensity: "mature",
    explicitness: "Render mature material only when earned.",
    language_register: "controlled contemporary prose",
    prose_preferences: {
      psychic_distance: "close",
      dialogue_density: "moment_led",
      interiority: "filtered",
      paragraphing: "mixed"
    }
  },
  "UNIVERSAL CONTENT POLICY": {
    rating_label: "Mature",
    allowed_content_scope: "Only story-relevant mature content.",
    tonal_handling: "Direct but not exploitative.",
    governing_policy_note: "Follow project policy.",
    character_bias_handling: "Render bias as character-specific."
  },
  "PROSE MODE": {
    pov_character: entityId,
    person: "third",
    tense: "past",
    psychic_distance: "close",
    interiority_mode: "filtered",
    dialogue_density: "balanced",
    paragraphing: "mixed",
    language_output: "English",
    special_style_constraints: []
  }
};

function descriptorNames(fields: readonly FieldDescriptor[]): string[] {
  return fields.flatMap((field) => [
    field.name,
    ...(field.fields ? descriptorNames(field.fields) : []),
    ...(field.itemDescriptor?.fields ? descriptorNames(field.itemDescriptor.fields) : [])
  ]);
}

function setupMocks(): void {
  vi.mocked(listStoryConfig).mockResolvedValue({ ok: true, configs: payloads });
  vi.mocked(setStoryConfig).mockResolvedValue({ ok: true });
  vi.mocked(listRecords).mockResolvedValue({
    ok: true,
    records: [
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
    ]
  });
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("StoryConfigEditor", () => {
  it("renders all singleton schema fields and round-trips edits through setStoryConfig", async () => {
    setupMocks();
    render(<StoryConfigEditor />);

    for (const kind of Object.keys(payloads) as StoryConfigKind[]) {
      expect(await screen.findByRole("button", { name: `Save ${kind}` })).toBeTruthy();
      const descriptor = getEditorDescriptor(kind);
      for (const name of descriptorNames(descriptor?.fields ?? [])) {
        expect(screen.getAllByText(name).length).toBeGreaterThan(0);
      }
    }

    expect(screen.getByRole("button", { name: "Help for premise" })).toBeTruthy();
    fireEvent.change(screen.getByLabelText(/^premise/), { target: { value: "A city remembers every broken promise." } });
    fireEvent.click(screen.getByRole("button", { name: "Save STORY CONTRACT" }));
    await waitFor(() => expect(setStoryConfig).toHaveBeenCalledWith("STORY CONTRACT", expect.objectContaining({
      premise: "A city remembers every broken promise."
    })));

    fireEvent.change(screen.getByLabelText(/^rating_label/), { target: { value: "Mature revised" } });
    fireEvent.click(screen.getByRole("button", { name: "Save UNIVERSAL CONTENT POLICY" }));
    await waitFor(() => expect(setStoryConfig).toHaveBeenCalledWith("UNIVERSAL CONTENT POLICY", expect.objectContaining({
      rating_label: "Mature revised"
    })));

    fireEvent.change(screen.getByLabelText(/^language_output/), { target: { value: "English with close POV" } });
    fireEvent.click(screen.getByRole("button", { name: "Save PROSE MODE" }));
    await waitFor(() => expect(setStoryConfig).toHaveBeenCalledWith("PROSE MODE", expect.objectContaining({
      language_output: "English with close POV"
    })));
    expect(listStoryConfig).toHaveBeenCalledTimes(1);
  });

  it("renders missing singleton states from the list route without per-kind config fetches", async () => {
    setupMocks();
    vi.mocked(listStoryConfig).mockResolvedValue({
      ok: true,
      configs: {
        "STORY CONTRACT": payloads["STORY CONTRACT"],
        "UNIVERSAL CONTENT POLICY": payloads["UNIVERSAL CONTENT POLICY"]
      }
    });
    render(<StoryConfigEditor />);

    expect(await screen.findByText("No saved PROSE MODE yet.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Save PROSE MODE" })).toBeTruthy();
    expect(listStoryConfig).toHaveBeenCalledTimes(1);
  });

  it("keeps all five content-policy fields distinct with no boilerplate shortcut", async () => {
    setupMocks();
    render(<StoryConfigEditor />);

    await screen.findByRole("button", { name: "Save UNIVERSAL CONTENT POLICY" });
    for (const field of [
      "rating_label",
      "allowed_content_scope",
      "tonal_handling",
      "governing_policy_note",
      "character_bias_handling"
    ]) {
      expect(screen.getByLabelText(new RegExp(`^${field}`))).toBeTruthy();
    }
    expect(screen.queryByText(/NO RESTRICTIONS/i)).toBeNull();
  });

  it("uses an entity reference picker for PROSE MODE pov_character", async () => {
    setupMocks();
    render(<StoryConfigEditor />);

    const picker = await screen.findByLabelText(/^pov_character/);
    expect(screen.getByRole("button", { name: "Help for pov_character" })).toBeTruthy();
    expect(picker.tagName).toBe("SELECT");
    expect(within(picker).getByRole("option", { name: "Aster" })).toBeTruthy();
    expect((picker as HTMLSelectElement).value).toBe(entityId);
  });
});
