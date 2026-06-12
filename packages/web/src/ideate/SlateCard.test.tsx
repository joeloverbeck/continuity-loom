// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { ParsedIdeationIdea } from "../api.js";
import { SlateCard } from "./SlateCard.js";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("SlateCard", () => {
  it("renders operator badge, headline, why line, and resolved citation chips", () => {
    render(
      <SlateCard
        idea={ideaFixture()}
        citations={{ "[SECRET-1]": "The letter names a ledger substitution" }}
        isKept={false}
        onKeep={vi.fn()}
        onRegenerate={vi.fn()}
      />
    );

    expect(screen.getByText("Reveal")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "The sealed letter changes hands." })).toBeTruthy();
    expect(screen.getByText("The secret and handoff pressure support it.")).toBeTruthy();
    expect(
      within(screen.getByLabelText("Grounds for The sealed letter changes hands.")).getByText(
        "The letter names a ledger substitution"
      )
    ).toBeTruthy();
  });

  it("renders question-mode text and unknown-citation markers", () => {
    const questionIdea = ideaFixture();
    delete questionIdea.headline;

    render(<SlateCard idea={{
      ...questionIdea,
      question: "Who benefits if the latch rattles now?",
      unknownCitations: ["[CLOCK-99]"],
      grounds: ["[CLOCK-99]"]
    }} isKept={false} onKeep={vi.fn()} onRegenerate={vi.fn()} />);

    expect(screen.getByRole("heading", { name: "Who benefits if the latch rattles now?" })).toBeTruthy();
    expect(screen.getByText("[CLOCK-99]")).toBeTruthy();
    expect(screen.getByText("Unknown citations: [CLOCK-99]")).toBeTruthy();
  });

  it("offers keeper and per-slot regenerate actions without insertion affordances", () => {
    const keep = vi.fn();
    const regenerate = vi.fn();
    const idea = ideaFixture();

    render(<SlateCard idea={idea} isKept={false} onKeep={keep} onRegenerate={regenerate} />);

    fireEvent.click(screen.getByRole("button", { name: "Keep" }));
    fireEvent.click(screen.getByRole("button", { name: "Regenerate slot" }));

    expect(keep).toHaveBeenCalledWith(idea);
    expect(regenerate).toHaveBeenCalledWith(idea);
    expect(screen.queryByRole("button", { name: /insert/i })).toBeNull();
  });
});

function ideaFixture(): ParsedIdeationIdea {
  return {
    slotNumber: 1,
    operator: "Reveal",
    headline: "The sealed letter changes hands.",
    why: "The secret and handoff pressure support it.",
    grounds: ["[SECRET-1]"],
    unknownCitations: []
  };
}
