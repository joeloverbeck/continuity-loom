# PRD Body Contract

Read this file in full before drafting each intended PRD in Step 3 of [`to-prd`](../SKILL.md).

## Template-conformance pass

Before creating the issue, run a template-conformance pass over the body, not just a section-presence scan:

- The body starts with an untitled provenance preamble and does not repeat the title as an H1.
- `## User Stories` is a numbered list, and each story follows `As an <actor>, I want <feature>, so that <benefit>` rather than a looser bullet or `I can` format.
- `## Implementation Decisions` records every `resolved default` from the intake decision-closure ledger with its evidence-based rationale; any `still open` row remains explicit in `## Further Notes` and the label decision.
- `## Testing Decisions` states the external-behavior testing rule, names the tested modules or surfaces, names prior-art tests descriptively rather than by file path, and records the seam-confirmation outcome after the literal marker `Seam confirmation:`.
- `## Principles` names the touched principle documents and ADRs, affirms non-contradiction with them, and flags any deliberate exception before implementation.
- `## Further Notes` records the seam-confirmation outcome after the literal marker `Seam confirmation:`: answered with the ratified seams, or timed out with the seams open to veto.

## Template

<prd-template>

[Preamble — an untitled paragraph before the first section: provenance (which session or decision determined this PRD), what prior PRD or commitment it follows or discharges, and the ratification status of its decisions.]

## Problem Statement

The problem that the user is facing, from the user's perspective.

## Solution

The solution to the problem, from the user's perspective.

## User Stories

A LONG, numbered list of user stories. Each user story should be in the format of:

1. As an <actor>, I want a <feature>, so that <benefit>

Keep a literal comma directly before `so that` (and before `I want`) — an em-dash, semicolon, or other punctuation in place of that comma fails the staged-body story-conformance check even when the sentence reads fine.

<user-story-example>
1. As a mobile bank customer, I want to see balance on my accounts, so that I can make better informed decisions about my spending
</user-story-example>

This list of user stories should be extremely extensive and cover all aspects of the feature.

## Implementation Decisions

A list of implementation decisions that were made. This can include:

- The modules that will be built/modified
- The interfaces of those modules that will be modified
- Technical clarifications from the developer
- Architectural decisions
- Schema changes
- API contracts
- Specific interactions

When intake produced a decision-closure ledger, include each `resolved default` as a concrete implementation decision and state the durable authority or same-kind prior art that selected it. Do not present a synthesized default as explicit user ratification. Leave any `still open` decision in Further Notes and preserve its `needs-triage` consequence.

Do NOT include specific file paths, code snippets, or volatile code symbols (function, variable, or private-helper names). They may end up being outdated very quickly. Stable data-model identifiers, by contrast, are acceptable and expected — schema table and column names, controlled-vocabulary names, link-type and record-type keys, and route/endpoint names — since they match house style (prior flow PRDs cite them freely) and are themselves conformance anchors. Citations of principle, ADR, spec, prior issue/PR, and methodology-module documents are exempt — they are stable identifiers and are themselves the conformance mechanism.

Exception: if a prototype produced a snippet that encodes a decision more precisely than prose can (state machine, reducer, schema, type shape), inline it within the relevant decision and note briefly that it came from a prototype. Trim to the decision-rich parts — not a working demo, just the important bits.

## Testing Decisions

A list of testing decisions that were made. Include:

- A description of what makes a good test (only test external behavior, not implementation details)
- Which modules will be tested
- Prior art for the tests (i.e. similar types of tests in the codebase), named descriptively (package + kind of test) rather than by file path, consistent with the Implementation Decisions rule
- The literal marker `Seam confirmation:` followed by the ratified seams, or the unchanged-existing-seam timeout outcome when that exception applies

## Principles

The conformance section this repo requires of every implementable issue: name `docs/FOUNDATIONS.md` and the active domain authorities or ADRs the PRD touches, apply the §29 alignment checklist, affirm non-contradiction with them, and flag any deliberate exception to the steward before implementation.

## Out of Scope

A description of the things that are out of scope for this PRD.

## Further Notes

Any further notes about the feature. When the synthesized requirements rest on provisional or unratified decisions (e.g., an interview the user never answered), say so here and mark them open to veto before grooming. Include the literal marker `Seam confirmation:` and record the outcome either way (answered: name the seams ratified; timed out: open to veto), so a groomer can tell which parts of the PRD stand ratified and which do not.

</prd-template>
