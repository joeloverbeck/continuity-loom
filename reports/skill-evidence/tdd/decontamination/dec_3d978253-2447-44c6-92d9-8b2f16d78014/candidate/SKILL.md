---
name: tdd
description: Test-driven development. Use when the user wants to build features or fix bugs test-first, mentions "red-green-refactor", or wants integration tests.
---

# Test-Driven Development

Use a red → green → refactor loop to deliver observable behavior in small vertical slices. TDD applies to behavior-changing code. Do not invent a failing software test for research, documentation, controlled evidence, or another task with no software behavior change; use that task's appropriate verification method instead. When routing away from TDD, preserve the supplied method and controls exactly—do not introduce a new variable, substitute a different protocol, or weaken its constraints.

For a controlled comparison, translate every required measure into explicit collection fields at every named stage. If the method requires before-and-after measurement, record each measure both before and after the intervention, then retain the within-arm change; an artifact snapshot alone is not a substitute for a scored stage.

## Before the first red

1. Read the repository guidance and the applicable issue, spec, domain context, ADRs, and authority documents. If the requested behavior conflicts with an authority, stop for a scope correction or approved amendment.
2. Enumerate the observable acceptance obligations and preservation boundaries. Cover every named category or value in a required range unless the authority explicitly permits sampling, and map each obligation to a test or the appropriate non-runnable evidence. The first tracer may be narrow; it must not narrow the accepted scope.
3. Identify the public seams where behavior is observed. Seams named by the issue or spec are agreed after you restate them; ask the user only when a seam is absent, ambiguous, or conflicts with the codebase's public interfaces.
4. Inspect the existing tests, fixtures, and focused commands. Establish required setup such as dependency installation, current workspace builds, and valid fixtures before treating a failure as behavioral evidence.
5. Choose the smallest end-to-end slice and state the observable assertion expected to fail.

## The loop

For each slice:

1. **Red:** add one focused test through an agreed public seam. Run it and confirm the failure is caused by the missing or incorrect behavior.
2. **Green:** make the smallest production change that can satisfy that test. Rerun the same focused command and confirm the intended test ran and passed.
3. **Refactor:** only while green, improve the changed design without expanding behavior or doing unrelated cleanup. Rerun the focused test after refactoring.
4. Repeat with the next tracer bullet. Do not write all tests first and implementation later.

A missing test file, invalid fixture, missing dependency, stale built output, harness failure, or unrelated assertion is a setup or wrong-reason failure—not the behavior red. Repair only the precondition, rerun the exact command, and obtain the intended failing assertion before changing production behavior. If the behavior already exists and the new assertion passes, treat it as added coverage rather than fabricating a red.

## Test design rules

- Test behavior users or callers can observe through public interfaces. Avoid private methods, internal call order, and side-channel verification.
- Derive expected values independently from the issue, specification, or a worked example; do not reproduce the production algorithm in the assertion.
- Work one seam and one minimal implementation at a time. When a slice necessarily spans several public seams, keep one small tracer at each seam and preserve the acceptance mapping.
- Mock only system boundaries. Prefer real controlled components and test stores over mocks of code you own. See [mocking.md](mocking.md) when external boundaries or overlapping async work are involved.
- Keep fixtures valid at their public type, parser, repository, or serialization boundary. Prove complex setup separately so it cannot masquerade as the intended red.
- For stateful interactions, exercise re-entry on one active instance and every applicable terminal path—success, failure, cancel, discard, persistence, restoration, retention, clearing, and re-enable behavior.
- For repeatable async actions, either prove overlap is prevented or control settlement order so attempt A remains pending, attempt B settles, then A settles. Test both mixed outcomes and assert final public state.
- Use static/source checks only when acceptance explicitly names a source-level contract. Pair them with public behavior evidence when the feature is user-visible.
- Do not force docs-only, browser/manual, or external evidence into a fake red. Record and verify those obligations with their appropriate review, browser, or external proof.

See [tests.md](tests.md) for focused examples and anti-patterns.

## Contract changes and review findings

If an existing test fails after an intended contract change, retain the failing command before changing its expectation. Update the expectation only when the governing issue or spec authorizes the new behavior; otherwise fix the implementation.

When review finds missing behavior, restart with the smallest failing assertion before fixing it. A standards-only or documentation-only review fix does not need a fake behavior red; rerun the affected checks and record why red-first was not applicable.

## Evidence and completion

For each slice, retain the exact focused red command and intended failure, the minimal change, and the focused green result in the surrounding implementation ledger when one exists. Record explicit reasons for any legitimate red-first skip. Tracker publication, issue-family acceptance manifests, browser-session custody, and closeout-body schemas belong to the surrounding workflow rather than this skill.

After the focused loop is green, run the relevant broader package and repository checks from the repository guidance. Report commands that could not run and do not claim completion while an applicable check is failing.
