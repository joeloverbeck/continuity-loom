# Two-PRD program

## PRD A: User-Supplied Candidate Intake

- Add `Write or paste candidate` only when deterministic prompt preview is
  ready; provider readiness does not gate this path.
- It starts one empty, ephemeral user-supplied Draft Candidate and makes no
  OpenRouter call.
- Generated and user-supplied candidates share edit, discard, replace, and
  accept behavior; non-empty drafts require loss-prevention confirmation before
  refresh or replacement.
- Acceptance uses one discriminated provenance union: OpenRouter entries keep
  actual provider/model/settings; user-supplied entries never fabricate those
  fields and retain only source plus applicable compiler versions.
- Existing rows migrate transactionally and idempotently to explicit OpenRouter
  provenance. Migration failure leaves the project intact and stops opening.
- Accepted prose remains output, never prompt or canon authority.
- Confirmed seams: Candidate component; accepted route; project-open migration;
  archive/export component; localhost production browser; root gates.
- Label posture: enhancement plus ready-for-agent.

## PRD B: Prompt-Facing Full Labels

- Remove browse-label truncation from every prompt-facing compiler surface while
  preserving compact browse UI labels.
- Derive prompt-facing labels from complete record payloads in pure core code;
  do not recover them from accepted prose or hidden state.
- Cover Prose ordering, grounded Ideation, Record Hygiene, Segment
  Reconciliation, references, and stubs.
- Keep compiler output deterministic and validation fail-closed.
- Confirmed seams: pure label projection matrix and compiler goldens; route
  compile tests; prompt inspector/UI checks; localhost production browser; root
  gates.
- Label posture: bug plus ready-for-agent.

Program order is priority, not dependency: publish A first because it unblocks
external trial prose, then B. Both are independently implementable. After both
issue numbers exist, add one sequence comment to each issue naming both numbers,
titles, order, and the fact that ordering is not a technical dependency.

