# Seam and uncertainties to resolve before red

Start at the public, pure core readiness seam. It should take a valid story/brief view plus archive-derived accepted-segment state and return the effective required generation context, blockers, and readiness without mutating the supplied record. Confirm the repository's existing public function/type names, focused test command, valid fixture builder, and the exact specified blocker identifier before writing the assertion. The historical task requires one named blocker but does not supply its literal name here; the test must import or use the issue-authorized literal rather than inventing one.

The archive is authoritative for lifecycle derivation:

- zero accepted segments requires `first_segment`;
- one or more accepted segments requires `continuation_after_accepted_segment`.

An omitted saved context may be normalized to the required value. A contradictory saved value remains valid, saveable data; it is not silently rewritten. It makes readiness false until an explicit repair is saved.

# First red: pure lifecycle/readiness matrix

Add one focused parameterized behavior test through the core public seam. Use otherwise-valid fixtures so setup or an unrelated blocker cannot masquerade as the intended red.

| Accepted count | Saved context | Effective context | Context blocker | Ready on context alone |
|---:|---|---|---:|---:|
| 0 | missing | `first_segment` | 0 | yes |
| 0 | `first_segment` | `first_segment` | 0 | yes |
| 0 | `continuation_after_accepted_segment` | `first_segment` | exactly 1 | no |
| 1 | missing | `continuation_after_accepted_segment` | 0 | yes |
| 1 | `continuation_after_accepted_segment` | `continuation_after_accepted_segment` | 0 | yes |
| 1 | `first_segment` | `continuation_after_accepted_segment` | exactly 1 | no |
| 3 | missing | `continuation_after_accepted_segment` | 0 | yes |
| 3 | `continuation_after_accepted_segment` | `continuation_after_accepted_segment` | 0 | yes |
| 3 | `first_segment` | `continuation_after_accepted_segment` | exactly 1 | no |

For every contradictory row, assert the exact named blocker occurs once and the caller-supplied saved value remains unchanged. Add a focused case using an existing context-sensitive validation fixture to prove that all other checks evaluate the archive-derived effective context, not the contradictory saved value. Its expected blockers should be the ordinary blockers for the derived context plus one context-mismatch blocker—never a duplicate mismatch blocker.

Run the narrow core command and inspect the assertion. The intended red is a wrong derived context, missing/duplicated mismatch blocker, incorrect readiness, or mutation of the saved brief. A fixture/parser/build failure is not the red: repair only that precondition and rerun. If the complete matrix unexpectedly passes against the public seam, retain it as coverage and move to the first downstream assertion that exposes missing behavior; do not fabricate a failure.

# Smallest green and refactor boundary

Make only the core change needed for that matrix: derive required context from accepted-segment count, normalize missing context in the evaluated view, compare any present saved value with the derived requirement, append the one named mismatch blocker when contradictory, and run the remaining readiness checks against the derived context. Return the single readiness result without persisting or mutating the story record.

Rerun the exact focused command. While it is green, remove duplication only inside the changed lifecycle/readiness code—for example, centralize the two-value derivation or blocker construction if the matrix exposed repetition. Do not yet restructure server or web consumers. Rerun after refactoring and commit this coherent green core slice.

# Subsequent vertical slices

Take these one at a time. For each, add the smallest public failing assertion, confirm the right-reason red, make the smallest production change, rerun focused green, and refactor only while green.

1. **Persistence remains draftable.** Through the public repository or save route, save a contradictory brief, read it back through the public read seam, and assert the contradictory value round-trips unchanged while readiness is blocked. Also prove an older record with the field missing still loads and evaluates with the normalized context. Do not assert storage through a private query or incomplete cast fixture.
2. **Lifecycle boundary transitions do not rewrite the brief.** On one active story instance, accept the first segment while a saved `first_segment` brief exists. Assert the accepted count becomes one, required context becomes continuation, the saved brief still says `first_segment`, and readiness now has the one mismatch blocker. Separately delete the last accepted segment from a story saved as continuation and assert the inverse mismatch without auto-repair. Cover a multiple-to-one deletion as the non-boundary canary: it remains continuation and does not create a context mismatch.
3. **Compilation and preview fail closed.** Through their public seams, a contradictory saved brief returns the shared blocked readiness result and no prompt bytes. Use a sentinel that would appear in a compiled prompt to make the absence observable; do not mock an owned compiler merely to assert its call order. Make both paths consume the core readiness result rather than independently reimplementing the lifecycle rule.
4. **Candidate intake fails closed.** Submit a candidate against the contradictory state through the public route. Assert the public blocked response carries the shared readiness result and a subsequent public read shows no candidate was accepted or persisted.
5. **Generate and provider sending fail closed.** Call the server generation seam directly with a faithful fake provider boundary and a contradictory brief. Assert the public blocked result contains no prompt, candidate, or provider result; assert the fake provider received zero calls as supporting evidence. This server assertion is required even if the UI disables Generate, because a disabled control does not protect the route.
6. **Explicit recovery requires fresh compilation.** In one active instance, first inspect a valid prompt. Perform an acceptance/deletion transition that makes the saved context contradictory and assert the previously inspected prompt is no longer current or sendable. Explicitly save the derived context, then request compilation again and assert readiness, preview, candidate intake, and generation return to ordinary behavior using a newly compiled prompt. The repair must not resurrect or relabel the stale inspected prompt.
7. **Web recovery is accessible.** In the rendered UI, create the mismatch through a public interaction. Assert the named blocker is exposed as accessible text, readiness-dependent preview/Generate actions are unavailable, the contradictory saved selection remains visible, and the explicit repair control has an accessible name and usable focus/label relationship. Save the repair and assert the blocker clears and the actions re-enable only after fresh state/compilation.

Use real core/server components and an isolated valid test repository wherever practical. Mock only the external provider boundary. If generation requests can overlap during recovery, either prove overlap is prevented or use controlled deferred provider promises and test both older-success/newer-failure and older-failure/newer-success settlement orders; the final public UI state must belong to the newest attempt.

# Preservation canaries

Add focused non-regression assertions alongside the slice that owns each contract:

- Put a unique sentence in accepted prose. After explicit repair and fresh compilation, assert it is absent from prompt bytes while permitted continuity metadata remains available. A blocked compile must still return no bytes at all.
- Round-trip matching, missing, and contradictory values through the public schema/repository boundaries to preserve compatibility. Verify the existing export surface preserves the saved value and that lifecycle evaluation does not rewrite exported data.
- Assert existing provenance fields survive save, boundary transitions, block, repair, and fresh generation unchanged except for fields whose update is explicitly authorized.
- Exercise every preview, compilation, candidate, Generate, and provider path against the same readiness outcome so no consumer becomes a second lifecycle authority.

Documentation-only obligations do not need a fake failing behavior test. Update the governing docs after the behavior is green, review them against the implemented public contract, and run the affected checks.

# Commits and verification

Keep commits at green vertical boundaries: core lifecycle/readiness; persistence and transition behavior; server fail-closed gates and recovery; web accessibility/stale-prompt recovery; then docs and preservation coverage. A later green refactor may consolidate consumer plumbing around the shared readiness value, but it must not change the public behavior or create a second derivation path.

For every slice, retain the exact focused red command and intended assertion failure, the minimal change, and the focused green result. Finish by running the relevant package tests, then the repository's canonical gates:

```text
npm run lint
npm run typecheck
npm test
npm run build
```

Report any command that cannot run. Do not claim completion while an applicable focused or canonical check is failing.
