# Checks

## Deterministic body validation

Command:

```sh
node .claude/skills/to-prd/scripts/validate-prd-body.mjs reports/skill-evidence/to-prd/decontamination/dec_581ad8e4-4f9d-4aad-a6ee-59eeec05c8a4/trials/candidate/task-02/prd-body.md --policy-file reports/skill-evidence/to-prd/decontamination/dec_581ad8e4-4f9d-4aad-a6ee-59eeec05c8a4/trials/candidate/task-02/policy.json
```

First run: exit 1. All structural, story, source-policy, ADR, and seam checks passed, but `hasChecklistItems` failed because the draft used descriptive checklist labels rather than the eight canonical item strings. The draft was repaired to map the exact emitted checklist items.

Final run: exit 0.

- `startsUntitled`: true
- All nine required sections: true
- Testing and Further Notes `Seam confirmation:` markers: true
- `checklistModeMatches`, `hasChecklist`, `hasChecklistItems`: true
- `storyCount`: 13; `badStories`: `[]`
- `hasOnlyApprovedLocalSources`, `hasNoDisallowedLocalSources`: true
- `hasResolvedAdrShorthands`: true; no ADR shorthand emitted
- `checklistMissing`, `unexpectedLocalSourcePaths`, `leakedDisallowedLocalSources`, `unresolvedAdrShorthands`, `failures`: `[]`

The final validator emitted these body citations: `docs/FOUNDATIONS.md`, `docs/compiler-contract.md`, `docs/prompt-template-rationale.md`, `docs/prompt-template.md`, `docs/story-record-schema.md`, `docs/user-guide.md`, and `docs/validation-rule-inventory.md`.

## Direct source-durability gate

Publication ref: `origin/main` at `f9ed9a4a9f5bb497793605951e099ee0e40dfcac`.

| Path | Clean | Tracked | Visible on publication ref | Content matches ref |
|---|---|---|---|---|
| `docs/FOUNDATIONS.md` | yes | yes | yes | yes |
| `docs/compiler-contract.md` | yes | yes | yes | yes |
| `docs/prompt-template-rationale.md` | yes | yes | yes | yes |
| `docs/prompt-template.md` | yes | yes | yes | yes |
| `docs/story-record-schema.md` | yes | yes | yes | yes |
| `docs/user-guide.md` | yes | yes | yes | yes |
| `docs/validation-rule-inventory.md` | yes | yes | yes | yes |

Checks used per path: `git status --porcelain -- <path>`, `git ls-files --error-unmatch <path>`, `git ls-tree -r --name-only origin/main -- <path>`, and `git diff --quiet origin/main -- <path>`.

## Simulation boundaries

- No network or tracker command was run.
- Exact-title duplicate search, live label-existence proof, issue creation, metadata/body readback, published-body identity comparison, and published durability replay are not representable in this explicitly offline simulation and are not claimed.
- No product code or governing document was edited.
- Branch observed during validation: `main`.
- The task-local validator policy was reused for the repair run and removed after validation.
- Final task-directory listing returned exactly `checks.md`, `notes.md`, `prd-body.md`, and `response.md`; scoped `git status` showed exactly those four intentional untracked artifacts.
