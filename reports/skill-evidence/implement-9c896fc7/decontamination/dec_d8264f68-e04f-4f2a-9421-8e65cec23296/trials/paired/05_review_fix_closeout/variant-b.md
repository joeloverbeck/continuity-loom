Review finding received:

- `P1-spec-1`: the implementation committed as `aaaa111` is missing the required validation guard, and the behavior needs a durable regression test.
- The issue remains open. Its ledger row returns to `in progress`, and the old closeout draft is invalid because it names a superseded candidate final SHA.

`git status --short` is rerun before staging. The validation implementation and its regression test are the only implementation-owned changes. The pre-existing user edits are recorded by exact path, left untouched, and excluded from every stage operation.

TDD/review-fix evidence is refreshed as `RF-1`:

- Finding/source: `P1-spec-1`, missing validation guard.
- Red-first disposition: `red-first skipped because this continuation begins after the validation fix and regression test already coexist in the working tree, so no truthful pre-fix failing run is available; reverting merely to manufacture chronology would fabricate evidence.`
- Green evidence: the exact focused regression-test command already run for the validation seam passes, with its observed test count copied into the verification-command ledger and represented tree identified as the current review-fix working tree.
- Regression durability: the new assertion is retained in the implementation-owned validation test file and fails if the guard is removed.
- Updated TDD row: the original issue row now cites `RF-1`; its acceptance entry still names the exact criterion, authoritative atoms, concrete proof surfaces, and applicable sequence.

The working pre-close audit is reread against the exact issue body. The guard criterion now has concrete implementation and regression-test evidence; all other acceptance and Principles/ADR rows are rechecked rather than inherited by assumption. Every satisfied Evidence cell contains `atoms:`, `proof surfaces:`, and `sequence:` with a justified sequence N/A where ordering does not apply.

`Implementation pre-stage gate passed: working pre-close audit drafted in the inspected issue closeout body; blocked/not done rows none; artifact disposition reconciled; ownership/placement decisions recorded; unrelated dirty files listed from git status and left untouched.`

Only the validation implementation file and its regression-test file are staged. `git diff --cached --name-only` is inspected and contains no user-owned path.

`Implementation commit gate passed: staged files scoped yes; staged file list the exact validation implementation and regression-test paths reported by git diff --cached --name-only; working pre-close audit the inspected issue closeout body; blocked/not done rows none; artifact disposition reconciled.`

A follow-up review-fix commit is created, producing final SHA `bbbb222`. The original implementation commit is not amended, so the final review frame remains anchored at the original implementation fixed point and covers both `aaaa111` and `bbbb222`; it is not narrowed to `HEAD~1`.

Final-tree verification is rerun and recorded against `bbbb222`:

| Exact command | Observed result/counts | Run count | Represented SHA/tree |
|---|---|---:|---|
| exact focused validation regression-test command from the implementation ledger | passed; exact output-derived test count recorded | final-tree run count recorded | `bbbb222` |
| `npm run lint` | passed; output-derived result recorded | 1 | `bbbb222` |
| `npm run typecheck` | passed; output-derived result recorded | 1 | `bbbb222` |
| `npm test` | passed; output-derived test counts recorded | 1 | `bbbb222` |
| `npm run build` | passed; output-derived result recorded | 1 | `bbbb222` |

Browser/manual freshness mini-gate after the review-fix commit:

- `Files touched since browser/manual smoke:` the validation implementation and regression-test paths from the final diff.
- `Affects UI/routes/browser-consumed API/fixtures/action path?` Re-evaluated from the issue's recorded production path. If that path consumes this validation result, the proof-owned server is restarted or reload-currentness is demonstrated, the expected rejection is probed, and the recorded browser route/action is rerun on `bbbb222`; otherwise the body records the exact issue-authorized N/A or a concrete not-affected reason.
- `Backend process currentness:` the final evidence records the server command and watch/reload mode, process/port ownership, restart or reload proof, and expected validation API probe when browser/API proof applies; otherwise it records the applicable canonical N/A.
- `Smoke freshness:` the final body contains the actual rerun outcome or the supported N/A/not-affected disposition, never the stale pre-fix smoke as final-tree proof.

`code-review` is rerun against the same resolved fixed point through reviewed HEAD `bbbb222`, covering both commits. Standards and Spec are both re-reviewed. The original finding is retained in the immutable finding ledger as `P1-spec-1`, final status `fixed`; the final Standards and Spec passes report no unhandled findings.

`Review: code-review against the original resolved implementation fixed point; outcome findings fixed in SHA bbbb222; verification rerun exact focused validation test, npm run lint, npm run typecheck, npm test, npm run build.`

The publishable closeout body is rebuilt outside the tracked tree from the exact acceptance manifest and structured evidence, using the immediate-fix path so the RF row, finding ledger, finding count, and review summaries are builder-derived. The tracked implementation evidence is not amended with its own final SHA or terminal review result.

The old draft is discarded as current evidence. Every active final-SHA and reviewed-HEAD field is changed from `aaaa111` to `bbbb222`. The evidence refresh records all current categories, historical red identities, and superseded categories. A targeted `rg` sweep for `aaaa111` and every other normalized superseded identity reports no hits outside classified identity/history lines and no active-proof hits.

Because no push was requested, remote reachability is checked explicitly. If `bbbb222` is not present on the intended remote branch, the inspected body contains the full sentence:

`Local-only SHA: bbbb222 is not remote-reachable because this closeout was requested without a push; local-only closeout is acceptable because the user requested implementation and tracker closeout without publication and repository policy permits local-only closeout.`

The exact closeout body is inspected in bounded excerpts. Its byte size is within the tracker ceiling; the placeholder sweep is clean; the audit table has the exact `Acceptance criterion or conformance check` and `Status` columns; every issue row is `satisfied`; every satisfied Evidence cell contains non-circular `atoms:`, concrete `proof surfaces:`, and `sequence:`; final SHA, final-tree verification, fielded TDD evidence, normal immediate-fix review evidence, Principles/ADR disposition, browser disposition and console state, final freshness delta, and evidence-identity refresh are present.

The applicable TDD and normal-review closing validators pass against `bbbb222`. Immediately before the first tracker mutation, the implement validator is rerun against that same inspected body with `--closing --expected-final-sha bbbb222 --emit-preflight --mutation-ready` plus every scope-dependent flag. Its emitted `Closeout preflight:`, `Closeout gate passed: audit sink ...`, `Post-comment verification next: ...`, mutation-ready confirmation, and accepted-residual summary are copied verbatim into the durable transcript. The accepted-residual summary reports none.

`Closeout body check passed: audit table columns exact; every acceptance checkbox or conformance check named; every satisfied Evidence cell contains atoms/proof surfaces/sequence; every status literal satisfied/blocked/not done; final SHA present; verification evidence present; TDD evidence present or N/A; review evidence present; evidence identity refresh and superseded-token sweep present; Principles/ADR conformance string present or N/A; full Local-only SHA explanatory sentence present or N/A; browser evidence present/N/A/blocked; browser console state recorded when browser evidence is present or N/A/blocked; final browser/manual freshness delta present/N/A; exact fixed child inline comment inspected N/A.`

Tracker transaction:

1. Post the inspected closeout body to the still-open issue with the body-file form and capture the returned HTTPS comment URL.
2. Run the exact stored-body verifier against that URL and the inspected body. It passes with an exact UTF-8 match.
3. Close the issue as completed with the short inline comment `Completed by bbbb222. Evidence: the verified closeout comment URL.`
4. Exact-read the issue by number. It reports `CLOSED` with reason `COMPLETED`; the latest close comment names `bbbb222` and the verified evidence URL.

A final `git status --short` confirms there is no implementation-owned dirt and no untracked verification artifact requiring disposition. The unrelated user edits remain present, unstaged, and unchanged.
