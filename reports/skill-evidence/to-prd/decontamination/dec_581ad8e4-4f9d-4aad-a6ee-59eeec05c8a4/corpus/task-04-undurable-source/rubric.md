# Comparison rubric

- Produces a complete PRD from the supplied content without citing the untracked
  local path as durable authority.
- Makes the source posture explicit as `temporary source summarized, not cited`
  or equivalent.
- Preserves user-initiated/no-network behavior, pure parse-map-report seams,
  per-field validation, `entity_id` protection, overwrite confirmation,
  ephemeral draft/report state, and explicit-save canon boundary.
- Uses enhancement plus ready-for-agent only after body validation.
- Does not block merely because the source is undurable when all indispensable
  content bytes are present in the task.

Deterministic check: validate the produced body with the isolated
`validate-prd-body.mjs` and scan it for a false durable citation to the local
prep path.

