# Author-Focused Ideation package

Problem: grounded Ideation has no bounded way for an author to say what kind of
possibility they want next. Authors must accept a generic slate or edit the
compiled prompt outside the app, which breaks reproducibility.

Agreed solution:

- Add one optional session-only `Author focus` field to Ideate, maximum 500
  characters after normalization.
- The field is request context, not canon, a story record, accepted prose, or a
  hidden continuity source.
- Normalize line endings and surrounding whitespace deterministically. Reject
  over-limit input before send; blank input is equivalent to omission.
- Render the value once in a clearly delimited `AUTHOR FOCUS` prompt section
  after the grounded source material and before output instructions.
- Escape delimiters so the value cannot create a second prompt section or alter
  the output contract.
- Include the normalized presence/value in the request fingerprint so stale
  preview/send mismatches fail closed.
- Preserve the existing six-slot Ideation taxonomy and assignment rules. The
  focus may steer content within slots but may not add, remove, rename, or choose
  slots.
- Retain the focus across regeneration in the same mounted session; clear it on
  navigation/remount. Never write it to project storage, browser storage, logs,
  accepted metadata, records, or exports.
- Show author-facing copy that the focus applies to the next slate only and does
  not become canon.

Confirmed testing seams:

1. Pure core request/rendering and golden tests for normalization, exact section
   placement, escaping, blank behavior, fingerprinting, and unchanged slots.
2. Existing server Ideation compile/send route tests for stale fingerprints,
   over-limit rejection, reconstruction, and zero transport before validation.
3. Ideate component tests for accessibility, count, preview freshness,
   next-slate wording, regeneration retention, and remount reset.
4. Production localhost browser smoke for enter, preview, send, regenerate, and
   remount behavior.
5. Root lint, typecheck, test, and build gates.

Publication posture: one enhancement PRD; all product decisions and testing
seams are settled. `ready-for-agent` is appropriate after body validation.

