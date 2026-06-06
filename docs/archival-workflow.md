# Archival Workflow

Use this as the canonical archival policy for completed, rejected, deferred, or superseded repository work products.

This policy covers tickets, specs, completed requirements sets, brainstorming docs, and reports. It does not authorize archiving active canonical docs such as `docs/FOUNDATIONS.md`, `docs/compiler-contract.md`, `docs/prompt-template.md`, `docs/prompt-template-rationale.md`, `docs/story-record-schema.md`, `docs/stress-suite.md`, `docs/stress-coverage-matrix.md`, `docs/demo-blocker-recipes.md`, `docs/user-guide.md`, `README.md`, `AGENTS.md`, or `CLAUDE.md` unless a later transition audit or replacement spec explicitly says so.

## Archive destinations

Use these destinations:

- active tickets → `archive/tickets/`
- active specs → `archive/specs/`
- completed requirements sets → `archive/<requirements-folder-name>/`
  - example: `docs/requirements-version-1/IMPLEMENTATION-ORDER.md` → `archive/requirements-version-1/IMPLEMENTATION-ORDER.md`
- brainstorming docs → `archive/brainstorming/`
- reports → `archive/reports/`

Preserve filenames unless there is a collision.

## Required steps

1. Confirm the item is no longer active authority.
   - If the item is a canonical active doc, do not archive it just because a phase completed.
   - If the item is a completed requirements folder, archive the folder contents as historical planning material instead of editing old upload/provenance references.
   - If an active doc still points at the item as active authority, correct the active doc first.
2. For completed tickets and active implementation specs, edit the document before moving it:
   - mark final status at the top as one of:
     - `**Status**: ✅ COMPLETED` or `**Status**: COMPLETED`
     - `**Status**: ❌ REJECTED` or `**Status**: REJECTED`
     - `**Status**: ⏸️ DEFERRED` or `**Status**: DEFERRED`
     - `**Status**: 🚫 NOT IMPLEMENTED` or `**Status**: NOT IMPLEMENTED`
   - for completed implementation work, add an `Outcome` section at the bottom with:
     - completion date;
     - what actually changed;
     - deviations from original plan;
     - verification results.
3. For completed requirements folders, preserve the files as historical records unless the transition audit explicitly requires a pre-archive edit.
   - Do not normalize old uploaded-source filenames inside archived requirements docs merely for polish.
   - Normalize stale upload filenames in active docs instead.
4. For reports, prefer preserving historical report text as-is unless the report itself was an active implementation plan that needs final status/outcome metadata.
5. Ensure the destination archive directory exists:

   ```bash
   mkdir -p archive/tickets archive/specs archive/brainstorming archive/reports
   ```

   Create completed-requirements destinations as needed, for example:

   ```bash
   mkdir -p archive/requirements-version-1
   ```

6. Move the document or folder entry.
   - Prefer `git mv <source> <destination>` when the source is tracked.
   - Detect tracked files with `git ls-files --error-unmatch <source>`.
   - If the file is untracked, use plain `mv`.
7. If there is a filename collision, choose an explicit non-colliding destination filename.
8. Confirm the original active path no longer exists.
9. Review active docs and tickets for stale references to the old active path.
   - Active references must point to the new archive path if historical provenance is needed.
   - Otherwise, remove the reference or replace it with the active canonical path.
10. Do not edit archived historical implementation artifacts after the move unless a later correction is required for accurate provenance, security, or legal reasons.

## Post-archive rule

Archived files are historical evidence. They are not active implementation instructions unless an active doc or ticket explicitly names a specific archived file and explains why it matters.
