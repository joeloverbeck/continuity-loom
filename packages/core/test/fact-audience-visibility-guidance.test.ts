import { getFieldGuidance } from "../src/index.js";
import { describe, expect, it } from "vitest";

// PRD #165 / issue #167: the FACT.audience_visibility field guidance must stop promising
// reader-concealment and instead tell the truth — it is not a reader-concealment control —
// and route an author who wants to hide a POV-known premise to the SECRET model.

describe("FACT.audience_visibility field guidance tells the truth (PRD #165 / #167)", () => {
  const guidance = getFieldGuidance("FACT.audience_visibility");

  function combinedText(): string {
    if (!guidance) {
      throw new Error("FACT.audience_visibility guidance is missing");
    }
    return JSON.stringify(guidance);
  }

  it("keeps the audience_visibility enum values unchanged", () => {
    expect(guidance?.enumValues).toBeDefined();
    expect(Object.keys(guidance!.enumValues!)).toEqual(["hidden", "implied", "explicit", "not_applicable"]);
  });

  it("no longer promises reader-concealment", () => {
    const text = combinedText();
    expect(text).not.toContain("Do not expose this fact to the audience yet");
    expect(text).not.toContain("allowed to know this fact");
  });

  it("states the field is not a reader-concealment control", () => {
    const text = combinedText().toLowerCase();
    expect(text).toContain("not a reader-concealment control");
    expect(text).toContain("does not conceal");
  });

  it("routes an author to the SECRET model with pov_access: knows and audience_visibility: hidden", () => {
    const text = combinedText();
    expect(text).toContain("SECRET");
    expect(text).toContain("pov_access: knows");
    expect(text).toContain("audience_visibility: hidden");
  });

  it("makes the hidden value text itself route to the SECRET model rather than promising concealment", () => {
    const hidden = guidance?.enumValues?.hidden?.short ?? "";
    expect(hidden).not.toContain("Do not expose");
    expect(hidden).toContain("SECRET");
  });

  it("preserves the explicit value guidance so unrelated field-help stays stable", () => {
    expect(guidance?.enumValues?.explicit?.short).toBe("The audience may know it directly.");
  });
});
