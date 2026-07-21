Understood. We’ll explore Candidate 2 and end with a design brief in this discussion only. I won’t update the glossary, ADRs, or implementation files.

The first load-bearing decision is the seam’s ownership. My recommendation is:

- The Manifest intake module owns alias resolution, unit defaults, and validation ordering.
- Its interface accepts an adapter-neutral intake request and returns either a validated Manifest or ordered validation failures.
- The CLI, HTTP, and import-file adapters keep only their source-specific parsing and translate into that intake request.

That shape gives the module real depth: intake policy is local, while each adapter stays thin. It also gives tests leverage because alias/default/validation interactions can be exercised through one interface instead of three adapters.

Should the design brief adopt that seam, or should the Manifest intake module also own source parsing?

Execution record: design-brief-only constraint active; no side effects performed; seam ownership remains unratified pending your answer.
