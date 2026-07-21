# Checks

- Read the pinned baseline `SKILL.md` plus its explicit `DEEPENING.md` and `DESIGN-IT-TWICE.md` references.
- Confirmed all frozen input blob hashes with `git hash-object`.
- Inspected both pinned parsers in full, the pinned strict-output primitives, direct core/server callers, and focused parser/property tests.
- Covered the rubric with two materially different seam shapes, an explicit recommendation based on depth/locality, platform-free and deterministic constraints, syntax-versus-domain ownership, a concrete TypeScript interface, and profile-specific failure tests.
- Preserved strict failures and existing result asymmetries; proposed no compatibility aliases. No candidate/decontamination analysis was inspected and no target or source code was edited.
