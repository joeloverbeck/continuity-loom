# T07 Paired Evaluation Result

## Decision

**Tie.** Both A and B are executable operator packets that satisfy the shared rubric and all
task-specific T07 boundaries. Neither has a behavioral omission large enough to prefer the other.
A is somewhat more exhaustive about snapshots, accounting, and closeout; B is somewhat more
compact while preserving the same decisive controls.

## Per-criterion judgments

| Criterion | A | B | Judgment |
|---|---|---|---|
| Source-and-doc-blind visible-browser authorship | Pass. Restricts the journey to the visible 1440x900 UI, help, inspectors, and visible diagnostics. | Pass. Applies the same UI-only, 1440x900, source/doc/API/hidden-state prohibition. | Tie |
| Local isolation, loopback binding, and provider guard | Pass. Uses isolated project, settings, app, and browser paths; requires `127.0.0.1`, blank credentials, an ephemeral port, and provider-route blocking. | Pass. Requires the same isolated run surfaces, blank credential, loopback-only ephemeral session, exact-origin restriction, and provider-send blocking. | Tie |
| New-story versus continuation boundary | Pass. Explicitly declares `new_story`, no prior report, and no inherited project. | Pass. Explicitly declares `new_story` and later requires `prior_report: null`; it does not reuse or mutate a historical project. | Tie |
| Exactly one accepted local segment or honest blocker | Pass. Requires visible sequence-1 proof, no more than light intervention, and specific blocker termination rather than manufactured completion. | Pass. Requires at most one acceptance, visible sequence-1 proof, the same light-intervention ceiling, and truthful blocker handling. | Tie |
| Exact visible prose and assistance prompt evaluation | Pass. Custodies and fingerprints the visible prompts, uses fresh cold contexts, dispatches only the final post-promotion prose prompt, and evaluates naturally invoked assistance without OpenRouter. | Pass. Uses exact visibly extracted files, `fork_turns: "none"`, no supplemental context, a bounded retry, and cold evaluation for naturally invoked assistance. | Tie |
| Accepted prose remains non-canonical | Pass. Treats acceptance as bounded evidence and requires manually chosen canonical record or Generation Brief edits. | Pass. States that acceptance proves only the prose sequence and requires explicit visible canonical updates for chosen durable changes. | Tie |
| Evidence, observation discipline, and cumulative report | Pass. Separates visible fact from interpretation, limits retained evidence, carries findings into the cumulative ledger, and requires the full cumulative report. | Pass. Preserves the same fact/interpretation split, privacy-safe evidence limits, stable findings ledger, full schema-v2 report, and truthful status. | Tie |
| Narrative, knowledge, presence, and stopping boundaries | Pass. Keeps Mara alone at the observatory; preserves sender, location, motive, presence, and safety unknowns; stops before any reply decision. | Pass. Preserves all of the same story facts, unknowns, physical limits, and exact stopping point. | Tie |
| Actual visible **Copy prompt** actuation | Pass. Explicitly requires exercising the rendered **copy prompt** clipboard control for Mara and Elias. | Pass. Explicitly makes **Copy prompt** the author action for each Cast draft. | Tie |
| Exact local Cast-prompt custody and external drafting | Pass. Extracts the still-visible exact bytes with `text-file`, fingerprints them, sends only that file to a fresh context, and saves the raw response locally. | Pass. Extracts the still-visible complete prompt to `/tmp`, supplies an exact file-only executor instruction, and saves the response verbatim to a separate local file. | Tie |
| Import review before explicit save and authority | Pass. Requires untouched-response assessment, visible paste/import, field-by-field correction, explicit Save, visible saved-state confirmation, and denies authority before that point. | Pass. Requires assessment, visible paste/import, visible correction to sealed truth, explicit Save, verification, and states that all earlier stages confer no canon. | Tie |
| Promotion separated from record, canon, and Working Set mutation | Pass. Takes a boundary snapshot, uses only the dedicated participation control, verifies unchanged records and membership, and stops on silent authority leakage. | Pass. Uses the visible cast-band control without record editing, verifies unchanged saved values, canon, and membership, and keeps physical presence distinct from participation. | Tie |
| Visible pre/post-promotion prompt comparison | Pass. Captures and fingerprints exact pre/post prompts and repeats the same searches to isolate participation changes while facts remain stable. | Pass. Captures both prompt states, fingerprints them, and inspects what was added, removed, expanded, or repositioned while rechecking absence and knowledge locks. | Tie |

## Regression assessment

- **A:** No material or severe regression. Its extra operational detail and repeated closeout
  controls add reading burden, but do not weaken or redirect the task.
- **B:** No material or severe regression. Its shared Cast procedure is less redundantly expanded
  per character, but it still requires separate prompts, fresh executors, review, correction, and
  explicit saves for both records.

