# TDD execution plan for #96

This is a software behavior regression, so red -> green applies. The first seam is the pure core lifecycle/readiness interface. Repository, server, and web tests begin only after that matrix is green.

Before the first red command, inspect the active project authorities and record an exact alignment disposition for the compiler, record schema, validation, accepted-segment, storage, and local/provider boundaries. The packet does not supply route names, field locations, blocker naming conventions, or test-runner syntax, so those must be resolved from the current public interfaces rather than guessed. The issue already agrees these public seams: core readiness/compiler, acceptance and deletion operations, save/load/export, preview/compilation/candidate/Generate/provider routes, and the rendered recovery UI.

I would choose computed normalization for a missing saved context: derive the required value from accepted-segment count without silently writing the record. That preserves old records and keeps repository mutations explicit. If an active schema authority requires persistence-time normalization, record that authority before changing this choice.

## Slice 1: pure lifecycle/readiness matrix

Add one parameterized test through the public core readiness function. Freeze the input so mutation also fails the test.

| Accepted segments | Saved context | Required/effective context | Expected mismatch blocker |
|---:|---|---|---|
| 0 | missing | `first_segment` | none |
| 0 | `first_segment` | `first_segment` | none |
| 0 | `continuation_after_accepted_segment` | `first_segment` | exactly one |
| 1 | missing | `continuation_after_accepted_segment` | none |
| 1 | `continuation_after_accepted_segment` | `continuation_after_accepted_segment` | none |
| 1 | `first_segment` | `continuation_after_accepted_segment` | exactly one |
| 3 | missing | `continuation_after_accepted_segment` | none |
| 3 | `continuation_after_accepted_segment` | `continuation_after_accepted_segment` | none |
| 3 | `first_segment` | `continuation_after_accepted_segment` | exactly one |

The first red assertion must prove all of the following, not merely that a helper returns a string:

- required context is determined only by accepted archive count: zero versus greater than zero;
- a missing value uses the required context without mutating the saved record;
- a contradiction produces exactly one stable named blocker (provisionally `generation_context_mismatch`; adopt the repository's public blocker convention if different);
- the readiness result exposes the archive-derived required/effective context even when the saved value contradicts it;
- unrelated readiness checks still run. Add a fixture that triggers one existing independent blocker and assert both it and the single mismatch blocker. Where an existing check is context-sensitive, choose its fixture so its public blocker proves that it evaluated the archive-derived context, not the contradictory saved value.

Expected red: the zero/positive derivation, normalization, mismatch blocker, or blocker composition is absent or inconsistent. A fixture/schema setup failure is only a wrong-reason red and must be repaired before recording behavior red.

Smallest green change: add one pure core derivation and have the existing public readiness evaluator return the required/effective context plus the named mismatch blocker. Do not change repository, routes, UI, or prompt compilation in this slice. Run the focused core test to green.

## Slice 2: compiler fail-closed behavior

Red tests at the public core compilation seam:

1. A contradictory record returns the shared blocked readiness result and no prompt value/bytes.
2. A missing or matching record compiles with the derived context.
3. With a unique accepted-prose canary in one and multiple accepted segments, a successful prompt does not contain that canary. Accepted archive metadata may determine lifecycle; accepted prose itself never becomes context.
4. Any other existing validation blocker composes with the mismatch while using the derived context.

Smallest green change: make compilation consume the already-green readiness result and return before prompt assembly when blocked. Do not create a second lifecycle calculation. Keep prompt construction unchanged for ready records.

## Slice 3: persistence and boundary transitions

Use public repository/application operations, not database inspection, as the oracle. Add red tracers one at a time:

- saving a brief with a contradictory context succeeds and round-trips that exact value, but subsequent readiness is blocked;
- loading a schema-compatible older record with the context absent succeeds and readiness computes the required value without an implicit write;
- exporting a record preserves its saved context, accepted archive, schema-compatible shape, and existing provenance fields;
- starting at zero with saved `first_segment`, accepting the first segment changes the archive count to one but leaves the saved brief unchanged; readiness then reports the mismatch;
- starting at one with saved `continuation_after_accepted_segment`, deleting back to zero leaves the saved brief unchanged and reports the mismatch;
- deleting from two accepted segments to one keeps required context as continuation and does not invent a mismatch;
- rejected or superseded candidates do not affect the required context.

Smallest green change: remove or prevent any context rewrite in acceptance/deletion operations, preserve the field in repository serialization/export, and route post-operation readiness through the core evaluator. Do not add migration aliases or duplicate schema authorities.

## Slice 4: one readiness result gates every server path

At the public server/API seam, use a contradictory saved record and a recording fake only for the external provider boundary. Add focused red tests in this order:

1. preview is blocked with the named blocker and the response contains no prompt bytes;
2. compilation is blocked before prompt construction and exposes the same readiness result;
3. candidate intake is rejected and repository state/provenance show that no candidate was stored;
4. Generate is blocked with no prompt/candidate result;
5. provider sending is never invoked and no provider-derived candidate or provenance is created.

Call count is not the sole oracle: each test must also assert the public blocked response and absence of prompt/candidate state. Use the same blocker payload/identity at all five seams so route-specific reimplementations cannot drift.

Smallest green change: introduce or reuse one server application-level readiness gate that delegates to the core result. Preview, compilation, candidate intake, Generate, and provider send all consume that result and return before their side effects. Saving remains allowed.

## Slice 5: explicit repair, freshness, and stale inspection

Exercise the complete sequence on one active record instance:

1. At zero accepted segments with saved `first_segment`, inspect prompt `P1`; it is current.
2. Accept the first segment. Assert the saved brief still says `first_segment`, readiness is blocked, no prompt bytes are returned, and `P1` is no longer current/eligible for Generate.
3. Attempt Generate using the stale inspection identity. Assert the public blocked result and no provider call or candidate.
4. Explicitly save `continuation_after_accepted_segment`. Saving succeeds, but the old inspection remains stale.
5. Compile again from the freshly loaded current record. Assert a new inspection identity/revision `P2`, ordinary ready behavior, and the accepted-prose canary still absent.
6. Repeat the symmetric delete-to-zero repair path. Also prove two-to-one remains continuation without repair.

The public freshness oracle should be the repository revision or existing compilation identity, not a private cache flag. The server must compile from the current record and must not trust client-supplied old prompt bytes.

Smallest green change: invalidate/clear inspected-prompt currentness whenever the relevant record revision or readiness changes, require a fresh compilation identity for current behavior, and preserve explicit-save semantics. Do not auto-repair on accept or delete.

## Slice 6: accessible web recovery

At the rendered DOM/user-action seam, start from a contradictory record and test that:

- one accessible status/alert names the saved and required contexts and the repair action;
- preview/Generate cannot initiate blocked requests, while editing and Save remain available;
- the repair control is labeled and keyboard operable, focus/status feedback is sensible, and errors are not communicated by color alone;
- choosing the required value and explicitly saving removes the blocker after the refreshed record arrives;
- the previously inspected prompt is cleared or marked stale, and a fresh preview/compilation is required before ordinary generation;
- failed Save retains the user's edit and the blocker; successful Save followed by fresh compilation restores normal behavior.

Use route/action/result assertions for a final browser smoke, with console state recorded. The component test is behavior red; the browser run is final evidence, not a fabricated red.

## Refactor and commit boundary

Do not refactor while a slice is red. After all affected public seams are green, a behavior-preserving refactor may consolidate duplicate lifecycle/readiness decisions behind the core result and tighten names/types. It must not broaden storage changes, add compatibility shims, or move accepted prose into prompt context.

Keep reviewable commits at green boundaries:

1. core lifecycle/readiness matrix;
2. core compiler fail-closed and accepted-prose canaries;
3. repository compatibility plus accept/delete transitions;
4. server route/provider/candidate gates;
5. explicit repair and compilation freshness;
6. accessible web recovery and governing docs.

If a slice discovers that behavior already exists, run the criterion-specific public assertion before production changes and record `coverage-only existing behavior; red-first N/A because behavior already existed and no production code changed`. If an existing expected value must change, first retain its failing command and add an `existing contract-change expectation` evidence row tied to #96.

## Verification and closeout evidence

For every slice retain, in chronological order, the focused red command and intended assertion failure, the minimal green change, and the focused green command. Confirm the intended test file and case actually ran. Keep separate rows for core readiness, compiler, persistence/transition, each server gate, repair/freshness, web behavior, browser evidence, and docs.

After focused tests are green, run the affected package tests and then the canonical repository gates:

```text
npm run lint
npm run typecheck
npm test
npm run build
```

Update the active compiler, schema/validation, and user-facing documentation selected by the repository's active-doc map. Documentation is a `no-runnable` row unless an existing public doc-contract check applies; review it against each #96 criterion instead of inventing a source-string test. Preserve existing export and provenance regression suites and run them in the final tree. Final browser evidence must use the current backend/tree, cover contradiction -> explicit save -> fresh compilation, and record that blocked paths produced no prompt, candidate, or provider call.

Remaining uncertainties to resolve before editing are the existing saved-field location, exact public blocker vocabulary, current compilation freshness mechanism, route names/status conventions, deletion semantics, and which provenance fields are authoritative. Resolve them from active authorities and public interfaces; do not introduce parallel fields or guessed aliases.
