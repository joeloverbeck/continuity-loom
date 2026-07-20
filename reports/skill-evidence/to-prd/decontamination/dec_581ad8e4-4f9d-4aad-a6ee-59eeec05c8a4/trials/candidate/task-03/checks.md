# Deterministic checks

All final checks used the live `.claude/skills/to-prd` deterministic helpers specified by the trial. No live skill instructions or references were read.

## PRD A body validation

- Policy: `expectChecklist: true`; approved sources were `docs/FOUNDATIONS.md`, `docs/compiler-contract.md`, `docs/story-record-schema.md`, and `docs/user-guide.md`; no disallowed sources.
- Command result: exit `0`.
- Exact result fields: `storyCount: 9`; `badStories: []`; `checklistMissing: []`; `unexpectedLocalSourcePaths: []`; `leakedDisallowedLocalSources: []`; `unresolvedAdrShorthands: []`; `failures: []`.
- Every emitted boolean check was `true`, including `startsUntitled`, all required sections, both `Seam confirmation:` markers, checklist mode and items, story conformance, source policy, and ADR resolution.
- Extraction result: exit `0`; `localSourcePaths` exactly `docs/FOUNDATIONS.md`, `docs/compiler-contract.md`, `docs/story-record-schema.md`, and `docs/user-guide.md`; `adrShorthands: []`; `resolvedAdrPaths: []`; `unresolvedAdrShorthands: []`.

## PRD B body validation

- Policy: `expectChecklist: true`; approved sources were `docs/FOUNDATIONS.md`, `docs/compiler-contract.md`, `docs/prompt-template.md`, and `docs/validation-rule-inventory.md`; no disallowed sources.
- Command result: exit `0`.
- Exact result fields: `storyCount: 9`; `badStories: []`; `checklistMissing: []`; `unexpectedLocalSourcePaths: []`; `leakedDisallowedLocalSources: []`; `unresolvedAdrShorthands: []`; `failures: []`.
- Every emitted boolean check was `true`, including `startsUntitled`, all required sections, both `Seam confirmation:` markers, checklist mode and items, story conformance, source policy, and ADR resolution.
- Extraction result: exit `0`; `localSourcePaths` exactly `docs/FOUNDATIONS.md`, `docs/compiler-contract.md`, `docs/prompt-template.md`, and `docs/validation-rule-inventory.md`; `adrShorthands: []`; `resolvedAdrPaths: []`; `unresolvedAdrShorthands: []`.

## Sequence-comment verification

- Simulated `#1001`: exit `0`; exact helper result `{"exactMatches":1,"expectedExactly":1,"verified":true}`.
- Simulated `#1002`: exit `0`; exact helper result `{"exactMatches":1,"expectedExactly":1,"verified":true}`.
- Each simulated issue had one comment whose body was byte-identical to `sequence-comment.md` after the expected command-line final-newline normalization.

## Fixed findings during deterministic checking

- Initial body validation showed that the draft checklist prose did not use the eight canonical item keys. Both bodies were corrected to map every emitted key; the final results above are green.
- PRD B initially left the external-LLM mapping without a named PRD-section pointer. It was corrected to point to Solution and Testing Decisions; the final result is green.
- The first simulated comment fixture retained a terminal newline while the helper's command-line expected body did not, producing `exactMatches: 0`. The fixture was corrected to apply the expected final-newline normalization; both independent final verifications returned exactly one match.

## Cleanup

- Temporary policy files `policy-a.json` and `policy-b.json` were removed with `apply_patch` after validation.
- No simulated tracker-response files were created; the helper received generated JSON through standard input.
