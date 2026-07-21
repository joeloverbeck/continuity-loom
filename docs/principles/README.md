# Continuity Loom — Foundational Principles

Status: active index — constitution-layer authority order and conformance rule
Authority: support index for `docs/principles/FOUNDATIONS.md`

This folder is Continuity Loom's constitution layer. Documents here state the
standing product commitments that every PRD, implementation issue, living
specification, ADR, and code change must respect.

## Document Set

| Document | Owns |
|---|---|
| [`FOUNDATIONS.md`](./FOUNDATIONS.md) | Product identity, continuity authority, prompt-compilation doctrine, validation doctrine, workflow doctrine, and the future-work alignment checklist. |

`FOUNDATIONS.md` is the repository's highest substantive authority. This index
routes readers to it; it does not override or restate the constitution.

## Conformance Rule

Every PRD and groomed implementation issue must name the applicable principle
sections and affirm that the proposal does not contradict them. A deliberate
exception requires an explicit constitutional amendment under
[`FOUNDATIONS.md` §1.1](./FOUNDATIONS.md#11-amendment-procedure-and-precedence)
before dependent behavior is implemented.

Principles are cited rather than copied into downstream artifacts. Living
specifications translate them into precise current contracts under
[`docs/specs/`](../specs/); PRDs and issues consume those contracts rather than
creating parallel authority.

## Repository Authority Order

When repository documents conflict:

1. [`docs/principles/FOUNDATIONS.md`](./FOUNDATIONS.md) governs substantive
   product commitments.
2. The applicable living domain specification under [`docs/specs/`](../specs/)
   governs the precise current contract for its surface.
3. ADRs under [`docs/adr/`](../adr/) record durable architectural decisions and
   must conform to both principles and applicable specifications.
4. Support indexes, guides, reports, PRDs, implementation issues, and code must
   align upward; none silently overrides a higher layer.

[`docs/ACTIVE-DOCS.md`](../ACTIVE-DOCS.md) is the repository-wide routing
registry. It identifies the active authority for each surface but cannot
override this order.

## Related Material

- [Active Docs Map](../ACTIVE-DOCS.md) — repository-wide authority routing.
- [Living Specifications](../specs/README.md) — precise current behavioral and
  assurance contracts.
- [Architectural decisions](../adr/) — durable decisions and trade-offs.
