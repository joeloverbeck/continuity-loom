# Review evidence

Use this when implementation is ready for review and after every review fix or amend.

## Review route

Invoke the repository `code-review` skill against a resolved fixed point. Read that skill before deciding fallback is necessary; its policy owns whether reviewers or local two-axis fallback apply.

- Preferred: commit the owned implementation, then review from the pre-implementation fixed point through `HEAD`.
- If a commit is inappropriate, review the explicit WIP diff and say no committed fixed point exists.
- If one axis is interrupted or stale, preserve completed evidence and use the recovery/fallback route defined by `code-review`.

Carry the canonical review handoff or fallback block into the durable closeout sink unchanged. Do not duplicate its field schema here.

## Findings and final-tree refresh

Preserve every finding even when fixed before closeout. For behavior-changing fixes, obtain a failure for the intended behavior before patching when possible; a setup or nearby failure is only partial red. Add the smallest durable regression proof, fix, and rerun affected tests/gates.

Stage only owned files, then intentionally amend or create a follow-up commit. If a follow-up commit is used, keep review anchored at the original implementation fixed point so it covers implementation plus fixes.

After every change once review starts:

1. Refresh final SHA and actual remote reachability.
2. Ensure the review frame covers current `HEAD`; rerun stale axes.
3. Rerun every verification gate made stale.
4. Re-evaluate browser/manual and backend-process freshness for changed UI/routes/API/fixtures/action paths.
5. Refresh closeout bodies and current, historical-red, and superseded evidence identities; run the required superseded-token sweep through the canonical builder/validators.
6. Replace stale active SHA/evidence references while keeping genuine historical red/finding identity clearly classified.

The publishable body must report the final review outcome truthfully: no findings, findings fixed, or accepted residuals. When residuals are accepted, use the implement validator's machine-derived `Accepted residuals:` summary verbatim; do not rewrite it as “no findings.”

## Commit and sink decision

Tracked implementation reports are SHA-independent evidence sources. Do not amend a report merely to add the terminal SHA/review result of the commit containing it. Put final self-referential fields in a tracker comment or another external durable sink.

Tracker closeout normally requires an implementation-owned final commit. If no commit may be created, state that no SHA represents the verified tree and keep closeout blocked unless both user authorization and repository policy explicitly permit a local-only closeout path.
