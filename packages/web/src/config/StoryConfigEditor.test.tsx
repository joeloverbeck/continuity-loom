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
    setting_baseline: "Rainy districts under old bargains.",
    content_intensity: "mature",
    explicitness: "Render mature material only when earned.",
    language_register: "controlled contemporary prose",
  },
  "UNIVERSAL CONTENT POLICY": {
    rating_label: "Mature",
    allowed_content_scope: "Only story-relevant mature content.",
    tonal_handling: "Direct but not exploitative.",
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

const primaryLabels: Record<string, string> = {
  title: "Story title",
  premise: "Premise",
  genre_mode: "Genre / mode",
  tone: "Tone",
  setting_baseline: "Setting baseline",
  content_intensity: "Content intensity",
  explicitness: "Explicitness",
  language_register: "Language register",
  rating_label: "Rating label",
  allowed_content_scope: "Allowed content scope",
  tonal_handling: "Tonal handling",
  character_bias_handling: "Character bias handling",
  pov_character: "POV character",
  person: "Person",
  tense: "Tense",
  psychic_distance: "Psychic distance",
  interiority_mode: "Interiority mode",
  dialogue_density: "Dialogue density",
  paragraphing: "Paragraphing",
  language_output: "Output language",
  special_style_constraints: "Special style constraints"
};

function labelPattern(schemaKey: string): RegExp {
  const label = (primaryLabels[schemaKey] ?? schemaKey).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`^${label}`);
}

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

    expect(screen.getByRole("button", { name: "Help for Premise" })).toBeTruthy();
    fireEvent.change(screen.getByLabelText(/^Premise/), { target: { value: "A city remembers every broken promise." } });
    fireEvent.click(screen.getByRole("button", { name: "Save STORY CONTRACT" }));
    await waitFor(() => expect(setStoryConfig).toHaveBeenCalledWith("STORY CONTRACT", expect.objectContaining({
      premise: "A city remembers every broken promise."
    })));

    fireEvent.change(screen.getByLabelText(/^Rating label/), { target: { value: "Mature revised" } });
    fireEvent.click(screen.getByRole("button", { name: "Save UNIVERSAL CONTENT POLICY" }));
    await waitFor(() => expect(setStoryConfig).toHaveBeenCalledWith("UNIVERSAL CONTENT POLICY", expect.objectContaining({
      rating_label: "Mature revised"
    })));

    fireEvent.change(screen.getByLabelText(/^Output language/), { target: { value: "English with close POV" } });
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

  it("keeps the four content-policy fields distinct with no boilerplate shortcut", async () => {
    setupMocks();
    render(<StoryConfigEditor />);

    await screen.findByRole("button", { name: "Save UNIVERSAL CONTENT POLICY" });
    for (const field of [
      "rating_label",
      "allowed_content_scope",
      "tonal_handling",
      "character_bias_handling"
    ]) {
      expect(screen.getByLabelText(labelPattern(field))).toBeTruthy();
    }
    expect(screen.queryByText(/NO RESTRICTIONS/i)).toBeNull();
  });

  it("uses an entity reference picker for PROSE MODE pov_character", async () => {
    setupMocks();
    render(<StoryConfigEditor />);

    const picker = await screen.findByLabelText(/^POV character/);
    expect(screen.getByRole("button", { name: "Help for POV character" })).toBeTruthy();
    expect(picker.tagName).toBe("SELECT");
    expect(within(picker).getByRole("option", { name: "Aster" })).toBeTruthy();
    expect((picker as HTMLSelectElement).value).toBe(entityId);
  });

  it.each(Object.keys(payloads) as StoryConfigKind[])(
    "reconciles a first %s save to one truthful loaded status and reloads the server value",
    async (kind) => {
      setupMocks();
      const initialConfigs = { ...payloads } as Partial<Record<StoryConfigKind, unknown>>;
      delete initialConfigs[kind];
      vi.mocked(listStoryConfig).mockResolvedValueOnce({ ok: true, configs: initialConfigs });
      render(<StoryConfigEditor />);

      expect(await screen.findByText(`No saved ${kind} yet.`)).toBeTruthy();
      fillMissingConfig(kind);
      fireEvent.click(screen.getByRole("button", { name: `Save ${kind}` }));

      await waitFor(() => expect(setStoryConfig).toHaveBeenCalledWith(kind, expect.any(Object)));
      expect(screen.queryByText(`No saved ${kind} yet.`)).toBeNull();
      const panel = screen.getByRole("button", { name: `Save ${kind}` }).closest(".configPanel") as HTMLElement;
      expect(within(panel).getAllByRole("status")).toHaveLength(1);
      expect(within(panel).getByRole("status").textContent).toBe(`${kind} saved.`);

      cleanup();
      vi.mocked(listStoryConfig).mockResolvedValueOnce({
        ok: true,
        configs: { ...initialConfigs, [kind]: payloads[kind] }
      });
      render(<StoryConfigEditor />);

      expect(await screen.findByRole("button", { name: `Save ${kind}` })).toBeTruthy();
      expect(screen.queryByText(`No saved ${kind} yet.`)).toBeNull();
    }
  );

  it("removes stale success on failure, retains authored input, and clears the error on retry", async () => {
    setupMocks();
    vi.mocked(setStoryConfig)
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce({ ok: false, kind: "save-failed", message: "Configuration save failed." })
      .mockResolvedValueOnce({ ok: true });
    render(<StoryConfigEditor />);

    const premise = await screen.findByLabelText<HTMLInputElement>(/^Premise/);
    fireEvent.change(premise, { target: { value: "First successful revision." } });
    fireEvent.click(screen.getByRole("button", { name: "Save STORY CONTRACT" }));
    expect(await screen.findByText("STORY CONTRACT saved.")).toBeTruthy();

    fireEvent.change(premise, { target: { value: "Retained after failure." } });
    fireEvent.click(screen.getByRole("button", { name: "Save STORY CONTRACT" }));
    expect((await screen.findByRole("alert")).textContent).toBe("Configuration save failed.");
    expect(screen.queryByText("STORY CONTRACT saved.")).toBeNull();
    expect(premise.value).toBe("Retained after failure.");

    fireEvent.click(screen.getByRole("button", { name: "Save STORY CONTRACT" }));
    expect(await screen.findByText("STORY CONTRACT saved.")).toBeTruthy();
    expect(screen.queryByRole("alert")).toBeNull();
    expect(premise.value).toBe("Retained after failure.");
  });

  it("leads each field with an author-facing label while keeping the schema key as secondary described metadata", async () => {
    setupMocks();
    render(<StoryConfigEditor />);

    // Primary author label supplies the accessible name.
    const premise = await screen.findByLabelText<HTMLTextAreaElement>(/^Premise/);
    expect(premise.tagName).toBe("TEXTAREA");
    expect(screen.getByLabelText(/^Story title/)).toBeTruthy();
    expect(screen.getByLabelText(/^POV character/)).toBeTruthy();
    expect(screen.getByLabelText(/^Output language/)).toBeTruthy();

    // Exact schema key remains visible as secondary technical metadata.
    expect(screen.getAllByText("premise").length).toBeGreaterThan(0);
    expect(screen.getAllByText("language_output").length).toBeGreaterThan(0);

    // The schema key participates in the accessible description.
    const describedBy = premise.getAttribute("aria-describedby");
    expect(describedBy).toBeTruthy();
    const describedText = (describedBy as string)
      .split(/\s+/)
      .map((id) => document.getElementById(id)?.textContent ?? "")
      .join(" ");
    expect(describedText).toContain("premise");

    // Requiredness is still announced on the primary-labeled control.
    expect(within(premise.closest(".editorField") as HTMLElement).getByLabelText("required")).toBeTruthy();

    // Field help continues to resolve through the canonical schema-key path.
    expect(screen.getByRole("button", { name: "Help for Premise" })).toBeTruthy();
  });

  it("leads enum fields with the author label and keeps the schema key in the accessible description", async () => {
    setupMocks();
    render(<StoryConfigEditor />);

    // Card-style enum: the radiogroup is named by the author label, not the schema-key path.
    const contentIntensity = await screen.findByRole("radiogroup", { name: "Content intensity" });
    const cardDescribedBy = contentIntensity.getAttribute("aria-describedby");
    expect(cardDescribedBy).toBeTruthy();
    expect(document.getElementById(cardDescribedBy as string)?.textContent).toBe("content_intensity");

    // Plain-select enum: named by the author label via its wrapping label, schema key described.
    const person = screen.getByLabelText<HTMLSelectElement>(/^Person/);
    expect(person.tagName).toBe("SELECT");
    const selectDescribedBy = person.getAttribute("aria-describedby");
    expect(selectDescribedBy).toBeTruthy();
    expect(document.getElementById(selectDescribedBy as string)?.textContent).toBe("person");
  });

  it("leads the special_style_constraints list group and its controls with the author label and describes it by the schema key", async () => {
    setupMocks();
    render(<StoryConfigEditor />);

    // The list renders as a group named by the author label, described by the schema key.
    const group = await screen.findByRole("group", { name: "Special style constraints" });
    const groupDescribedBy = group.getAttribute("aria-describedby");
    expect(groupDescribedBy).toBeTruthy();
    expect(document.getElementById(groupDescribedBy as string)?.textContent).toBe("special_style_constraints");

    // The add control reads with the author label, not the raw schema key.
    expect(screen.getByRole("button", { name: "Add Special style constraints" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Add special_style_constraints" })).toBeNull();
  });
});

function fillMissingConfig(kind: StoryConfigKind): void {
  if (kind === "STORY CONTRACT") {
    for (const [name, value] of Object.entries(payloads[kind] as Record<string, string>)) {
      // content_intensity is a required enum with a valid default; its author label
      // now also names the radiogroup, so a text-input label lookup is intentionally skipped.
      if (name === "content_intensity") {
        continue;
      }
      const control = screen.getByLabelText(labelPattern(name));
      fireEvent.change(control, { target: { value } });
    }
    return;
  }

  if (kind === "UNIVERSAL CONTENT POLICY") {
    for (const [name, value] of Object.entries(payloads[kind] as Record<string, string>)) {
      fireEvent.change(screen.getByLabelText(labelPattern(name)), { target: { value } });
    }
    return;
  }

  fireEvent.change(screen.getByLabelText(/^POV character/), { target: { value: entityId } });
  fireEvent.change(screen.getByLabelText(/^Output language/), { target: { value: "English" } });
}
