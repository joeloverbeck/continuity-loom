## TDD evidence — issue #203

Final SHA: `1a2b3c4d5e6f7890`

TDD evidence

| Issue | CONTEXT.md status | ADRs/principles/docs status | Seam | Red command/failure | Green command or evidence | Acceptance covered | Review fix / red-first skip reason |
|---|---|---|---|---|---|---|---|
| #203 | read | aligned because `docs/principles/FOUNDATIONS.md` §9.1 authorizes the seam | red-first | `npm test -- compile-rejected` failed with "expected rejected candidate to be absent, received 1 occurrence" | `npm test -- compile-rejected` — passed: 1 file and 2 tests; exit 0 | AC1 "Rejected candidates never appear in the compiled prompt."; atoms: atomic — one indivisible obligation, that a rejected candidate is absent from the compiled prompt; proof surfaces: the public `compileStoryPrompt` compilation seam, observed by the green command `npm test -- compile-rejected` with observed result passed: 1 file and 2 tests; exit 0; sequence: N/A because the criterion is not sequence-sensitive | N/A |

Existing-test contract-change rows: none

TDD review-fix map: N/A because review created no TDD row changes

Verification command ledger:

| Exact command | Observed result/counts | Run count | Represented SHA/tree |
|---|---|---|---|
| `npm test -- compile-rejected` | passed: 1 file and 2 tests; exit 0 | 1 | `1a2b3c4d5e6f7890` |

TDD closeout preflight:
- Durable sink/body inspected: this closeout body for issue #203, published as the issue #203 closeout comment (stable issue reference used because the comment URL does not exist until posting)
- Compact table/header: present after structural check
- Rows accounted for: all in-scope issues and seams listed — issue #203 has exactly one seam, the public `compileStoryPrompt` compilation seam, and it has a row
- Pre-red recovery status: N/A - pre-red preflight/table was visible before first red
- Pre-red evidence reference: durable implementation-ledger file for issue #203 carried into this closeout body's TDD evidence section at the 'TDD preflight' heading (staging path kept private); the preflight and compact table appear above the first red command in file line order, so that chronology proves they precede the first red command
- CONTEXT.md status: present
- ADRs/principles/docs status: aligned because `docs/principles/FOUNDATIONS.md` §9.1 authorizes the seam
- Acceptance atom map: all rows list the exact criterion plus authoritative atoms and proof surfaces; AC1 is atomic and its row names the proof surface
- Acceptance sequence map: all rows list ordered proof or a justified sequence N/A; AC1 is not order-, transition-, or timeline-sensitive, so its row uses sequence N/A
- Partial-red / red-first skip reasons: none
- Evidence-only rows freshness: none - browser/manual N/A because the only seam is the pure `compileStoryPrompt` compilation function and no route, UI action, browser-consumed API shape, fixture, or data setup changed
- Evidence-only browser console state: N/A because no browser/manual evidence-only rows
- Evidence-only proof server preflight: N/A because no browser/manual evidence-only rows or no proof server applies
- Evidence-only backend process currentness: N/A because no browser/manual evidence-only rows
- Evidence identity refresh: same-sink current/historical-red/superseded identity block inspected
- Existing-test contract-change rows: none

Evidence identity refresh:
- Current evidence identities: fixture paths none; browser sessions none; packet paths/hashes none; active revisions none; artifacts none
- Historical red identities retained: none
- Superseded evidence identities: fixture paths none; browser sessions none; packet paths/hashes none; active revisions none; artifacts none
- Superseded-token sweep: N/A because every superseded category is none

TDD evidence gate passed: durable sink this closeout body for issue #203, published as the issue #203 closeout comment (stable issue reference before the tracker URL exists); compact table/header present after structural check; seams accounted for all listed; CONTEXT.md status present; ADRs/principles/docs status aligned because `docs/principles/FOUNDATIONS.md` §9.1 authorizes the seam; sequence evidence N/A; evidence identities present; partial-red / red-first skip reasons none; evidence-only rows none; proof server preflight N/A; existing-test contract-change rows none.

Post-comment verification next: after gh issue comment --body-file returns a URL, run node .claude/skills/implement/scripts/verify-github-comment-body.mjs "$comment_url" "$body" before any close command.
