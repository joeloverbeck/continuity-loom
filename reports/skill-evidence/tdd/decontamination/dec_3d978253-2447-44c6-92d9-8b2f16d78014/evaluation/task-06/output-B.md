# TDD approach

Start at the pure deterministic lifecycle/readiness seam. Do not begin with routes, React, provider mocks, or a bulk final-state suite. Before the first edit, confirm the active authority's exact public types, existing readiness API, canonical blocker identifier, fixture builders, and focused test commands. The task does not supply the blocker identifier or say whether missing-value normalization is persisted; those are the two material uncertainties. Use the existing canonical identifier if one exists. If none is specified, introduce one identifier, provisionally `generation_context_mismatch`, without an alias. Treat a missing value as ready via an archive-derived effective value without writing the brief unless the storage authority explicitly requires load-time normalization.

For every slice below, retain the exact focused red command and the intended assertion failure, then the minimal production change and focused green output. Setup, fixture, type, or harness failures are not a valid red.

## Slice 1: pure lifecycle and readiness matrix

Add one parameterized public-behavior test for the required context and readiness result. The independently specified oracle is:

- accepted count `0` requires `first_segment`;
- accepted count `1` or greater requires `continuation_after_accepted_segment`.

Exercise this complete matrix with valid public fixtures:

| Accepted count | Saved value | Expected result |
| --- | --- | --- |
| 0 | missing | effective/required context is `first_segment`; no mismatch blocker |
| 0 | `first_segment` | required context is `first_segment`; no mismatch blocker |
| 0 | `continuation_after_accepted_segment` | exactly one mismatch blocker |
| 1 | missing | effective/required context is `continuation_after_accepted_segment`; no mismatch blocker |
| 1 | `continuation_after_accepted_segment` | required context matches; no mismatch blocker |
| 1 | `first_segment` | exactly one mismatch blocker |
| multiple | missing | effective/required context is `continuation_after_accepted_segment`; no mismatch blocker |
| multiple | `continuation_after_accepted_segment` | required context matches; no mismatch blocker |
| multiple | `first_segment` | exactly one mismatch blocker |

Each contradictory case must also prove that the brief is still valid/saveable, that the saved field remains unchanged, and that unrelated readiness checks receive the archive-derived required context and still report their own results. Assert the mismatch identifier occurs once rather than replacing or duplicating other blockers.

The expected first red is a matrix row returning the saved contradictory context as ready, deriving the wrong required context, or omitting the mismatch blocker. If every row unexpectedly passes, verify the assertion reaches the intended public seam and record this as coverage rather than fabricating a red.

The smallest green is one pure derivation of required context from accepted-segment count and one comparison used by the existing shared readiness calculation. It must not rewrite the saved brief. Refactor only after green: centralize the lifecycle literals/blocker construction and remove duplicated derivation inside the changed area, without changing any other validation behavior.

## Slice 2: archive transitions on one real test store

After core is green, add focused stateful tests through the public acceptance/deletion and repository seams. Use one active repository instance per transition; do not compare unrelated snapshots.

- Start at zero with saved `first_segment`; accept one segment; assert the accepted archive has one item, the saved brief still says `first_segment`, and readiness now has the single mismatch blocker.
- Start at one with saved `continuation_after_accepted_segment`; delete the only accepted segment; assert the saved brief remains unchanged and readiness now blocks against required `first_segment`.
- Start with multiple accepted segments and matching continuation context; delete one while at least one remains; assert it stays ready and the saved value is unchanged.
- Where the public workflow supports the reverse transition, repair explicitly, accept/delete again, and prove re-entry on the same instance.

Include accepted-prose canaries containing a unique sentinel. They may change only the accepted count used by lifecycle derivation: neither the sentinel nor accepted prose may enter readiness-derived prompt inputs, compiled prompt bytes, saved summaries, exports beyond the already-authorized accepted archive, or provenance fields that do not already own it.

The smallest green is to have acceptance/deletion invalidate or recompute readiness from the archive while leaving brief persistence alone. Refactor only shared transition invalidation already exercised by the tests.

## Slice 3: fail-closed server and repository gates

Once the core and transition tests are green, drive each server behavior through its public route/API with a real isolated test repository. Create a contradictory brief through the ordinary save route and prove the save succeeds and round-trips unchanged. Then test that the same shared readiness result gates:

- prompt preview/inspection;
- prompt compilation;
- candidate intake;
- Generate;
- provider sending.

For every blocked path, assert the public blocked result contains the one canonical mismatch blocker and exposes no prompt bytes. Assert the real candidate repository remains unchanged. Fake only the external provider client and assert zero sends as supporting boundary evidence; also assert the caller-visible blocked result, because call count alone is not the behavior oracle. Do not mock core readiness, compilation, routes, or the repository you own.

Add an accepted-prose sentinel to the archive and assert it is absent from every permitted post-repair prompt. Add schema/repository/export round trips for missing, matching, and contradictory saved values so the new rule does not break compatibility, ownership, or provenance.

The smallest green is to compute readiness once at the common preflight seam and return its blocked result before compilation, candidate persistence, or provider dispatch. Route-specific copies of the lifecycle rule are not an acceptable green. Refactor only after all focused server gates pass, extracting the common preflight/result plumbing if the existing design needs it.

## Slice 4: explicit repair and freshness

Through the public API, first inspect a valid prompt, then perform an acceptance/deletion transition that makes the saved value contradictory. Assert the previously inspected prompt is no longer current and all compilation/generation entry points block. The public freshness oracle should be the repository's existing revision/provenance/currentness contract; do not assert a private cache key.

Save the archive-derived required context explicitly. Assert the saved brief now contains that value, readiness is ordinary again, and only a fresh compilation restores preview, candidate intake, Generate, and provider sending. Prove the new prompt has the repaired lifecycle context and excludes the accepted-prose sentinel. If the public API accepts a prompt revision/token, also assert the stale inspected value is rejected after repair rather than silently reused.

The smallest green is invalidation on the boundary transition and explicit save, followed by fresh compilation through the existing compiler. Refactor freshness bookkeeping only while these tests remain green.

## Slice 5: web recovery and accessibility

With core/server green, render the web flow against controlled public API responses and add the smallest browser/component tracer:

- a contradictory saved brief remains editable and can be saved;
- the named blocker is visibly associated with the generation-context control and announced through the existing accessible error/status mechanism;
- preview and Generate are unavailable while blocked, no candidate appears, and the provider boundary remains untouched in the assembled browser test;
- selecting the required value and explicitly saving clears the blocker;
- the stale inspected prompt is no longer presented as current;
- requesting a fresh preview restores the ordinary controls and shows the repaired context without accepted prose.

Test keyboard reachability, focus after the failed attempt/save, accessible names, and the status announcement through rendered behavior rather than static source checks. Keep the production change to presenting the shared server readiness result and recovery action; do not reimplement the lifecycle rule in React. Refactor common blocked-state presentation only after the recovery tracer is green.

## Docs, commits, and verification

Documentation and checklist updates follow the behavior slices and do not need a fake software red. Review them directly against the final public behavior. Keep incremental commits aligned to green vertical slices: core matrix; transitions; server fail-closed gates; repair/freshness; web recovery/docs. Do not commit a knowingly red intermediate state.

For each slice, run the repository's existing focused command for the touched public test file, discovered during preflight, and record proof that the named cases ran. Then run the relevant package tests. Final canonical verification is:

```text
npm run lint
npm run typecheck
npm test
npm run build
```

Completion requires all applicable canonical gates to pass, or an explicit report of any command that could not run. The evidence ledger should map every acceptance item to a focused green test, including the full zero/one/multiple matrix, both boundary directions, draftability, all five fail-closed consumers, explicit repair/fresh compilation, accepted-prose exclusion, schema/export/provenance preservation, and accessible web recovery.
