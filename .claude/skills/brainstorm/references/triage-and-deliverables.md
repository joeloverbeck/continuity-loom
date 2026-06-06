# Triage & Deliverables

Detailed rules for two SKILL.md branches: the triage recommendation (Step 3 §Triage brainstorms) and deliverable classification (Step 5). Also collects the Step 4 design-presentation carve-outs.

---

## Triage recommendation structure

Used when the brainstorm evaluates a report, finding-set, or diagnostic question and produces work items, instead of proposing approaches.

### Per-item structure

Each triage item has:

1. **verdict** — one of the types below.
2. **rationale** — 1-2 sentences naming the FOUNDATIONS / codebase / contract grounds.
3. a **conditional sub-field** — `modification scope` (for accept-with-modification) / `alternative path` (for reject) / `deferred_to` (for defer) / `verification source` (for refuted-by-verification). Absent for accept / already-resolved.

### Verdict types

| Verdict | Sub-field | Use when |
|---|---|---|
| `accept` | none | item warrants action as recommended |
| `accept-with-modification` | `modification scope` | item warrants action with refinements (scope-narrowed, severity-shifted, technique-substituted) |
| `reject` | `alternative path` | item declined with no positive scheduling intent; pair with what to do instead (or "none") |
| `defer` | `deferred_to` | item judged sound but routed to a follow-up deliverable; names the follow-up shape + the trigger condition for re-evaluation |
| `already-resolved` | none | re-triage case: the item was actioned between the original pass and this one; cite the resolving artifact + date |
| `refuted-by-verification` | `verification source` | the item's claimed gap or premise is disproved by codebase/contract verification at triage time; quote the file:line evidence |

The seven-bucket vocabulary is closed — don't coin new verdicts. A user-elected skip ("skip the polish for now") is a `defer` whose trigger is the user's batch-scoping choice. An item whose premise is refuted but carries a valid residual best folded into another finding uses the dominant verdict plus a rationale cross-reference to the absorbing item's ID.

### Per-item identifiers

Derive from the source report's own numbering when present (`P1`, `R10`, `F-01`). When unnumbered, use `R<N>` for source-report items. Use `O<N>` for **out-of-report** findings (auditor-discovered, no presence in the source report) — always the literal `O<N>` prefix so they're unambiguous in cross-references. IDs must be stable so the user can reference them by number. When a prior triage on the same surface already used `O<N>` keys, continue the numbering (start at the next free integer, e.g. `O5`) or round-prefix (`R3-O1`) so cross-round cross-references stay unambiguous.

### Grouping & out-of-report findings

Group items by verdict bucket so the user can scan by shape (all accept together, all reject together, etc.). In cross-references and the verdict field itself, use the canonical lowercase-hyphenated form (`accept-with-modification`).

Findings discovered during exploration that are NOT in the source report (adjacent pre-existing bugs, schema drift) go in a separate **out-of-report findings** sub-section AFTER the verdict buckets, keyed `O<N>` — not a new verdict bucket. But a correction that refutes a *source-report item's* premise HAS presence in the report, so it's a `refuted-by-verification` (or `already-resolved`) verdict keyed `R<N>` in the buckets. Corrections that reframe the whole triage (tied to no single item) go in the triage lead or a verification headline before the buckets.

### No-source-report diagnostic case

When the request is a diagnostic question or exploration prompt rather than a formal report ("figure out why X", "what's happening with Z"), there's no source report to evaluate verdicts against:

- **Check for a prior triage of this surface first.** A no-source-report conformance/diagnostic *re-audit* is the common case where an earlier `docs/triage/` record already exists; glob/grep `docs/triage/` (and existing `tickets/`/`specs/`) for the same spec or surface **before** forming findings, and frame the pass as a delta — don't re-propose a deliberately-deferred or already-rejected item as fresh. This discovery is also the precondition for the §User-pre-authorization reversal-check (surface a prior-decision reversal before the scope `AskUserQuestion`).
- **Omit the verdict-bucket section entirely** — the verdicts are defined against source-report items.
- **Route all findings to the out-of-report sub-section**, keyed `O<N>`. The answers to the user's questions ARE the findings — emit them as `O1`, `O2`, …, not as synthetic `R<N>` items restating the questions.
- **The closing structure still applies.**
- **When the diagnostic resolves to a recommended *action* (not a set of independent work items)** — i.e. the question is "what should we do about X?" and the answer is one course of action weighed against alternatives — the `O<N>` findings carry the *answer* (the diagnosis), and the close borrows Step 3's recommendation shape in place of (or alongside) the deliverable-shape recommendation: name the recommended action upfront, then the rejected alternatives with their grounds, then any optional add-ons. This is the sanctioned blend for action-shaped diagnostics; don't force an action choice into the flat `O<N>` finding list.
- **When the request is a conformance audit against an authority doc/contract** ("ensure the implementation matches `story-record-schema.md`", "verify X conforms to `compiler-contract.md`") — a frequent no-source-report shape — group the findings by *remediation route* (fix-code / amend-authority-doc / no-action-affirm) rather than by the report-oriented verdict types, since the natural disposition of each discrepancy is which side moves (code or doc). Keep the `O<N>` keying (the closed identifier convention still holds — don't coin an `F<N>` prefix), and include a brief affirming "what already conforms" note so the audit reads as coverage, not just a defect list. The remediation route is the per-item disposition; a "judgment-call" discrepancy (code-or-doc unclear) is surfaced as its own item with the recommendation and the rejected alternative.

### Closing structure

Close every triage recommendation with:

1. **Deliverable-shape recommendation** — one spec / N tickets / mixed batch / in-place edits, per §Deliverable classification.
2. **Named assumptions** — remaining gaps in the format `(N) X — assuming Y`.

For a multi-deliverable triage (≥2 specs or ≥3 tickets), make the finding→deliverable mapping explicit in the recommendation (either inline `R3 — <summary> → SPEC-002`, or a `deliverable → findings` map) so the user can see which accepted finding lands where at approval time.

**`AskUserQuestion` vs named-assumptions at close-out:** if a remaining gap is material-deliverable-shape (changes deliverable type / scope / count), prefer `AskUserQuestion` to settle it before proceeding — even under auto mode or pre-authorization — because a shape mismatch requires rewriting rather than refining. For content-level gaps within a stable shape, prefer `AskUserQuestion` outside auto mode; under auto mode or pre-authorization, default to named-assumptions plus the design-approval gate.

### Worked skeleton

```markdown
## Verification headline (only if a correction reframes the whole report; else omit)

## Triage verdicts

### Accept
- **R<N>** — <summary>[ → <target deliverable, for multi-deliverable triages>]. _Rationale_: <grounds>.

### Accept-with-modification
- **R<N>** — <summary>. _Modification scope_: <refinement>. _Rationale_: <grounds>.

### Defer
- **R<N>** — <summary>. _Rationale_: <reason>. _deferred_to_: <follow-up>; re-evaluate when <condition>.

### Reject
- **R<N>** — <summary>. _Alternative path_: <what to do instead, or "none">. _Rationale_: <grounds>.

### Refuted-by-verification
- **R<N>** — <summary>. _Verification source_: <file:line / grep / agent finding>. _Rationale_: <verbatim evidence>.

## Out-of-report findings (auditor-introduced)
- **O<N>** — <description>. <Resolution: landed in <site> | flagged for follow-up>.

## Deliverable-shape recommendation
<one spec / N tickets / mixed batch — per §Deliverable classification; finding→deliverable map for ≥2 deliverables>

## Named assumptions
(1) <unknown> — assuming <assumption>; (2) ...
```

---

## Deliverable classification

The full per-type rules behind SKILL.md Step 5's quick-triage table.

- **Inline ops/setup task or mechanical-fix batch** — small tooling/ops work or a bounded mechanical-fix batch executed inline with no persisted design artifact (repo setup, local config, a short pre-approved sequence). Skip both the `docs/plans/` design doc and the Step 6 menu; the deliverable is the in-conversation design plus a post-execution summary. The HARD-GATE still requires explicit approval of the consolidated design before executing. The file edits/new files ARE persisted — only the design doc is elided.

- **Approved code fix / behavior change implemented inline** — a substantive fix to application source (e.g. `packages/*/src`) that emerges from a diagnostic triage or an approved design and is implemented in-session, optionally test-driven (red → green → lint/typecheck/test gate). Distinct from a *mechanical*-fix batch: it may introduce new types, functions, or tests, but it stays bounded and code-only (no spec/ticket/design-doc artifact). Skip both the `docs/plans/` design doc and the Step 6 menu; the deliverable is the code change plus a post-execution verification summary (what was reproduced, the gate results). The HARD-GATE still requires the design/triage to be approved — or pre-authorized — before editing; file edits ARE persisted, only the design doc is elided. Do not commit — leave for user review. When the work spans several cycles in one session, each new cycle re-enters at Step 1 and emits its own post-exploration confidence anchor (SKILL.md Step 6).

- **New skill design** — the deliverable is the skill file at `.claude/skills/<name>/SKILL.md`; the skill file IS the design, so skip the `docs/plans/` doc. Adjust the Step 6 menu (omit "create a spec"). In plan mode, write the plan file first; write the full SKILL.md as the first post-approval implementation step.

- **Modify existing skill file(s)** — the edits ARE the design; skip the design doc. For a merge, include the new unified file, deletion of superseded directories, and updates to any cross-references.

- **Project documentation & root instruction/config files** — edits to (or creation of) `README.md`, `docs/*.md`, or root agent-instruction/config files (`CLAUDE.md`, `AGENTS.md`) where the doc IS the deliverable; the content IS the design. The Step 6 menu may be omitted when it completes inline in the same turn. (A root instruction file matches neither the `README.md` nor `docs/*.md` glob literally but is handled identically — inline-completion, menu-skip.)

- **New dev-tooling/CI/config file** — a created tooling/CI/config file (`.github/workflows/*`, lint/format/build config) where the file IS the deliverable; the file content IS the design. Created in place; the Step 6 menu may be omitted when it completes inline in the same turn. Verify the commands/actions the file invokes (build/test/lint scripts, action versions) before writing, as for any operator-introduced premise.

- **Amend `docs/FOUNDATIONS.md`** — a constitutional change. Per FOUNDATIONS §1, the constitution is amended deliberately and on purpose. Present the amendment explicitly as a constitution change, name the principle(s) affected and the downstream specs/features the change unblocks or invalidates, and require explicit user sign-off before writing. Skip the design doc — the amendment IS the deliverable.

- **Port external skill** — deliverable is (a) the new skill file, (b) deletion of the reference source once verified, and (c) a transformations table enumerating per-element strip/replace/preserve decisions (one row per substitution site, not per source line). The approach focuses on identifying extraneous source-repo elements and their repo-appropriate replacements. A substitution not itemized in the table is out of scope until itemized. **Co-ported dependency files**: a ported skill often depends on co-ported files from the source repo (templates, READMEs, referenced docs the skill hard-depends on); itemize each as its own strip/replace/preserve row — they typically carry the same source-repo residue as the skill itself, and a dependency file not itemized is out of scope until itemized.

- **Replaces an existing artifact** — include (a) confirmed deletion of the old artifact, (b) a check for cross-references to it (in other skills, `README.md`, memory), (c) a note of the replacement in the deliverable.

- **System spec** — deliverable is the spec in `specs/`; the spec IS the design, so skip the design doc. **Section structure**: if a drafting-rules file or an existing spec in `specs/` establishes a convention, follow it; otherwise use the canonical section set that the `reassess-spec` and `spec-to-tickets` skills parse — Problem Statement, Approach, Deliverables, FOUNDATIONS Alignment, Verification, Out of Scope, Risks & Open Questions — and add a top-of-file note that the default structure was used. An existing spec under `archive/specs/` does **not** set the convention, even if it was successfully decomposed; the canonical section set is authoritative for new `specs/` files regardless of archived house style. This rule governs only the *tooling-parsed section set* — non-parsed preamble embellishments the established SPEC series uses (e.g. a `Primary authority docs:` / `Supporting authorities:` split, a `> Section style note:` blockquote) MAY mirror the series for consistency. To make that mirroring actionable rather than passive: while scanning `archive/specs/` for the highest ID (see Spec-ID assignment below), open the most-recent archived spec and copy its preamble embellishment style — the `Depends on:` enumeration form, the `Primary/Supporting authority` split, the section-style-note blockquote wording — so a new spec is not visibly inconsistent with its own tightly-uniform series. Do **not** adopt the `docs/requirements-version-1/*` requirements-doc house style (Purpose / Scope / Non-goals / … / Done Means) for a `specs/` file — those are requirements documents, not specs, and the spec tooling keys off the canonical section names. The Problem Statement should capture the motivation, evidence, and key "considered X, chose Y because Z" decisions from the brainstorm; a Brainstorm-Context / provenance header MAY additionally prefix the spec. For a lightweight spec that header is brief (original request, references, final confidence + assumptions). For a **codebase-grounded or roadmap/phase spec** the preamble may legitimately be substantial and SHOULD additionally carry (a) a *premise-verification* block citing `file:line` evidence that each operator-introduced design premise holds — the Step 4 "verify operator-introduced premises" rule, recorded inline so the downstream `reassess-spec` / `spec-to-tickets` skills inherit the verification (because they trust it, each `file:line` placed here must be operator-verified by Read/grep, not relayed from a sub-agent report whose line ranges may be off) — and (b) a *scope-decisions* block recording the confirmed scope-edge choices and their rationale. These two blocks are what make such a spec self-contained for decomposition; do not compress them away in the name of brevity. A roadmap/phase-driven spec MAY also carry a lightweight status header block (`Status:` plus, when relevant, `Phase`, `Depends on`, and `Governing authority`); a newly drafted spec's initial status is `DRAFT` (flipped to `COMPLETED` at archival). **Spec-ID assignment**: scan `specs/` **and `archive/specs/`** (plus any other spec home this repo uses) for the highest existing `SPEC-NNN` and claim the next integer (first spec is `SPEC-001`). Scanning `specs/` alone is wrong under the `specs/` → `tickets/` → `archive/` workflow, where a decomposed spec is moved to `archive/specs/` and `specs/` is routinely empty — a `specs/`-only scan would re-claim `SPEC-001` and collide with archived history. The Step 6 menu is mandatory (post-deliverable phase): offer reassess / decompose into tickets / implement / done.

- **Implementation tickets** — deliverable is the ticket file(s) in `tickets/`; the tickets ARE the design. If a ticket template exists, follow it; otherwise use a minimal Title / Context / Acceptance Criteria / Verification shape and note the template's absence. **Namespace**: tickets use per-initiative prefixes (e.g. `COMPILER-NNN`, `VALIDATE-NNN`), not one global sequence. Scan `tickets/` for existing prefixes and reuse an established one; for a fresh namespace, derive a short uppercase initialism from the deliverable's primary subject and start at `<PREFIX>-001`. Cite the namespace choice in the deliverable lead so the user can redirect. Ticket *creation* presents the Step 6 menu; ticket *update in place* is inline-completed — skip the menu and summarize the delta.

- **Triage producing ≥2 specs or ≥3 tickets** — additionally write `docs/triage/YYYY-MM-DD-<topic>-triage.md` summarizing the source report, accepted items (with the full path to each spec/ticket + a one-line rationale), dismissed items (one-line reason each), and identified-but-unactioned follow-ups. Keep it under ~80 lines; reference deliverables by path rather than duplicating their content. This makes the brainstorm's decisions durable without re-running it. For a single spec or fewer than 3 tickets, skip this file by default — the deliverables are sufficient history.

- **Re-audit delta against an existing triage record** — when a re-audit changes the disposition of items in an existing `docs/triage/YYYY-MM-DD-<topic>-triage.md` (a deferral now actioned, a "not ticketed" item now ticketed, a prior finding now refuted), update that record in place with a dated delta/addendum — even when the ≥2-spec/≥3-ticket new-companion threshold isn't met — so the durable decision trail stays truthful. Cite the new ticket/spec paths; don't silently leave a stale "deferred, not ticketed" note.

- **Triage analysis, all deliverables deferred** — when the brainstorm emits verdicts but produces no spec/ticket now (everything deferred) yet the user wants the verdicts persisted, write the decision record to `docs/triage/YYYY-MM-DD-<topic>-triage.md` with the full triage (source, per-item verdicts + rationale, recommended shape, named assumptions). The file IS the deliverable, so it carries full verdict content (the ≤80-line companion budget does not apply). Step 6 offers: re-invoke `brainstorm` on this file to produce the deferred deliverables / adjust a named assumption / done.

- **Design doc (default)** — when none of the above fit, write `docs/plans/YYYY-MM-DD-<topic>-design.md`, where `<topic>` is a kebab-case short name. Consolidate all approved sections into a clean document with a "Brainstorm Context" header (original request, reference file, load-bearing decisions, final confidence + assumptions). In plan mode, write to the plan file instead.

- **Research brief** — a self-contained markdown report at `reports/<topic>-research-brief.md` targeted at an external researcher/LLM whose findings feed a later design. Inline all schemas, evidence, terminology, hard constraints, and explicit research questions, since the audience has no repo access. For product-behavior topics, include a non-negotiable-constraint section naming the FOUNDATIONS principles the topic engages and any rejection criteria future recommendations must satisfy. Optimize for completeness over brevity. Step 6: feed the brief to the researcher / wait for findings.

**Deliverable pivot.** If the user redirects the deliverable type mid-brainstorm ("actually, make this a spec"), reclassify and adjust the flow; don't re-confirm — they told you what they want. When the request pre-authorizes a choice among types ("ticket or spec, whichever fits"), the operator may select based on scope evidence from exploration without re-prompting — cite the scope basis in the deliverable lead.

When persisting ≥3 files, track one task per file so progress is visible. Do NOT commit any deliverable — leave it for user review.

---

## Design-presentation carve-outs

Detail for the Step 4 carve-outs. Each keeps the HARD-GATE — explicit approval of the consolidated artifact (or the per-tier unit) is required before any write.

- **Small-deliverable carve-out.** When the design comprises ≤4 distinct *decisions* (user-approveable choice points where the user could meaningfully redirect — atomic facts following from a parent decision count with the parent) AND confidence is ≥85%, present the design as a single structured artifact (a transformations table, a bullet list of decisions, a short enumerated summary) approved in one turn. Permitted by default under auto mode; outside auto mode, announce the consolidation. When the count is borderline, prefer consolidating — the gate that matters is "can the user review this in one turn".

- **Template-structured-deliverable carve-out.** When the deliverable has its own canonical template (a ticket template, the default spec sections, a skill file), the template provides the section navigation; present the full draft as one artifact, and one approval covers it. Covers the common case of a single template-structured deliverable with many small atomic line-items that don't decompose into the Step 4 section list. Announce the consolidation the way the small-deliverable carve-out does: present a delta summary (recommendation plus any scope confirmations) in the same turn as the write, so a same-turn write under §User pre-authorization (or the Non-plan-mode fast-track below) is never silent.

- **Multi-deliverable triage navigation.** For triage brainstorms producing ≥2 deliverables, apply the template-structured carve-out per deliverable — each spec/ticket is approved as a single consolidated draft. The triage approval covers all N deliverables together; no per-deliverable gate fires. (A companion `docs/triage/` file is a companion to the set, not a member of it, and doesn't count toward the ≥2 threshold.)

- **Non-plan-mode fast-track.** When confidence is ≥85%, a single approach is approved with named assumptions covering remaining gaps, and the deliverable is template-structured, the consolidated-draft approval may be collapsed with the approach/triage approval: present a delta summary in the same turn as the file write. For triage brainstorms the triage-recommendation approval transitively covers the write in any mode; for non-triage approach-selection the same-turn collapse needs auto mode *or* §User pre-authorization (the consolidated draft is the user's first look at the full surface, but pre-authorization independently satisfies the gate via the recommendation presentation — auto mode is not separately required when the request pre-authorized the deliverable). The material-deliverable-shape check (Guardrails §User pre-authorization) still fires before a same-turn write — if the shape shifts, confirm with `AskUserQuestion` first.

- **Re-emergent interview during design.** If the user asks a discovery-style question or requests enumeration of open decisions during Step 3/4 ("ask me the questions that need settling to amend SPEC-X"), conduct a constrained interview applying the Step 2 rules (one question per message, prefer multiple-choice, name uncertainty, recommend when delegated). Label questions (A, B, C) so the design presentation can cite them. The settled decisions feed the design; the HARD-GATE still holds.

- **Mid-design term-clarification.** When the user asks what a term you introduced means, answer inline with one self-contained explanation (diagram, worked example, or short prose), then continue the section flow — not a labeled-question sequence.

- **Mid-design scope-narrowing.** When the user requests reduced surface area after sections are approved (the architecture stays valid), recompute under the narrowed scope and announce the deltas before re-presenting; name the dropped elements with a concrete re-evaluation trigger each. Update the design doc in place unless the user asks for a fresh one. This is not a register shift and not a term clarification — don't mis-route it as either.

- **Plan-mode interaction.** Per-section approval is replaced by whole-plan approval via `ExitPlanMode`. Present key decisions inline (1-2 messages, grouping related sections) before writing the plan file, pausing after the first message for course corrections. The goal is conversation-level checkpoints, not per-section gates. When the approach is architecturally constrained (single viable option), the confidence announcement, approach proposal, and design presentation may fold into one message.
