# T04 Candidate Commands And Checks

Trial commit: `7e8a545860c0d70f25be429d0a02b37d44be8bbc`

## Isolation and input integrity

- Created a fresh local shared clone, checked out the trial commit detached, overlaid every T04 frozen input, removed the source's own same-stem prep, and installed only the assigned candidate snapshot.
- Frozen-input SHA-256 checks matched `hashes.sha256`:
  - current source: `75c7d0083ae1d1eef2ef2831914c76003c3d88ea1cdb0532a0cb8b0f267601d2`
  - predecessor source: `457239ac24551154242b45d6d8571b6f07e74c714b8739af26dcb3c07720afe9`
  - predecessor prep: `6a70a39bec6a93c186e5a642b06fa12fa70fe10e78d55f35c6a43e5c0e269b6a`
- Source report validation passed.
- Candidate source inspection returned `status: ok`, 2 prioritized findings, 15 cumulative rows, 6 strengths, and no warnings or errors.

## Evidence reads

- Read the complete current source, the bounded predecessor detail required by F003/F006/F014, and the complete predecessor prep.
- Read required repository authorities and only affected source, tracker, code, and test seams.
- Live GitHub reads found the exact relevant owners closed: #100, #109-#112, #122, and #123. No tracker write was performed.
- Source, predecessor source, and predecessor prep are tracked, clean, visible on `origin/main`, and content-identical.

## Focused verification

- Initial five-file Vitest invocation: two web files passed 15 tests; three suites could not resolve `@loom/core` because the disposable clone had no built core package.
- `npm run build --workspace @loom/core`: passed.
- Repeated focused command:

  `npx vitest run packages/web/src/segment-reconciliation/SegmentReconciliationView.test.tsx packages/server/src/segment-reconciliation-routes.test.ts packages/web/src/notes/NoteEditor.test.tsx test/note-editor-persistence.test.ts packages/server/src/story-notes-isolation.test.ts`

  Result: 5 test files passed, 29 tests passed.
- `git diff --check -- reports/playtest-the-winter-letter-2026-07-20T023325Z-prd-prep.md`: passed.
- Privacy/stale-language scan found only categorical boundary mentions of accepted/candidate prose, not reproduced content; no machine-local path, localhost URL, secret, prompt, raw response, payload, or stale completion language is present.
- Root lint, typecheck, full test, and build were skipped because this is a report-only trial; the skill calls for focused checks rather than root gates.

## Prep validation

- First draft validation correctly rejected explanatory suffixes on two controlled classification fields and a shortened prior-action label. The artifact was corrected to exact contract values and exact prior recommendation text.
- Candidate draft validation then passed with 15 dispositions, 6 strength constraints, 0 PRD candidates, 0 ticket packets, and no warnings or errors.
- Candidate final validation passed with the same counts and `completionMode: final`.
- The first frozen-current invocation used a standalone validator copy and failed because its relative source-validator import was not retained. After restoring the frozen relative layout and dependency, the frozen-current final validation passed with the same counts and no warnings or errors.
- Post-validation status and detached-branch capture exactly matched the validated three-row worktree ledger.

## Non-actions

No product, source report, active doc, skill source, spec, ticket, tracker, commit, push, or PRD mutation occurred.
