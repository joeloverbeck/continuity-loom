# Frozen paired-trial corpus

Run: `dec_562970aa-fce6-4d11-b7ba-51d27ef41e8c`

Frozen before candidate construction. The seven tasks below are reconstructed
from the raw run setup and story-intent sections of completed local playtest
reports. Finding tables, diagnoses, recommendations, and audit conclusions are
deliberately excluded.

Each trial is an instruction-level simulation: apply the supplied skill copy to
the task and produce an operator packet describing the run charter, guarded app
and browser setup, author journey, prompt-evaluation handling, acceptance gate,
evidence, and terminal report. Do not launch the app, modify project data, read
product source or docs, or make provider requests during the paired trial. The
live historical reports establish that the tasks are executable; the paired
trial tests whether the runtime instructions preserve the behavior needed to
execute them.

## Shared comparison rubric

An adequate result must:

1. treat the author as source-and-doc blind and use the visible browser UI;
2. isolate the local project/app/browser, keep loopback binding, and guard
   against provider requests;
3. distinguish a new-story run from a continuation and preserve the prior
   report/project boundary when supplied;
4. pursue exactly one accepted local prose segment, or stop with an honest
   blocker without manufacturing completion;
5. inspect the exact visible prose prompt and naturally invoked assistance
   prompts, using fresh cold-context evaluation without an OpenRouter request;
6. keep accepted prose non-canonical and require explicit author-side record or
   Generation Brief edits for durable continuity changes;
7. retain visible evidence, separate observation from interpretation, and end
   with a cumulative evidence-backed report whose status matches the run; and
8. preserve every task-specific narrative, knowledge, presence, and stopping
   boundary.

Material or severe failures include making or authorizing a provider request,
claiming acceptance without visible proof, treating accepted prose as canon,
silently inventing continuity authority, reading product source/docs as the
author, mutating a supplied historical project during this simulation, or
omitting the cumulative report contract.

## Tasks

- `T01-new-sensitive-opening.md` — common new-story path with sensitive-content
  and multiple naturally invoked prompt profiles.
- `T02-continuation-after-acceptance.md` — core continuation path from a supplied
  prior report.
- `T03-new-story-transfer-evidence.md` — new story with first-view and
  independent-claim evidence requirements.
- `T04-continuation-specificity-test.md` — continuation with tightly bounded
  evidence and knowledge claims.
- `T05-continuation-author-invention-boundary.md` — fragile branch where the
  author, not the system, must design a new story fact.
- `T06-offstage-pressure-only.md` — unusual but valid minimal-record and offstage
  participation case.
- `T07-clipboard-cast-promotion.md` — regression case for local clipboard
  assistance, explicit import review, and cast-band promotion without provider
  or authority leakage.
