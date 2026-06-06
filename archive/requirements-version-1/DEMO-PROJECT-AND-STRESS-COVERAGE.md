# Demo Project and Stress Coverage — Continuity Loom v1

## Purpose

This spec defines the tame v1 demo fixture and maps the conceptual stress suite to v1 capabilities. The demo exists for smoke testing, onboarding, UI validation, and regression coverage. It must not use Red Bunny content.

## Scope

This spec covers the built-in demo premise, required demo records, demo generation-time brief, validation blocker examples, OpenRouter/candidate/acceptance walkthrough expectations, stress-suite mapping, and explicit Red Bunny boundary.

It does not define fixture JSON, database seed code, test files, or production demo-loading code.

## Non-goals

This spec does not bundle Red Bunny, does not create a mature-content demo, does not special-case compiler behavior for demos, and does not turn stress cases into implementation tickets or plot templates.

## Demo project: The Letter Under the Flour Bin

Use a tame built-in demo project titled **The Letter Under the Flour Bin**.

Premise: During a violent storm, two siblings shelter in the old root cellar beneath their rented farmhouse. The older sibling, Elin, secretly carries a rain-spotted letter from their missing father. The younger sibling, Niko, believes their father left them willingly. The letter suggests he was taken by someone connected to the landlord, but Elin has not decided whether to reveal it.

This premise is safe, non-erotic, and still exercises continuity, POV knowledge, secrets, physical state, object possession, location constraints, voice, active working set curation, validation blockers, prompt preview, OpenRouter send, candidate editing, acceptance, and accepted segment browsing.

## Demo story configuration

### STORY CONTRACT

- Title: The Letter Under the Flour Bin.
- Genre/mode: grounded family mystery; stormbound literary suspense.
- Tone: tense, intimate, restrained, protective, rain-soaked, practical.
- Content intensity: general/mild suspense.
- Explicitness: no explicit sexual content; mild fear and family distress allowed.
- Language/register: plain contemporary English with rural practical texture.
- Continuity philosophy: continuity-first; no branches; no dramatic act structure.

### UNIVERSAL CONTENT POLICY

- Rating label: General / mild suspense.
- Allowed scope: storm danger, fear, family conflict, possible adult wrongdoing, secrecy, and emotional pressure.
- Tonal handling: grounded and non-sensational.
- Governing policy note: provider/platform policy remains first.
- Character bias handling: character suspicion is not narrator-certified fact unless records establish it.

### PROSE MODE

- POV: Elin.
- Person: close third or first person; close third recommended for smoke testing non-POV limits.
- Tense: past or present; present recommended for immediacy.
- Psychic distance: close.
- Interiority: filtered.
- Dialogue density: moment-led.
- Paragraphing: mixed.
- Language output: English.

## Required demo records

### ENTITY / CAST MEMBER

- Elin Ward, 16: older sibling, practical, protective, carrying the letter, POV character.
- Niko Ward, 11: younger sibling, anxious but sharp, believes their father abandoned them, onstage active silent/speaker depending on generation.
- Mara Venn, landlord, offstage pressure source; suspected by the letter but not proven.
- Orin Ward, missing father, offstage; letter author.

Elin and Niko require CAST MEMBER core dossiers. Mara and Orin can be ENTITY plus offstage relevance unless promoted later.

### CURRENT AUTHORITATIVE STATE

- Time: late evening during a thunderstorm.
- Location: root cellar under the farmhouse kitchen.
- Onstage: Elin and Niko.
- Offstage pressure: storm, landlord Mara Venn, missing father Orin Ward.
- Positions: Elin near the flour bin and lantern; Niko on the lower stair or beside the potato crates.
- Possessions: Elin carries the sealed letter inside her jacket; Niko has a chipped mug; lantern sits on a crate.
- Visibility: dim lantern light; cellar stairs visible; kitchen door above audible but closed.
- Routes/exits: stairs up to kitchen; swollen yard outside; cellar has a narrow vent but no person-sized exit.
- Available time: enough for one short exchange or one reveal-withheld.
- Locks: Niko has not seen the letter; Elin does not know whether the landlord is guilty; father is not onstage.

### SECRET

- Secret claim: Elin has a letter from their missing father suggesting he did not leave willingly.
- Holders: Elin.
- Protected non-holders: Niko.
- Audience visibility: explicit or implied, depending demo brief.
- POV access: knows.
- Allowed cues: Elin touches jacket, avoids flour bin, reacts to thunder/footsteps, glances at cellar stair.
- Forbidden reveal: narration must not certify landlord guilt; Niko must not know the letter unless reveal occurs.
- Reveal permission: clue_only or natural_reveal_allowed, depending selected demo scenario.

### OBJECT

- Letter: owner Orin or unknown; carried_by Elin; hidden in jacket; visible_to_pov because POV knows, hidden from Niko; durability major.
- Lantern: current_location crate; visible; usable by either sibling if reachable; durability continuity_relevant.
- Flour bin: location root cellar; can conceal or reveal; visible; durability continuity_relevant.
- Cellar latch: above stairs; audible/visible depending position; usable from kitchen side and maybe from cellar side depending fixture version.

### LOCATION / AFFORDANCE

- Root cellar: cramped, damp, low beams, shelves, stairs, storm noise, one lantern, storage bins.
- Visible affordances: hide letter, reveal letter, ask Niko to stay quiet, move lantern, listen at stair, climb to kitchen, comfort Niko, refuse to answer, check latch.
- Unavailable actions: father cannot enter without route; Niko cannot read a hidden letter; no major location change without climbing stairs and opening the kitchen door.

### PRESSURE RECORDS

- EVENT: storm drove siblings into cellar.
- EVENT: Elin found the letter earlier under the flour bin.
- BELIEF: Niko believes father abandoned them; truth relation contested/unknown.
- BELIEF: Elin suspects the landlord may be involved; confidence low/medium, truth relation unknown.
- EMOTION: Elin’s protective fear and guilt.
- EMOTION: Niko’s abandonment anger and storm fear.
- RELATIONSHIP: Elin protects Niko but withholds truth; Niko trusts Elin but resents being managed.
- INTENTION: Elin wants to keep Niko calm and decide whether to reveal the letter.
- INTENTION: Niko wants a truthful answer about father.
- OPEN THREAD: What really happened to Orin Ward?
- CLOCK: storm/water rising or footsteps above, if demo scenario needs a ticking pressure.
- CONSEQUENCE: cellar dampness makes the letter vulnerable if dropped or exposed.

## Demo generation-time brief

Use a first-segment demo brief with no accepted prose:

- Recent causal context: Elin and Niko entered the cellar as the storm intensified. Elin found and hid the letter earlier. Niko has been asking why she keeps touching her jacket.
- Last visible moment: thunder shakes dust from the beams; Niko asks whether Elin is hiding something.
- Prior accepted prose status: `None. No accepted prose is included.`
- Begin after: Niko’s question lands in the cellar silence.
- Manual must render: Elin’s first evasive answer or partial truth; Niko’s response; the pressure around the hidden letter.
- May render: lantern flicker, sound upstairs, Niko noticing jacket movement.
- Do not force: full confession, landlord appearance, father’s return, major location change.
- Stop guidance: one short exchange ending at the first new response point.
- Validation tags: `first_segment`, `dialogue_expected`, `introspection_expected`, `secret_or_clue_pressure`, `physical_interaction_expected`, `object_use_possible`.

## Demo validation blocker examples

The demo must include intentionally creatable blocker scenarios for smoke testing:

- Letter has two holders: Elin and Niko.
- Manual directive says “Niko reads the letter” while the object is hidden in Elin’s jacket and Niko lacks access.
- Manual directive says “Mara enters the cellar” without route, timing, or awareness mechanism.
- Handoff includes pasted accepted prose.
- SECRET says Niko is protected non-holder while POV knowledge field says Niko knows the letter.
- Stop guidance asks for the whole chapter or the mystery reveal.
- Active speaker Niko lacks voice anchor.
- Physical interaction expected but positions/routes are blank.

## Demo workflow coverage

The demo should let an implementer/user verify:

- creating/opening a project;
- browsing records;
- editing CAST MEMBER dossiers;
- selecting active working set records;
- setting cast inclusion bands;
- editing current state/handoff/directive/stop guidance;
- seeing blockers and warnings;
- fixing blockers;
- previewing prompt;
- sending to OpenRouter if configured;
- editing candidate;
- accepting candidate;
- browsing accepted segment;
- seeing durable-change reminder;
- manually updating records after acceptance.

## Stress-suite coverage mapping

V1 capability coverage must include all 26 cases from `stress-suite(8).md` conceptually. The demo does not need to instantiate every case, but the app must support them.

| Stress area | Covered by v1 capability |
|---|---|
| No accepted prose in prompts / continuation handoff | Validation blocks accepted prose contamination; continuation requires user-authored handoff and records. |
| First segment empty-state correctness | Demo starts with no accepted prose and self-sufficient current state. |
| Local stop boundary | STOP GUIDANCE and stop rule validation reject chapter/act/beat/future-summary requests. |
| Dialogue voice distinction | CAST MEMBER dossiers and current voice pressure pins support two-speaker and ensemble dialogue. |
| Active silent cast | Active/onstage local function supports active silent presence with body/silence pressure. |
| POV/audience/secrets separation | SECRET, POV profile, and audience profile lanes are required and validated. |
| Physical continuity | Current state, entity status, location, object, affordance, positions, routes, and time are validated. |
| Object use/transfer | OBJECT and VISIBLE AFFORDANCE records distinguish use from holder changes. |
| Offstage/institutional/nonhuman pressure | ENTITY status/reach and interruption route validation support offstage/institutional pressure. |
| Mature fiction envelope | UNIVERSAL CONTENT POLICY supports bounded mature configuration without provider override. |
| Clocks, obligations, consequences | CLOCK/OBLIGATION/CONSEQUENCE records require current opportunity and visible cause for ticks/breaches. |
| Low-drama/minimalist prose | Prose mode, emotion/belief/open-thread pressure, and craft prompts support quiet scenes without manufactured incident. |
| Large context / dossier bloat | Length warnings and voice pins preserve salience without compiler compression. |
| False reports and belief truth relations | BELIEF truth_relation/access_route prevents testimony from becoming canon. |

## Red Bunny boundary

`red-bunny-prompt-example(17).md` remains a high-pressure prompt surface example. It must not be bundled as the tame demo project. It may inform stress coverage for mature content, POV leakage, active cast dossier length, and physical continuity, but no Red Bunny content should appear in default demo data.

## User-facing behavior

The demo should be selectable as “Create demo project” or “Open demo copy.” It should clearly be sample data. Users should be able to break validation intentionally and repair it.

Demo content should be tame enough to display in onboarding, screenshots, and smoke tests.

## Data/logic implications

The demo should be ordinary project data, not special-case compiler logic. It should load through the same project/store/validation/compiler paths as user projects.

The demo may be regenerated from a fixture, but once copied into a project folder, it is a normal local project.

## Alignment with `FOUNDATIONS.md`

The demo preserves local-first ownership, single continuity, record-first generation, no accepted prose prompt source, manual active working set selection, deterministic validation, prompt inspection, candidate edit/accept, accepted archive, and durable-change reminder.

## Security/privacy implications

Demo data must contain no API keys, no real secrets, no prompt archives, and no explicit mature content. It should be safe for logs/screenshots if accidental fixture names appear, though app logs still should not include full record payloads by default.

## Validation implications

Demo data should include both a valid generation setup and optional documented invalid variants for blocker testing. Invalid variants must be created through normal UI edits or fixture toggles, not hidden test-only code paths.

## Failure modes

Demo/stress failure modes include:

- using Red Bunny as bundled demo;
- making demo data special-case compiler behavior;
- demo lacks secrets, physical state, or object possession and therefore misses core validation;
- demo validates only happy path;
- stress suite treated as implementation tickets rather than conceptual coverage;
- demo accepted segment automatically updates records.

## Done Means

Demo and stress coverage is satisfied when:

- a tame demo project exists and can be copied/opened as normal project data;
- the demo includes required records across story config, cast, secret, object, location, affordance, event, belief, emotion, relationship, intention, open thread, and optional clock/consequence;
- the demo has a valid first-segment generation brief;
- the demo can exercise validation blockers, prompt preview, OpenRouter send, candidate editing, acceptance, accepted segment browsing, and durable-change reminder;
- stress-suite cases are mapped to v1 capabilities;
- Red Bunny is explicitly excluded from bundled demo content.
