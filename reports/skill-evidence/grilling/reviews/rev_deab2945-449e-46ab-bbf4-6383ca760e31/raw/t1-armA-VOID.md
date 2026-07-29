# T1 — arm A, VOIDED (cueing prompt; not a trial result)

Prompt contained "...together with any files that document points to", which orders the behavior
under test. Retained for audit only. See HARNESS-ARTIFACT-void.md.

## Verbatim executor output

I read both files in the fixture project (`docs/candidates.md` and `docs/AUTHORITY.md`); those two are the entire project — no code, no tracker, not a git repo. The authority doc settles the candidate branch outright, so I'm recording it as fact rather than putting it to you as a choice.

**Explored fact — Candidate A is rejected.** `better-sqlite3` ships a compiled native addon, which `docs/AUTHORITY.md` §1 forbids outright. §3 makes this non-negotiable regardless of its performance profile.

**Explored fact — Candidate B is rejected.** Redis requires a `redis-server` process alongside the app, which §2 forbids. Same §3 override applies.

**Explored fact — Candidate C is the only admissible option.** Plain JSON files on disk are pure JS, no addon, no daemon. Because repo authority leaves exactly one valid option, candidate choice is not a decision you own here — it stays out of the decision ledger.

**Finding — the write-up is misleading as written.** `docs/candidates.md` presents three peers on performance grounds and never mentions the binding constraints.

**Finding — the real risk moved.** Since the backend is forced, the only thing that can still fail is C's stated weakness.

Question 1: What is this grilling run's scope boundary — the backend selection alone, or the selection plus the read-path design that makes it survivable? My recommendation (Recommended): include the read path. Do you agree?

## Rubric note

Would have scored PASS, but the instrument cued the behavior. Voided.
