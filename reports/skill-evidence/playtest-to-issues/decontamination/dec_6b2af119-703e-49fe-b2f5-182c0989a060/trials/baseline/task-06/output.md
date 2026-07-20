# Decision

Stop before publication. I recommend five standalone non-PRD issues: the four supplied product tickets plus one bounded verification issue for F010. I do not recommend a PRD. No source publication, issue creation, existing-issue mutation, or routed-skill execution is authorized by the request.

The intended artifact-source posture is currently blocked. The canonical report and all three linked visual dependencies are local, dirty or untracked, and absent from the publication ref. The prep artifact is also untracked and must not be cited as durable source. Under the custody contract, the exact source paths must first receive explicit source-publication authorization and then be verified at the publication ref before issue-publication approval may be requested.

The supplied tracker snapshot is complete for this intake. None of the four packet titles has an owner. The snapshot also contains no owner for the proposed F010 verification title. Closed issues #100, #103, #109, #110, #111, and #112 are not publication targets: #100 covers F008; #103 and #111 are narrower completed work relevant to F009; the others do not own these follow-ups. No reopen, relabel, comment, or close is proposed.

# Custody checkpoint

| Non-PRD item | Disposition now | Proposed owner | Labels | Blocker | Evidence |
| --- | --- | --- | --- | --- | --- |
| F004 | `blocked` pending publication prerequisites and approval | New issue: `ENTITY prompt-eligibility guidance correction` | `bug`, `ready-for-agent` | Artifact source is not durable; issue creation is not approved | The supplied authority comparison says the browser help overstates person-ENTITY prompt eligibility while the compiler correctly includes selected non-person descriptions and excludes person descriptions. Exact-title owner: none. |
| F003 | `blocked` pending publication prerequisites and approval | New issue: `Required-list marker clarification` | `bug`, `ready-for-agent` | Artifact source is not durable; issue creation is not approved | Required list properties can lawfully contain `[]`, but the shared star implies a nonempty value. The packet preserves schema, serialization, validation, and compiler behavior. Exact-title owner: none. |
| F005 | `blocked` pending publication prerequisites and approval | New issue: `Structured-pressure warning copy correction` | `bug`, `ready-for-agent` | Artifact source is not durable; issue creation is not approved | The predicate and warning severity are correct, but the copy contradicts the supplied active recipe by treating selection of a structured pressure record as required rather than optional. Exact-title owner: none. |
| F009 | `blocked` pending publication prerequisites and approval | New issue: `Linked CAST creation and activation handoff` | `enhancement`, `ready-for-agent` | Artifact source is not durable; issue creation is not approved | Closed #103 and #111 address narrower prerequisite/name-display work. They do not own the missing linked-dossier action or explicit post-save activation handoff. Exact-title owner: none. |
| Playtest methodology pilots | `blocked` | Proposed route: `$skill-audit ".claude/skills/playtest"` | N/A | The route's current trigger, input, and state contract cannot be exact-checked from the permitted isolated evidence set | The prep assigns the Paired-Draw Check, Independent Claim Challenge, and deferred first-view witness to report-only skill audit, but the custody contract forbids freezing a skill route without reading and confirming the destination contract. The route is not executed here. |
| F010 | `blocked` pending publication prerequisites and approval | New issue: `Measure later-dossier repayment in a continuation playtest` | `ready-for-agent` only; no false `bug` or `enhancement` label | Artifact source is not durable; issue creation is not approved | This is bounded and actionable verification work: run a continuation after the dossier exists, measure the named evidence, and make no product-change claim unless a repeatable author-visible gap is found. The complete snapshot has no owner with this title. |

These are proposed dispositions only. None may be recorded as `published` until an approved creation is exact-read and family-verified. The methodology row prevents a complete custody receipt until its destination contract can be checked and the row can truthfully become `routed` or receive another disposition.

## First operational action

`publish the four bounded ticket candidates after exact-title duplicate readback, preserving their explicit-write and no-schema-change constraints`

Status: `blocked`. The duplicate result is presently clear, but the canonical source package is not publication-ref durable and neither source publication nor issue publication has been approved. F010 also remains in custody as separate verification work even though it is not one of the four product packets.

## PRD queue

| PRD candidate | Role | Disposition | Next action or proof |
| --- | --- | --- | --- |
| None | N/A | N/A | The source inventory contains no intended or deferred PRD candidate. The contemplated mandatory CAST-dossier policy is rejected by current authority and evidence; it is not a deferred candidate. |

PRD queue: exhausted. Do not invoke `/to-prd`; follow-up custody is incomplete.

## Proposed issue contracts

### ENTITY prompt-eligibility guidance correction

Scope and acceptance: correct person-versus-non-person `ENTITY.short_description` help; preserve the ENTITY-first offstage route; state that Generation Brief carries current local pressure and CAST is optional durable deepening; prove existing positive non-person and negative person compiler behavior; make no schema, payload, selection, prompt-byte, fingerprint, provider, or migration change.

Browser-visible guidance mapping: the existing ENTITY Create/Edit help remains the entry point; person and non-person states explain their actual prompt outcomes; validation and error recovery are N/A because save behavior does not change; prompt bytes and freshness remain unchanged and receive regression coverage; external-model behavior is N/A; canon/prose guidance distinguishes Generation Brief pressure from durable ENTITY/CAST authority; persistence is unchanged; keyboard and accessible-description coverage applies to both editor states.

### Required-list marker clarification

Scope and acceptance: distinguish structural property presence from a nonzero item minimum; give `ENTITY.roles_in_story` and required CAST lists that accept `[]` adjacent accessible “may be empty” guidance; preserve any real nonzero minimum; prove add/remove, save, reload, and exact empty-array round trips in generic and CAST editors; make no schema, compiler, export, payload, or migration change.

Browser-visible guidance mapping: existing Create/Edit labels and help remain the entry point; empty-lawful, populated, and true-minimum states get distinct wording; validation behavior stays unchanged while the false missing-value implication is removed; prompt preview and external-model behavior are N/A; canon/prose authority is N/A because this is structural form guidance; persistence retains exact arrays; keyboard, screen-reader, add/remove, save, and reload coverage spans both editor families.

### Structured-pressure warning copy correction

Scope and acceptance: replace the title, summary, and fastest-action copy with neutral absence-of-structured-pressure language; say generation may proceed when the local directive/current state is sufficient; retain the exact predicate, warning severity, clearing condition, readiness, and provider gating; render the same warning family on Generation Brief, Prompt Preview, and Generate; add no prose heuristic or suppressor.

Browser-visible guidance mapping: all three existing readiness surfaces remain available and nonblocking; absent-record and selected-record states retain deterministic outcomes; warning target, optional action, and recovery condition are explicit; preview bytes and freshness stay unchanged; Generate remains the sole provider action and is neither triggered nor newly blocked; free-form prose gains no validation authority; there is no persistence change; shared readiness tests cover status semantics, copy, actions, accessibility, and keyboard use on all three pages.

### Linked CAST creation and activation handoff

Scope and acceptance: offer `Create linked CAST MEMBER` only for an active, unarchived person ENTITY with no current link; offer `Open linked CAST MEMBER` when a current link exists; handle non-person, archived, missing-link, and archived-link states truthfully; preselect the ENTITY relationship without writing; preserve values after save failure; after success offer explicit Add/Open Active Working Set actions; retain retryable add failure; never auto-add, auto-band, infer a role, or change prompt contents before existing explicit selection and band actions.

Browser-visible guidance mapping: ENTITY detail owns state-dependent create/open availability; create, edit, linked, saved, add, open, and recovery outcomes are explicit; save/add failures retain authored state and announce recovery; prompt contents/freshness change only after existing explicit membership and band operations; external-model behavior is N/A; relationship provenance comes only from the durable selected ENTITY, never prose or assistance; only explicit Create and Add actions write existing shapes; browser and accessibility coverage includes focus, keyboard actions, status/error announcements, Working Set transition, and reload.

### Measure later-dossier repayment in a continuation playtest

Scope and acceptance: continue the same story after the dossier exists through a second accepted local unit; record interaction count, correction burden, deterministic dossier-field reuse, and a cold-context quality comparison; verify offstage, explicit-write, accepted-prose, and prompt-authority boundaries; do not pre-authorize product mutation; if repeatable author-visible harm is observed, return it as separately triageable evidence.

Browser-visible guidance mapping: this is verification work and changes no user-facing guidance. Its browser journey must nevertheless record the continuation entry point, visible states/actions/outcomes, any warnings or recovery, Prompt Preview reuse and freshness, whether a user-initiated provider boundary is crossed, canon/prose separation, explicit persistence and reload behavior, and the exercised keyboard/accessibility path. Product-level UI acceptance beyond those observations is N/A until evidence establishes a separate defect or enhancement.

## Publication posture

Decision scan: recommendation only. There is no approval for source publication, issue creation, or existing-issue mutation.

Source relationship: artifact-source mode is intended, but blocked until the canonical report and every linked evidence dependency are content-identical and visible at the publication ref. The untracked prep is custody input only and is not a durable issue citation.

Parent disposition: N/A. There is no truthful tracker parent and no parent-ledger mutation is proposed.

Source/target: after durability and approval gates, the durable report and dependency set would support five standalone non-PRD issues. Each issue must say it is a standalone non-PRD follow-up and neither ratifies nor implements a remaining PRD candidate. There is no remaining PRD candidate.

Prerequisites: obtain explicit authorization for the four exact source paths below; publish only those paths; verify their content identity and visibility at the publication ref; exact-read duplicate titles again at publication time; and verify the `$skill-audit` destination contract before freezing that routed disposition.

Publication: no issue bodies are staged and no mutation occurs now. A later, separate checkpoint must request approval for exactly the five listed issue creations. No mutation of #100, #103, #109, #110, #111, or #112 is included.

Artifacts: source publication authorization is needed for exactly:

- `reports/playtest-ash-at-low-water-2026-07-19T102650Z.md`
- `reports/assets/playtest-ash-at-low-water-2026-07-19T102650Z/accepted-segment-reminder.png`
- `reports/assets/playtest-ash-at-low-water-2026-07-19T102650Z/iven-active-working-set.png`
- `reports/assets/playtest-ash-at-low-water-2026-07-19T102650Z/iven-linked-cast-created.png`

Coverage: all six non-PRD rows are represented: five proposed issue candidates and one blocked route. The four browser product packets retain their complete checklist mappings; the verification issue has explicit process-work N/A boundaries. First action is blocked and PRD queue is exhausted.

## Approval question

Do you authorize publication of exactly the four source/evidence paths listed above, with no issue creation or existing-issue mutation yet, so their publication-ref durability can be verified before I return with the separate five-issue publication checkpoint?
