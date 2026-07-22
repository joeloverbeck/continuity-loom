# Run Setup

## Select the branch

- **New story:** infer reasonable missing creative details from the supplied
  premise without adding an interview. Seal the intended local segment and what
  must remain unresolved.
- **Continuation:** read the supplied report completely and no unrelated report.
  Its `project_path` is the sole locator. If it is absent, outside `/tmp`, or no
  longer exists, write a `continuation-project-missing` blocked report rather
  than reconstructing the story from prose.

The prior report supplies returning-author context and the inherited finding
ledger. It is never cold-subagent prompt context.

## Prepare paths and custody

From the repository root:

```bash
node .claude/skills/playtest/scripts/prepare-run.mjs \
  --story-title "<working story title>" \
  [--prior-report reports/<prior-report>.md]
```

Use every path in the helper receipt exactly. It allocates a unique report stem,
evidence directory, `/tmp` run root, scratchpad, exchange/config directories and,
for a new story, a proposed project path without creating the project itself.
Never substitute a repository path or reuse an earlier run path.

Before any run-owned repository write other than the prepared evidence directory,
append exact `git status --short` output to the scratchpad. Existing changes are
user-owned: do not inspect, adopt, clean, or restore them merely because they are
dirty. At close, allow only the run's report and evidence directory beyond this
baseline; ignored build output is acceptable.

## Seal the pre-use charter

Before app launch, record:

- story intent, next local segment, exact stop, and what remains undecided;
- POV, speakers, silent/onstage presences, and offstage pressures;
- physical, continuity, knowledge, reveal, voice, prose, and content constraints;
- expected useful records, sincere Private Note use, Working Set, and Generation
  Brief work;
- expected help from Ideate, Record Hygiene, or Segment Reconciliation;
- the first-time-author mental model and explicit non-goals.

State author needs, not presumed UI fields. The later report should retain what
the UI confirmed, corrected, or left unclear.

If the user explicitly asks for action counts, authored-field counts, promotion
cost, or another quantitative comparison, read `observation-log.md`, activate
its ledger before launch, and name the requested boundaries. Otherwise leave
quantitative tracking inactive.

One invocation accepts exactly one new segment. Post-acceptance record and brief
work belongs to the same run; never continue into another prose generation. A
blocked run still gets a complete report and preserves any story project.
