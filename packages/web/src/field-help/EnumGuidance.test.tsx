// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { EnumGuidance } from "./EnumGuidance.js";

afterEach(() => {
  cleanup();
});

describe("EnumGuidance", () => {
  it("renders selected-value guidance for guided enum values", () => {
    render(
      <EnumGuidance
        fieldPath="SECRET.reveal_permission"
        enumValues={["locked", "clue_only", "natural_reveal_allowed", "directive_required"]}
        value="locked"
        onChange={vi.fn()}
      />
    );

    expect(screen.getAllByText(/No reveal and no decisive clue/).length).toBeGreaterThan(0);
    expect(screen.getAllByText("locked").length).toBeGreaterThan(0);
  });

  it("renders card radios for allowlisted high-impact enums and writes enum literals", () => {
    const onChange = vi.fn();

    render(
      <EnumGuidance
        fieldPath="SECRET.reveal_permission"
        enumValues={["locked", "clue_only", "natural_reveal_allowed", "directive_required"]}
        value="locked"
        onChange={onChange}
      />
    );

    const group = screen.getByRole("radiogroup", { name: "SECRET.reveal_permission values" });
    expect(within(group).getByLabelText(/clue_only/)).toBeTruthy();

    fireEvent.click(within(group).getByDisplayValue("clue_only"));

    expect(onChange).toHaveBeenCalledWith("clue_only");
  });

  it("keeps non-allowlisted enums as selects with selected-value explanation", () => {
    render(
      <EnumGuidance
        fieldPath="FACT.audience_visibility"
        enumValues={["hidden", "implied", "explicit", "not_applicable"]}
        value="explicit"
        onChange={vi.fn()}
      />
    );

    expect(screen.getByRole("combobox")).toBeTruthy();
    expect(screen.queryByRole("radiogroup")).toBeNull();
    expect(screen.getByText(/The audience may know it directly/)).toBeTruthy();
  });
});
