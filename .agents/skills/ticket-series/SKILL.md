---
name: ticket-series
description: Use in Continuity Loom for goals that implement, close out, or archive one ticket, a capstone ticket, or a glob/series of tickets from tickets/ in dependency order; align work with active docs under docs/ except triage/, verify acceptance or amended scope honestly, archive completed tickets/specs, repair active references, and commit completed work one ticket at a time.
---

# Ticket Series

Use this skill when the user asks to implement or close out Continuity Loom
tickets. The target may be one ticket, a capstone ticket, or a ticket family
such as `tickets/SPEC012DURCHAREM-*`, with or without a referenced active spec.
Work from the live checkout, not remembered state.

## Inputs

- Ticket selector: a single ticket path, capstone ticket, or glob under
  `tickets/`.
- Reference spec selector: if provided, usually under `specs/`.
- Explicit sequencing, verification, archival, commit, or no-commit constraints
  from the prompt.

If a selector is ambiguous, inspect matching paths and choose only when the repo
context makes the intended ticket or family clear. Ask before proceeding if
multiple targets plausibly match.

## Startup

1. Read the repository guidance and authority map:
   - `AGENTS.md`
   - `docs/ACTIVE-DOCS.md`
   - `docs/FOUNDATIONS.md`
   - `tickets/README.md`
   - `docs/archival-workflow.md`
2. Resolve the ticket and spec selectors to concrete paths.
3. Read the resolved tickets and active spec, if any. Ignore `triage/**`
   unless the user or an active ticket explicitly names a triage file as
   evidence.
   If `docs/ACTIVE-DOCS.md` says there are no active tickets or specs but the
   user-named selectors resolve to live files, treat those live files as the
   current task authority. Note the mismatch only when it affects archive or
   reference closeout.
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

Complete exactly one ticket before starting the next, unless active spec or
ticket authority explicitly requires multiple tickets to land in the same
revision. For a same-revision exception, finish and archive the coupled tickets
together, record the coupling reason in each `Outcome`, and use a commit message
that names every coupled ticket.

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

   When a ticket changes `packages/core` and you run direct server or web tests
   that import the built `@loom/core` package, rebuild the core workspace first
   or prefer a root lane that rebuilds it. If a direct package test fails with
   stale compiler/template/version metadata or other behavior that contradicts
   the current source, rebuild the relevant workspace output and rerun the test
   before treating the failure as a product regression.

   If a broad gate fails only from timeout or resource contention, and the
   failure is not an assertion, type, lint, build, or product error, rerun the
   affected targeted tests and then rerun the broad gate once before treating it
   as a blocker. If a broad gate fails in an unrelated assertion outside the
   touched surface after equivalent broad coverage already passed on the current
   task state, rerun the failing file or filter once and then rerun the broad
   gate once. If a broad gate fails because it traverses unrelated generated
   output, mutation-test sandboxes, or sibling worktrees outside the task scope,
   verify the failing paths are unrelated, run the owned package/path-scoped
   equivalent checks, leave the unrelated files untouched, and record the broad
   gate caveat in the ticket `Outcome` and final response. Treat a repeat
   in-scope failure as a blocker. Report the original failure, the targeted rerun
   or scoped substitute, and the broad rerun outcome when one is applicable. If
   you fix an unrelated assertion or brittle test exposed by a broad gate so the
   current gate can pass, classify it as an incidental gate fix. Prefer a
   separate commit when practical; if it lands in the ticket commit, name it
   explicitly in the ticket `Outcome` and final response.

   If a pre-existing assertion spans behavior deliberately split across later
   tickets, do not weaken it to hide a real failure. Either use the
   same-revision exception when the intermediate state cannot be made coherent,
   or, when the active ticket explicitly scopes the later behavior out, keep a
   narrower assertion that still proves the current ticket invariant. Record the
   temporary narrowing in the ticket `Outcome`, and restore or strengthen the
   broader coverage in the dependent ticket before closing the series.
5. For browser-facing or request-shape-sensitive work, add a real localhost or
   browser smoke instead of relying only on unit tests. Use loopback URLs only;
   record the project/path and URL used. When the smoke needs project data
   creation, mutation, deletion, or export, prefer a disposable temporary
   project under `/tmp` or another clearly non-user data path, then record that
   path and cleanup/artifact status. Restore any user or demo data changed
   during the smoke; stop browser/dev-server processes; remove transient
   artifacts such as `.playwright-cli/`; and distinguish expected setup console
   errors from product failures. When a browser automation skill such as
   Playwright is available, follow it for browser driving, prerequisite checks,
   snapshots, console review, and artifact cleanup. A later capstone or manual
   runbook may cite an earlier same-family smoke only when the earlier ticket
   outcome records the exact covered UI steps, remaining gaps are covered by
   current automated or manual proof, and the capstone outcome names any
   live-provider caveat. If you decide this smoke rule is not applicable, or
   that a narrow component/API change is sufficiently proven without a real
   localhost or browser smoke, record the rationale in the ticket `Outcome` and
   final response.
6. Before marking the ticket complete, re-read its `What to Change`,
   `Files to Touch`, `Acceptance Criteria`, and `Test Plan` sections. For each
   major surface, confirm it is fulfilled, intentionally deferred, not
   applicable, or blocked with evidence. Then update the ticket with final
   status and an `Outcome` section following `docs/archival-workflow.md`.
   Append the `Outcome` at the bottom of the ticket before moving it, after the
   existing ticket sections.

   If the user explicitly changes the closeout scope, for example by saying to
   consider a ticket finished and amend it if necessary, record that user
   direction in the ticket before archive. The amended closeout must state what
   original acceptance items were not performed, why they are no longer being
   claimed, and what verification actually supports the completed status. Do
   not mark skipped gates, floor activation, baseline flips, or required-status
   changes as passed unless they really ran and passed.
7. Archive the ticket:
   - Create `archive/tickets/` if absent.
   - Use `git mv` for tracked tickets.
   - Use plain `mv` only for untracked tickets.
   - Confirm the original `tickets/` path is gone.
8. Sweep active docs, specs, ledgers, indexes, and tickets for stale live ticket
   paths and bare ticket identifiers. Update references that should now point to
   `archive/tickets/`. Search active surfaces first; archived historical matches
   are normally preserved unless an active artifact depends on them or the
   archive needs a provenance, security, or legal correction.

   Useful sweep pattern after archiving a ticket:

   ```sh
   rg -n "tickets/TICKET-ID|TICKET-ID" docs specs tickets AGENTS.md CLAUDE.md README.md
   ```
   After repair, active references to `archive/tickets/TICKET-ID.md` are
   acceptable provenance references. Stale `tickets/TICKET-ID` paths and
   unqualified live dependency references still need correction.
9. Review the diff for unrelated changes.
10. Inspect `git diff --cached --name-status` before committing. If unrelated
    pre-existing changes are staged, unstage only those unrelated entries before
    committing the ticket. After `git mv`, stage rename/deletion pairs with a
    scoped command such as `git add -A tickets archive/tickets` when direct
    staging of the old path fails. When a ticket or spec was edited before or
    after the move, also inspect `git diff --cached --stat` or
    `git diff --cached -- <archive-path>` to confirm the status and `Outcome`
    edits are staged, not just the rename. Then re-check the cached name-status
    before committing.
11. Commit the completed ticket work before moving on unless the user explicitly
    asked not to commit. Use a concise message naming the ticket.

Do not advance on plausible implementation alone. Acceptance criteria must pass,
or the ticket must be explicitly blocked with evidence.

## Final Spec Closeout

After all tickets in the series are complete:

1. Re-read the reference spec, if any, and verify every acceptance item is done,
   rejected, deferred, or intentionally not implemented.
2. Run the relevant final gates. For full family completion, run the root
   commands below, or explicitly record in the ticket/spec outcome and final
   response why any listed command was skipped:

```sh
npm run lint
npm run typecheck
npm test
npm run build
```

   If a broad final gate fails only from timeout or resource contention, and the
   failure is not an assertion, type, lint, build, or product error, rerun the
   affected targeted tests and then rerun the broad gate once before treating it
   as a blocker. If a broad final gate fails in an unrelated assertion outside
   the touched surface after equivalent broad coverage already passed on the
   current task state, rerun the failing file or filter once and then rerun the
   broad gate once. If a broad final gate fails because it traverses unrelated
   generated output, mutation-test sandboxes, or sibling worktrees outside the
   task scope, verify the failing paths are unrelated, run the owned
   package/path-scoped equivalent checks, leave the unrelated files untouched,
   and record the broad gate caveat in the spec `Outcome` and final response.
   Treat a repeat in-scope failure as a blocker. Report the original failure,
   the targeted rerun or scoped substitute, and the broad rerun outcome when one
   is applicable.
3. Update the spec with final status and an `Outcome` section following
   `docs/archival-workflow.md`. Append the `Outcome` at the bottom of the spec
   before moving it, after the existing spec sections.
4. Archive completed active specs to `archive/specs/`, using `git mv` when
   tracked.
5. Repair active references and implementation-order/index surfaces found in the
   repo. Do not edit archived historical artifacts after the move unless needed
   for accurate provenance, security, or legal reasons.
6. For docs/spec-heavy families, run any applicable capstone checks from the
   spec plus lightweight repository truth checks before archiving:
   - registry completeness for active docs, when `docs/ACTIVE-DOCS.md` is in
     scope;
   - stale active-path or snapshot-claim greps named by the spec;
   - active `docs/*.md` cross-reference resolution for touched entry docs;
   - old active ticket/spec path absence after archive moves;
   - matrix, ledger, or implementation-order completeness loops named by the
     spec.

   Example patterns, adapted to the family:

   ```sh
   for f in docs/*.md; do base=$(basename "$f"); grep -q "docs/$base" docs/ACTIVE-DOCS.md || echo "MISSING docs/$base"; done
   for ref in $(rg -o "docs/[A-Za-z0-9._/-]+\\.md" docs AGENTS.md CLAUDE.md README.md | sed 's/^.*docs\\//docs\\//' | sort -u); do test -f "$ref" || echo "MISSING $ref"; done
   rg -n "specs/SPEC-ID|SPEC-ID|TICKET-PREFIX" docs specs tickets AGENTS.md CLAUDE.md README.md
   test ! -f specs/SPEC-ID.md && test -f archive/specs/SPEC-ID.md
   ```

7. Run a final status/diff check and commit the spec archive/truthing work
   unless the user explicitly asked not to commit.
   If the final ticket is itself the capstone or explicitly owns spec closeout,
   the final ticket archive and spec archive may land in one commit. Record that
   coupling in the ticket and spec `Outcome` sections, and use a commit message
   that names the final ticket.
8. If a `/goal` is active, mark it complete only after implementation,
   verification, ticket archives, spec archive or documented reason it remains
   active, reference repair, and required commits are done. When resuming after
   an apparent closeout, re-check that no completed ticket or spec remains at an
   active path, archived tickets/specs have final status plus an `Outcome`,
   active reference sweeps are clean or intentionally point to archive paths,
   final gates are current, and the worktree contains no unreported task
   residue.

## Reporting

Final responses must include:

- Tickets completed and archived.
- Spec archived, or why no spec was archived.
- Commits made.
- Verification commands actually run.
- Any checks not run and why.
- Any unrelated pre-existing changes left untouched.
- Any incidental unrelated gate fixes included in a ticket commit.

Use explicit `none` entries when applicable, for example:

- Checks not run: none.
- Unrelated pre-existing changes left untouched: none observed.
- Incidental unrelated gate fixes: none.
