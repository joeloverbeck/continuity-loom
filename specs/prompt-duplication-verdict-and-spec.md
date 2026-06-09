# Prompt Duplication Verdict and Selective-Refinement Mini-Spec

## Verdict

I am not verifying that this commit is the current `main`. I am using your supplied commit as the target of record and fetching files only by exact commit URL from `joeloverbeck/continuity-loom`.

**Ruling:** the current Continuity Loom doctrine is **mostly vindicated**, but not globally. Cross-segment repetition is net-positive when it is **dual-framing**: the front section gives the prose model a compact, current-generation pressure cue, while the later section gives full authority, metadata, and constraints. That pattern is well aligned with long-context evidence, structured-prompt practice, and fiction craft. The user's worry is valid only where the same datum is rendered again with the same function and nearly the same wording. Those cases should be tightened, not solved with a blanket dedupe pass.

Therefore this deliverable takes **Branch B**: the status quo is defended as the governing design, with a narrow mini-spec for selective refinement. The mini-spec preserves deterministic compilation, keeps the 28-section universal template, does not introduce LLM summarization/deduplication, does not rely on hidden state, and does not replace front salience with pointer-only cross-references.

### Evidence ledger

```text
Requested repository: joeloverbeck/continuity-loom
Target commit: cc9fa70e851a8c3ecd7c6c74b8eedcd083c5a90f
Freshness claim: user-supplied target commit only; not independently verified as latest main
Manifest role: path inventory only
Repository metadata used: no
Default-branch lookup used: no
Branch-name file fetch used: no
Code search used: no
Clone used: no
URL fetch method: web.open exact raw.githubusercontent.com URLs; container.download exact raw URLs for markdown/text artifacts where accepted; TypeScript code inspected through exact web.open raw/blob URLs because container.download rejected application/javascript content type
Fetched files:
- https://raw.githubusercontent.com/joeloverbeck/continuity-loom/cc9fa70e851a8c3ecd7c6c74b8eedcd083c5a90f/README.md
- https://raw.githubusercontent.com/joeloverbeck/continuity-loom/cc9fa70e851a8c3ecd7c6c74b8eedcd083c5a90f/CLAUDE.md
- https://raw.githubusercontent.com/joeloverbeck/continuity-loom/cc9fa70e851a8c3ecd7c6c74b8eedcd083c5a90f/docs/ACTIVE-DOCS.md
- https://raw.githubusercontent.com/joeloverbeck/continuity-loom/cc9fa70e851a8c3ecd7c6c74b8eedcd083c5a90f/docs/FOUNDATIONS.md
- https://raw.githubusercontent.com/joeloverbeck/continuity-loom/cc9fa70e851a8c3ecd7c6c74b8eedcd083c5a90f/docs/user-guide.md
- https://raw.githubusercontent.com/joeloverbeck/continuity-loom/cc9fa70e851a8c3ecd7c6c74b8eedcd083c5a90f/docs/compiler-contract.md
- https://raw.githubusercontent.com/joeloverbeck/continuity-loom/cc9fa70e851a8c3ecd7c6c74b8eedcd083c5a90f/docs/prompt-template.md
- https://raw.githubusercontent.com/joeloverbeck/continuity-loom/cc9fa70e851a8c3ecd7c6c74b8eedcd083c5a90f/docs/prompt-template-rationale.md
- https://raw.githubusercontent.com/joeloverbeck/continuity-loom/cc9fa70e851a8c3ecd7c6c74b8eedcd083c5a90f/docs/story-record-schema.md
- https://raw.githubusercontent.com/joeloverbeck/continuity-loom/cc9fa70e851a8c3ecd7c6c74b8eedcd083c5a90f/docs/stress-suite.md
- https://raw.githubusercontent.com/joeloverbeck/continuity-loom/cc9fa70e851a8c3ecd7c6c74b8eedcd083c5a90f/docs/stress-coverage-matrix.md
- https://raw.githubusercontent.com/joeloverbeck/continuity-loom/cc9fa70e851a8c3ecd7c6c74b8eedcd083c5a90f/archive/reports/continuity-first-prose-prompt-redesign-first-iteration.md
- https://raw.githubusercontent.com/joeloverbeck/continuity-loom/cc9fa70e851a8c3ecd7c6c74b8eedcd083c5a90f/archive/specs/SPEC-007-deterministic-prompt-compiler.md
- https://raw.githubusercontent.com/joeloverbeck/continuity-loom/cc9fa70e851a8c3ecd7c6c74b8eedcd083c5a90f/packages/core/src/compiler/compile-prompt.ts
- https://raw.githubusercontent.com/joeloverbeck/continuity-loom/cc9fa70e851a8c3ecd7c6c74b8eedcd083c5a90f/packages/core/src/compiler/template-constants.ts
- https://raw.githubusercontent.com/joeloverbeck/continuity-loom/cc9fa70e851a8c3ecd7c6c74b8eedcd083c5a90f/packages/core/src/compiler/placeholder-map.ts
- https://raw.githubusercontent.com/joeloverbeck/continuity-loom/cc9fa70e851a8c3ecd7c6c74b8eedcd083c5a90f/packages/core/src/compiler/sections/front.ts
- https://raw.githubusercontent.com/joeloverbeck/continuity-loom/cc9fa70e851a8c3ecd7c6c74b8eedcd083c5a90f/packages/core/src/compiler/sections/pressure.ts
- https://raw.githubusercontent.com/joeloverbeck/continuity-loom/cc9fa70e851a8c3ecd7c6c74b8eedcd083c5a90f/packages/core/src/compiler/sections/cast.ts
- https://raw.githubusercontent.com/joeloverbeck/continuity-loom/cc9fa70e851a8c3ecd7c6c74b8eedcd083c5a90f/packages/core/src/compiler/sections/records-tail.ts
- https://raw.githubusercontent.com/joeloverbeck/continuity-loom/cc9fa70e851a8c3ecd7c6c74b8eedcd083c5a90f/packages/core/test/golden-first-segment.prompt.txt
Contamination observed: no
Connector/tool namespace trusted as evidence: no
```

**Contract/code drift observed:** yes, but not contamination. `docs/compiler-contract.md §4` describes `{active_knowledge_pressure}` as using “POV/SECRET/BELIEF/EVENT lanes,” while `packages/core/src/compiler/sections/pressure.ts` renders FACT records there as well. The uploaded task’s duplication map correctly notices FACT duplication; the contract row should be corrected in the mini-spec.

### Surface-by-surface ruling

| Duplication surface | Verdict for prose quality/coherence | Ruling | Disposition |
|---|---:|---|---|
| BELIEF → `active_knowledge_pressure` + `pov_relevant_beliefs` / `non_pov_behavior_shaping_beliefs` | Net-positive | This is usually dual-framing. The pressure section tells the writer what the belief should do now; the detail dossier preserves truth relation, confidence, access route, and visibility. Fictional POV depends on what a character perceives, interprets, and believes, not just on external fact state. | Keep, but format the pressure line around `behavioral_effect` first. Avoid making the pressure line a bare second copy of the claim when the behavioral effect is populated. |
| FACT → `hard_canon_bullets` + `active_knowledge_pressure` + `pov_accessible_facts` / `writer_visible_or_non_pov_facts` | Mixed; ordinary FACTs are net-neutral to net-negative when tripled | Hard canon and current-state facts can deserve edge salience. Ordinary setting/discovered facts do not need a second front copy unless they are active pressure. Triple rendering spends tokens and risks over-weighting inert exposition. | Tighten. FACTs appear in `active_knowledge_pressure` only when deterministic existing fields mark them as current/critical: `fact_kind=hard_canon`, `fact_kind=current_state`, `scope=current_segment`, or `salience=high|critical`. Otherwise detail/hard-canon sections carry them. |
| EVENT → `active_knowledge_pressure` + `recent_events` / `relevant_backstory` / `offstage_or_withheld_events` | Net-positive for immediate/recent causal events; net-negative for archive-like backstory | A front event pressure cue is useful when the prior event changes the next beat. Backstory and withheld events should not be promoted just because they exist. | Tighten. `active_knowledge_pressure` should include `immediate_previous` / `recent_causal` / high-current-relevance `offstage` events. `relevant_backstory` and `withheld` stay in detail unless a current-relevance predicate is met and reveal constraints allow it. |
| SECRET → `active_knowledge_pressure` + reveal lanes | Net-positive | This is not simple duplication. A hidden truth, holder map, non-holder protection rule, allowed clue, forbidden reveal, and reveal permission are different instructions. Reducing them to one mention would increase reveal leakage risk. | Keep. Clarify that lanes other than the hidden-truth lane should reference the secret label/holder/permission, not restate the whole claim unless needed for clarity. |
| LOCATION / OBJECT / VISIBLE AFFORDANCE → `material_pressure` + detail + `physical_continuity` | Mixed | Location/object/status repetition is usually useful because physical mistakes break scene coherence. VISIBLE AFFORDANCE is the risky outlier: it can appear as action pressure, material pressure, detail, and physical continuity with nearly the same action text. | Keep location/object/status dual-framing. Remove or status-only render VISIBLE AFFORDANCE from `material_pressure`; let `active_action_pressure`, `visible_affordances`, and `physical_continuity` do the work. |
| PLAN / INTENTION / OPEN THREAD / CONSEQUENCE → `active_action_pressure` + dedicated active detail sections | Net-positive | These are live causal drivers. Summary-plus-detail helps the prose model keep motivation, next action, unresolved tension, and consequence in working memory before it reaches long dossiers. | Keep. Do not cross-reference away. Maintain deterministic status tags for non-active/resolved pressure so the model does not treat them as active commands. |
| ENTITY STATUS → `material_pressure` + `physical_continuity` | Net-positive | Physical/body/object state is exactly the kind of local continuity that degrades prose when buried. Duplication here acts as a guardrail against teleporting, impossible actions, and object-position errors. | Keep. No dedupe. |
| CAST MEMBER voice → `active_cast_voice_pressure_pins` + `active_onstage_full_cast_dossiers` | Strongly net-positive | This is the best-supported duplicate. The pin is a current-scene salience cue; the dossier is a durable identity resource. Voice, behavior, and focalization need active priming, especially when dossiers are long. | Keep. Strengthen the rationale text. Add a stress case that protects this doctrine from future token-budget dedupe. |

### Explicit ruling on the current doctrine

The doctrine in `FOUNDATIONS.md §17`, `FOUNDATIONS.md §28.2`, and `docs/prompt-template-rationale.md §7/§10` is **correct in principle**: long-context capability does not make buried context safe, and a compact working-set précis near the front is a legitimate salience device. The empirical literature does not support “mention once in the middle and trust the model.” Long-context models still show positional bias and retrieval degradation, especially when information is dense, multi-needle, paraphrased, or intermixed with distractors.[^lost-middle][^ruler][^needlebench][^nolima][^distracted]

But the doctrine should be narrowed from “duplication helps” to this more precise rule:

> **Repeat current pressure, constraints, and voice salience; do not repeat inert record text. A duplicate is justified when the second rendering changes the instruction’s job. It is suspect when it repeats the same claim under the same framing.**

That refinement is enough. No global dedupe pass, pointer-only cross-reference scheme, section-order redesign, or foundation amendment is warranted.

---

## 1. Repository-grounded findings

### 1.1 Authority posture

The active documents establish a strict authority hierarchy. `docs/FOUNDATIONS.md` governs the verdict: deterministic prompt compilation, the universal prose prompt contract, durable cast dossiers, edge placement of critical instructions, and the refusal to treat long-context models as permission to dump archives. `docs/compiler-contract.md` is the authoritative bridge for section order, placeholders, empty-state behavior, and change control. `docs/prompt-template-rationale.md` is the pro-duplication rationale that this report is judging.

No fetched file changed the non-negotiables. Any recommendation must remain a deterministic render of selected records and generation-time fields; it must not use an LLM to summarize, select, prioritize, compress, dedupe, or rewrite records at compile time; and it must not bring accepted/rejected/superseded prose or auto-derived summaries into prompt context.

### 1.2 Current compiler behavior

The code confirms the brief’s central claim: each section independently renders its placeholders. `compile-prompt.ts` walks `SECTION_ORDER` and dispatches sections; `pressure.ts`, `cast.ts`, `front.ts`, and `records-tail.ts` resolve their own subsections. There is no global “mention once,” cross-section dedupe, or pointer insertion layer.

The observed duplicate sites are therefore structural, not accidental. The deliberate ones are especially visible in `template-constants.ts`, where active cast voice pins are explicitly labeled current-generation salience duplicates before full cast dossiers. `docs/prompt-template-rationale.md §7` also describes the active working set as a compact pressure précis before detailed causal and characterization sections, not as a replacement for them.

The one drift to fix is the FACT omission in `compiler-contract.md §4`’s `{active_knowledge_pressure}` row. The implementation includes FACT; the contract row should name it and constrain it.

### 1.3 Golden prompt token reality

The fetched golden prompt is about **27,386 characters / 3,986 whitespace words / roughly 6,800 tokens** by a simple chars÷4 estimate. Its `<active_working_set>` is about **2,817 characters / 480 words / roughly 700 tokens**, or about **10%** of the prompt. This is not trivial, but it is also not the main token mass. The biggest duplicated clusters in the golden are active working set summaries versus detail sections, location/object/affordance versus physical continuity, and voice pins versus cast dossiers.

A full deletion of `<active_working_set>` would save the most tokens, but would cut directly against the design’s best-supported salience mechanism. The realistic savings from the selective mini-spec below are smaller: about **100–250 tokens** in the golden prompt and plausibly **5–12%** in larger, record-dense prompts with many FACT/EVENT/AFFORDANCE entries. That is enough to be worth doing where the duplicated text is inert, but not enough to justify weakening voice, secret, action, or physical-continuity safety.

---

## 2. External research synthesis

### 2.1 Long-context behavior: salience placement still matters

The strongest relevant empirical result is not “LLMs like repetition.” It is that long-context models still do not reliably use all positions equally. *Lost in the Middle* found that performance is highest when relevant information is near the beginning or end of context and can degrade sharply when information is in the middle, even when the model’s context window is long enough.[^lost-middle] RULER extends this beyond simple single-needle retrieval and shows performance falling as context length and task complexity increase, especially for multiple needles, multi-hop tracing, and aggregation.[^ruler] NeedleBench likewise stresses varying information density and reports that reasoning models struggle with continuous retrieval and reasoning in dense contexts.[^needlebench] NoLiMa further undermines naive needle-in-haystack confidence by showing that long-context success often depends on literal lexical overlap; when lexical overlap is minimized, performance drops substantially at long context lengths.[^nolima]

For Continuity Loom, that means the rationale in `FOUNDATIONS.md §28.2` is not merely conservative; it is empirically aligned. A detail buried after long cast dossiers, locations, objects, or backstory can be underused. A compact front pressure cue is a plausible mitigation.

### 2.2 Repetition is useful only when it increases salience without adding noise

There is emerging evidence that prompt repetition can improve non-reasoning LLM performance, but that evidence is broad and does not prove that repeated story-record rows improve prose.[^prompt-repetition] The safer inference is narrower: repetition can act as priming when the repeated material is important, short, and consistent. It becomes harmful when it introduces irrelevant context, near-duplicates that compete for attention, or contradictions. Shi et al. show that irrelevant context can distract LLMs and reduce task performance.[^distracted] Knowledge-conflict research also treats inter-context conflicts as a real failure mode: when multiple contextual statements disagree or imply different priorities, models can blend, ignore, or over-trust the wrong one.[^conflicts]

This is the decisive distinction for Continuity Loom. Repetition is not automatically confusion. **Undifferentiated repetition** is the risk. If two sections tell the model the same claim in the same way, the model may overweight exposition or waste attention. If two sections give different jobs for the same datum, the duplicate is not redundant; it is instruction design.

### 2.3 Summary-plus-detail is a known good pattern, but the summary must be a summary

Mature long-context prompting advice converges on three practices: put important longform data high in the prompt when possible, put the user query or final instruction near the end, and use explicit delimiters/structure such as XML tags so the model can parse source roles.[^anthropic][^gemini] Anthropic’s long-context guidance specifically recommends careful structure for data-rich inputs and reports that putting longform data near the top can significantly improve performance on long-context tasks.[^anthropic-long] LlamaIndex’s LongContextReorder exists for the same reason: relevant chunks buried in the middle are easier to miss, so systems reorder context toward the beginning and end.[^llamaindex]

Continuity Loom’s active working set is a hand-authored, deterministic version of that pattern. The design is sound if the front section is a **pressure summary**: “what must matter now.” It is weaker if the front section is a second excerpt of the detailed record. This is why BELIEF, PLAN, INTENTION, CONSEQUENCE, voice pins, and physical status do well under duplication, while ordinary FACT and AFFORDANCE action text need tightening.

### 2.4 XML/structured sections reduce but do not remove the need for salience

Structured prompts help. Anthropic recommends XML tags for complex prompts because clear section boundaries help the model parse and reduce misinterpretation; Google’s Gemini prompt strategy similarly emphasizes consistent structure, clear delimiters, and precision.[^anthropic][^gemini] Continuity Loom’s XML-like universal template is therefore a strength.

But structure is not a substitute for placement. Tags make sections legible; they do not guarantee that a long middle section will control generation. That is why pointer-only schemes are not a good replacement for salience duplicates.

### 2.5 Cross-references are inferior to compact restatement for this use case

A deterministic “render once, then say see the beliefs section” scheme sounds tidy, but it asks the model to resolve a pointer into a later or earlier block and then apply the right frame. That is a risky maneuver in a long prompt. It saves tokens at the cost of recall and instruction-following burden.

Comparable narrative-context systems tend not to rely on empty pointers. SillyTavern’s World Info documentation tells authors that inserted lore content should be standalone; metadata/keywords can trigger insertion, but the content itself must carry what the model needs.[^sillytavern] RAG systems likewise reorder, filter, or rerank actual text chunks rather than replace them with pointers.[^llamaindex] Continuity Loom should use labels and compact pressure phrasing, not pointer-only dedupe.

### 2.6 Narrative craft supports dual-framing

Fiction is not only fact recall. A record can matter as external truth, POV access, behavioral pressure, voice constraint, physical affordance, or reveal prohibition. Narratology’s account of focalization emphasizes that character point of view is about events as perceived, felt, interpreted, and evaluated by the character, not just what is true in the storyworld.[^focalization] Recent work on internal focalization likewise frames it as an invitation to imagine perceiving from a character’s point of view.[^internal-focalization]

That supports Continuity Loom’s BELIEF and voice duplicates. A belief as a full dossier item and a belief as immediate interiority pressure are not the same instruction. A voice anchor buried in a rich cast dossier and a current scene voice pin are not the same instruction. A secret claim and a forbidden reveal are not the same instruction. The compiler is right to preserve those framings.

---

## 3. Detailed surface analysis

### 3.1 BELIEF

**Ruling: net-positive.** The user’s named example is legitimate dual-framing when rendered well. A BELIEF dossier row answers: who holds the belief, what exactly is believed, whether it is true, how confident the holder is, how they got it, how visible it is, and what behavioral effect it has. The active knowledge pressure line answers a different question: what interpretive or behavioral force must color the next segment?

The detail section must remain full because cutting truth relation, access route, or visibility is how prose leaks hidden truth into the wrong mind. The front pressure line should remain because focalized prose depends on what the POV character suspects, misreads, denies, or fears now.

**Risk:** if `active_knowledge_pressure` repeats only the BELIEF `claim` while the later dossier also leads with the full claim, the front line is doing less work than it should.

**Refinement:** lead the active pressure summary with `behavioral_effect` when populated, then compactly identify the belief. For non-POV beliefs, this matches the existing schema’s own prompt treatment: non-POV beliefs should lead through behavior. For POV beliefs the pressure line still leads with `behavioral_effect`, which intentionally differs from the `{pov_relevant_beliefs}` detail row (which leads POV beliefs with truth relation per `docs/story-record-schema.md` and `docs/compiler-contract.md §4`). That is a deliberate dual-frame — current behavioral force at the front, full truth-relation-first authority in the dossier — not a drift to be "fixed" later.

### 3.2 FACT

**Ruling: mixed; selective tightening warranted.** FACT is the weak point in the current duplicate map. Some facts are hard constraints: hard canon, current segment facts, and current state facts. Those deserve salience and may legitimately recur. Ordinary setting facts and discovered facts, however, are often inert storyworld data. If such a fact appears in hard canon, active knowledge pressure, and the detailed facts section, the prompt spends extra tokens without adding a new instruction.

This is also where the contract/code drift matters. The contract row omits FACT from `{active_knowledge_pressure}`, but code renders FACT. The correct fix is not to delete all FACT pressure. It is to make the predicate explicit and narrow.

**Refinement:** FACT should enter `active_knowledge_pressure` only if existing deterministic fields mark it as live pressure: `fact_kind=hard_canon`, `fact_kind=current_state`, `scope=current_segment`, or `salience=high|critical`. Low/medium setting/discovered facts remain in the relevant facts section and, if applicable, hard canon.

### 3.3 EVENT

**Ruling: net-positive for recent/immediate causal events, net-negative for archive-like backstory.** A previous event can be a live pressure source: a bell rang early, someone just lied, an offstage auditor is approaching. If that event is buried only in `recent_events`, the next segment may not feel causally continuous. Front salience helps.

Backstory is different. The detail section should preserve relevant backstory, but a front summary should not promote every selected backstory event to current pressure. The compiler already has deterministic fields that can separate these cases: `event_kind` and `current_relevance`.

**Refinement:** include `immediate_previous` and `recent_causal` events in active knowledge pressure when they have nontrivial current relevance; include `offstage` events only when they exert high/critical current pressure and are not reveal-unsafe; keep `relevant_backstory` and `withheld` in detail unless a strict predicate is met.

### 3.4 SECRET

**Ruling: net-positive; preserve.** SECRET is not just a fact with a label. It has a hidden claim, holders, protected non-holders, allowed cues, forbidden reveals, reveal permissions, triggers, and clue carriers. These are different instructions. Removing the lanes would likely increase the very errors the project exists to prevent: wrong narrator knowledge, premature reveal, missing clue permission, or accidentally explicit exposition.

**Risk:** repeated full secret claims in every lane would become redundant and could increase leakage pressure. The solution is not dedupe; it is lane discipline.

**Refinement:** no code change required if current render already keeps lane roles distinct. Add rationale/contract language that only the hidden-truth lane should need the full claim by default. Holder/non-holder/reveal-permission lanes should use a label or compact identifier plus the lane-specific rule.

### 3.5 LOCATION / OBJECT / VISIBLE AFFORDANCE

**Ruling: mixed.** For LOCATION and OBJECT, duplication is generally helpful. Physical continuity errors are highly visible to readers: a character crosses an impossible distance, sees through a wall, uses an object they do not have, or forgets a hazard. Putting material pressure near the front and physical continuity later is a rational defense.

VISIBLE AFFORDANCE is different. It is action possibility, material setup, and physical continuity all at once. The same `prompt_text` can therefore be rendered in `active_action_pressure`, `material_pressure`, `visible_affordances`, and `physical_continuity`. That can become same-framing repetition: “can listen at the stair door” repeated three times. The action-pressure section already gives the model the action possibility; the detail section gives constraints; physical continuity keeps object/route state stable.

**Refinement:** remove VISIBLE AFFORDANCE action text from `material_pressure`, or render it status-only there. Keep affordances in `active_action_pressure`, `visible_affordances`, and `physical_continuity`.

### 3.6 PLAN / INTENTION / OPEN THREAD / CONSEQUENCE

**Ruling: net-positive.** These records are by definition pressure. They tell the prose model what people want, what they are attempting, what consequences loom, and what unresolved tension colors the scene. A compact action-pressure précis before detail sections is exactly the summary-plus-detail pattern that long-context evidence supports.

**Risk:** including inactive, satisfied, answered, or resolved items without status markers can confuse the model. The current contract’s deterministic annotations for non-active pressure are the right mitigation.

**Disposition:** keep unchanged.

### 3.7 ENTITY STATUS

**Ruling: net-positive.** ENTITY STATUS belongs in both material pressure and physical continuity because it is a current physical/agency constraint. A concise front reminder plus detailed continuity later reduces impossible blocking and embodiment errors.

**Disposition:** keep unchanged.

### 3.8 CAST MEMBER voice

**Ruling: strongly net-positive.** Voice pins are the clearest win. The project’s current doctrine says durable dossiers are primary authority and current voice pressure is optional salience reinforcement. That distinction is exactly right. A full dossier preserves identity; a pin tells the model which part of that identity must be loud in this segment.

Fiction craft strongly supports this: voice is not merely an attribute; it shapes diction, silence, perception, gesture, and how interiority reaches the page. Long-context evidence supports repeating that pressure near the front rather than trusting the model to retrieve it from a long dossier later.

**Disposition:** keep. Add a stress case to prevent future “token saving” changes from deleting voice pins.

---

## 4. Prompt-length regime

The optimal amount of redundancy depends on prompt length and information density. In a very short prompt, there is little middle to get lost in, so repetition has less retrieval value. In a long prompt with rich cast dossiers, many objects, and multiple secrets, front salience is more valuable. That might suggest a deterministic length-aware rule.

Do **not** implement length-aware dedupe now.

Reasons:

1. Token-count thresholds are model-dependent and will age badly.
2. Length-aware behavior would make prompt diffs less stable and harder to reason about.
3. The universal prompt contract is designed to be stable and inspectable.
4. Content-type rules solve the real problem with less complexity.
5. The golden prompt is only about 6.8k estimated tokens, but it already shows useful salience duplication; the issue is not length alone, but whether a duplicate changes instruction function.

A deterministic length-aware policy would not violate determinism if it used a fixed tokenizer and fixed thresholds, but it is not justified by the evidence. Prefer differentiated predicates and render formatting.

---

## 5. Cross-referencing alternative

A “render once, reference elsewhere” scheme is not recommended.

Allowed versions of cross-reference:

- A compact label such as `Secret: sealed letter audit truth` can identify the same record across lanes.
- A pressure line can use a record display label plus a short current-pressure phrase.
- Section text can say that the detail section remains authoritative.

Disallowed or discouraged versions:

- Replacing the pressure line with “see relevant facts below.”
- Replacing secret reveal lanes with “see secret above.”
- Replacing voice pins with “see full cast dossier.”

The model needs the current instruction where the current instruction is being used. Pointer-only context assembly saves tokens but pushes retrieval and frame application back onto the model, which is precisely the failure mode the design is guarding against.

---

## 6. Branch B rationale report: why the status quo mostly wins

The user’s confusion worry is not irrational. Repeating story data can degrade prose if the repeats are same-framing, verbose, subtly inconsistent, or too numerous. But Continuity Loom’s current duplication is not mostly that. Most duplicate surfaces are attempts to present one datum under different prompt functions:

- **Pressure vs dossier:** what matters now versus the full record.
- **Hidden truth vs reveal rule:** what is true versus who may know, suspect, clue, or say it.
- **Voice pin vs identity dossier:** current scene sound/behavior versus durable character authority.
- **Action possibility vs physical constraint:** what can happen versus what must remain physically true.
- **Current state vs backstory/fact archive:** what drives this segment versus what remains canon.

That is good prompt architecture. The problem surfaces are those where the compiler lacks a clear “pressure not archive” predicate or where the same action text appears in too many pressure-like sections. The mini-spec below fixes those without undermining the design.

---

## 7. Selective-refinement mini-spec

### 7.1 Scope

This mini-spec tightens duplicate rendering at the surfaces where the evidence is mixed:

1. FACT entries in `active_knowledge_pressure`.
2. EVENT entries in `active_knowledge_pressure`.
3. BELIEF active-pressure formatting.
4. VISIBLE AFFORDANCE rendering in `material_pressure`.
5. Documentation language distinguishing salience duplicate from redundant restatement.
6. Stress-suite coverage for duplicate-salience quality.

### 7.2 Non-goals

This mini-spec does **not**:

- remove `<active_working_set>`;
- reorder the 28-section universal template;
- introduce a global dedupe pass;
- introduce pointer-only cross-references;
- use an LLM to summarize, rank, select, compress, rewrite, repair, or dedupe records;
- remove voice pins;
- reduce full active/onstage cast dossiers;
- weaken secret reveal lanes;
- use accepted/rejected/superseded prose or auto-derived summaries;
- add hidden compiler state or branch-name-dependent behavior.

### 7.3 Rationale

The rationale is the verdict above: front-loaded salience is supported, but same-framing duplicate record text should be narrowed. The active working set should remain a current-pressure précis, not a second copy of the detailed dossiers.

### 7.4 `compiler-contract.md` edits

#### 7.4.1 §3 render order

No section-order change.

Add this note under the §3 rationale paragraph after the sentence that explains why compact active pressure and voice pins appear before long cast sections:

```markdown
Active working-set lines are pressure summaries, not archive copies. A record may appear both in a pressure summary and in a later detail section only when the pressure rendering performs a different prompt function: current causal force, behavior/interiority pressure, physical constraint, reveal safety, or voice salience.
```

#### 7.4.2 §4 row: `{active_knowledge_pressure}`

Replace the current source/notes row with:

```markdown
| `{active_knowledge_pressure}` | User-authored pressure summary + selected SECRET/BELIEF/FACT/EVENT lanes, narrowed by pressure predicates | Yes when knowledge/secrecy matters | Warn/block as applicable | `None beyond detailed records below` | Keeps information pressure salient without copying the archive. BELIEF pressure leads with `behavioral_effect` when present, followed by a compact belief identifier/claim. This behavioral-effect-first ordering applies to all beliefs in the pressure summary by design — the pressure line conveys current behavioral/interiority force, not the dossier — and intentionally differs from the `{pov_relevant_beliefs}` detail row, which leads POV beliefs with truth relation; the difference is a deliberate dual-frame, not a drift bug. SECRET pressure may state the hidden truth only when reveal constraints still govern its use. FACT pressure renders only when `fact_kind=hard_canon`, `fact_kind=current_state`, `scope=current_segment`, or `salience=high|critical`; ordinary low/medium setting/discovered facts remain in the detail sections. EVENT pressure renders `immediate_previous` and `recent_causal` events with `current_relevance` other than `none`; `offstage` events render here only when `current_relevance=high|critical`; `relevant_backstory` and `withheld` events do not render here unless separately represented by a SECRET/reveal lane. If the projected pressure text equals the display label, render it once. EVENT knowledge pressure renders the description claim without appending the relevance enum. |
```

This fixes the contract/code drift by explicitly naming FACT, while also narrowing FACT’s pressure predicate.

#### 7.4.3 §4 row: `{material_pressure}`

Replace the current row with:

```markdown
| `{material_pressure}` | Selected LOCATION/OBJECT/ENTITY STATUS pressure summary | Required for physical/object-heavy moments | Block if physical tag set and absent | `None beyond detailed records below` | Current physical/material pressure. VISIBLE AFFORDANCE action text does not render here; affordances are carried by `{active_action_pressure}`, `{visible_affordances}`, and `{physical_continuity}`. If a future implementation needs a blocked/unavailable affordance warning here, it must render status-only, not repeat the affordance `prompt_text`. |
```

#### 7.4.4 §4 row: `{active_action_pressure}`

Keep the row’s source list. Append one note:

```markdown
VISIBLE AFFORDANCE action text belongs here as current action possibility; do not duplicate the same action text in `{material_pressure}`.
```

#### 7.4.5 §4 row: `{pov_relevant_beliefs}` and `{non_pov_behavior_shaping_beliefs}`

No source change. Append to each note:

```markdown
This detail row remains the full authority record. Any prior active knowledge pressure line is a current-pressure cue, not a substitute for these fields.
```

#### 7.4.6 §4 secret rows

For `{secret_holders}`, `{secret_non_holders_to_protect}`, `{allowed_clues_and_surface_cues}`, `{forbidden_reveals}`, and `{reveal_permissions}`, append this note:

```markdown
Use the secret label or compact identifier plus the lane-specific rule. Do not restate the full `secret_claim` in this lane unless omission would make the lane ambiguous.
```

#### 7.4.7 §8 empty-state rules

No structural change.

Add one bullet under pressure-summary empty-state behavior:

```markdown
A pressure summary may be empty even when later detail sections contain records, if no selected record satisfies that pressure summary’s deterministic predicate. Use the existing empty state (`None beyond detailed records below`) and do not synthesize a filler summary.
```

#### 7.4.8 §10 change-control

Add `active_knowledge_pressure` and `material_pressure` golden-prompt diff expectations to the checklist of same-revision updates:

```markdown
Changes to pressure-predicate inclusion, pressure-summary field precedence, or VISIBLE AFFORDANCE placement must update compiler tests, the golden prompt baseline, `docs/prompt-template.md`, and `docs/prompt-template-rationale.md` in the same revision.
```

### 7.5 `prompt-template.md` edits

In `<active_working_set>`, immediately before the pressure sub-blocks, add:

```markdown
These are current-pressure summaries. They are not exhaustive record dossiers. Use them to keep causal, knowledge, material, and voice pressure salient; use the later detail sections for full authority and metadata.
```

The material pressure sub-block currently carries no note — it is a bare `Material pressure:` label followed by the `{material_pressure}` placeholder (see `docs/prompt-template.md` and the mirrored `template-constants.ts` block). So this is an **add**, not a replace: add a note clarifying that affordance action text is not part of material pressure:

```markdown
Material pressure covers location, object, and entity-status constraints. Possible actions from visible affordances are summarized under action pressure and detailed under locations/objects/affordances.
```

In the active cast voice pressure note, keep the existing salience-duplicate doctrine and add:

```markdown
This is a legitimate dual-frame duplicate: current scene voice pressure here, durable cast authority later.
```

### 7.6 `prompt-template-rationale.md` edits

Add a subsection after §7 (the rationale doc currently uses flat `## N` sections with no `###` subsections; either add this as a new flat top-level section or accept that it introduces the doc's first subsection level):

```markdown
### 7.x Salience duplicates vs redundant restatement

The active working set is a salience device, not a duplicate archive. A record may appear in the active working set and later in its full detail section when the two renderings perform different jobs: current causal pressure, behavior/interiority pressure, reveal safety, physical constraint, or voice salience. The compiler should avoid same-framing repeats where a front pressure line merely repeats an ordinary fact, event description, or affordance action text already rendered later with no additional current-pressure function.
```

Add a subsection after §10:

```markdown
Voice pins remain protected salience duplicates. They should not be removed for token-budget reasons while active/onstage cast dossiers are long. The pin is the current-generation voice pressure; the dossier is the durable character authority.
```

### 7.7 `FOUNDATIONS.md` amendments

No amendment is warranted.

The mini-spec operates within the current foundations. It does not weaken deterministic compilation, local-first operation, API-key secrecy, validation fail-closed behavior, universal prompt sections, cast dossier authority, or the exclusion of accepted/rejected/superseded prose and auto-derived summaries.

### 7.8 Code targets

Implementation should touch only deterministic compiler and tests:

- `packages/core/src/compiler/sections/pressure.ts`
  - Note: `active_knowledge_pressure` currently resolves SECRET/BELIEF/FACT/EVENT through a **single shared** projection (`firstText(payload, ["secret_claim", "claim", "statement", "description"])`) and a `() => true` predicate via `pressureFromRecords`. The three changes below all require introducing **per-type** handling (a per-type predicate and/or projection), so size this as a shared-projection split rather than four isolated tweaks.
  - Update FACT predicate in `active_knowledge_pressure`.
  - Update EVENT predicate in `active_knowledge_pressure`.
  - Change BELIEF pressure formatting to prefer `behavioral_effect` when present.
  - Remove VISIBLE AFFORDANCE from `material_pressure` or render status-only if explicitly kept.
- `packages/core/src/compiler/template-constants.ts`
  - Update section prose notes per `prompt-template.md`.
- `packages/core/test/compiler-pressure-sections.test.ts`
  - Add predicate and formatting tests.
- `packages/core/test/compiler-golden.test.ts`
  - Accept the updated golden prompt.
- `packages/core/test/golden-first-segment.prompt.txt`
  - Baseline moves.

No storage, server, web UI, OpenRouter, record mutation, or validation-gating changes are required unless implementing a new warning. This mini-spec does not require a schema change because FACT and EVENT already carry deterministic kind/scope/salience/current-relevance fields.

### 7.9 Validation and warning impacts

No blocker behavior changes.

Optional warning, if desired:

```markdown
Warn when more than N ordinary FACT or relevant_backstory EVENT records are selected but none qualify for active knowledge pressure, and the generation brief has a knowledge/secrecy focus tag. The warning must be authoring guidance only; it must not add records or synthesize pressure text.
```

This warning is not required for the mini-spec. It may be deferred to keep implementation small.

### 7.10 Stress-suite impact

Add a new conceptual case after the existing salience/long-dossier cases:

```markdown
### Case 32 — Cross-segment salience duplicate calibration

Setup:
- One high-salience BELIEF with populated behavioral effect.
- One ordinary low-salience setting FACT.
- One critical current-state FACT.
- One immediate_previous EVENT with high current relevance.
- One relevant_backstory EVENT with low current relevance.
- One SECRET with holders, protected non-holders, allowed cues, forbidden reveals, and locked/clue-only reveal permission.
- One VISIBLE AFFORDANCE that can drive action.
- One active/onstage cast member with a long full dossier and a current voice pressure pin.

Expected prompt behavior:
- BELIEF appears as behavior/interiority pressure in active knowledge pressure and as full metadata in belief details.
- Ordinary low-salience setting FACT does not appear in active knowledge pressure, but remains in detail facts.
- Critical/current FACT appears in active knowledge pressure and in detail/hard canon as applicable.
- Immediate/recent high-relevance EVENT appears in active knowledge pressure and event details.
- Low-relevance backstory does not appear in active knowledge pressure.
- SECRET lanes remain separate; only lane-specific text repeats.
- VISIBLE AFFORDANCE action text appears in active action pressure and detail/physical continuity, not material pressure.
- Voice pin remains before full cast dossier.
```

### 7.11 Stress coverage matrix impact

Add a row to the numbered table in `docs/stress-coverage-matrix.md`. That table is **4 columns** (`| # | Stress case | Risk area | Implemented v1 capability |`) and its `#` cell is formatted `| Case N |`, so the row must fold the golden/test proof into the capability column:

```markdown
| Case 32 | Cross-segment salience duplicate calibration | Prompt salience vs redundant restatement; long-context placement; duplicate-noise control | Active working set predicates (`fact_kind`/`scope`/`salience` FACT gate, `event_kind`/`current_relevance` EVENT gate), belief behavior-first pressure, affordance removal from `material_pressure`, voice-pin preservation; golden prompt diff plus compiler pressure tests prove current-pressure summaries remain dual-frame while inert archive text is not copied forward. |
```

Pre-existing drift (out of scope for this mini-spec): the matrix's numbered table currently stops at Case 26, even though `docs/stress-suite.md` already defines Cases 27–31. This mini-spec only adds the Case 32 row in the correct format; backfilling rows for Cases 27–31 is a separate matrix-maintenance task and is not undertaken here.

### 7.12 Golden prompt impact

The golden prompt baseline will move. Expected diffs:

- `<active_working_set>` knowledge pressure may lose ordinary FACT and low-current-relevance EVENT lines.
- BELIEF lines may reorder content to lead with behavioral effect.
- Material pressure may drop VISIBLE AFFORDANCE action text.
- Section order remains unchanged.
- Secret lanes remain unchanged except for possible minor wording if lane labels are tightened.
- Voice pin placement and full cast dossier placement remain unchanged.

### 7.13 Token-budget delta

Estimated savings:

- Golden prompt: **100–250 tokens**, mostly from FACT/EVENT pressure narrowing and VISIBLE AFFORDANCE removal from material pressure.
- Larger record-dense prompts: **5–12%** if many low/medium facts, backstory events, and affordances were previously repeated in front pressure summaries.
- Full deletion of `<active_working_set>` would save about **700 tokens** in the golden prompt, but is rejected because it removes high-value salience.
- Full pointer-only dedupe could save more, but is rejected because it weakens instruction locality and recall.

Token savings are a secondary benefit. The primary value is lower duplicate noise while preserving the salience architecture.

### 7.14 Decomposition into reviewable tickets

This mini-spec can split cleanly:

1. **Contract/rationale docs:** update `compiler-contract.md`, `prompt-template.md`, and `prompt-template-rationale.md` with salience-duplicate terminology and row changes.
2. **Active knowledge pressure predicates:** implement FACT/EVENT predicate narrowing and BELIEF behavior-first formatting in `pressure.ts` with unit tests.
3. **Material pressure affordance cleanup:** remove/status-only VISIBLE AFFORDANCE from `material_pressure` with unit tests.
4. **Golden prompt refresh:** update `golden-first-segment.prompt.txt` and golden regression tests.
5. **Stress coverage:** add Case 32 and the matrix row.

Each ticket is deterministic and reviewable without touching storage, UI, OpenRouter, accepted prose, or validation snapshots.

---

## 8. Foundations alignment

### 8.1 §29 alignment checklist

| Foundation check | Result |
|---|---|
| Deterministic compilation | Pass. All predicates use existing deterministic fields: record kind, fact kind, scope, salience, event kind, current relevance, status, and populated user-authored text. |
| No LLM intermediary | Pass. No LLM summarization, ranking, repair, rewriting, compression, dedupe, or selection. |
| User-controlled working set | Pass. The compiler does not add records. It only changes which selected records are front-summarized. |
| Prompt contract bridge | Pass. All placeholder/source/empty-state changes are expressed as `compiler-contract.md` edits. |
| Universal template integrity | Pass. No section is removed or reordered. |
| Cast dossier authority | Pass. Full active/onstage dossiers remain full. Voice pins are preserved. |
| Secret/reveal safety | Pass. Secret lanes remain; lane discipline is clarified. |
| Physical continuity | Pass. Entity status, locations, objects, affordance details, and physical continuity remain. |
| Accepted/rejected/superseded prose exclusion | Pass. No prose archive enters prompt context. |
| Local-first and API-key secrecy | Pass. No network/storage/security change. |

### 8.2 §29.4 prompt-compilation hard-fails

| Hard-fail category | Result |
|---|---|
| Uses an LLM to select/rank/summarize/repair/rewrite records | No. |
| Makes prompt output nondeterministic | No. |
| Allows accepted/rejected/superseded prose into prompt-facing context | No. |
| Omits required universal sections without foundation amendment | No. |
| Adds provider-specific hacks to the v1 core contract | No. |
| Weakens validation fail-closed behavior | No. |

No foundations amendment is needed.

---

## 9. Final recommendation

Adopt the mini-spec. Do not pursue a broad dedupe redesign.

The right policy is not “repeat everything” and not “mention every datum once.” The right policy is:

1. **Keep front salience for live pressure.**
2. **Keep full later dossiers for authority and metadata.**
3. **Keep secret lanes and voice pins.**
4. **Narrow ordinary fact/event promotion.**
5. **Stop repeating affordance action text in material pressure.**
6. **Use labels and compact pressure phrasing, not pointer-only cross-references.**

That protects the project’s core prose-quality doctrine while removing the clearest duplicate-noise cases the user is worried about.

---

## 10. Acceptance checklist

- [x] The deliverable is the single file `prompt-duplication-verdict-and-spec.md`, opening with an evidence-cited verdict.
- [x] It rules per duplication surface in §3.1 and explicitly upholds/refines the §3.2 doctrine.
- [x] It distinguishes redundant restatement from legitimate dual-framing.
- [x] It takes Branch B and includes a selective-refinement mini-spec.
- [x] Every proposed change is expressible as deterministic `compiler-contract.md` edits and respects all hard invariants.
- [x] No foundations amendment is proposed; §29/§29.4 alignment is shown inline.
- [x] Validation, stress-suite, golden-prompt, and token-budget impacts are stated.
- [x] No external repository context is assumed beyond the uploaded brief, uploaded manifest, and exact-commit URL fetches listed in the ledger.

---

## Sources

### Repository files

The repository sources used are the exact URLs listed in the evidence ledger. They were treated as fetched from the user-supplied target commit only, not as proof of current `main`.

### External research and practitioner sources

[^lost-middle]: Nelson F. Liu et al., “Lost in the Middle: How Language Models Use Long Contexts,” *Transactions of the Association for Computational Linguistics*, 2024. https://aclanthology.org/2024.tacl-1.9/

[^ruler]: Cheng-Ping Hsieh et al., “RULER: What’s the Real Context Size of Your Long-Context Language Models?” arXiv:2404.06654, 2024. https://arxiv.org/abs/2404.06654

[^needlebench]: “NeedleBench: Evaluating LLM Retrieval and Reasoning Across Varying Information Densities,” arXiv:2407.11963. https://arxiv.org/abs/2407.11963

[^nolima]: “NoLiMa: Long-Context Evaluation Beyond Literal Matching,” arXiv:2502.05167. https://arxiv.org/abs/2502.05167

[^distracted]: Freda Shi et al., “Large Language Models Can Be Easily Distracted by Irrelevant Context,” arXiv:2302.00093, 2023. https://arxiv.org/abs/2302.00093

[^conflicts]: Rongwu Xu et al., “Knowledge Conflicts for LLMs: A Survey,” EMNLP 2024. https://aclanthology.org/2024.emnlp-main.486.pdf

[^prompt-repetition]: Yaniv Leviathan, Matan Kalman, and Yossi Matias, “Prompt Repetition Improves Non-Reasoning LLMs,” arXiv:2512.14982. https://arxiv.org/abs/2512.14982

[^anthropic]: Anthropic, “Claude prompting best practices,” especially XML tag guidance for complex prompts. https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices

[^anthropic-long]: Anthropic, “Claude prompting best practices,” long-context guidance on structuring data-rich inputs and placing longform data near the top. https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices

[^gemini]: Google AI for Developers, “Prompt design strategies,” Gemini API docs. https://ai.google.dev/gemini-api/docs/prompting-strategies

[^llamaindex]: LlamaIndex, “Node Postprocessor Modules,” including long-context reorder and related postprocessors. https://developers.llamaindex.ai/python/framework/module_guides/querying/node_postprocessors/node_postprocessors/

[^sillytavern]: SillyTavern Docs, “World Info.” https://docs.sillytavern.app/usage/core-concepts/worldinfo/

[^focalization]: The Living Handbook of Narratology, “Focalization.” https://www-archiv.fdm.uni-hamburg.de/lhn/node/18.html

[^internal-focalization]: Adrian Bruhns and Tilmann Köppe, “Internal Focalization and Seeing through a Character’s Eyes,” *Estetika: The European Journal of Aesthetics*, 2024. https://estetikajournal.org/articles/10.33134/eeja.364
