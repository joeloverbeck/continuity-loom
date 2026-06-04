# FOUNDATIONS.md Alignment Check (Step 4)

## 4.0 Internal Contradictions

Before checking FOUNDATIONS, scan for contradictions between the spec's Problem Statement, Approach, Non-Goals/Out of Scope, FOUNDATIONS Alignment section, and Deliverables. If the spec includes a table that classifies state (e.g. "validator-blocked vs. validator-warned", "current vs. resolved record"), verify consistency across sections. A deliverable that contradicts its own Out of Scope entry is a CRITICAL Issue.

## 4.1 Alignment Section Verification

If the spec has a FOUNDATIONS Alignment section, verify each entry:

- Principle names must match `docs/FOUNDATIONS.md` (e.g. `§8 Deterministic prompt compilation`, `§11 Validation and hard fails`, `§15 POV, knowledge, secrets`, a `§29.N` hard-fail group).
- Each alignment statement must be specific — a bare "aligned" without a named mechanism is a MEDIUM Improvement finding.
- For deliverables touching validation, compilation, record authority, or POV/secrets, the statement must name the mechanism (e.g. "compilation stays deterministic because record selection is the user's explicit active working set, never an LLM ranking").

**No alignment section at all**: do not treat absence as CRITICAL by default. Surface adding one as an Addition (MEDIUM) for specs whose deliverables don't touch validation/compilation/record-authority/POV semantics. Escalate to a HIGH Issue only when a deliverable that *does* touch those semantics ships with no alignment statement anywhere — there the omission is a grounding gap.

## 4.2 Missing Principles

Identify FOUNDATIONS principles the spec should address but doesn't. Pay particular attention to:

- **§4.4 / §8 Deterministic compilation** — specs touching prompt compilation must declare that output is deterministic for identical inputs+versions and that no LLM intermediary selects/ranks/summarizes/rewrites records during compilation. Absence where compilation is touched is a HIGH Issue.
- **§9 Universal prose prompt contract** — specs that compile prompts must account for all required prompt-contract sections; omitting one without a constitutional amendment is a hard-fail (§29.4).
- **§11 Validation and hard fails** — specs proposing validation must keep it deterministic and blocking, distinguish warnings from blockers, and name what failing means. Unaddressed second-order effects are Improvement findings at minimum.
- **§13/§14/§20 Record authority & human gatekeeping** — specs that mutate records must keep human review/acceptance authoritative and must not infer canon from accepted prose. Silent mutation is a CRITICAL Issue.
- **§15 POV, knowledge, secrets** — specs touching POV/secret handling must preserve the secret firewall (no leakage the records forbid). Violations are CRITICAL.

## 4.3 Record Alignment Issues

Record each issue with the specific FOUNDATIONS principle and conflict. Cite the section heading exactly (`§11 Validation and hard fails`, `§8 Deterministic prompt compilation`). Bare citations (`FOUNDATIONS violation`) without principle names force Step 7's pre-apply verification to disambiguate.

**Determinism sub-check**: if the spec's deliverables or verification steps claim determinism, reproducibility, or byte-identical output, verify against §4.4/§8:

- No LLM intermediary in the compilation path (§29.4) — selection/ranking/summarization/repair of records during compilation breaks determinism *and* the records-as-substrate principle.
- Deterministic iteration order — rely on sorted collections or insertion-ordered maps, not incidental object-key order.
- No wall-clock time (`Date.now()`, timestamps) in canonical/compiled forms unless the spec explicitly separates a captured-at timestamp (allowed) from a canonical-form input (forbidden).

Flag determinism violations as HIGH Issues citing §8 / §29.4.

## 4.4 §29 Hard-Fail Check

`docs/FOUNDATIONS.md §29` is an alignment checklist of hard-fail questions grouped by surface:

- §29.1 Identity — autonomous story generation, plot-deciding, branching/timelines/canon-tree, plot-rail machinery, accepted prose as canon.
- §29.2 Continuity authority — LLM making authoritative record changes, inferring canon from prose, mutating records without user acceptance, hiding continuity changes.
- §29.3 Active working set — silently including/removing/compressing records, treating inactive records as branches, preventing inspection of what will be compiled.
- §29.4 Prompt compilation — LLM intermediary in compilation, nondeterministic output, accepted prose in prompts, provider hacks as core, omitting a universal-prompt-contract section.
- §29.5 Validation — generating from contradictory state, missing mandatory fields, impossible physical/perceptual/knowledge conditions, secret leakage, user override of hard failures in v1, conflating warnings with blockers.
- §29.6 POV and reveal — blurring POV/audience knowledge, secret leakage into the wrong mind, omitting secret-holder/clue/reveal fields, non-POV interiority where forbidden.
- §29.7 Physical continuity — objects changing hands without action, movement without route/time, offstage interruption without mechanism, omitting current location, treating physical continuity as optional texture.
- §29.8 Accepted prose archive — storing rejected candidates by default, using accepted segments as prompt context, not marking user edits, hiding segments, not reminding the user to update records.
- §29.9 Prompt audit and secrets — permanently archiving prompts by default, committing prompt logs to git, exposing/storing/logging API keys, failing unclearly with no key.
- §29.10 Data ownership — remote storage as sole source of truth, blocking local access, hard export/backup, opaque service lock-in.
- §29.11 Quality and workflow checks — not hard fails, but a good proposal should satisfy them (faster atomic record creation, clearer working-set selection, better validation legibility, preserved prompt inspectability, etc.).

For each §29 group the deliverable engages, answer its questions against the spec. **Any hard-fail question answered "yes" is a CRITICAL Issue** — the proposal violates the foundation and must be rejected or redesigned (per FOUNDATIONS §29's own gate). The §29.11 checks, when failed, are Improvement findings rather than Issues.

Present in Step 6 as a `### §29 Hard-Fail Check` section: one line per engaged group, each `pass | N/A | flag (reason)`. Omit the section when no §29 group is engaged.
