# Continuity Loom — Living Specifications

Status: active index — current normative product and assurance specifications
Authority: support index for the domain authorities registered in `docs/ACTIVE-DOCS.md`

This folder contains Continuity Loom's living specifications: precise,
implementation-consumed contracts for current behavior, schemas, prompts,
validation, regression cases, and development assurance. They are downstream
of [`docs/principles/`](../principles/) and are consumed by PRDs and
implementation issues.

These files are not PRD-like work proposals and do not revive the retired root
`specs/` and `tickets/` workflow. New work still enters through GitHub Issues.
Completed historical implementation specs remain under `archive/specs/`.

## Specification Set

| Document | Owns |
|---|---|
| [`compiler-contract.md`](./compiler-contract.md) | Deterministic compiler mapping, section order, empty states, and the validation bridge. |
| [`prompt-template.md`](./prompt-template.md) | Universal prose prompt text and placeholders. |
| [`cast-member-draft-prompt-template.md`](./cast-member-draft-prompt-template.md) | Static record-free Cast Member dossier drafting prompt and output contract. |
| [`ideation-prompt-template.md`](./ideation-prompt-template.md) | Grounded ideation request, slot, and output contract. |
| [`story-record-hygiene-prompt-template.md`](./story-record-hygiene-prompt-template.md) | Story-record hygiene source, comparison, and output contract. |
| [`segment-reconciliation-prompt-template.md`](./segment-reconciliation-prompt-template.md) | Segment Reconciliation source profile, output contract, and quarantine rules. |
| [`story-record-schema.md`](./story-record-schema.md) | Story-record and generation-time brief schemas and record taxonomy. |
| [`validation-rule-inventory.md`](./validation-rule-inventory.md) | Implemented validation diagnostic namespace and severities. |
| [`stress-suite.md`](./stress-suite.md) | Canonical compiler, validation, prompt, and assistance stress cases. |
| [`stress-coverage-matrix.md`](./stress-coverage-matrix.md) | Coverage mapping from stress cases to implemented capabilities. |
| [`robustness-testing.md`](./robustness-testing.md) | Mutation, coverage, property, metamorphic, and golden assurance policy. |

## Maintenance Rule

The same-change rules inside each specification remain binding. A PRD or issue
that changes a governed surface must update every affected specification,
implementation surface, version pin, test, matrix, or guide named by those
rules in the same revision.

[`docs/ACTIVE-DOCS.md`](../ACTIVE-DOCS.md) remains the registry that identifies
which specification governs each surface. Supporting rationale and operational
guides stay at `docs/` root so this folder contains normative contracts rather
than explanations or procedures.
