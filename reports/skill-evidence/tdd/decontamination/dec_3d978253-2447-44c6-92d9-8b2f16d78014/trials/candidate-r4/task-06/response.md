# Execution-ready red-green-refactor plan

This is a behavior-changing regression and should use TDD. The governing lifecycle oracle is independent of the saved brief:

```text
accepted segment count = 0  -> first_segment
accepted segment count > 0  -> continuation_after_accepted_segment
```

A missing saved value may be normalized to that oracle for evaluation. A present contradictory value must remain saveable and unchanged, make readiness false, and contribute exactly one named mismatch blocker. All other validation must evaluate the archive-derived oracle, not the contradictory saved value.

The supplied task does not name the repository's public functions, blocker literal, route status/error shapes, or focused test commands. Before editing, read the active authorities and issue, locate the existing public readiness/compiler/repository/route/UI seams, and bind the assertions below to their actual names. Do not invent a parallel API or count a fixture/build failure as red. In particular, obtain the exact required blocker identifier from the authority or issue before writing the first assertion.

## Acceptance map

| Obligation | Public evidence |
| --- | --- |
| Zero/one/many crossed with missing/matching/contradictory context | Core readiness table through the existing public core seam |
| Exactly one mismatch blocker; other checks use required context | Core readiness result with a branch-sensitive fixture |
| Contradictory values remain saveable; missing values remain compatible | Save/load API plus real test repository |
| Acceptance and deletion do not rewrite the brief | Transition through the public acceptance/deletion APIs followed by normal read/readiness APIs |
| One readiness result gates every path | Preview, compilation, candidate-intake, Generate, and provider-route integration tests using the same fixture and blocker result |
| Blocked work emits no prompt/candidate/provider side effect | Public result plus prompt/candidate repository state; external provider spy only at the provider boundary |
| Explicit repair and fresh compilation recover; stale inspection is not current | Stateful test on one active server/UI instance |
| Accepted prose, schema, export, provenance, and storage invariants survive | Focused regression tests through their public serialization/compile/export seams |
| Accessible web recovery | Rendered/browser behavior and accessibility assertions |
| Documentation and canonical gates | Documentation review, then repository commands; no fake software red for docs |

## Slice 1: core lifecycle and contradiction

**First red.** Through the existing public core readiness seam, use a valid record with zero accepted segments and saved `continuation_after_accepted_segment`. Assert:

- required/effective generation context is `first_segment`;
- readiness is blocked;
- the blocker collection contains the exact named mismatch blocker once;
- a branch-sensitive unrelated validation result is the one required by `first_segment`, proving the contradictory saved value did not steer other checks.

Use an existing valid fixture builder/parser and independently written literal expectations. If the assertion unexpectedly passes, record it as existing coverage and proceed to the next missing public behavior; do not fabricate a failure.

**Smallest green.** At the current core readiness seam, derive required context solely from accepted-segment count. Normalize an absent saved value only in the evaluated view. If a saved value is present and unequal, append one mismatch blocker without replacing the derived context used by the remaining validators. Do not mutate or persist the brief.

Rerun the exact focused command and confirm the intended assertion, not merely the file, ran and passed.

**Next reds at the same seam.** Grow the focused table to the complete required matrix, using `0`, `1`, and `2` as zero, one, and multiple:

| Accepted count | Saved value | Required/effective value | Mismatch blocker |
| ---: | --- | --- | ---: |
| 0 | missing | `first_segment` | 0 |
| 0 | `first_segment` | `first_segment` | 0 |
| 0 | `continuation_after_accepted_segment` | `first_segment` | 1 |
| 1 | missing | `continuation_after_accepted_segment` | 0 |
| 1 | `continuation_after_accepted_segment` | `continuation_after_accepted_segment` | 0 |
| 1 | `first_segment` | `continuation_after_accepted_segment` | 1 |
| 2 | missing | `continuation_after_accepted_segment` | 0 |
| 2 | `continuation_after_accepted_segment` | `continuation_after_accepted_segment` | 0 |
| 2 | `first_segment` | `continuation_after_accepted_segment` | 1 |

Add one case at a time if the existing harness makes the full table obscure which behavior is red. Each contradictory case also asserts that no duplicate/cascade mismatch appears.

**Refactor while green.** Extract one small pure lifecycle derivation/comparison function inside core only if the passing cases reveal duplication. Keep blocker aggregation and unrelated validation in the existing readiness module. Do not introduce persistence, server, or UI dependencies into core.

## Slice 2: persistence compatibility and boundary transitions

**Red, save/load.** Through the normal save route and real isolated test repository, save a valid brief whose context contradicts the current accepted count. Assert the save succeeds, a normal read returns the exact saved value, and the public readiness result carries the mismatch blocker. Add a legacy/missing-field fixture through the public parser/load seam and assert it loads and evaluates with the archive-derived context.

**Green.** Make the serializer/parser accept the existing optional value shape and ensure save does not call normalization as a mutation. Reuse the core readiness result when returning readiness. Avoid a schema migration or compatibility alias unless an authority explicitly requires one.

**Red, acceptance.** Start with zero accepted segments and saved `first_segment`; accept one segment through the public operation. A subsequent normal read must still show saved `first_segment`, while readiness now requires continuation and blocks once.

**Red, deletion.** Start with exactly one accepted segment and saved continuation; delete that segment through the public operation. A subsequent normal read must still show saved continuation, while readiness now requires first segment and blocks once. Also retain the multiple-to-one case as a non-mismatch control.

**Green.** Remove any implicit brief rewrite from those boundary operations, if present, and recompute readiness after the archive change. Do not change accepted-segment storage behavior beyond suppressing the prohibited brief mutation.

Rerun each focused transition test after its minimal change. Refactor only duplicated retrieval/readiness plumbing while green.

## Slice 3: shared gating and zero side effects

Create one contradictory fixture through the public save/repository boundary, then add narrow tracers in this order rather than writing every consumer test before implementation:

1. preview returns the shared blocked readiness result and exposes no prompt bytes;
2. compilation returns the same blocked result and emits/persists no compiled prompt;
3. candidate intake rejects the operation with that result and stores no candidate;
4. Generate is unavailable and exposes the blocker to the user;
5. a direct server/provider-send path returns the blocker and makes no provider call.

For each tracer, obtain the intended red, change that consumer to gate on the existing shared core readiness result before doing work, and rerun to green before moving on. Use real owned components and a real isolated test store. Mock only the external provider boundary; its call count is supporting proof, paired with the public blocked response and absence of prompt/candidate side effects.

Once two consumers are green, refactor repeated adapter code into the narrowest shared application-level gate. The refactor must not create a second readiness calculation, move server concerns into core, or broaden behavior.

## Slice 4: explicit repair, freshness, and accessible recovery

Use one active instance so the test proves transitions rather than unrelated snapshots:

1. Begin with a matching brief and inspect/preview a prompt; retain its public prompt/provenance identity.
2. Perform an acceptance or deletion that makes the saved context contradictory.
3. Assert readiness blocks and the formerly inspected prompt is no longer current or sendable.
4. Explicitly save the corrected context.
5. Assert readiness is restored, but do not treat the stale inspected prompt as freshly compiled.
6. Compile again and assert the new prompt/provenance identity is current and ordinary intake/Generate behavior is restored.
7. Assert a provider send, if exercised, can use only the fresh compilation.

The first red should be the earliest violated public transition in that sequence. The smallest green is freshness invalidation keyed to the readiness/archive/brief revision already exposed by the system, plus requiring a fresh successful compile before currentness is restored. Do not redesign the whole prompt cache.

At the rendered UI seam, assert the blocked Generate control is semantically disabled, the named blocker and repair action are perceivable to assistive technology, keyboard users can reach the explicit save/recovery flow, and Generate re-enables only after save plus fresh compilation. Implement only the UI state/announcement/recovery wiring required by those assertions, then refactor presentation duplication while green.

## Preservation tests and non-test evidence

Add focused regression assertions alongside the slice that could violate each invariant:

- Put a distinctive sentinel in accepted prose and prove a repaired/fresh compile does not contain it.
- Round-trip missing, matching, and contradictory records through the public schema/repository seam without moving data across storage ownership boundaries.
- Export through the public export seam and assert the saved brief, accepted archive, and compatible schema shape are preserved.
- Assert candidate/compiled-prompt provenance refers to the fresh compilation and cannot claim the stale inspected prompt.

Expected values must come from the issue/authority, not from reproducing production logic in the test. Documentation changes receive an explicit review against the lifecycle matrix, blocker/recovery behavior, and user instructions; they do not need a fabricated failing software test.

## Verification and completion

For every slice, retain the exact focused red command and intended failing assertion, the minimal production change, and the exact focused green result. After each refactor, rerun that focused test. Exact focused commands remain an explicit pre-implementation uncertainty because the supplied task does not expose the repository's runner or file layout; discover them from existing package scripts/tests before the first red rather than guessing.

After all focused slices are green, run the affected package suites and then the canonical repository gates:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Do not claim completion if an applicable gate fails. Record any command that cannot run, and distinguish setup/harness failures from behavioral failures.
