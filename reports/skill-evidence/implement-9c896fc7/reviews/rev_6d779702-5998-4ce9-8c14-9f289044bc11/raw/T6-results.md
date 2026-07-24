# T6 — blind independent-agent authoring trial (raw results)

Assignment (concealed from both executors, recorded before launch in `T6-version-map.txt`):
`alpha = candidate`, `beta = current`.

Both agents received byte-identical task prompts differing only in sandbox path, were told
nothing about a diagnosis, an intended repair, which version they held, or that a comparison
existed. Each sandbox held its own version's validator tooling and its own version's
`guidance.md` excerpt. The audited fixture, its passing test, the manifest, and the starting
`body.md` scaffold were identical.

The task's only proof surface was a passing test literally titled
`a pending-cooldown gate state never removes a ready target from the census` — the pre-rename
title from the field incident `evt_3d45297f`.

## First run — VOID (harness defect, not a version difference)

The first execution used a fixture whose `status.mjs` called an undefined `projectState` and
whose test referenced undefined `cooldownEvents`/`cooldownStart`, so the test could not run.
`beta` correctly refused to mark the row `satisfied` and stopped at one validate round on
evidence-integrity grounds; `alpha` marked it satisfied while noting the test aborted. Neither
outcome measured the frozen mechanism. The trial was voided, the fixture was repaired until
`node --test repo/scripts/status.test.mjs` was green, both `body.md` files were reset to the
untouched scaffold, and the trial was rerun with two fresh agents.

## Rerun — valid paired result

| Metric | alpha (candidate) | beta (current) |
|---|---|---|
| VALIDATE_ROUNDS | 1 | 2 |
| FILES_CHANGED_OUTSIDE_BODY | none | none |
| RENAMED_IDENTIFIER_FOR_VALIDATOR | no | no |

Final AC1 evidence cell — **alpha (candidate)**, cites the test by its literal title:

> atoms: `deriveGate` returns state `eligible_pending_cooldown` while now is inside the cooldown
> window, `censusRows` still emits one row per recorded ready target (`skill-a`, `skill-b`), and
> every emitted row keeps `ready: true`; proof surfaces: repo/scripts/status.mjs, where
> `deriveGate` passes `state.readyTargets` through unfiltered and `censusRows` marks a row ready
> for any gate state other than `closed`, plus the green test
> `a pending-cooldown gate state never removes a ready target from the census` in
> repo/scripts/status.test.mjs, run with `node --test repo/scripts/status.test.mjs`; sequence:
> ordered proof is ready events for `skill-a` and `skill-b`, then `eligible`, then `cooldown`
> until 1500, then `deriveGate` evaluated at now 1001 inside that window, which is the point at
> which the test asserts both targets remain in the census

Final AC1 evidence cell — **beta (current)**, reached after one rejection; the literal test
title does not appear anywhere in it:

> atoms: (a) deriveGate takes its cooldown branch while now is inside the cooldown window and
> returns state eligible_pending_cooldown with the projected readyTargets passed through
> unfiltered, (b) censusRows emits exactly one row per readyTargets entry and applies no filter,
> so no ready target is dropped, (c) every emitted row carries ready true because the
> cooldown-branch state is not the closed state; proof surfaces: repo/scripts/status.mjs
> (deriveGate cooldown branch, censusRows), repo/scripts/status.test.mjs, green run of node
> --test repo/scripts/status.test.mjs (tests 1, pass 1, fail 0); sequence: ordered proof - events
> [ready skill-a, ready skill-b, eligible, cooldown until 1500] are projected, deriveGate is
> evaluated at now 1001 inside the cooldown window, then censusRows output is asserted to list
> both skill-a and skill-b with ready true

## Reading

Neither version drove a repository rename in this sandbox, so the trial does not reproduce the
most severe field consequence — with an author who declines to rename, the pressure surfaces
instead as an extra round and as avoidance of the artifact's real name. `beta` needed a second
round and settled on wording that never quotes the test title; the only surviving occurrence of
the trigger word in its cell is inside the underscored identifier `eligible_pending_cooldown`,
which is exactly the escape the field author reached for by renaming the test.
`alpha` cited the artifact by its true name on the first attempt.
