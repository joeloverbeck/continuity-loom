# Current versus candidate measures

Counts use `wc` over the three runtime files. Token figures are rough English-token estimates at 1.33 tokens per word and are comparison aids, not model-billing claims.

| Measure | Current baseline | Candidate | Change |
| --- | ---: | ---: | ---: |
| Main `SKILL.md` lines | 178 | 94 | -84 (-47%) |
| Main `SKILL.md` words | 2,737 | 1,290 | -1,447 (-53%) |
| Main runtime token estimate | ~3,640 | ~1,720 | ~-1,920 |
| All runtime files lines | 488 | 177 | -311 (-64%) |
| All runtime files words | 4,720 | 1,783 | -2,937 (-62%) |
| All-runtime token estimate | ~6,280 | ~2,370 | ~-3,910 |
| Specific-item numbered steps | 6 | 5 | Recommendation/pause and application remain distinct; repeated override mechanics moved to one section. |
| Unconditional normal-path reference loads | The main file advertises both references; specific triage always requires the rejection-KB procedure even without a plausible rejection | 0 | Brief and rejection-KB references are explicitly branch-loaded. |
| Conditional references | `AGENT-BRIEF.md`, `OUT-OF-SCOPE.md` | Same two | No reference or capability removed. |
| Incident/provenance passages | 2 explicit incident-shaped explanations plus several audit-style qualifications | 0 | Transferable invariants retained without the stories. |
| Duplicated-definition clusters | At least 5: label gates, blocker search, approval, exact readback, and long examples restating templates | 0 intentional; each invariant has one canonical home | Consolidated. |
| Executable helpers | 0 | 0 | Unchanged. |

## Preserved hard gates

Both versions require: repository-owned label/precondition reads; exactly one category and state; recommendation before unapproved mutation; verification of bug/PR/readiness claims; completed-state and prerequisite proof for conditional transitions; throwaway verification data; disclaimer-prefixed tracker prose; and exact post-mutation readback. The candidate consolidates these gates but does not turn any into advice.

## Structural simplifications

- Three full good examples and one bad example were removed from the brief reference after their transferable rules and template were retained.
- The rejected-enhancement reference's long illustrative tree/code sample was replaced by its actual record contract.
- Blocker/family discovery mechanics are conditional rather than interleaved with the common recommendation path.
- Direct and standing overrides share the state/safety contract instead of repeating label, prerequisite, comment, and readback rules.
- Repository configuration points to its active owners; triage no longer embeds cross-repository setup behavior beyond a stop-and-route fallback.
