// @vitest-environment jsdom

import type { GenerationSessionDraft } from "@loom/core";
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { SectionRail, sectionRailEntries } from "./SectionRail.js";

const firstSegmentDraft: GenerationSessionDraft = {
  current_authoritative_state: {
    current_time: "dawn",
    current_location: "kitchen"
  },
  immediate_handoff: {
    recent_causal_context: "Mara heard the latch click."
  },
  stop_guidance: {
    soft_unit_guidance: "Stop after the latch opens."
  }
};

function renderRail(
  draft: GenerationSessionDraft = firstSegmentDraft,
  generationContext: "first_segment" | "continuation_after_accepted_segment" = "first_segment"
): void {
  render(<SectionRail draft={draft} generationContext={generationContext} />);
}

afterEach(() => cleanup());

describe("SectionRail", () => {
  it("links validation plus all generation-brief sections to existing heading ids", () => {
    render(
      <>
        {sectionRailEntries.map((entry) => (
          <h3 key={entry.targetId} id={entry.targetId}>{entry.label}</h3>
        ))}
        <SectionRail draft={firstSegmentDraft} generationContext="first_segment" />
      </>
    );

    const nav = screen.getByRole("navigation", { name: "Generation brief sections" });
    const links = within(nav).getAllByRole("link");

    expect(links).toHaveLength(9);

    for (const entry of sectionRailEntries) {
      const link = links.find((candidate) => candidate.getAttribute("href") === `#${entry.targetId}`);

      expect(link).toBeTruthy();
      expect(link?.getAttribute("href")).toBe(`#${entry.targetId}`);
      expect(document.getElementById(entry.targetId)).not.toBeNull();
    }
  });

  it("summarizes section fill without ready or valid wording", () => {
    renderRail();

    const nav = screen.getByRole("navigation", { name: "Generation brief sections" });

    expect(within(nav).getByRole("link", { name: /current state.*2 required empty/i })).toBeTruthy();
    expect(within(nav).getByRole("link", { name: /handoff.*1 filled/i })).toBeTruthy();
    const chipLabels = Array.from(nav.querySelectorAll(".briefFillChip"), (chip) => chip.textContent ?? "");

    expect(chipLabels.join(" ")).not.toMatch(/ready|valid/i);
  });

  it("switches continuation-required handoff counts with generation context", () => {
    renderRail(firstSegmentDraft, "continuation_after_accepted_segment");

    const nav = screen.getByRole("navigation", { name: "Generation brief sections" });

    expect(within(nav).getByRole("link", { name: /handoff.*2 required empty/i })).toBeTruthy();
  });
});
