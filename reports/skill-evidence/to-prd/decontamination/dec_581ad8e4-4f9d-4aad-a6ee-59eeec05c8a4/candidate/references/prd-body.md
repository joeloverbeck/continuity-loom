# PRD Body Contract

Read this file in full before drafting each intended PRD in Step 3 of
[`to-prd`](../SKILL.md).

## Conformance rules

- Begin with an untitled provenance and ratification preamble; do not repeat the
  issue title as an H1.
- Include every section in the template below.
- User Stories are a long numbered list. Each line must match
  `As an <actor>, I want <feature>, so that <benefit>` with the literal commas.
- Implementation Decisions record every `resolved default` with its evidence;
  `still open` decisions remain in Further Notes and affect the label.
- Testing Decisions describe external behavior, name tested modules/surfaces and
  descriptive prior art rather than test-file paths, and contain the literal
  `Seam confirmation:` marker.
- Principles names `docs/FOUNDATIONS.md`, relevant active domain authorities and
  ADRs, applies Section 29, and flags any deliberate exception before work starts.
- Further Notes also contains `Seam confirmation:` with the answered seams or
  timeout/open-to-veto disposition.

Do not prescribe volatile source file paths, private function/variable names, or
implementation snippets. Stable schema identifiers, route names, controlled
vocabulary, and citations to principles, ADRs, specs, prior issues, or methods
are allowed. When a prototype expresses a decision more precisely than prose,
include only the decision-rich state/schema fragment and identify it as such.

## Template

<prd-template>

[Untitled preamble: provenance, preceding commitment or program position, and
ratification state.]

## Problem Statement

The user's problem.

## Solution

The user-visible solution.

## User Stories

1. As an <actor>, I want <feature>, so that <benefit>

Cover normal behavior, boundaries, failure/recovery, accessibility, persistence,
security, migration, and implementation stewardship where applicable.

## Implementation Decisions

The settled product, interface, data, interaction, and architectural decisions,
including evidence-backed resolved defaults. Do not hide open decisions here.

## Testing Decisions

State the external-behavior rule, tested surfaces, descriptive same-kind prior
art, and implementation gates.

Seam confirmation: <answered with named seams, or timed out with unchanged
existing seams open to veto>

## Principles

Name and apply the touched governing authorities and any deliberate exception.

## Out of Scope

Explicit exclusions and deferred program entries.

## Further Notes

Provisional decisions, dependencies, source posture, sequence, and other
publication context.

Seam confirmation: <same disposition as Testing Decisions>

</prd-template>

