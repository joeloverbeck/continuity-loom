## Source and coordination

Issue #188
predecessor of PRD #200; unblocks the compiler slice

This slice implements the storage key-shape decision carried by its source tracker item. It is not a child of PRD #200 and adds no scene beat annotation behavior of its own. It must land before the PRD #200 family starts; the compiler slice is the one that cannot proceed without it, because it reads scene beat annotation data by key.

## What to build

One normalized storage key form for scene beat annotation data in the local project store, landed on its own so every later slice reads and writes a single key shape.

- Key-shape authority lives in `@loom/core` and stays framework- and platform-free: no `fastify`, `react`, `vite`, or `node:` builtins cross that boundary.
- Normalization of an existing store runs in the `@loom/server` on-open project-store migration pipeline, alongside the legacy generation-session key handling that pipeline already performs. The user opens a project and the store is normalized in place, with no export/import round trip and no separate migration command.
- The store's declared schema version and its existing `migration-required` and `ok` compatibility outcomes remain the single gate for whether an opened store needs work. This slice adds no second compatibility path and no alternate open route.
- Normalization is a mechanical key rename. It preserves every annotation value, its association with its owning record, and its order; it never creates, drops, merges, resolves, or rewords stored content.
- No prompt section, no compiler-contract change, no validation blocker or warning, and no UI. Scene beat annotation storage semantics, prompt compilation, and editing are owned by the PRD #200 slices.

Handoffs:

- "Compile scene beat annotations into the prose prompt" consumes the normalized key form and owns every prompt-facing change, including the matching `docs/specs/compiler-contract.md` update in that same change.
- "Store scene beat annotations on the story record" owns the record-level field definition and the matching `docs/specs/story-record-schema.md` update. This slice defines only how that data is keyed in the store, not what the field means.
- "Edit scene beat annotations in the scene editor" owns every browser-visible surface. This slice has none, so the browser-visible guidance checklist is not applicable to it.

Test seam: project-store open behavior tests in `@loom/server` covering a pre-normalization store, an already-normalized store, and a store holding no scene beat annotation data at all; plus the existing `@loom/core` import-boundary test proving the key-shape authority stays pure.

## User stories covered

N/A - the source tracker item defines no user stories at all, and this slice ships no user-facing behavior change. Every scene beat annotation story stays with the PRD #200 slices.

## Acceptance criteria

- [ ] Opening a project store that holds scene beat annotation data under a pre-normalization key form returns the same annotations under the single normalized key form, with none dropped, reordered, or reworded, and with every annotation still attached to its original owning record.
- [ ] Every write path persists scene beat annotation data under the normalized key form only: no read-time alias, dual-read fallback, or compatibility shim for the pre-normalization form survives in shipped code, and re-opening a store this build already normalized performs no further normalization and reports `ok` compatibility.
- [ ] For an already-normalized project, compiled prompt output, validation blockers and warnings, accepted prose, and every browser-visible surface are unchanged: this slice adds, removes, or rewords no prompt section, placeholder, diagnostic, or UI control.

## Blocked by

None - can start immediately

## Principles

- `docs/principles/FOUNDATIONS.md` §24 (local-first and user-owned data): project data stays local, portable, and inspectable. Normalization happens in place on open, preserves integrity and backup/export behavior, and never moves author data behind a new boundary.
- `docs/principles/FOUNDATIONS.md` §8 (deterministic prompt compilation): a storage key is not a prompt placeholder, so this slice changes no compiled prompt and owes no compiler-contract edit. The compiler slice makes its placeholder and contract change together, as that section requires.
- `docs/specs/story-record-schema.md` remains the record-shape authority. This slice renames no field and changes no requiredness, so it leaves that spec untouched.
- Repository conventions in `CLAUDE.md`: keep the change narrow and aligned with package boundaries, and introduce no backwards-compatibility alias, shim, or duplicate authority path. Exactly one key form exists once this slice lands.

No deliberate exception to governing doctrine is claimed.
