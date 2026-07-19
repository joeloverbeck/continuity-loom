# PRD-ready determination — Cast Member Dossier Draft Import (Clipboard Round-Trip)

Status: PRD-ready determination only. No tracker, code, spec, or doc mutation was performed by this prep beyond writing this file.

## Header

- **Source artifact:** `reports/cast-member-record-field-guide.md` (whole guide, including the "Suggested LLM output shape" section). Durability: tracked, clean, and visible at `origin/main` (verified via `git ls-tree origin/main`), so it is a stable citation.
- **Implementation-surface evidence:** `packages/core/src/records/cast-member.ts` (strict zod `castMemberSchema`), `packages/core/src/records/cast-member-sections.ts` (`castMemberSectionModel`), `packages/web/src/records/CastMemberEditor.tsx` (react-hook-form editor with `payload` prefill prop), `packages/web/src/records/RecordBrowser.tsx` (linked ENTITY→CAST flow prefills `payload={{ entity_id }}`; `entity_id` renders as a reference `<select>`).
- **Authored artifact status:** this file is new/untracked at creation time; it is not a stable citation until committed and pushed.
- **Freshness snapshot:** branch `main`, HEAD `45160f9`, in sync with `origin/main` (0 unpushed commits). Pre-existing unrelated worktree dirt: five modified `.claude/skills/**` files, enumerated in Freshness And Boundaries (none touched by this prep).
- **Tracker freshness:** `gh issue list --state open` returned zero open issues. Searches for "cast" and "import" found only closed items: #103, #106, #111, #116 (adjacent cast-creation UX, all shipped), and PRD exemplars #84, #91, #94, #97. No overlap with a dossier-import feature.
- **Session decisions:** all product decisions below were user-ratified in the same-session grilling interview; none are provisional.

## Reassessment Verdict

- The Cast Member authoring bottleneck is real and unaddressed: today the user manually shuttles `reports/cast-member-record-field-guide.md` to an external LLM and retypes the structured response field by field.
- Recommended first PRD: a **clipboard round-trip** — a Copy button that puts a self-contained, record-free **Cast Member draft prompt** on the clipboard, and an Import affordance that parses the pasted structured JSON response locally, tolerantly prefills the draft form per field, and shows an ephemeral import report. The app never contacts any LLM for this feature.
- No FOUNDATIONS amendment is required. No new §9.1 assistance source profile, no compiler-contract change, no server endpoint.
- Follow-on candidates: none ratified (the in-app OpenRouter variant was rejected, not deferred).
- Supporting-skill result (domain modeling): no glossary file or ADR owed; one term sharpened — **Cast Member draft prompt** (avoid "extraction prompt": invention is sanctioned by the ratified invention policy). The ratified template doc is the term's authority home.
- External research: used (structured-output reliability and paste-format consensus), see Evidence Checked.

## Evidence Checked

| Decision surface | Ratified outcome | PRD impact |
| --- | --- | --- |
| Flow architecture | Clipboard round-trip; app never calls an LLM; copied prompt contains zero project data | Core product rule |
| Copy payload | Self-contained draft prompt: role framing, per-field semantics distilled from the field guide, rules, strict output contract — one fenced JSON object, exact `castMemberSchema` field names, never `entity_id`, plus `uncertainties` and invented-fields lists | Prompt template scope |
| Invention policy | The prompt instructs the external LLM to invent character-fitting, memorability-enhancing material for fields the dossier cannot fill, rather than omitting them; inventions are listed so the report can flag them for review | Prompt template scope; supersedes the field guide's evidence-only rule |
| Import policy | Tolerant per-field: lenient envelope parsing (fenced JSON or JSON surrounded by prose), import every field that validates, skip only invalid/unknown fields with named reasons, never silently drop, never auto-save | Import behavior scope |
| Import report | Ephemeral three-band report: filled / skipped-with-reason / needs-you (`entity_id` selection, uncertainties, invented fields); no persistence, no project-store or browser residue | Import behavior scope |
| Placement & merge | Copy + Import on the Cast Member editor in create (including linked flow) and edit modes; paste-present fields overwrite after a confirmation listing them; absent fields untouched; the form's `entity_id` is always preserved | UI scope |
| Doc authority | New domain-authority doc `docs/cast-member-draft-prompt-template.md`, registered in `docs/ACTIVE-DOCS.md` in the same change; template implemented and versioned in `@loom/core` with a drift test asserting every `castMemberSchema` field appears in the prompt; `reports/cast-member-record-field-guide.md` archived per `docs/archival-workflow.md` when the feature ships | Doc + core scope |
| Artifact home | This file at `reports/cast-member-draft-import-prd-prep.md` | Prep only |

Prior art and research that shaped the candidate set:

- Closed #103/#106/#111/#116: cast creation is already guided through an ENTITY prerequisite with a linked creation/activation handoff; the `payload` prefill prop used by #116 is the import seam.
- Existing assistance surfaces (Ideate, Record Hygiene, Segment Reconciliation) are in-app OpenRouter surfaces with copy-prompt affordances but no paste-back ingestion; this PRD introduces the first paste-back import, governed by FOUNDATIONS §26/§26.1.
- External research (web): JSON is the consensus paste format for LLM structured output; schema-plus-example-plus-strict-rules prompting is the reliability pattern; prompt-only structured output fails roughly 5–20% of the time in production, which motivated the tolerant per-field import. Key sources: aipromptarchitect.co.uk structured-output guide, tianpan.co production structured-outputs writeup.

## Authority Findings

- **FOUNDATIONS needs no amendment.** The draft prompt is static, versioned template text containing zero project records, story config, or user data, so it reads no §9.1 source profile and adds no prompt class. The import side is an LLM-assistance surface under §26/§26.1 and the PRD must satisfy those rules explicitly: opt-in per invocation; quarantined output (the unsaved draft form plus a clearly labeled ephemeral report); mandatory provenance (imported-vs-invented-vs-uncertain visibility); no automatic record mutation (nothing saved until the user saves); no residue on rejection (§29.9: no project-store, prompt, log, or persisted-browser residue; no localStorage).
- **No compiler-contract or prose-template change.** The prose prompt class, assistance source profiles, and `packages/core/src/version.ts` prose/compiler/contract versions are untouched. The draft prompt gets its own version identity in core.
- **Doc changes owed through the PRD, not yet made:** create `docs/cast-member-draft-prompt-template.md` (domain authority) and register it in `docs/ACTIVE-DOCS.md` in the same change; archive `reports/cast-member-record-field-guide.md` per `docs/archival-workflow.md` at ship time, since the ratified invention policy supersedes its evidence-only extraction rules.
- **Section 29 alignment:** the feature passes the §29 checklist as scoped — no hidden prompt context, no working-set mutation, no automatic canon, no validation weakening, no network traffic, no key exposure. §29.11 quality checks apply normally.

## Recommended First PRD

### PRD: Cast Member Dossier Draft Import — Clipboard Round-Trip with Tolerant Per-Field Import

- **Purpose:** remove the highest-friction authoring step — manually transcribing an external LLM's structured character draft into the Cast Member editor — without giving any LLM authority over records.
- **Sources:** `reports/cast-member-record-field-guide.md` (superseded as operational tool by this PRD's template doc); the implementation-surface evidence in the Header; FOUNDATIONS §17, §26, §26.1, §27, §29.3, §29.9.
- **Problem:** the CAST MEMBER record's ~50 fields are its value and its cost. The existing workflow (paste field guide + dossier into ChatGPT-Pro, then retype the response field by field) is slow, error-prone, and bypasses no friction the app could not absorb.
- **Recommended product rule:** the app ships a versioned, record-free **Cast Member draft prompt** the user copies to any external LLM, and a local, tolerant, per-field **dossier draft import** that prefills the editor form as a quarantined draft with a three-band ephemeral report; the user remains the sole continuity authority and the only writer of the record.
- **Scope:**
  1. `@loom/core`: draft-prompt template (self-contained; per-field semantics; invention policy; strict single-fenced-JSON output contract with `uncertainties` and invented-fields lists; never `entity_id`), its version constant, and a drift test asserting every `castMemberSchema` field appears in the template; pure parse/map/report functions (lenient envelope extraction, per-field zod validation, skip-with-reason accounting, `entity_id` and unknown-key stripping).
  2. `@loom/web`: Copy-draft-prompt and Import affordances on the Cast Member editor in create (including linked flow) and edit modes; paste dialog; overwrite-confirmation listing affected fields; three-band import report; form prefill via the existing `payload`/reset seam; no persistence of paste, report, or draft beyond the mounted editor.
  3. Docs: `docs/cast-member-draft-prompt-template.md` as domain authority, registered in `docs/ACTIVE-DOCS.md`; archive `reports/cast-member-record-field-guide.md` per `docs/archival-workflow.md`.
  4. No server changes, no OpenRouter involvement, no schema changes.
- **Acceptance:**
  - Copying produces the full template text; a schema field added to `castMemberSchema` without a template update fails the drift test.
  - Importing a fully valid response prefills every present field, preserves the form's `entity_id`, and reports all three bands correctly.
  - Importing a partially invalid response (bad enum, unknown key, empty string, missing sections) imports the valid remainder, names each skip with its reason, and never silently drops anything.
  - Import never performs a save; cancel/clear leaves no project-store, working-set, or persisted-browser residue.
  - Overwrite confirmation appears exactly when paste-present fields would replace non-empty form values, and lists them.
  - Invented fields and uncertainties from the response surface in the report and are never written into the record payload.
  - Canonical gates pass: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.
- **Likely issue slices (if decomposed):** core template + drift test; core parse/map/report; web copy affordance; web import dialog + report + merge/confirm; docs + registry + archival closeout.
- **Out of scope:** any OpenRouter or in-app LLM call for this feature; a new §9.1 source profile or prompt class; import for other record types; automatic record creation or mutation; storing pastes, reports, or drafts; letting the external LLM choose or emit `entity_id`; prose-template or compiler-contract changes.

## Follow-On Candidates

None ratified. The in-app OpenRouter drafting surface was explicitly rejected as a candidate (not deferred); revisiting it would be a new determination.

## Coverage Follow-Up

- After ship, a `playtest`-skill session exercising the copy → external-draft → import → review → save loop would provide field evidence for the report bands and merge/confirm behavior. Evidence-only; it becomes product work only if the playtest surfaces defects.

## Rejected Or No-Op Alternatives

- **In-app OpenRouter drafting surface:** rejected — requires a new §9.1 source profile (FOUNDATIONS + compiler-contract amendment), binds the flow to the user's OpenRouter models, and costs credits; the user's frontier-model workflow lives outside the app.
- **Phased program (clipboard now, in-app later):** rejected — the user chose the pure clipboard flow; no deferred in-app candidate is recorded.
- **Skeleton-only copy payload:** rejected — preserves the two-artifact shuffle the feature exists to remove.
- **YAML output contract:** rejected — needs a new parser dependency and is whitespace-fragile from LLM output; JSON parses with `JSON.parse` plus the existing zod schema.
- **Strict all-or-nothing import:** rejected — external structured output fails often enough that whole-paste rejection reinstates the bounce-back friction.
- **Create-only placement:** rejected — dossier refreshes for existing characters would return to manual field entry.
- **Keeping the field guide active alongside the template doc:** rejected — two field-semantics authorities with contradictory invention rules is exactly the duplicate-authority drift the repo's change-intake rules forbid.
- **UI-copy-only prompt (no doc, no core version):** rejected — breaks the house pattern that every prompt surface has a domain authority, and nothing would catch schema-prompt drift.
- **FOUNDATIONS amendment:** no-op — not needed under the ratified architecture.
- **CONTEXT.md / ADR creation:** no-op — FOUNDATIONS plus per-surface template docs are the project's authoritative vocabulary (deference rule); the decision is reversible and unsurprising, failing the ADR test.

## PRD Publication Inputs

- **Suggested title:** `PRD: Cast Member Dossier Draft Import — Clipboard Round-Trip with Tolerant Per-Field Import`
- **Publication package:** one PRD. All ratified decisions share one surface (the Cast Member editor), one seam family, and one acceptance proof; no multi-PRD program.
- **Recommended testing seams (checkpoint still owed):** primary seam in `@loom/core` — pure functions for template rendering (drift test against `castMemberSchema`) and parse/map/report (table-driven fixtures for valid, partial, malformed, and adversarial pastes). Secondary seam in `@loom/web` — existing editor-level component tests for copy, import dialog, overwrite confirmation, report rendering, and `entity_id` preservation. No server seam (no server changes). The `/to-prd` Step 2 seam confirmation was **not** performed by this prep and remains owed.
- **`/to-prd` consultation:** consulted for house style only (PRD body shape, source durability, publication package, seam and label inputs). No draft, staging, publication, or label operation was performed.
- **Likely label:** `enhancement` + `needs-triage` (house pattern for PRDs, per exemplars #84/#91/#94/#97; both labels already exist). Downgrade/hold conditions: any applicable browser-visible checklist item without a concrete PRD home keeps it `needs-triage`; `ready-for-agent` is for fully specified implementation issues after decomposition.
- **Issue-tracker and triage-label docs consulted:** `docs/agents/issue-tracker.md`, `docs/agents/triage-labels.md`.
- **Citations for the PRD:** FOUNDATIONS §4.1, §9/§9.1, §17, §26, §26.1, §27, §29.3, §29.9, §29.11; `docs/ACTIVE-DOCS.md` (registry rule and change-intake rules); `docs/archival-workflow.md`; `docs/story-record-schema.md` §5; `reports/cast-member-record-field-guide.md`; closed issues #103, #106, #111, #116 (adjacent prior art).
- **Browser-visible guidance checklist mapping** (all items applicable; the PRD must give each a concrete section home):
  - `entry point and availability`: Copy + Import on the Cast Member editor, create (including linked ENTITY→CAST flow) and edit modes; always available when the editor is open.
  - `user-visible states, actions, and outcomes`: copy action and confirmation; paste dialog; prefilled-draft state; three-band report; overwrite confirmation listing affected fields.
  - `validation, warning, error, and recovery behavior`: unparseable-paste error; per-field skip reasons; confirm/cancel recovery; nothing saved on any path until the user saves.
  - `prompt preview contents and freshness`: the draft prompt is static versioned template text copied verbatim — no compiled project state; freshness is the template version alone, and the copied text is fully user-readable.
  - `user-initiated external LLM boundary`: no path in this feature makes a provider call; the external LLM interaction happens entirely outside the app via the user's clipboard.
  - `canon and prose boundary visibility`: imported values are a quarantined draft, not a record, until the user saves; invented fields and uncertainties are labeled review material and never enter the payload.
  - `persistence, migration, export, and provenance`: nothing persists except the record the user explicitly saves; paste, report, and unsaved draft leave no project-store or browser residue; the report shows what came from the paste versus what needs the user.
  - `browser and accessibility regression scenario`: editor-seam component tests covering keyboard operation and accessible names for the import dialog, report, and confirmation.
- **Canonical gates:** `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`. **Focused gates:** core drift test; core parse/map/report fixture suite; web editor import interaction tests.
- **Evidence expectations:** unit and component coverage at the seams above; optional post-ship playtest evidence per Coverage Follow-Up. No cold-LLM evaluation is required (no in-app LLM behavior), though a one-shot manual round-trip with a real external LLM is a sensible smoke check during implementation.
- **Source durability warnings:** none for the cited source (tracked, clean, publication-ref-visible). This prep file itself is new/untracked until committed; commit it before treating it as a stable citation in the published PRD.

## Completion Self-Check

- `/to-prd` consulted for house style only: yes; no publication steps run.
- Source posture: durable (tracked, clean, publication-ref-visible). Authored artifact: new/untracked at write time.
- Tracker freshness: zero open issues; relevant closed IDs #103/#106/#111/#116 and PRD exemplars #84/#91/#94/#97.
- Selected first PRD: stated above; follow-on candidates: none ratified; coverage-only: optional playtest.
- Testing seam recommendation recorded; `/to-prd` seam checkpoint still owed.
- Likely label and downgrade conditions recorded; label docs consulted.
- Canonical and focused gates recorded.
- Machine-local path sweep: no machine-local paths; all citations are repo-relative or tracker IDs.

## Freshness And Boundaries

- Refreshed this session: tracker state, git baseline, FOUNDATIONS/ACTIVE-DOCS/agent-doc reads, implementation-surface reads, external web research.
- Not done: no code, doc, spec, ticket, or tracker changes; no `/to-prd` publication; no seam ratification; no app run or test run (no code changed).
- Pre-existing worktree dirt preserved (all unrelated to this prep, none touched by it): modified `.claude/skills/implement/SKILL.md`, `.claude/skills/implement/references/closeout-templates.md`, `.claude/skills/implement/scripts/validate-closeout-body.mjs`, `.claude/skills/implement/scripts/validate-closeout-body.test.mjs`, `.claude/skills/tdd/closeout-evidence.md`.
- Files intentionally added by this prep: `reports/cast-member-draft-import-prd-prep.md` (this file) only.
