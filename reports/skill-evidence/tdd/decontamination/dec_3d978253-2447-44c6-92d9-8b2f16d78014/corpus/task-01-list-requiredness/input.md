# Historical task: Required-list marker clarification (#114)

Clarify requiredness for list fields in the generic Record Editor and CAST MEMBER editor. A required property may lawfully be an empty array; the UI must distinguish structural presence from a nonzero item minimum.

Constraints and acceptance criteria:

- Preserve existing schemas, defaults, validation, serialization, and prompt behavior.
- Existing create/edit entry points and list controls remain available.
- Lists that accept zero items expose adjacent, programmatically associated "may be empty" guidance; a registered nonzero minimum exposes the actual minimum instead.
- Lawful empty lists save, reload, serialize, export, and round-trip unchanged.
- Do not invent default items, require role tags, add warnings, or change scalar required markers.
- Cover empty and nonempty lists, a true-minimum control, accessible descriptions, add/remove actions, save, and reload.
- Canonical gates are `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.
