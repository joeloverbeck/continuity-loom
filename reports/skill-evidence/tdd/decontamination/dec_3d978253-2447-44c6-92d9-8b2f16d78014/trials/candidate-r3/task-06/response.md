# Agreed seams and uncertainty

This is behavior-changing regression work, so use red-green-refactor in vertical slices. The issue supplies the public seam progression: pure core lifecycle/readiness, then server routes and repository boundaries, then rendered web behavior and provider sending. Restate those as the agreed seams and begin at core.

Two public details are not present in the task statement: the existing API/symbol names and the exact required blocker identifier. Before writing the first assertion, obtain those names from the governing issue and existing public interfaces; do not invent a parallel API or freeze a guessed blocker name. Below, `CONTEXT_CONTRADICTION` is a symbolic stand-in for that required name. The plan also assumes that normalizing a missing value means deriving the required value in the shared readiness result without silently persisting it. If the authority instead requires save-time persistence, resolve that before implementation.

# Acceptance map

The archive-derived requirement is deterministic:

- zero accepted segments requires `first_segment`;
- one or more accepted segments requires `continuation_after_accepted_segment`.

At the core public readiness seam, the first red is one table-driven matrix covering all nine cases:

| Accepted count | Saved context | Expected effective context | Context result |
| --- | --- | --- | --- |
| 0 | missing | `first_segment` | ready with normalized effective value |
| 0 | `first_segment` | `first_segment` | ready |
| 0 | `continuation_after_accepted_segment` | `first_segment` | blocked by exactly one `CONTEXT_CONTRADICTION` |
| 1 | missing | `continuation_after_accepted_segment` | ready with normalized effective value |
| 1 | `continuation_after_accepted_segment` | `continuation_after_accepted_segment` | ready |
| 1 | `first_segment` | `continuation_after_accepted_segment` | blocked by exactly one `CONTEXT_CONTRADICTION` |
| many | missing | `continuation_after_accepted_segment` | ready with normalized effective value |
| many | `continuation_after_accepted_segment` | `continuation_after_accepted_segment` | ready |
| many | `first_segment` | `continuation_after_accepted_segment` | blocked by exactly one `CONTEXT_CONTRADICTION` |

For contradictory rows, assert the complete public readiness result: `ready` is false; the contradiction blocker occurs once; the reported required/effective context is archive-derived; and unrelated readiness checks still run against that derived context. Add a case with an independent blocker so the test proves contradiction does not short-circuit or substitute the contradictory saved value. For missing and matching rows, “ready” here means “no context blocker”; unrelated blockers may still make the overall result not ready.

Run the focused core command and confirm that these assertions fail because the lifecycle rule or contradiction handling is absent/incorrect. Setup, fixture, type, or unrelated failures are not the red.

# Slice 1: deterministic core readiness

The smallest production change is to put the count-to-required-context decision and comparison with the optional saved value in the existing core readiness path. It should return the effective archive-derived context plus the named blocker when a present saved value contradicts it. Existing readiness checks must consume that effective context. Do not mutate storage in this function.

Rerun the exact matrix command to green. While green, refactor only enough to give the lifecycle decision one shared, pure owner and remove duplication encountered in the changed core path. Do not yet alter routes or UI.

Next add core-level failing assertions that the one shared readiness result gates each core operation that can produce or consume generation material:

- blocked preview and compilation return no prompt bytes;
- blocked candidate intake accepts/persists no candidate;
- blocked generation cannot reach a sendable request; and
- accepted prose remains absent from every prompt-bearing result, using a distinctive accepted-prose canary.

Make the smallest change that routes those operations through the shared readiness result. Rerun to green. Preserve schema compatibility, export shape, provenance, and storage ownership with focused characterization assertions at their public seams rather than inspecting private helpers.

# Slice 2: archive boundary transitions and explicit repair

On one active story/repository instance, add failing public tests for these transitions:

1. Start at zero with saved `first_segment`; accept the first segment; verify the accepted count becomes one, the saved brief remains `first_segment`, and readiness now has one contradiction blocker.
2. Start at one with saved `continuation_after_accepted_segment`; delete the last accepted segment; verify the count becomes zero, the saved brief is unchanged, and readiness blocks.
3. Exercise one-to-many and many-to-one transitions; because both sides remain above zero, a matching continuation value stays matching and is not rewritten.
4. Save a contradictory value through the public save seam; verify the save succeeds and round-trips unchanged while readiness blocks. This proves contradictory data remains draftable/saveable.
5. From a blocked instance, explicitly save the archive-required value; request a fresh compilation; verify ordinary readiness and generation behavior return.
6. If a prompt was inspected before the mismatch or repair, prove it becomes stale and cannot remain the current inspected prompt. Only the post-save fresh compilation may become current.

Each red must fail at the named transition or recovery assertion, not because its persisted fixture is invalid. The minimal production change is boundary invalidation/re-evaluation: acceptance, deletion, and save operations preserve the user's brief, invalidate stale derived/inspected generation artifacts, and cause the existing shared readiness owner to recompute from the current accepted count. They must not auto-repair the saved field.

Rerun each tracer to green before adding the next. Refactor only after the transition suite is green, centralizing changed-operation invalidation if the same rule was necessarily duplicated. Keep the accepted-prose canary in the fresh compilation assertion.

# Slice 3: server fail-closed behavior

After core is green, add route/repository tracers through public server interfaces:

- save accepts and returns a contradictory brief without repository normalization, while the public readiness response exposes exactly the named blocker;
- acceptance and deletion can create the mismatch but do not update the saved brief;
- preview, compilation, candidate intake, and Generate all consume the same readiness result and return the same blocker when blocked;
- blocked routes emit no prompt body/bytes and create no candidate;
- the provider boundary receives zero calls while blocked, with the public blocked response as the primary oracle;
- explicit repair followed by a fresh compilation restores the route flow, and only then may a provider request occur; and
- accepted prose canaries, export data, storage ownership, schema-compatible records, and provenance remain intact.

Use a real isolated repository/test store when available and a faithful injected fake only at the provider boundary. A provider call count supports the no-send obligation but does not replace assertions on public response, prompt absence, and candidate absence.

The smallest production change is to make the affected routes delegate to the existing shared readiness result before prompt creation, candidate intake, or provider dispatch. Do not add route-specific lifecycle calculations. Once all route tracers are green, refactor duplicate fail-closed response mapping into the narrowest shared server boundary.

# Slice 4: web recovery and accessibility

Only after server green, add rendered/public web tracers showing that a contradictory saved value remains editable; the named blocker is visibly and accessibly associated with the context control; preview/Generate cannot proceed; and no stale inspected prompt is represented as current. Exercise keyboard-accessible explicit correction and save on the same mounted instance, then request fresh compilation and prove preview/Generate is re-enabled with the repaired context.

The smallest UI change is to render and obey the server/shared readiness state at existing controls, preserve editing/saving, clear or mark stale inspected prompt state after acceptance/deletion/save, and refresh only through a new compilation result. Do not calculate a second lifecycle rule in React. After green, refactor only duplicated readiness-to-control presentation logic. Update the applicable behavior documentation after code behavior is green; documentation needs review and canonical checks, not a fake red.

# Evidence, commits, and verification

Keep a per-slice ledger with the exact focused command, the intended failing assertion, the minimal production change, and the same command passing. Sensible independently green commits are:

1. core lifecycle/readiness matrix and shared core gates;
2. acceptance/deletion/save transitions, invalidation, and explicit repair;
3. server/repository/provider fail-closed integration; and
4. web accessibility/recovery, documentation, and canonical verification.

Discover and use the repository's existing focused runner syntax rather than inventing commands in this blind plan. The verification order is:

1. focused core matrix;
2. focused core gate and accepted-prose canary tests;
3. focused boundary-transition/repository tests;
4. focused server route/provider tests;
5. focused rendered web accessibility/recovery tests;
6. relevant package suites; and
7. the repository's canonical lint, typecheck, complete test, and build gates.

Do not claim completion if an applicable gate fails or could not be run; report the exact command and reason. The final evidence must demonstrate one shared readiness decision from core through UI/provider, saveability of contradictory drafts, no prompt/candidate/provider side effects while blocked, explicit repair plus fresh compilation, stale-prompt invalidation, and all named preservation canaries.
