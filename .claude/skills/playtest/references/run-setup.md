# Run Setup

## Branch selection

Choose exactly one branch from the invocation:

- **New story:** the user supplies a story kind, premise, ingredients, or desired experience.
  Infer reasonable missing creative details without turning setup into another interview.
- **Continuation:** the user supplies one report produced by this skill and asks to continue.
  Read that report completely. Do not discover other reports. The report's `project_path` is the
  only project locator; if it is absent, not under `/tmp`, or no longer exists, produce a blocked
  report rather than reconstructing the story from report prose.

The prior report informs the returning-author branch, including inherited expectations and the
cumulative finding ledger. It is not prompt context and must not be passed to a cold subagent.

## Prepare paths

From the repository root, run:

```bash
node .claude/skills/playtest/scripts/prepare-run.mjs \
  --story-title "<working story title>" \
  [--prior-report reports/<prior-report>.md]
```

The helper creates and prints:

- a unique report stem and `reports/assets/<stem>/` evidence directory;
- a structured scratchpad and routine screenshot directory under
  `/tmp/continuity-loom-playtest/<stem>/`;
- a prompt-exchange directory and isolated app-settings directory under the same run root;
- for new stories, a project parent and proposed project path under
  `/tmp/continuity-loom-playtest-projects/` without creating the project folder itself;
- for continuations, the existing project path read from the supplied report.

Use the exact printed paths. Never substitute a project inside the repository. Never reuse a run
root, evidence directory, project folder, settings directory, or report stem.

## Establish custody

Before any run-owned repository write other than the evidence directory created by the helper,
capture `git status --short`. Append the exact baseline to the scratchpad. Existing changes are
user-owned; do not inspect them merely because they are dirty, adopt them, clean them, or restore
them.

At close, compare `git status --short` with the baseline. The only permitted repository changes
are this run's report and evidence directory plus the post-validation method-register update when
its pilot is active and exact counter/state-cell changes in `SKILL.md`'s Authoritative pilot state.
Build output ignored by git is acceptable. Any other delta caused by the run is an
observational-contract defect and must be reported.

## Record pre-use intent

Before launching, complete these scratchpad fields:

- what story the author intends to create or continue;
- the intended next local segment and what should remain undecided afterward;
- intended characters, POV, speakers, silent/onstage presences, and offstage pressures;
- expected continuity, physical, knowledge, reveal, voice, and content constraints;
- expected useful records and private notes;
- expected Generation Brief work;
- expected help from Ideate, Record Hygiene, or Accepted-Segment Change Review;
- the sealed mental model of how a first-time author expects the app to support the work;
- explicit non-goals and material that must not be forced.

Do not pre-judge that a named field or surface is useful. State the author need first; later record
whether the product made the right representation discoverable and worthwhile.

Do not read `reports/playtest-method-register.md` during setup or the author journey. Its pilot is
post-validation bookkeeping, not priming material. Do not search unrelated reports to decide
whether another pilot instrument should trigger; use only the Authoritative pilot state in
`SKILL.md` and record a natural non-trigger as pending. Never guess or reconstruct a count.

## Quantitative coverage

Activate the prepared Quantitative journey ledger only when the invocation asks for action counts,
authored-field counts, setup or promotion cost, or another quantitative journey comparison. Before
launching the browser, set the ledger to `active`, name every requested boundary, and state any
observed-versus-shortest-path comparison. Otherwise leave it `inactive`.

Apply these rules contemporaneously:

- Count one visible author action when a visible control is successfully actuated for navigation,
  authoring, submission, or purposeful UI inspection. Count a product-visible failed activation
  when it becomes an observation; do not count an automation locator failure that never actuated
  the control.
- Do not count passive `text`, `tree`, `box`, screenshot, wait, shell, helper, or cold-subagent
  operations. A visible search, expansion, help toggle, or other deliberately actuated inspection
  control may count as an `inspection` action.
- Count a distinct authored field once per visible field instance that receives an intentional
  author write or selection within the measured boundary. Re-edits add successful writes but not
  another distinct field. Use visible list-item instances such as `Item 1` and `Item 2` separately;
  blank optional fields and untouched defaults do not count. A default-valued control counts only
  when the author visibly actuates it and preserves that value as an authored choice.
- Count every successful visible field write or selection, including a correction. Buttons and
  navigation controls are actions, not authored fields or writes.
- Append cumulative boundary snapshots through stable action IDs. Derive deltas and any separately
  requested shortest demonstrated path from the ledger; never reconstruct or overwrite the
  observed path at report time.

Keep the ledger privacy-safe: labels, action kinds, booleans, counts, and short value-free action
summaries only.

## Run boundary

One invocation accepts exactly one new segment. The post-acceptance record and brief work belongs
to the same run. Do not continue into a second prose generation. A blocked run still produces a
report and preserves the project if one exists.

**Completion criterion:** all paths are unique and known; continuation project existence is
verified; baseline, intent, expectations, sealed mental model, and run boundary are present in the
scratchpad before app launch.
