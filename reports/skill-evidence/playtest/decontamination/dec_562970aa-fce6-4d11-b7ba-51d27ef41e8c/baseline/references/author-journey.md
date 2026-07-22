# Author Journey

## Contents

- [New-story entry](#new-story-entry)
- [Continuation entry](#continuation-entry)
- [Sincere authoring loop](#sincere-authoring-loop)
- [Assistance surfaces](#assistance-surfaces)
- [Candidate and acceptance](#candidate-and-acceptance)
- [Light accessibility and layout pass](#light-accessibility-and-layout-pass)

## New-story entry

When the Cold First-View Witness state is `active`, capture it before the main operator sees the
initial screen:

1. Navigate with the guarded browser and save a screenshot under the run's `/tmp` scratch
   directory in the same `browser-act.mjs goto <base-url> --shot <temporary-path>` command. The
   command may return URL, title, and screenshot path, but do not run `text`, `tree`, `html`, or an
   image-viewing tool and do not otherwise display or inspect the screenshot in the parent context.
2. Create a sealed packet containing only a neutral one-sentence role premise such as “You are an
   author opening a local fiction-authoring application for the first time,” that screenshot, and
   the fixed questions below. Fingerprint the packet manifest with lowercase SHA-256. Do not include
   the user's story premise, this skill, product docs, expected findings, operator expectations,
   repository context, or story prose.
3. Send the packet to one genuinely fresh context. Ask only: what this screen appears to be for,
   the first action it suggests, what the witness expects that action to do, which visible terms
   are unclear, and an overall `clear`, `partly-clear`, or `unclear` rating. Have it save the answer
   under `/tmp` and return only confirmation.
4. Record the executor host family, exact model identifier only when the host exposes it (otherwise
   `unknown`), exposure boolean, timestamp, packet fingerprint, and privacy check.
5. The main operator now opens the same screenshot, then the still-unmodified live screen, and
   records the same first-view observations before reading the witness answer. Only then compare the
   two accounts.

The packet manifest is a temporary UTF-8 file that names the packet version, screenshot path and
SHA-256, neutral premise, and exact questions. Its fingerprint is the SHA-256 of those exact manifest
bytes; never fingerprint a paraphrase or the later witness response.

If a genuinely fresh witness or sealed delivery is unavailable, record the pilot as pending with a
coverage limitation and continue the core playtest. Do not improvise a witness in the parent
context. This instrument tests first-screen comprehension only; it is not evidence of human
transfer or of a fully uninstructed journey.

Whether or not the pilot triggers, navigate to the isolated app and inspect the initial screen
before typing. Record what the page appears to be for, the next action it suggests, terminology
that is or is not understandable, and what a first-time author expects will happen.

Create the project through the visible **Create** form using the exact parent path, folder name,
title, and optional description from the prepared run. Do not use the demo project. Confirm the
visible project status and path before proceeding.

Capture the source-and-doc-blind assessment before systematically visiting the navigation or
opening field help. The skill's coverage obligations must not erase what the first screen
communicated before exploration.

## Continuation entry

Open the prior report's `project_path` through the visible **Open** form. Confirm the visible title
and path. Visit **Accepted Segments** before changing story state and establish:

- the latest accepted sequence;
- whether the archive makes the continuation point discoverable;
- whether the latest segment can be read and distinguished from continuity authority;
- what durable changes appear to need deliberate author review.

Reading accepted prose is allowed author review. Do not copy it into the Generation Brief, use it
as a prose-prompt source, or treat it as automatic canon. Use records and independently authored
state/handoff fields for continuation.

## Sincere authoring loop

Work through the app in the order a sincere author finds sensible. The following coverage is a
destination, not a secret shortcut through the UI:

1. **Story Configuration.** Express the intended story contract, prose mode, maturity envelope,
   and constraints. Record fields that feel unclear, duplicative, unnecessary, or unexpectedly
   important.
2. **Records.** Create only the entities, cast dossiers, facts, knowledge/reveal boundaries,
   physical state, pressure, relationship, emotion, object/location, and affordance records the
   intended local segment needs. Prefer atomic records except where the UI presents rich cast
   dossiers. Record the cost of deciding types and fields.
3. **Private Notes.** Use notes for actual author scratch—questions, discarded options, planning,
   reminders, or research fragments—when useful. Confirm through experience that notes remain
   visibly distinct from records and prompt context. Re-author any note-derived decision
   deliberately; never transfer or inject it.
4. **Active Working Set.** Select the records needed for the next segment. Ensure every intended
   POV, active speaker, active silent presence, physically active character, present-minor
   speaker, and offstage pressure appears in the appropriate visible cast band/function. Do not
   silently include a record merely because it is globally important.
5. **Generation Brief.** Fill the universal minimum and only the context-gated fields that the
   intended moment makes useful. For every populated field, record the author need and expected
   observable influence before prompt compilation. Treat validation-focus controls as readiness
   controls rather than expected prose content unless the UI says otherwise.
6. **Readiness.** Save the draft, inspect blockers and warnings, and resolve blockers through the
   canonical UI. Assess whether diagnostics identify the real author action, whether field help
   arrives at the right time, and whether warnings are proportionate. Never weaken or bypass a
   blocker.

Do not mechanically fill every optional field. An unused field is evidence only when a natural
author need caused it to be populated and the response had a fair opportunity to reflect it.
Equally, record when the app imposes authoring work whose purpose cannot be understood or whose
value never becomes visible.

## Assistance surfaces

Use assistance only when the author need arises, and log why each surface was invoked or skipped:

- **Ideate:** when the author is genuinely stuck or wants grounded possibilities/questions before
  committing the next local directive.
- **Record Hygiene:** when records plausibly overlap, restate one another, feel stale, or create
  uncertainty about what should be edited. Whole-project scope is appropriate for general
  cleanup; active-working-set scope is appropriate for immediate authoring focus.
- **Segment Reconciliation:** after acceptance when the latest segment plausibly changed durable
  state, or at continuation entry when the prior run left reconciliation unfinished.

Compile and inspect each assistance prompt in the UI, but do not press its OpenRouter control.
Evaluate the cold response according to [Cold prompt evaluation](prompt-evaluation.md). Re-author
only suggestions the playtest agent independently judges useful and correct.

## Candidate and acceptance

After cold prose evaluation, click **Write or paste candidate**. Fill the editor from the chosen
temporary response file, preserving the raw response assessment in the scratchpad first. Make
only edits an ordinary author would make; do not silently rewrite the entire candidate to hide a
prompt failure.

Record intervention burden:

- `none` — accepted unchanged;
- `light` — copyediting or a few local corrections;
- `substantial` — multiple continuity, voice, pacing, or instruction repairs while retaining the
  response's basic segment;
- `rewrite` — most useful prose had to be replaced; treat this as a major prompt/output finding.

Accept only coherent prose the author genuinely chooses to keep. If neither of the two allowed
cold attempts can be made acceptable without a replacement-level rewrite, stop with a prose
quality blocker rather than fabricating completion.

After acceptance, verify the new sequence in **Accepted Segments**, inspect the durable-change
reminder, and perform any chosen reconciliation/record updates. Do not acknowledge completion of
durable-change work until canonical surfaces actually represent the chosen continuity.

## Light accessibility and layout pass

At safe points, assess keyboard focus visibility, accessible names for major controls, label/help
association, color-only state, clipping, scrolling, long-form field readability, and whether the
fixed 1440x900 desktop layout supports the current task. Do not derail the author journey into a
full WCAG audit.

**Completion criterion:** exactly one new segment is accepted or the blocker policy is exhausted;
the intended characters/functions and relevant continuity are visibly represented; assistance
use or non-use is explained; and the project is left in a deliberate state suitable for the next
report-driven continuation.
