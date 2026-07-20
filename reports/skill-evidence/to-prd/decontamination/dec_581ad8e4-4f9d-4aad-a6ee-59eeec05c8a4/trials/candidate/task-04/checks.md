# Checks

## Body validation

- Validator: live `.claude/skills/to-prd/scripts/validate-prd-body.mjs`, used only for deterministic body validation as directed.
- Reusable task-local policy: `expectChecklist: true`; four durable approved sources; the undurable prep path disallowed.
- First run: exit 1. The body had the checklist section but used paraphrased item labels, so all eight canonical checklist item-name checks were missing.
- Repair: mapped the same substance under the eight canonical item names emitted by the validator.
- Final run: exit 0; all template, seam-marker, checklist, source-policy, ADR, and story-form checks passed; 16 stories; zero failures.
- Extraction run: exit 0; sources were exactly `docs/FOUNDATIONS.md`, `docs/compiler-contract.md`, `docs/story-record-schema.md`, and `docs/user-guide.md`; no ADR shorthand.

## Staged durability ledger at `origin/main`

| Path | Clean | Tracked | Visible on publication ref | Content matches ref |
|---|---|---|---|---|
| `docs/FOUNDATIONS.md` | yes | yes | yes | yes |
| `docs/compiler-contract.md` | yes | yes | yes | yes |
| `docs/story-record-schema.md` | yes | yes | yes | yes |
| `docs/user-guide.md` | yes | yes | yes | yes |

Each cell was proven with the candidate-prescribed direct Git commands: path-scoped porcelain status, `git ls-files --error-unmatch`, `git ls-tree -r --name-only origin/main`, and `git diff --quiet origin/main`.

## False-citation and artifact checks

- False durable-citation scan over `prd-body.md` and `response.md`: `rg` found no `reports/`, `input.md`, task source-directory, or corpus-path reference (exit 1, no matches).
- Response/body identity: the content after the `Body:` marker in `response.md` is byte-identical to `prd-body.md` (`diff` exit 0).
- Tracker metadata/readback, published-body validation, and published durability rerun: intentionally not run because this is a no-network, no-publication simulation.
- Task-local policy: removed after validation.
- Network access and tracker/product mutations: none.
