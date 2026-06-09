---
name: ticket-series
description: Use in Continuity Loom for goals that implement a glob or series of tickets from tickets/ in dependency order, align each ticket with active docs under docs/ except docs/triage/, verify acceptance, archive completed tickets/specs, repair active references, and commit completed work one ticket at a time.
---

# Ticket Series

Use this skill when the user asks to implement a Continuity Loom ticket family,
for example `tickets/SPEC012DURCHAREM-*`, with or without a referenced active
spec. Work from the live checkout, not remembered state.

## Inputs

- Ticket selector: usually a glob under `tickets/`.
- Reference spec selector: if provided, usually under `specs/`.
- Explicit sequencing, verification, archival, commit, or no-commit constraints
  from the prompt.

If a selector is ambiguous, inspect matching paths and choose only when the repo
context makes the intended family clear. Ask before proceeding if multiple
families plausibly match.

## Startup

1. Read the repository guidance and authority map:
   - `AGENTS.md`
   - `docs/ACTIVE-DOCS.md`
   - `docs/FOUNDATIONS.md`
   - `tickets/README.md`
   - `docs/archival-workflow.md`
2. Resolve the ticket and spec selectors to concrete paths.
3. Read the resolved tickets and active spec, if any. Ignore `docs/triage/**`
   unless the user or an active ticket explicitly names a triage file as
   evidence.
4. Select the active domain docs from `docs/ACTIVE-DOCS.md` for the touched
   surface. Common anchors:
   - prompt/compiler changes: `docs/compiler-contract.md`,
     `docs/prompt-template.md`, `docs/prompt-template-rationale.md`
   - story record or generation brief data: `docs/story-record-schema.md`
   - validation or hard-fail behavior: `docs/stress-suite.md`,
     `docs/stress-coverage-matrix.md`, `docs/demo-blocker-recipes.md`
   - user-facing behavior: `docs/user-guide.md`
5. Determine dependency order from explicit dependencies, numbering, ticket
   prose, spec sequencing, and current code.
6. Check `git status --short` before editing. Preserve unrelated user changes.

## Alignment Rules

- `docs/FOUNDATIONS.md` is the design gate. Reassess any ticket that touches
  runtime behavior, stored data, prompt compilation, validation, generation,
  accepted segments, OpenRouter, local-first ownership, or LLM-assistance
  surfaces against the relevant FOUNDATIONS sections before implementation.
- Do not treat archived material as active guidance unless an active ticket,
  spec, or doc explicitly points to a specific archived file.
- Do not revive completed v1 requirements or archived specs as backlog.
- If current code and the ticket disagree, correct the ticket/spec first when
  the correction is material.
- Do not add compatibility aliases, duplicate authority paths, or shims unless
  an active spec deliberately requires them.

## Per-Ticket Loop

Complete exactly one ticket before starting the next.

For each ticket:

1. Reassess assumptions against current code, `FOUNDATIONS.md`, selected domain
   docs, and package ownership.
2. Identify the narrow implementation surface and exact acceptance criteria.
3. Make the minimal code, doc, and test changes that satisfy the ticket while
   preserving package boundaries:
   - `packages/core` stays platform-free and must not import `fastify`,
     `react`, `vite`, or `node:*`.
   - server and dev/prod launch paths must bind `127.0.0.1` only.
4. Run targeted checks that prove the ticket. Use root gates when the touched
   surface or ticket requires broader proof:

```sh
npm run lint
npm run typecheck
npm test
npm run build
```

5. For browser-facing or request-shape-sensitive work, add a real localhost or
   browser smoke instead of relying only on unit tests.
6. Update the ticket with final status and an `Outcome` section following
   `docs/archival-workflow.md`.
7. Archive the ticket:
   - Create `archive/tickets/` if absent.
   - Use `git mv` for tracked tickets.
   - Use plain `mv` only for untracked tickets.
   - Confirm the original `tickets/` path is gone.
8. Sweep active docs, specs, ledgers, indexes, and tickets for stale live ticket
   paths. Update references that should now point to `archive/tickets/`.
9. Review the diff for unrelated changes.
10. Commit the completed ticket work before moving on unless the user explicitly
    asked not to commit. Use a concise message naming the ticket.

Do not advance on plausible implementation alone. Acceptance criteria must pass,
or the ticket must be explicitly blocked with evidence.

## Final Spec Closeout

After all tickets in the series are complete:

1. Re-read the reference spec, if any, and verify every acceptance item is done,
   rejected, deferred, or intentionally not implemented.
2. Run the relevant final gates. For full family completion, prefer the root
   commands:

```sh
npm run lint
npm run typecheck
npm test
npm run build
```

3. Update the spec with final status and an `Outcome` section following
   `docs/archival-workflow.md`.
4. Archive completed active specs to `archive/specs/`, using `git mv` when
   tracked.
5. Repair active references and implementation-order/index surfaces found in the
   repo. Do not edit archived historical artifacts after the move unless needed
   for accurate provenance, security, or legal reasons.
6. Run a final status/diff check and commit the spec archive/truthing work
   unless the user explicitly asked not to commit.
7. If a `/goal` is active, mark it complete only after implementation,
   verification, ticket archives, spec archive or documented reason it remains
   active, reference repair, and required commits are done.

## Reporting

Final responses must include:

- Tickets completed and archived.
- Spec archived, or why no spec was archived.
- Verification commands actually run.
- Any checks not run and why.
- Any unrelated pre-existing changes left untouched.
