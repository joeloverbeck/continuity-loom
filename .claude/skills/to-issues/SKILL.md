---
name: to-issues
description: Break a plan, spec, or PRD into independently-grabbable issues on the project issue tracker using tracer-bullet vertical slices.
disable-model-invocation: true
---

# To Issues

Break a plan into independently-grabbable issues using vertical slices (tracer bullets).

The issue tracker and triage label vocabulary live in the repo's label-mapping doc — `docs/agents/triage-labels.md` here; more generally, the issue-tracker config named in the project `CLAUDE.md`. If no mapping doc exists, run `/setup-matt-pocock-skills`.

## Process

### 1. Gather context

Work from whatever is already in the conversation context. An in-context body satisfies the body read when the issue was authored or fetched this session. But when the argument names a tracker issue, always fetch its comments fresh before drafting — they may carry corrections or vetoes newer than the context. If the referenced issue is not in context at all, fetch its full body and comments.

When the source is described deictically, such as "the newly-created PRD" or "the issue we just made," resolve it to the most recent in-session published issue/PRD, state the resolved number before drafting, and verify it with an exact `gh issue view <n> --comments` read.

If no in-context issue number is visible for a deictic source, run a compact recent-PRD lookup rather than guessing. Pick the newest candidate only when the result is unambiguous, state the assumption, and verify it with an exact `gh issue view <n> --comments` read before drafting. If multiple plausible PRDs or source issues exist, stop and ask for the intended issue number.

After fetching the source and fresh comments, check whether a parent child-map ledger already decomposes the same source. When a ledger lists existing child issues, verify those children directly, run exact-title duplicate confirmation as needed, report the existing breakdown, and stop before drafting, approval, or publication unless the user explicitly asks to re-break down, replace, or supplement the existing child set.

If the source body or comments name sibling PRDs/issues, program-sequence entries, coordination notes, "in flight" caveats, or related tracker items whose state could affect dependency wording, fetch those exact related items before Step 4. At minimum confirm their title, state, labels, and fresh comments, then classify them in the proposal as hard blockers, current context, or coordination-only. Do not rely on stale sequence comments when a sibling may already be implemented, closed, or materially changed.

Keep related-item fetches compact when exact issue or PRD numbers are already known. Prefer exact `gh issue view <n>` queries that project only title, state, labels, URL, comment count, and short comment excerpts through `--jq`; fetch full bodies only for the source issue and the few prior child issues needed for house style. Avoid broad `gh issue list` calls that include bodies or comments unless discovery is genuinely needed, because they are easy to truncate and then must be redone.

Scan the source body and fresh comments for decisions marked provisional, unratified, timed out, open to veto, or otherwise awaiting steward confirmation. Treat those as unresolved decisions, even if the source issue already carries `ready-for-agent`. Carry the unresolved-decision list into the Step 4 approval checkpoint; do not publish `ready-for-agent` child issues from those assumptions until the checkpoint explicitly ratifies or revises them. If they remain unresolved after the checkpoint, either stop before publication or publish only `needs-triage` child issues and state that they are not AFK-ready.

Use a compact unresolved-decision scan before classifying the source as AFK-ready. For tracker issues, prefer a body-plus-comments read such as `gh issue view <n> --json body,comments --jq '[.body, (.comments[].body?)] | join("\n---COMMENT---\n")' | rg -n "provisional|unratified|timed out|open to veto|TBD|open design|grooming decision|leading candidate|may |should "`; for local files, run the same `rg -n` pattern against the source file. If this compact tracker scan fails from transient tracker/API connectivity but a fresh exact body/comments read for the source is already in current context, retry once; if it still fails, inspect the already-fetched body/comments against the same phrase list, state that fallback in the Step 4 proposal, and proceed only after classifying any relevant modal or open-decision wording. If no fresh body/comments read is available, stop instead of guessing. Inspect every hit and classify it before Step 4 as one of: blocking open decision, ratifiable implementation latitude, or irrelevant prose. Modal words such as `may` or `should` are not automatic blockers; when they describe acceptable implementation latitude, encode the chosen interpretation in the proposal and ask the steward to ratify it.

Also scan for decisions the source explicitly delegates to grooming, issue breakdown, or later implementer judgment — phrases such as "grooming decision", "leading candidate", "record shape", "TBD", or "open design question". Treat these as structural decisions owed by the breakdown unless the source or fresh comments already ratified them. Carry them into the Step 4 approval checkpoint; either ask the steward to ratify the decision as encoded in the slices, route the decision into a first spec/document blocker before code-bearing slices depend on it, or leave affected children `needs-triage`.

Treat source assertions that an implementation mechanism already exists as testable premises, not implementation latitude. Extract material claims signaled by terms such as `existing`, `current`, `preserve`, `reuse`, or `unchanged`, then verify the named budget, policy, route, seam, or behavior against the live code and authoritative specs. Classify each claim as verified current, present-but-materially-different, or absent. Carry the latter two into the Step 4 checkpoint as structural decisions: propose the concrete interpretation for ratification, route it through a first spec/document blocker, or leave affected children `needs-triage`. Do not silently invent a missing mechanism or encode it as settled behavior.

Before drafting, classify the tracker relationship for every proposed issue. Use **child mode** when the source tracker item is a parent whose scope the issue implements. Use **standalone-source mode** when the new issue is derived from a tracker item but is a predecessor, follow-on, or coordination issue rather than its child; name the exact relationship in durable wording such as `Blocks PRD #379`. Do not force an inverse or coordination relationship into a `Parent` section.

In child mode, exact-read the parent's current state and labels and compare them with the canonical triage roles before Step 4. If any proposed child will be `ready-for-agent` while the parent is also `ready-for-agent`, the approval checkpoint must include an explicit parent-label transition that leaves the parent in a truthful non-AFK state. Do not invent an unlabeled or semantically false fallback. If the repository has no truthful non-AFK state for an open coordination parent, stop before publication and ask the maintainer to decide the tracker-state model. Never create an AFK-ready child family beside an AFK-ready parent.

If the maintainer asks whether an existing issue or PRD should be split, treat that as an assessment request first. Fetch the source issue and comments, run the granularity check, and decide whether child issues would reduce implementation risk. If the right answer is **do not split** — because the work is already a single coherent document/process issue, narrow bug fix, or one complete vertical slice — report that rationale and stop before house-style lookup, quiz, or publication. Do not create a no-op child issue just to exercise this skill.

### 2. Explore the codebase (optional)

If you have not already explored the codebase, do so to understand the current state of the code. Issue titles and descriptions should use the project's domain glossary vocabulary, and respect ADRs in the area you're touching.

Keep code exploration bounded. Start from exact source/exemplar terms and likely files, prefer `rg --files` plus targeted symbol or phrase searches, constrain globs and output budgets, and rerun narrower if a result truncates. Before passing conventional roots such as `apps`, `packages`, or `src` to a search command, verify they exist with a quick root listing or `rg --files -g package.json`, then constrain searches to the discovered roots. Broad repo-wide greps are a fallback only when discovery genuinely needs them.

Run `git status --short` during intake. Leave unrelated, uncited changes untouched and mention them in final reporting. If the source plan cites dirty or untracked local doctrine, reports, research briefs, field-trial reports, or other source artifacts, route them through the document-blocker/durability rule below before code-bearing slices depend on them.

Look for opportunities to prefactor the code to make the implementation easier. "Make the change easy, then make the easy change."

### 3. Draft vertical slices

Break the plan into **tracer bullet** issues. Each code-bearing issue is a thin vertical slice that cuts through all affected integration layers end-to-end, NOT a horizontal slice of one layer.

<vertical-slice-rules>

- Each code-bearing slice delivers a narrow but COMPLETE path through every affected layer (schema, API, UI, tests)
- If the source plan explicitly excludes a layer, such as "no schema change" or "server boundary first; no browser redesign", do not invent work in that layer. Instead, make the slice's acceptance criteria assert the excluded layer remains unchanged or consumes existing behavior through compatibility checks.
- A behavior-preserving refactor or architecture-seam relocation may legitimately be a single code-bearing slice (plus any document blocker): touch the affected layers and assert the untouched ones remain unchanged via acceptance criteria. Do not manufacture multiple slices where splitting would only leave the code in a half-migrated intermediate state (for example, the same methods living in two modules at once). A genuinely divisible refactor still splits — the granularity quiz below is where that call is made. More broadly, a small plan — a narrow bug fix, or a feature touching a single path — may legitimately reduce to one vertical slice; aim for the smallest set of complete slices, not a minimum count, and let the granularity quiz catch over-splitting as readily as under-splitting.
- A completed slice is demoable or verifiable on its own
- When the repo's architecture makes a sub-application seam (for example an HTTP app or server-boundary seam) the demoable integration boundary — and the fetched house style confirms it, e.g. prior flows shipped verified at that seam with the browser as a later or absent consumer — a slice may complete at that seam rather than the browser. Deliver the UI as a distinct consumer slice whose acceptance criteria assert it consumes server-returned shapes and duplicates no server policy. This is the sanctioned exception to the one-layer caution above: verifiable-at-the-seam satisfies "demoable," and the UI-consumer slice is not the drift the rule guards against. When a user story spans the seam pair, state which half each slice covers (for example "the server derivations; their browser rendering lands in <consumer slice title>") and cross-reference the counterpart by slice title in both bodies.
- Any prefactoring should be done before the code-bearing slices it eases
- Plan items that are documents (ADRs, specs) become ordinary blocker issues verified by review/conformance mechanisms, not vertical slices — only code-bearing items owe the all-layers rule
- For docs-only PRDs, split a standard, policy, or template update from its application to a coverage ledger or downstream doc when the application should depend on the newly durable standard. Keep the work as one issue when the document change is a single coherent review unit and a split would only duplicate conformance review.
- When a slice's behavior is deliberately completed by a later slice, state the handoff explicitly in both issue bodies (what this slice leaves open, which slice closes it), so neither implementer duplicates or drops the seam

</vertical-slice-rules>

Before finalizing the breakdown, check whether the source plan cites local ADRs, specs, context/glossary files, reports, research briefs, field-trial reports, other source artifacts, or other doctrine documents that were created or modified in this session — or that were ratified or decided this session but not yet authored (a planned ADR, spec, report, or source artifact that does not yet exist as a file). If a cited local document or source artifact is untracked, unwritten, or otherwise not yet durable in the repo, make a first document blocker issue for publishing/reviewing that doctrine or artifact before code-bearing slices depend on it. Make this document blocker even when the source plan lists that doctrine or artifact's own authoring as out of scope: the plan's out-of-scope governs its code layers, not the durability blocker the breakdown owes. The same duty extends to doctrine the breakdown itself introduces: when the slices will cite a named artifact the source plan never mentions (a governing spec for a new layer, a coverage list), that artifact is owed a first document blocker too — check prior breakdowns for the house precedent and surface the decision in the Step 4 quiz.

Treat a source-plan note such as "temporary source summarized, not cited," "summarized rather than cited," "pending local repo publication," "pending authoring/publication," or equivalent wording as the same durability trigger even when the source omits an exact local path. If code-bearing slices depend on that summarized finding, create the document blocker first so the durable source or issue-linked summary exists before implementation depends on it. Before creating that blocker, verify the note's currency against the repo: such notes can go stale between the source's authoring and the breakdown. If the cited doctrine or artifact is now tracked and committed (for example, confirmed via git earlier in the session), record that verification in the Step 4 proposal and skip the blocker — a stale note does not owe a no-op issue.

Durability requires content identity with the resolved publication ref, not merely a clean tracked path or a same-named file on that ref. After resolving every stable identifier to an exact tracked path as described below, use the canonical checker:

```sh
node .claude/skills/to-issues/scripts/check-artifact-durability.mjs <publication-ref> <path> [<path>...]
```

The checker emits one structured result per path. Exit `0` means every path is tracked, clean, visible at the resolved ref, and content-identical; exit `1` means at least one path is not durable and must be routed through the blocker/summary decision; exit `2` means the check itself failed. `identicalToRef: null` means identity was not evaluated because the path was untracked or absent at the ref — never reinterpret it as `true`.

When exit `2` reports `kind: sandbox-restricted`, rerun through the host's approved execution escalation when that mechanism is available. If escalation is unavailable or inappropriate, use the complete manual fallback below. Treat any other exit-2 kind as a helper/Git failure and preserve its structured error in the Step 4 evidence.

If the helper cannot run, use the manual fallback for every exact path: `git status --porcelain -- <path>`, `git ls-files --error-unmatch <path>`, `git ls-tree -r --name-only <publication-ref> -- <path>`, then `git diff --quiet <publication-ref> -- <path>`. Only run or interpret the final content comparison after the tracked and ref-visible checks both succeed; otherwise record identity as N/A rather than identical. A clean file from a local-only commit is pending publication when its content differs from the publication ref. Name the resolved ref and results in the Step 4 proposal. If a relied-on path is absent from that ref or its content differs, create the document blocker, move the necessary conclusion into a durable tracker note or sufficient parent summary, or stop before publishing dependent children.

When the parent issue body itself contains the ratified conclusions from an otherwise untracked or temporary source at enough detail for child issues to cite the parent plus tracked docs, treat the parent as the durable issue-linked summary. In that case, do not create a separate "publish the temporary source" blocker just to duplicate the parent body; instead, surface the decision in the Step 4 approval checkpoint and include it in the optional parent ledger. Still create a document blocker when code-bearing slices depend on details absent from both the parent body and tracked repo docs, or when a downstream tracked spec/ledger must absorb the conclusion before implementation can safely proceed.

Use this sufficiency test before skipping the blocker: every material child acceptance criterion must be traceable to the parent issue body, fresh parent comments, or tracked repo docs. If an implementation-critical detail exists only in untracked reports, local notes, chat, or temporary artifacts, create a document blocker or move the missing detail into a durable tracker note before publishing code-bearing children. Name the sufficiency decision in the Step 4 proposal and, when posted, the parent ledger.

When a source cites doctrine by stable identifier, number, or title rather than exact file path (for example `ADR 0008`), resolve it against the relevant repo directory by identifier and title before declaring it missing or creating a blocker. List or search the relevant doctrine directory first, then open the resolved path; do not synthesize filenames from remembered title wording. Prefer exact tracked paths once resolved, but treat stable identifiers as valid citations when they resolve unambiguously to tracked doctrine.

Resolve stable identifiers to exact tracked paths before including them in aggregate tracked/durability checks; otherwise a guessed filename can make unrelated durable sources look suspect.

The mirror hazard is durable doctrine the source plan *contradicts* rather than one that is missing: a PRD or plan whose cited spec, ADR, or principle exists and is tracked, but whose proposed names, roles, or behavior conflict with it — a source may even claim non-contradiction while contradicting. Do not slice such a plan as written. Resolve the repository's authority order from its agent instructions and active authority registry first; use `docs/principles/README.md` only when that live guidance selects it or the file exists and governs the touched surface. Correct the source's assumptions per that resolved order, present the conflict and your proposed correction as an explicit decision in the Step 4 quiz — the resolution is the user's call — and encode the corrected version in the slices with the deviation named in each affected issue body. The correction lives in the child issues; never edit the parent.

When a slice's correctness hinges on a *derivation* a cited spec or ADR made — a choice it reached by analogy or judgment, not one the upstream authority dictates — confirm that derivation against the upstream named in the resolved authority order before encoding it, and flag it to the steward as a judgment call. Affirming non-contradiction with the top of that order is already owed, so a spec faithfully "respected" can still violate the higher authority if the spec itself drifted; if the derivation proves unsound, route the fix as a doctrine-correction (above) rather than propagating it into slices.

Fetch one or two child issues of a prior breakdown from the tracker and match their house style — title pattern, body voice, section order, and acceptance-criteria conventions. Prefer a narrow lookup: query recent issue titles/numbers first, identify a prior PRD child set, then fetch one or two exact child issue bodies by default instead of pulling broad full-body lists. Usually stop at three exact child issue bodies; fetch one additional exact child body per materially distinct domain surface only when needed to cover both current house style and domain-specific precedent, and keep each read compact. The approval-only publication protocol contains the required issue template; preserve fetched house-style section order unless repo docs explicitly require a different order.

#### Parent-ledger precedent lookup gate

When the breakdown is likely to create multiple issues and Step 4 will offer a parent child-map ledger comment, inspect one recent same-repo parent ledger before the approval checkpoint when available. This is a mandatory two-phase lookup:

1. **Candidate headings only.** List each comment URL and its first Markdown heading:

   ```sh
   gh issue view <candidate-parent> --json comments \
     --jq '.comments[] | {url, heading: (.body | split("\n") | map(select(startswith("#"))) | .[0] // "")}'
   ```

   This candidate query may not project or print a comment `body`. Select exactly one URL whose heading matches `^# Child Issue Map`; broad `child`, `breakdown`, issue-reference, or full-body searches fail this gate because closeout comments can be very large and are not ledger precedent.

2. **One exact body.** Only after selecting the exact URL, fetch that comment:

   ```sh
   gh issue view <candidate-parent> --json comments \
     --jq '.comments[] | select(.url == "<exact-comment-url>") | .body'
   ```

Use only that selected comment to learn the ledger heading/table style and whether the repo uses a stable disclaimer. If phase 1 finds no matching parent-ledger precedent or disclaimer requirement, say so in the approval checkpoint and do not perform a broad fallback body search.

### 4. Quiz the user

Present the proposed breakdown as a numbered list. For each slice, show:

- **Title**: short descriptive name
- **Blocked by**: which other slices (if any) must complete first
- **User stories covered**: which user stories this addresses (if the source material has them)

Use this proposal item shape so the approval checkpoint is mechanically complete:

```markdown
1. **Title**: <short descriptive name>
   - **Blocked by**: <none, or slice numbers/titles>
   - **User stories covered**: <US numbers, temporary ordinals, quoted story refs, or N/A - source has no stories>
```

Before asking for approval, self-check that every proposed slice has all three fields. If the source has numbered stories, no proposed slice may omit `User stories covered`; either list the covered story numbers or explicitly explain why story coverage is N/A for that slice.

After the numbered list, include these eight global posture lines and self-check that none is missing:

- `Decision scan: <live or fallback source>; <hits and classification, or none>`
- `Tracker relationship: <child of #N, or standalone source #N with exact relationship>`
- `Parent disposition: <current parent state/labels, approved transition and resulting labels, or N/A for standalone-source mode>`
- `Source/target posture: <authoritative source and the exact issue set this breakdown will create>`
- `Prerequisite posture: <hard blockers, coordination-only items, and unresolved prerequisites, or none>`
- `Publication posture: <dependency order, label set, and child-ledger or standalone-source posture>`
- `Artifact posture: <publication ref and durability result for every relied-on local artifact, or no local artifacts>`
- `Coverage gate: <story coverage and browser-visible guidance mapping status, including specific N/A posture>`

Before asking for approval, verify that the numbered slices and all eight posture lines agree: every blocker appears in the prerequisite and publication order, every target matches the tracker relationship, the parent disposition prevents duplicate AFK-ready ownership, every non-durable artifact has a document blocker or durable issue-linked summary, and every story/checklist obligation is assigned to a slice. A posture line that says only `see above` is missing.

If the source user stories are unnumbered, assign temporary story ordinals in source order (`US1`, `US2`, etc.) for the proposal. Either include a one-line mapping or quote enough of each covered story that the references are unambiguous; the ordinals are proposal aids, not published requirement IDs unless the source already uses them.

Include a one-line prefactoring verdict for the whole breakdown ("Prefactoring: none needed because …", or a prefactor slice placed before all code-bearing slices — position 1, or immediately after any document blockers), so the reader can tell the check ran.

When any proposed slice changes browser-visible behavior, browser workflow or navigation, prompt preview or inspection, user-initiated external-model invocation, or candidate/accepted-output handling and its acceptance contract is fully specified, include a compact checklist-mapping table before the approval question. This includes a `needs-triage` slice held solely by an external sequencing or readiness gate; label posture does not make applicable guidance N/A. Read the canonical items from `docs/agents/issue-tracker.md` and use this shape so the browser-visible guidance gate is concrete before publication:

```markdown
| Slice | Checklist item | Covered by staged AC | N/A reason |
|---|---|---|---|
| <slice title> | <canonical issue-tracker checklist item> | AC <n> - "<short staged criterion excerpt>" | - |
```

For unaffected slices, include one row with `Checklist item` set to `browser-visible guidance checklist` and a specific `N/A reason` such as `server metadata seam only; browser consumer slice covers the checklist`. N/A means the checklist item does not apply; an external prerequisite is not an N/A reason. This Step 4 table can stay in the approval checkpoint or draft notes; do not publish it as a required issue-body section unless house style already does. If full issue bodies are not drafted before the approval checkpoint, the `Covered by staged AC` entries may use provisional AC numbers or concise coverage labels, but after drafting the actual issue bodies and before applying `ready-for-agent`, rerun the checklist mapping against the final acceptance-criteria bullets and revise the staged body or label if any checklist item no longer maps cleanly. Every final pre-publication mapping must use `AC <n> - "<verbatim excerpt>"`, with the excerpt belonging to that exact staged acceptance criterion; composite rows must resolve every named component or an explicit cross-slice handoff. A generic acceptance criterion that merely says `Browser-visible guidance checklist mapped` is useful as an issue-body summary but does not satisfy the local mapping by itself. A bare `yes` is only acceptable in the final ledger after that concrete mapping has already been performed.

Ask the user:

- Does the granularity feel right? (too coarse / too fine)
- Are the dependency relationships correct?
- Should any slices be merged or split further?
- When intake surfaced a doctrine conflict or correction (Step 3), does the user accept the correction and how it was resolved?
- When intake surfaced provisional, timed-out, unratified, or open-to-veto decisions, does the user ratify the listed decisions as encoded in the slices, revise them, or leave them unresolved?
- In child mode, does the proposed parent disposition truthfully prevent the parent and children from remaining AFK-ready at the same time? If no canonical state fits, stop for a tracker-state decision instead of treating approval as authorization to improvise one.
- In child mode with multi-issue publication, should the optional parent child-map ledger comment be posted after creation, assuming tracker docs or house style allow it? In standalone-source mode, record the ledger posture as N/A.
- In child mode, if the optional parent ledger is declined while the breakdown has ratified structural, durability, coordination, dependency, or story-coverage decisions that would otherwise live only in chat, should a concise "Breakdown decisions" note go in the first relevant child issue body before publication, or should that rationale intentionally remain out of the tracker?

For multi-issue breakdowns, end the checkpoint with an explicit publication sentence that states approval covers the eight posture lines as well as the numbered slices. In child mode: "If you approve this breakdown and its decision, tracker, parent-disposition, source/target, prerequisite, publication, artifact, and coverage postures, I will apply the approved parent-label transition, publish these N child issues in the dependency order shown with labels <labels>, and <post/skip> the parent child-map ledger as specified." Omit the transition clause when the parent is already in a truthful non-AFK state. In standalone-source mode, use the same posture list with parent disposition N/A and say that the issues will carry the exact approved source relationship and no parent ledger. Adjust an open child-mode ledger clause before publication.

If the user approves publication but delegates optional ledger judgment to you, default to posting the parent child-map ledger when the breakdown ratified structural, durability, coordination, dependency, or story-coverage decisions that future implementers would otherwise have to reconstruct from chat. Skip the ledger only when the user explicitly declines it, tracker docs or house precedent forbid it, or the breakdown has no durable rationale beyond the issue map; state that decision in the final report.

If the user approves publication and explicitly declines the parent ledger without answering the fallback-rationale question, default to adding a concise `## Breakdown decisions` note to the first relevant child issue body when the breakdown ratified structural, durability, coordination, dependency, or story-coverage decisions future implementers would otherwise have to reconstruct from chat. State that default before publishing. If the user explicitly says to leave the rationale out of the tracker, do that and state the choice in the final report.

When the proposed breakdown is a single no-blocker issue, a compact approval question is enough, but it must still make approval cover the one-slice granularity and all eight posture lines, including parent disposition, no-prerequisite, artifact, coverage, ledger, and publication decisions. In child mode, default the ledger to `skipped — relationship rationale is complete in the issue body` when a separate child-map comment adds no information. In standalone-source mode, parent disposition and the parent ledger are N/A because the issue body owns the exact source relationship. For example: "Does this one-slice/no-blocker breakdown and its eight postures feel right, and should I publish it as specified?"

Iterate until the user approves the breakdown. If the environment provides a timed approval mechanism and the approval question times out with no response, weigh re-asking once before proceeding — especially right after a long context dump (the user may have been reading rather than away) or when publishing is consequential (creating several real issues at once). Only on a second timeout (the user is away) proceed with the proposed breakdown, state in the conversation that it was applied unapproved, and offer post-hoc adjustment (merge/split/re-wire, closing issues if needed) when the user returns. If no timed approval mechanism is available, ask a plain-text approval question and stop before publishing unless the user has explicitly pre-authorized publication; do not treat tool unavailability as a timeout.

### 5. Publish after approval

Do not stage issue bodies or mutate the tracker until Step 4 is approved or publication was explicitly pre-authorized.

After approval, read [`references/publication-protocol.md`](references/publication-protocol.md) completely before taking any publication action. That approval-only protocol is mandatory and contains the issue template, label and duplicate guards, final checklist run sheet, serial substitution and creation loop, status-preserving sweeps, validator commands, parent-ledger handling, live family verification, cleanup, and Final Response Blocker.

Execution spine:

1. Freeze the approved titles, dependencies, labels, tracker relationship, parent disposition, ledger posture, and story/checklist mappings.
2. Run exact-title duplicate guards, then stage bodies and the local checklist run sheet.
3. Validate and sweep each body before its individual create call; substitute only real backward references.
4. Publish in dependency order and verify each returned issue before continuing.
5. In child mode, validate and post the approved parent ledger or apply its approved fallback; in standalone-source mode, verify the approved source relationship in the issue body.
6. Run the live published-family verifier against the staged bodies and complete run sheet.
7. Remove every temporary artifact, prove cleanup, inspect final worktree status, and report the verified family.

Completion criterion: the approved-created count matches; every published issue and blocker is live-verified; the approved parent/ledger or standalone-source relationship is verified; checklist, placeholder/path, and cleanup gates pass; and the final response contains the proof required by the publication protocol.
