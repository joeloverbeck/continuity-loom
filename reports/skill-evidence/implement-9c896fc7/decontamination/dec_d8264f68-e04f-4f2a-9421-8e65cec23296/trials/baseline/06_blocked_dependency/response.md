Blocked before implementation. I would not edit the repository or mutate the tracker in the current state.

Related tracker items outside requested scope: #21 enabling prerequisite.

Artifact disposition: N/A because the supplied issue evidence names no active implementation artifact.

| Issue | Blockers | Acceptance | Principles | Evidence | Test seam | Status | Closeout comment |
|---|---|---|---|---|---|---|---|
| #22 | #21 owns the schema; #21 has two mutually exclusive unresolved proposals; #22 is labeled `blocked` and `needs-info`, not `ready-for-agent` | Cannot be evaluated or implemented exactly until the schema proposal is chosen | Not established by the supplied evidence | Owner decision recorded on #21, followed by exact #21/#22 body, comment, label, and state readback | Cannot be selected until the schema is resolved | blocked | Keep open; no closeout mutation is permitted |
| #21 (enabling prerequisite, outside requested scope) | No owner decision between the two schema proposals | An authorized owner must select one proposal and make the resulting schema contract actionable | Not established by the supplied evidence | Explicit owner decision and updated tracker state | N/A because this is currently a decision gate | blocked | Do not implement or close implicitly as part of #22 |

Scope ledger posted: yes; no edits started; unrelated dirty files not enumerated in the supplied evidence, with another person's partial uncommitted attempt known and preserved untouched; in-scope issues #22; related tracker classification done (#21 enabling prerequisite); artifact disposition N/A; ownership/placement decisions N/A pending the schema owner decision.

There is no narrow implementation path that avoids making the unresolved product/schema decision. Choosing either proposal would exceed the authority granted by “implement #22,” and the existing partial attempt must not be overwritten, adopted, or staged without first identifying its exact paths and ownership.

To unblock this work, an authorized owner needs to record which schema proposal governs #21. After that decision, I would perform only read-only intake checks first: refresh exact structured readbacks of #21 and #22 including comments and labels, run `git status --short`, classify every existing change, and update the ledger with the exact acceptance criteria, principles/ADR obligations, evidence seams, artifact disposition, and ownership placement. Implementation and eventual closure of #22 can proceed only after those checks show the dependency resolved and all closeout rows can be satisfied.

Which of the two schema proposals has the owner approved for #21?
