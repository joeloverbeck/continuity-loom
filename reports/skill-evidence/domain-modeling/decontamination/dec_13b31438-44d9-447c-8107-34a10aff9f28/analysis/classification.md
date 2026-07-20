# Structure and provenance classification

Run: `dec_13b31438-44d9-447c-8107-34a10aff9f28`

The introduction commit (`06b719a7…`) already contained the three-file skill. Two July 19 updates expanded optional-path probing and the supporting-role closeout into a more ceremonial state machine, added active-doc mutation-checkpoint language, and froze approved ADR path identity. No old audit finding is treated as an answer key. The candidate must preserve behavior demonstrated by the frozen corpus and transferable repository ownership/safety rules.

## `SKILL.md`

| ID | Substantive instruction or group | Category | Treatment and justification |
|---|---|---|---|
| S01 | Frontmatter trigger and description | Core trigger or output contract | Preserve; it defines when terminology and ADR work invokes the skill. |
| S02 | Active modeling rather than passive glossary consumption | Core trigger or output contract | Preserve concisely; this is the skill boundary. |
| S03 | Read `docs/agents/domain.md` before choosing context/ADR paths | Current repository convention with a canonical owner | Preserve as the routing authority pointer. |
| S04 | Probe optional paths before opening them and keep absence silent | Current tool-specific requirement | Preserve conditionally and concisely; it prevents avoidable read failures without making a ceremony of line-count commands. |
| S05 | Check repository entrypoint/active-doc map and update required registries in the same change | Current repository convention with a canonical owner | Preserve as a concise pointer; `docs/ACTIVE-DOCS.md` owns this repository's registration rule. |
| S06 | Single-context default and example tree | Domain knowledge unavailable to a general agent | Preserve the default, but remove the large duplicate tree from the common path. |
| S07 | Multi-context routing and example tree | Domain knowledge unavailable to a general agent | Preserve behind the context-format reference; the second large tree need not remain mandatory runtime prose. |
| S08 | Lazy creation and no `CONTEXT-MAP.md` until a second context exists | Necessary safety or state-integrity invariant | Preserve; it prevents speculative authority files. |
| S09 | Challenge terminology that conflicts with the glossary | Core trigger or output contract | Preserve. |
| S10 | Sharpen vague or overloaded terms | Core trigger or output contract | Preserve. |
| S11 | Stress-test domain relationships with concrete scenarios | Domain knowledge unavailable to a general agent | Preserve as one modeling action. |
| S12 | Compare behavioral claims with code and surface contradictions | Necessary safety or state-integrity invariant | Preserve; it prevents recording a false model. |
| S13 | Apply the same challenge to agent-authored autonomous material | One-off defensive exception | Distill to a transferable invariant: agent-authored material is checked exactly like user-authored material. |
| S14 | Write resolved terms inline and consult `CONTEXT-FORMAT.md` | Core trigger or output contract | Preserve. |
| S15 | Hold writes while file-shape or caller deliverable-depth questions remain unresolved | One-off defensive exception | Replace the two scenario-specific exceptions with one general rule: obey an unresolved caller mutation boundary and report pending writes. |
| S16 | Defer to an upstream authoritative glossary | Duplicated instruction | Keep the canonical rule in `CONTEXT-FORMAT.md`; leave only the reference-loading duty in the main skill. |
| S17 | Exclude implementation, process, tooling, and code-structure names from `CONTEXT.md` | Duplicated instruction | Keep the canonical three-way test in `CONTEXT-FORMAT.md`; retain only the terms-versus-decisions split in the main skill. |
| S18 | Split domain/app concepts from decisions, trade-offs, consequences, and implementation shape | Core trigger or output contract | Preserve; it selects the correct durable artifact. |
| S19 | Three-part ADR qualification test | Duplicated instruction | Keep it canonically in `ADR-FORMAT.md`; require that reference whenever considering an ADR. |
| S20 | Use ADR format and prefer an owning artifact's decision record | Duplicated instruction | Keep canonically in `ADR-FORMAT.md`; preserve the ownership boundary through the mandatory reference. |
| S21 | Supporting-role final domain check when no trigger fired | Core trigger or output contract | Preserve. |
| S22 | Exact settled/provisional no-change result lines | Core trigger or output contract | Preserve verbatim; the regression trial protects the settled line and the provisional distinction is transferable. |
| S23 | Ratification/veto refresh cycle and pre-deliverable checkpoint ceremony | Audit bookkeeping, report conformance, custody ceremony, self-audit scaffolding | Remove the lifecycle narration; the output must reflect current settled/provisional state, which is sufficient. |
| S24 | Supporting-role recap lists exact glossary and ADR effects when changed | Core trigger or output contract | Preserve concisely. |

## `CONTEXT-FORMAT.md`

| ID | Substantive instruction or group | Category | Treatment and justification |
|---|---|---|---|
| C01 | Minimal context heading, description, language-entry structure, and `_Avoid_` aliases | Domain knowledge unavailable to a general agent | Preserve a smaller example. |
| C02 | Pick canonical vocabulary and list rejected synonyms | Domain knowledge unavailable to a general agent | Preserve. |
| C03 | Tight one- or two-sentence definitions of what a term is | Core trigger or output contract | Preserve. |
| C04 | Three-way app/domain versus programming/process/code-structure eligibility test | Necessary safety or state-integrity invariant | Preserve; corpus tasks 3 and 4 directly protect it. |
| C05 | Group entries only when natural clusters exist | Correct but disproportionately costly rare-case rule | Preserve as a short optional formatting note. |
| C06 | Defer to an authoritative upstream glossary and define only the local layer | Necessary safety or state-integrity invariant | Preserve; it prevents duplicate authorities and drift. |
| C07 | Single-context root default and multi-context map | Domain knowledge unavailable to a general agent | Preserve. |
| C08 | Full three-context relationship example | Correct but disproportionately costly rare-case rule | Replace with a compact map shape; the long sample crowds a rare branch. |
| C09 | Routing inference and lazy map creation rules | Domain knowledge unavailable to a general agent | Preserve canonically here; remove duplication from `SKILL.md`. |
| C10 | Ask when the applicable context is unclear | Core trigger or output contract | Preserve. |

## `ADR-FORMAT.md`

| ID | Substantive instruction or group | Category | Treatment and justification |
|---|---|---|---|
| A01 | ADR directory, sequential filename, and lazy creation | Current repository convention with a canonical owner | Preserve as the default when repo routing does not override it. |
| A02 | Short title plus concise context/decision/rationale template | Core trigger or output contract | Preserve. |
| A03 | Optional status, considered-options, and consequences sections | Domain knowledge unavailable to a general agent | Preserve concisely. |
| A04 | Scan existing ADRs and increment the highest number | Current tool-specific requirement | Preserve. |
| A05 | Freeze a path after a user-approved mutation checkpoint and renew confirmation on slug/number drift | Audit bookkeeping, report conformance, custody ceremony, self-audit scaffolding | Remove. It is a recent caller-workflow ceremony, not domain modeling, and the corpus does not establish it as needed. Repository mutation authority remains governed by the caller and repo instructions. |
| A06 | Three-part hard-to-reverse/surprising/trade-off test | Domain knowledge unavailable to a general agent | Preserve canonically. |
| A07 | Do not duplicate a decision record owned by another authoritative artifact | Necessary safety or state-integrity invariant | Preserve; corpus task 4 protects ownership. |
| A08 | Long taxonomy of qualifying decisions | Domain knowledge unavailable to a general agent | Distill to a shorter representative list without changing the boundary. |

## Audit-induced risk patterns marked

| Pattern | Location | Justification and candidate response |
|---|---|---|
| Qualifications layered on earlier qualifications | S03-S05, S21-S23 | July 19 changes turned two compact rules into ordered ceremonies. Preserve routing, ownership, and result-state invariants while removing command-shape and lifecycle narration. |
| Several rules solving one hazard in different places | S06-S08 with C07-C09; S16-S17 with C04-C06; S19-S20 with A06-A07 | Context routing, glossary eligibility, and ADR qualification each have two runtime homes. Make the relevant format reference canonical and keep only the load/dispatch rule in `SKILL.md`. |
| Repository-specific behavior stated in a generic skill | S05 and A05 | Keep the generic instruction to obey repository entrypoint/registry authorities; remove the particular mutation-checkpoint path-freezing ceremony. |
| Rare-case defenses crowding the common path | S15, S23, C08 | Replace scenario enumerations and ratification lifecycle detail with short conditional rules; shrink the multi-context example. |
| Front-loaded examples and duplicate trees | S06-S07 and C08 | Move routing detail to the already mandatory format reference and retain only one compact map example. |

## Candidate hypothesis

A single candidate will keep the three-file interface and all core behaviors while making each reference the canonical home for its own format. It will shorten `SKILL.md` to routing, modeling actions, artifact dispatch, and explicit supporting-role outcomes; retain the glossary eligibility and upstream-authority rules in `CONTEXT-FORMAT.md`; retain ADR qualification and ownership in `ADR-FORMAT.md`; and remove only duplicate examples, lifecycle ceremony, and mutation-checkpoint lore. No functional behavior will be added or repaired.
