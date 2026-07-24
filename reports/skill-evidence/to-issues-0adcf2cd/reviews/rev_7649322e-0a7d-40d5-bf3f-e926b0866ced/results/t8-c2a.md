# Approval checkpoint — break PRD #200 (Scene beat annotations) into 3 child slices

Nothing has been staged, no label has been changed, and no issue has been created. This is a proposal only.

## Proposed family (dependency order)

1. **Title**: Store scene beat annotations on the story record
   - **Blocked by**: none - can start immediately
   - **User stories covered**: US1
2. **Title**: Compile scene beat annotations into the prose prompt
   - **Blocked by**: "Store scene beat annotations on the story record"; #188
   - **User stories covered**: US2
3. **Title**: Edit scene beat annotations in the scene editor
   - **Blocked by**: "Compile scene beat annotations into the prose prompt"
   - **User stories covered**: US3

Proposed acceptance-criteria counts, frozen at approval: slice 1 = 4, slice 2 = 3, slice 3 = 8.
Proposed labels, identical on all three children: `enhancement`, `ready-for-agent`.

Each slice is a tracer bullet: slice 1 lands the stored shape plus its validation and round-trip behavior, slice 2 lands the compiled prompt block end-to-end from stored record to deterministic output, slice 3 lands the authoring surface. I am not splitting schema/API/UI to manufacture parallel work — slices 1 and 2 change no UI and each will assert that unchanged boundary explicitly, and slice 3's handoff from slice 2 ("the compiled beat block already exists; this slice only authors its input") will be named in both bodies.

### User-story ordinals

PRD #200 states its requirements as unnumbered narrative stories, so US1–US3 are temporary ordinals I assigned for this checkpoint; they are not PRD-native IDs and I need the mapping confirmed before it is written into any body.

| Ordinal | Source story (as I read it) | Owning slice |
|---|---|---|
| US1 | An author's scene beat annotations are stored on the story record and survive reload/export | Store scene beat annotations on the story record |
| US2 | Stored beat annotations reach the generated prose through the deterministic prompt | Compile scene beat annotations into the prose prompt |
| US3 | An author can add, edit, reorder, and remove beat annotations from the editing surface | Edit scene beat annotations in the scene editor |

Every story is owned exactly once; no story is split across slices and none is left unowned.

## Prefactoring verdict

**No prefactor slice.** The only candidate was extracting a shared beat-annotation type into `@loom/core` ahead of slice 1, but that type has no reader or writer until slice 1 itself, so the prefactor would leave a half-migrated schema that no verified behavior exercises — it fails the "leaves a coherent verified state" test and materially simplifies nothing. Slice 1 already is the enabling change and carries it.

## Material-claim verification

I verified each existence claim the breakdown leans on rather than encoding it as settled.

| Claim | Checked against | Classification |
|---|---|---|
| A story-record shape exists that a new annotation field can extend | `packages/core/src/records/` (registry, entity, field-paths), `docs/specs/story-record-schema.md` | verified current |
| A deterministic prompt compiler with a section seam exists | `packages/core/src/compiler/compile-prompt.ts`, `packages/core/src/compiler/sections/` (`front`, `cast`, `pressure`, `ideation`, `records-tail`), `docs/specs/compiler-contract.md` | verified current |
| "The scene editor" exists as a surface slice 3 can extend | `packages/web/src/` | **present-but-materially-different** — there is no `scene` record type and no component named scene editor. The nearest live surfaces are `packages/web/src/generation-brief/GenerationBriefView.tsx` (the per-generation authoring view) and `packages/web/src/notes/ScenePrepPane.tsx` |
| The prompt template already constrains structure vocabulary | `packages/core/src/compiler/template-constants.ts` | verified current, and it **conflicts with the feature name** — see doctrine conflict D1 |

I have not silently rewritten slice 3's title to match the code. The title stays as approved wording pending your ratification of L3 below; if you ratify a different target surface I will bring the retitled slice back here rather than renaming it during publication.

## Doctrine conflict and proposed correction

**D1.** `packages/core/src/compiler/template-constants.ts` instructs the model: "Do not mention story-structure terms such as page, scene, act, arc, midpoint, climax, beat, plot, or chapter in the prose." A feature that compiles *beat annotations* into the prose prompt runs directly at that rule, and `docs/specs/prompt-template.md` plus `docs/principles/FOUNDATIONS.md` §29 govern the resolution.

Proposed correction to encode (not applied, and I will not edit the parent to carry it): slice 2 compiles beat annotations as **directive scene context only**, the existing anti-structure-vocabulary instruction stays byte-unchanged, and slice 2 carries a regression acceptance criterion proving compiled prose guidance still forbids naming beats. I am not propagating either the PRD's framing or the template's framing unilaterally — only the version you ratify here gets written.

## Browser-visible guidance acceptance checklist

Source of the canonical items: the marked block in `docs/agents/issue-tracker.md`. Slice 3 is the only browser-visible slice. The mappings below are **proposed**; the final run sheet will use `AC <n> - "<verbatim excerpt>"` against the staged bodies before any create, and an external gate would not turn an affected slice into an N/A.

Slice 3 — Edit scene beat annotations in the scene editor (8 items, 8 proposed ACs, every item homed):

| Checklist item | Proposed acceptance criterion |
|---|---|
| `entry point and availability` | AC 1 — beat-annotation controls appear on the scene authoring surface for a loaded story, and are disabled with a stated reason when no scene context is selected |
| `user-visible states, actions, and outcomes` | AC 2 — add, edit, reorder, and remove a beat annotation; the visible list and its ordering update to match the stored record |
| `validation, warning, error, and recovery behavior` | AC 3 — an empty or over-long annotation surfaces the correct blocker-versus-warning distinction with a visible recovery path, and a failed save is recoverable without data loss |
| `prompt preview contents and freshness` | AC 4 — after a beat edit the prompt preview shows the recompiled beat block, and the UI prevents acting on a stale preview |
| `user-initiated external LLM boundary` | AC 5 — no beat-annotation action issues an OpenRouter or other provider request; the boundary is asserted, not assumed |
| `canon and prose boundary visibility` | AC 6 — beat annotations read as record/canon authority and stay visually and functionally distinct from candidates and accepted prose |
| `persistence, migration, export, and provenance` | AC 7 — annotations persist across reload and export, and an existing project saved without beats loads unchanged |
| `browser and accessibility regression scenario` | AC 8 — a real-browser scenario covers keyboard operation and accessible names for every new control |

Slices 1 and 2 — one row each:

| Slice | Checklist item | Covered by proposed AC mapping | N/A reason |
|---|---|---|---|
| Store scene beat annotations on the story record | `browser-visible guidance checklist` | - | N/A - `@loom/core` record shape and validation only; renders no UI, adds no route or control, and asserts the unchanged UI boundary |
| Compile scene beat annotations into the prose prompt | `browser-visible guidance checklist` | - | N/A - `@loom/core` compiler output only; the preview surface that displays it is unchanged by this slice and is owned by slice 3 |

## Postures

- `Decision scan:` PRD #200 body and fresh comments scanned. **0 blocking open decisions.** 3 items of implementation latitude routed to this checkpoint for ratification — **L1** three-slice granularity and the record → compiler → editor chain (the PRD prescribes no slice shape); **L2** slices 1 and 2 ship no UI and each asserts that excluded layer explicitly rather than deferring silently; **L3** slice 3's target surface, given that no component named "scene editor" exists (proposed target: the generation-brief authoring view, with `ScenePrepPane.tsx` unchanged). 1 doctrine conflict, **D1** above. Remaining modal wording sits in motivation and rationale prose and gates no behavior. If L3 or D1 is left unratified, slice 2 and slice 3 must drop to `needs-triage` rather than ship with an unresolved decision under a `ready-for-agent` label.
- `Source relationship:` **Child mode** for all three slices. Each body carries `## Parent` with the token `PRD #200`; no standalone-source or artifact-source slice is proposed, so no `## Source and coordination` section appears.
- `Parent disposition:` PRD #200 is OPEN and currently carries `ready-for-agent`. Three `ready-for-agent` children cannot coexist with a ready parent, so I propose exactly one truthful non-AFK transition: **remove `ready-for-agent`, add `needs-triage`** on #200, leaving it OPEN with its body untouched. `needs-triage` is truthful because after the breakdown the parent holds no directly grabbable work and returns to maintainer evaluation. No holding state is invented, and apart from this transition and the approved ledger comment I will make no parent mutation.
- `Source/target posture:` Source is tracker item #200, exact-read this session with fresh comments; the implementation surface was inspected at `f176d9a`. Targets are three new GitHub issues in `joeloverbeck/continuity-loom`. No local spec or ticket file is created — `specs/` and `tickets/` are retired per `CLAUDE.md` and `docs/agents/issue-tracker.md`.
- `Prerequisite posture:` #188 is a pre-existing hard tracker blocker on slice 2 only, and appears verbatim as `#188` in that body's `## Blocked by`. Internal edges: slice 2 blocked by slice 1, slice 3 blocked by slice 2, resolved to real numbers serially with backward placeholders only. No external non-tracker prerequisite exists, so no `--external-blocker` value is proposed. Slice 1 uses the no-blocker phrasing. The parent number #200 and sibling numbers stay out of every `## Blocked by` section, since any `#<number>` there is read as a declared blocker. Label existence will be fresh-read before publication; if `enhancement`, `ready-for-agent`, or `needs-triage` turns out to be absent I will return here with the exact `gh label create` command from `docs/agents/triage-labels.md` before creating anything.
- `Publication posture:` Child mode, serial creation in dependency order slice 1 → slice 2 → slice 3, with the approved parent transition applied only after label proof, exact-title all-state duplicate guards for all three titles, working-ledger validation, and current-frontier body/run-sheet validation pass; each issue is read back and verified before the next is created. **Proposed: post a `# Child Issue Map` ledger comment on #200 after all three children verify**, carrying the slice/number map, the blocker map, checklist mapping, and a `## Breakdown decisions` section recording L1–L3, D1, the US1–US3 ordinals, and the prefactoring verdict — none of which is durable anywhere else today. Nothing is written until you authorize.
- `Artifact posture:` No new local artifact is introduced and no local artifact carries implementation-critical detail, so **no document/spec/ADR blocker issue is proposed**. Sufficiency test: every material child acceptance criterion traces to the PRD #200 body, its fresh comments, or tracked doctrine below — I am not creating a blocker merely to republish provenance. Durability results are **not yet run**: the helper is a publication-time step and nothing is approved yet; `git status --short` at `f176d9a` shows all six paths tracked and clean, and every one will be checked at the publication ref before staging.

  | Artifact | Exact path or stable identifier | Role | Publication-ref result | Disposition |
  |---|---|---|---|---|
  | Foundations | `docs/principles/FOUNDATIONS.md` | implementation prerequisite | not yet run; tracked and clean at `f176d9a` | cite by path in `## Principles`; never duplicated into a body |
  | Tracker authority | `docs/agents/issue-tracker.md` | implementation prerequisite | not yet run; tracked and clean at `f176d9a` | source of the checklist items above; cited, not copied |
  | Triage labels | `docs/agents/triage-labels.md` | implementation prerequisite | not yet run; tracked and clean at `f176d9a` | governs the label strings; cited only |
  | Record schema spec | `docs/specs/story-record-schema.md` | implementation target | not yet run; tracked and clean at `f176d9a` | slice 1 updates it in the same diff |
  | Compiler contract | `docs/specs/compiler-contract.md` | implementation target | not yet run; tracked and clean at `f176d9a` | slice 2 updates it in the same diff |
  | Prompt template spec | `docs/specs/prompt-template.md` | implementation target | not yet run; tracked and clean at `f176d9a` | slice 2 updates it in the same diff; governs D1 |

- `Coverage gate:` US1 → slice 1, US2 → slice 2, US3 → slice 3 — every source story owned exactly once, none duplicated, none already satisfied by existing code. Every blocker in the family appears in the dependency order above (slice 1 → slice 2 → slice 3, plus #188 on slice 2), with no forward references and no cycle. Browser-visible checklist: 8 of 8 canonical items homed on slice 3, specific N/A rows for slices 1 and 2, and the final run sheet will re-prove every mapping with verbatim excerpts against the staged bodies. Acceptance counts 4 / 3 / 8 are frozen. `ready-for-agent` on all three children is only truthful if L1–L3 and D1 are ratified below; otherwise slices 2 and 3 go out as `needs-triage` with the reason recorded.

## Please confirm

1. **Granularity and dependencies** — three slices as titled, in the order slice 1 → slice 2 → slice 3, with #188 gating slice 2 only. (Say so if you want a different cut, or a single combined issue.)
2. **Implementation latitude and the doctrine correction** — ratify L1, L2, and L3, and ratify the D1 resolution (beats compile as directive context; the anti-structure-vocabulary instruction stays unchanged and slice 2 carries the regression AC). If any of these stays open, confirm that slices 2 and 3 publish as `needs-triage` instead.
3. **Source relationship, labels, parent disposition, and artifact posture** — child mode under `PRD #200`; `enhancement` + `ready-for-agent` on each child; the single parent transition `ready-for-agent` → `needs-triage` with #200 left OPEN and its body untouched; no document blocker and no new local artifact.
4. **Child-map ledger** — post the `# Child Issue Map` comment on #200 after all three children verify? (Yes/no.)
5. **If you decline the ledger** — should the durable rationale (L1–L3, D1, US1–US3, prefactoring verdict) go into a `## Breakdown decisions` section in slice 1 as the first relevant child, or intentionally stay out of the tracker? If you decline the ledger and leave this undecided, I will default to putting it in slice 1 and will say so before publishing.

Also confirm the US1–US3 ordinal mapping, since those ordinals are mine and not PRD-native.

**Approving this authorizes exactly this and nothing more: apply the single label transition on PRD #200 removing `ready-for-agent` and adding `needs-triage` while leaving it OPEN and its body unchanged; then create three new issues serially in the order "Store scene beat annotations on the story record" (no blockers), "Compile scene beat annotations into the prose prompt" (blocked by the first issue and by #188), and "Edit scene beat annotations in the scene editor" (blocked by the second issue), each labelled `enhancement` and `ready-for-agent`; and then post one `# Child Issue Map` ledger comment on #200 after all three verify.**

Worktree note: `git status --short` at `f176d9a` shows unrelated dirt in `.claude/settings.json` and under `reports/skill-evidence/` that predates this work; I will preserve it and name it in the final proof.
