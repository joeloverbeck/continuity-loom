# Local PRD prep

Source status: this prep exists only as an untracked local file. It is absent
from `origin/main`, so no publication-ref blob or stable tracker citation exists.
Its product decisions may be synthesized, but the local path must not be cited
as durable authority.

Problem: the Cast Member editor exposes a large, structured dossier schema but
offers no bounded way to draft that dossier with an external LLM and safely
bring useful fields back without automatic canon mutation.

Agreed solution:

- Add a static, versioned, record-free Cast Member drafting prompt that users
  explicitly copy to the clipboard. Copying is local and makes no provider call.
- The external response is JSON with registered dossier fields plus declared
  uncertainty and invention lists; it must omit `entity_id` and unknown keys.
- Add a local paste/import flow in create and edit modes. Pure core functions
  extract a fenced or prose-wrapped JSON object, parse it, validate each field,
  map valid fields, and report skipped fields with reasons.
- Import prefills only present valid fields. It never overwrites `entity_id`.
  Differing non-empty fields require exact-field confirmation; cancel is
  lossless.
- The report separates filled, skipped, and needs-author items. Everything
  remains an unsaved, ephemeral form draft until the author explicitly saves.
- No pasted response, report, or unsaved draft enters project storage, browser
  storage, prompt context, migration, export, logs, or provenance surfaces.
- Confirmed seams: static prompt/template core tests; pure parse/map/report table
  tests; editor component create/edit/linked modes; overwrite and recovery
  sequences; production-localhost browser; root gates.

Publication posture: one enhancement PRD. All product decisions and seams are
settled; `ready-for-agent` is appropriate after validation.

