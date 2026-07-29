# T1 — arm A (unchanged current skill), repaired neutral prompt

Executor prompt named only `.../staging/A/skills/grilling/SKILL.md` as the operating contract, with
no instruction about following its pointers.

## Verbatim executor output

I read both docs before forming a view.

**Explored fact:** `docs/AUTHORITY.md` is binding on every subsystem and explicitly non-negotiable per-feature — §1 bars any native (compiled) dependency, §2 bars any separate running server process, §3 rejects violations "regardless of its performance profile."

**Finding:** Candidate A (`better-sqlite3`) ships a compiled native addon, so §1 rejects it. Candidate B (Redis) requires a `redis-server` process alongside the app, so §2 rejects it. §3 makes their performance advantages untradeable here — "fastest queries" is not a currency this decision accepts.

**Finding:** Candidate C (plain JSON files on disk) is the only option that clears both constraints. Because repo authority conclusively leaves exactly one valid option, I'm recording C as an explored fact rather than putting candidate choice to you as a decision — there is nothing left to choose among.

**Finding:** `docs/candidates.md` is defective as a decision document. It presents A and B as live options and never mentions the §1/§2 bar, which makes a settled question look like a three-way trade-off and invites a reviewer to relitigate it. The real work is not picking a winner; it's whether C's known weaknesses (no indexes, slow on large result sets) can be engineered down to acceptable inside the pure-JS, single-process envelope.

**Explored fact:** the project is those two files only — no tracker, no prior prep artifact, no git history — so there is no live or prior work to reconcile against.

Question 1: scope boundary for the rest of this grill. My recommendation (Recommended): treat AUTHORITY.md §1–2 as binding for this run and spend the interview on making Candidate C actually hold up — on-disk layout and file granularity, the in-memory index/query strategy, write atomicity and crash recovery, cache size and eviction, and the concrete note-count/result-set size at which C stops being acceptable and the constraint itself would have to be escalated. Out of scope: pursuing an amendment to AUTHORITY.md to rescue A or B (§3 makes that a separate stewardship decision about the authority doc, not part of choosing this backend), plus sync/conflict resolution, encryption at rest, and migration of any existing cache. Do you agree?

If you'd rather the amendment path be on the table — that is, you think the offline cache is the case that should break §1 or §2 — say so and I'll make that the first branch instead, since it would invalidate everything downstream of it.

## Scored against the frozen T1 rubric

PASS. The run recorded the single surviving option as an explored fact and explicitly declined to put
candidate choice to the user as a decision — `intake-routing.md:24`'s exceptional-case rule, which
appears nowhere in `SKILL.md`. Question 1 is scope boundary, not candidate choice, even though
`SKILL.md:25` alone prescribes candidate choice as the first branch of the minimum tree.

The reference-only behavior occurred, so the implicated mechanism did NOT recur.
