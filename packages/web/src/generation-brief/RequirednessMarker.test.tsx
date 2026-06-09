// @vitest-environment jsdom

import { render, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { FieldRequiredness } from "@loom/core";

import { RequirednessMarker } from "./RequirednessMarker.js";
import type { GenerationContext } from "./requiredness-now.js";

describe("RequirednessMarker", () => {
  const cases: readonly [FieldRequiredness | undefined, GenerationContext, string | null][] = [
    ["always", "first_segment", "required"],
    ["always", "continuation_after_accepted_segment", "required"],
    ["continuation", "first_segment", "Optional for a first segment"],
    ["continuation", "continuation_after_accepted_segment", "required"],
    ["conditional", "first_segment", "Conditional"],
    ["conditional", "continuation_after_accepted_segment", "Conditional"],
    ["optional", "first_segment", "Optional"],
    ["optional", "continuation_after_accepted_segment", "Optional"],
    [undefined, "first_segment", null],
    [undefined, "continuation_after_accepted_segment", null]
  ];

  it.each(cases)("renders %s in %s as %s", (requiredness, generationContext, expected) => {
    const { container } = render(
      <RequirednessMarker requiredness={requiredness} generationContext={generationContext} />
    );
    const queries = within(container);

    if (expected === "required") {
      expect(queries.getByLabelText("required")).toBeTruthy();
      return;
    }

    if (expected === null) {
      expect(container.textContent).toBe("");
      return;
    }

    expect(queries.getByText(expected)).toBeTruthy();
  });
});
