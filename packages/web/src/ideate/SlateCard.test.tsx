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
  it("leads each ground with its bare citation key and keeps the resolved label alongside it", () => {
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

    const grounds = screen.getByLabelText("Grounds for The sealed letter changes hands.");
    // The key is what the `why` prose names, so it has to be on the card for the claim to be checkable.
    expect(within(grounds).getByText("SECRET-1")).toBeTruthy();
    expect(within(grounds).getByText("The letter names a ledger substitution")).toBeTruthy();
  });

  it("clamps grounds in CSS only, so the complete label survives in the DOM and the toggle un-clamps it", () => {
    const longLabel = "Iker Aguirre is almost exclusively attracted to older, gorgeous, seductive women, ".repeat(4);

    render(
      <SlateCard
        idea={ideaFixture()}
        citations={{ "[SECRET-1]": longLabel }}
        isKept={false}
        onKeep={vi.fn()}
        onRegenerate={vi.fn()}
      />
    );

    const grounds = screen.getByLabelText("Grounds for The sealed letter changes hands.");
    // Nothing is truncated: the whole label is in the DOM, so assistive technology reads it all and
    // it stays selectable. Only CSS clamps what a sighted reader sees.
    expect(within(grounds).getByText(/almost exclusively attracted/).textContent).toBe(longLabel);
    expect(grounds.className).toBe("groundList");

    const toggle = screen.getByRole("button", { name: "Show full grounds" });
    expect(toggle.getAttribute("aria-expanded")).toBe("false");

    fireEvent.click(toggle);

    expect(grounds.className).toBe("groundList groundList-expanded");
    expect(screen.getByRole("button", { name: "Hide full grounds" }).getAttribute("aria-expanded")).toBe("true");
  });

  it("offers no grounds toggle when no citation resolved to a label", () => {
    render(<SlateCard idea={ideaFixture()} isKept={false} onKeep={vi.fn()} onRegenerate={vi.fn()} />);

    expect(screen.queryByRole("button", { name: /grounds/i })).toBeNull();
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
    expect(screen.getByText("CLOCK-99")).toBeTruthy();
    expect(screen.getByText("Unknown citations: CLOCK-99")).toBeTruthy();
  });

  it("renders an assigned SKIPPED block without inventing normal idea fields", () => {
    render(<SlateCard idea={{
      slotNumber: 1,
      operator: "Reveal",
      skipped: true,
      grounds: [],
      unknownCitations: []
    }} isKept={false} onKeep={vi.fn()} onRegenerate={vi.fn()} />);

    expect(screen.getByText("Reveal")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Skipped slot 1" })).toBeTruthy();
    expect(screen.getByText("No compiled record supports this slot.")).toBeTruthy();
    expect(screen.queryByText(/why:/i)).toBeNull();
  });

  it("offers no Keep on a skipped slot, because there is nothing to keep", () => {
    const keep = vi.fn();

    render(<SlateCard idea={{
      slotNumber: 1,
      operator: "Reveal",
      skipped: true,
      grounds: [],
      unknownCitations: []
    }} isKept={false} onKeep={keep} onRegenerate={vi.fn()} />);

    expect(screen.queryByRole("button", { name: "Keep" })).toBeNull();
    expect(screen.getByRole("button", { name: "Regenerate slot" })).toBeTruthy();
    expect(keep).not.toHaveBeenCalled();
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
