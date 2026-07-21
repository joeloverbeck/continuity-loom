---
name: codebase-design
description: Shared vocabulary for designing deep modules. Use when the user wants to design or improve a module's interface, find deepening opportunities, decide where a seam goes, make code more testable or AI-navigable, or when another skill needs the deep-module vocabulary.
---

# Codebase Design

Design **deep modules**: substantial behavior behind a small interface, placed at
a clean seam and testable through that interface. The aim is leverage for callers,
locality for maintainers, and a stable test surface.

## Honor repository authorities

Before recommending a seam or interface inside a repository:

- If `docs/agents/domain.md` exists, follow it to the relevant domain glossary.
  Otherwise read `CONTEXT-MAP.md` and its mapped `CONTEXT.md` files when present,
  falling back to root `CONTEXT.md`.
- Read `docs/principles/README.md` when present, then the principles and ADRs
  relevant to the module.
- State when the design contradicts an authority and why reopening it may be
  justified. Also state when an authority already anticipates the proposed seam.

Use the repository's domain terms alongside the architecture vocabulary below.

## Vocabulary

Use these terms exactly. Do not substitute *component*, *service*, *API*, or
*boundary*.

**Module** — anything with an interface and an implementation: a function, class,
package, or tier-spanning slice.

**Interface** — everything a caller must know to use a module correctly, including
the type surface, invariants, ordering, error modes, configuration, and performance
characteristics.

**Implementation** — the code and knowledge hidden inside a module. Use
**adapter** instead when the role at a seam is the subject.

**Depth** — leverage at the interface. A deep module gives callers substantial
behavior through a small interface; a shallow module exposes nearly as much
complexity as it hides.

**Seam** — a place where behavior can change without editing the caller; the
location of a module's interface.

**Adapter** — a concrete implementation that satisfies an interface at a seam.

**Leverage** — the capability callers gain per unit of interface they must learn.

**Locality** — the concentration of change, bugs, knowledge, and verification in
one owner instead of across callers.

## Design principles

- **Depth belongs to the interface.** A module may contain private internal seams,
  but callers should not learn them merely because implementation tests use them.
- **Apply the deletion test.** If deleting the module makes complexity disappear,
  it was pass-through indirection. If the complexity returns across callers, the
  module was earning its keep.
- **The interface is the test surface.** Callers and tests cross the same seam.
  Prefer accepted dependencies, returned results, and a small surface; testing past
  the interface usually signals the wrong module shape.
- **Separate seam placement from interface design.** Decide both what knowledge is
  hidden and where behavior is allowed to vary.

When shaping an interface, ask whether it can expose fewer entry points, simpler
inputs, and fewer caller-visible invariants while hiding more coherent behavior.
Do not reward implementation size; depth means leverage, not an interface-to-lines
ratio. Do not reduce *interface* to the TypeScript keyword or public method list,
and use *seam* rather than the overloaded DDD term *boundary*.

## Load detailed guidance when relevant

- Before deepening a cluster that involves I/O, a database, a network/process
  crossing, a third party, migrations, file formats, or versioned contracts, read
  [DEEPENING.md](DEEPENING.md). It owns the dependency categories, adapter and
  historical-contract thresholds, seam discipline, and replace-don't-layer tests.
- When the user wants several alternative interfaces for a chosen candidate, read
  [DESIGN-IT-TWICE.md](DESIGN-IT-TWICE.md) and run its independent-design comparison.
