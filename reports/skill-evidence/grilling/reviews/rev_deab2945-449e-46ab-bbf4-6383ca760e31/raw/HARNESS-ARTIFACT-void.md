# Voided run — harness artifact, not a trial result

First administration of T1/T2 arm A used an executor prompt containing:
"...together with any files that document points to. Read it and comply with it exactly."

That clause instructs the executor to follow the entry document's pointers — which is precisely the
behavior under test. An instrument that orders the behavior cannot measure whether the contract
elicits it, so both runs are voided by the same rule that voids a location-only failure: repair and
rerun, do not count as a trial result.

Both voided runs passed (T1: recorded the single surviving option as an explored fact and kept
candidate choice out of the ledger; T2: emitted exactly one literal `Baseline: unchanged - ...`
receipt after a real pre-write capture). Their outputs are retained as
`t1-armA-VOID.md` / `t2-armA-VOID.md` for audit only.

Repaired prompt names the entry document alone, with no instruction about its links — matching how a
real invocation presents SKILL.md and leaves pointer-following to the run.
