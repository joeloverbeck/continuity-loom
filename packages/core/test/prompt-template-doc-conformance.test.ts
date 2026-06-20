import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { SECTION_TEMPLATES } from "../src/compiler/template-constants.js";

// docs/prompt-template.md is the named authority for the universal prompt
// template text. The static SECTION_TEMPLATES constants render verbatim into the
// compiled prose prompt, so the two must stay in lockstep (compiler-contract.md
// §1/§10). This guards the drift class where the doc's <authority_hierarchy> and
// <prose_craft> wording was amended (SPECFOUDOCAME-004) without updating the
// constants or the golden baseline.
const templateDoc = readFileSync(new URL("../../../docs/prompt-template.md", import.meta.url), "utf8");

type StaticSection = keyof typeof SECTION_TEMPLATES;

// Sections whose constant renders verbatim and therefore must appear as a
// contiguous block inside the authoritative template doc.
const VERBATIM_STATIC_SECTIONS: readonly StaticSection[] = [
  "role",
  "authority_hierarchy",
  "content_policy",
  "story_contract",
  "prose_mode",
  "hard_canon",
  "active_plans_and_intentions",
  "active_clocks",
  "active_obligations_and_consequences",
  "active_open_threads",
  "active_cast_full_dossiers",
  "present_minor_cast",
  "offstage_relevance",
  "physical_continuity",
  "invention_permissions",
  "contradiction_prohibitions",
  "prose_craft",
  "final_output_instruction"
];

// Static-template sections the compiler assembles dynamically (placeholder lines
// + static rules) or whose doc block embeds a compiler-facing annotation line
// absent from the constant, so the constant is not a contiguous substring of the
// doc. Their rendered output is pinned by the frozen golden baseline in
// compiler-golden.test.ts instead. Typed as string[] because the composite-section
// keys exist on SECTION_TEMPLATES at runtime but are excluded from its declared
// StaticSectionId key type.
const NON_VERBATIM_STATIC_SECTIONS: readonly string[] = [
  "pov_knowledge_constraints", // placeholder lines prepended to the static rules at compile time
  "audience_knowledge", // ambiguous-perception block injected conditionally
  "secrets_and_reveal_constraints", // value lines assembled; only the trailing reveal rule is reused
  "active_working_set", // doc block embeds the empty-pin annotation
  "stop_rule", // doc block embeds the conditional soft-unit annotation
  "relevant_facts_beliefs_events", // composite; doc block embeds a sub-block annotation
  "locations_objects_affordances" // composite; doc block embeds a sub-block annotation
];

describe("prompt-template.md <-> template-constants conformance", () => {
  it.each(VERBATIM_STATIC_SECTIONS)(
    "renders <%s> verbatim from the authoritative template doc",
    (sectionId) => {
      expect(templateDoc).toContain(SECTION_TEMPLATES[sectionId]);
    }
  );

  it("classifies every static section as verbatim or explicitly non-verbatim", () => {
    const classified = new Set<string>([...VERBATIM_STATIC_SECTIONS, ...NON_VERBATIM_STATIC_SECTIONS]);
    const unclassified = Object.keys(SECTION_TEMPLATES).filter((id) => !classified.has(id));

    // A newly added SECTION_TEMPLATES section forces a deliberate
    // verbatim-vs-dynamic decision in one of the two lists above.
    expect(unclassified).toEqual([]);

    // No section may be classified both ways.
    const overlap = VERBATIM_STATIC_SECTIONS.filter((id) => NON_VERBATIM_STATIC_SECTIONS.includes(id));
    expect(overlap).toEqual([]);
  });
});
