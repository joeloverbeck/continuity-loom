// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";

import { addKeeper, clearKeepers, listKeepers, removeKeeper } from "./keepers.js";

afterEach(() => {
  sessionStorage.clear();
  localStorage.clear();
  vi.unstubAllGlobals();
});

describe("ideation keepers", () => {
  it("persists keepers in sessionStorage and survives module-style reloads", () => {
    const storageSetItem = vi.spyOn(Storage.prototype, "setItem");
    const keeper = ideaFixture("The sealed letter changes hands.");

    const expected = {
      ...keeper,
      groundLabels: { "[SECRET-1]": "The letter names a ledger substitution" }
    };

    expect(addKeeper(keeper, { "[SECRET-1]": "The letter names a ledger substitution" })).toHaveLength(1);
    expect(listKeepers()).toEqual([expected]);
    expect(listKeepers()).toEqual([expected]);
    expect(storageSetItem).toHaveBeenCalledWith("loom.ideate.keepers.v1", JSON.stringify([expected]));
    expect(localStorage.length).toBe(0);
  });

  it("deduplicates, removes, and clears without residue", () => {
    const keeper = ideaFixture("The sealed letter changes hands.");

    addKeeper(keeper);
    addKeeper(keeper);

    expect(listKeepers()).toHaveLength(1);
    expect(removeKeeper(keeper)).toEqual([]);
    expect(sessionStorage.getItem("loom.ideate.keepers.v1")).toBeNull();

    addKeeper(keeper);
    clearKeepers();

    expect(listKeepers()).toEqual([]);
    expect(sessionStorage.getItem("loom.ideate.keepers.v1")).toBeNull();
  });

  it("does not touch network or durable browser storage", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    addKeeper(ideaFixture("The sealed letter changes hands."));
    removeKeeper(ideaFixture("The sealed letter changes hands."));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(localStorage.length).toBe(0);
  });

  it("keeps older persisted keepers without resolved labels backward-compatible", () => {
    const keeper = ideaFixture("The sealed letter changes hands.");
    sessionStorage.setItem("loom.ideate.keepers.v1", JSON.stringify([keeper]));

    expect(listKeepers()).toEqual([keeper]);
  });
});

function ideaFixture(headline: string) {
  return {
    slotNumber: 1,
    operator: "Reveal",
    headline,
    why: "The secret and handoff pressure support it.",
    grounds: ["[SECRET-1]"],
    unknownCitations: []
  };
}
