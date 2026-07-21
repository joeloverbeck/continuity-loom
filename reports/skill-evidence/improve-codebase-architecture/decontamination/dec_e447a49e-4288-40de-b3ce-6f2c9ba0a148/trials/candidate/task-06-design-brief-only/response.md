Understood: this is design-only. I won’t update `CONTEXT.md`, ADRs, implementation files, or other repository artifacts. The eventual deliverable from this discussion will be a design brief, and none of the options we discuss become ratified merely by appearing in it.

The first seam to settle is what “Manifest intake” owns. My starting recommendation is a transport-neutral boundary: CLI, HTTP, and import-file adapters convert their transport into an intake request; the intake module owns alias resolution, unit defaults, and validation sequencing; callers receive either a canonical Manifest or structured diagnostics. That would keep transport parsing and presentation outside the module while making the three entry paths share one behavioral policy.

The main unresolved question is failure semantics. Which contract should the design brief adopt?

1. **Staged error collection (recommended):** stop only when parsing or alias resolution makes later checks unsafe; otherwise collect all independent validation diagnostics in a stable order.
2. **Fail fast:** return the first error from the ordered intake pipeline.
3. **Caller-selected mode:** let each adapter choose fail-fast or collected diagnostics.

I recommend staged error collection because it preserves one intake policy across every adapter without hiding multiple actionable problems from users. Caller-selected behavior would weaken the seam by putting validation policy back into the adapters.
