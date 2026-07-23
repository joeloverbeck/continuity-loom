# Intake Routing

Branch-specific intake rules for `grilling`. `SKILL.md` remains the authority for classification and the core question loop.

## Cited design or plan stress-tests

Keep intake minimal enough to avoid replacing the interview with research, but deep enough not to ask what repo truth already answers.

- Open the cited artifact and the selected candidate or section first. Broaden only for dependencies, contradictions, or missing context.
- Read relevant glossary, principle, spec, ADR, and implementation surfaces.
- When the candidate concerns module depth, seams, interface shape, or architecture vocabulary, invoke the repo's relevant design-vocabulary or architecture skill as an authority.
- When the invocation names a supporting skill or wrapper, invoke it during intake — run the skill itself, not a file read, so its full instructions and its own closing/result contract apply — so its judgment shapes the branches and its result has a recap home.
- If the candidate may overlap in-process or prior PRD-shaped work, check narrow open and relevant closed tracker state. Record the result as an explored fact.
- Reconcile old report, field-build, audit, review, or PRD claims against current source and tracker state. Treat contradicted findings as covered unless replay disproves them, or as verification or reopen candidates rather than fresh scope.

## Determinations and recommendations

When no plan exists, broader intake is legitimate because the run must assemble a candidate set before choosing among it.

- Survey indexes, coverage ledgers, tracker state, current candidate files, and authority-order documents first.
- Include current open work and the latest relevant closed parent or PRD so the candidate set does not duplicate or contradict live work.
- For a large requested document glob, either read it exhaustively or disclose the bounded strategy. Targeted scans do not count as line-by-line review.
- After candidate choice, grill the winning candidate's design tree one branch at a time.
- Candidate choice is user-owned unless repo facts conclusively leave only one valid option. In that exceptional case, record the surviving option as an explored fact and omit candidate choice from the decision ledger. A merely recommended winner remains PROVISIONAL or outside the decision ledger until the user confirms it.
- Once candidate choice, scope boundary, and deliverable depth are resolved, stop at a PRD-ready or issue-ready recap unless publication, issue creation, document writing, or implementation was explicitly requested and permitted.

For issue-ready recaps, a skill such as `/to-issues` may be consulted for house style and granularity after relevant decisions are ratified. This is not permission to create issues.

For PRD-ready recaps or artifacts, `/to-prd` or recent ratified prior art may be consulted for house style. This is not publication scope and does not discharge `/to-prd`'s later testing-seam checkpoint.

## Diagnostic and audit determinations

A diagnostic or audit assesses something that already exists:

- candidate set and winning candidate are N/A;
- the deliverable is a findings verdict plus recommendation;
- the minimum design tree is scope boundary and deliverable depth; and
- a conflict between repo authority and the user's stated intent becomes a user-owned ratification branch because artifact comparison cannot settle intent.

Expect evidence intake to dominate this class. Broad reads and delegated exploration are appropriate when the active environment permits them.

## Existing prep artifacts

When a matching PRD-ready, issue-ready, or prep artifact exists:

- classify it as current, partially consumed, stale, superseded, or not relevant;
- state whether this run updated it, left it untouched, or recommends a refresh;
- name consumed tracker IDs; and
- preserve remaining candidates separately instead of treating the artifact as wholly current or wholly spent.
