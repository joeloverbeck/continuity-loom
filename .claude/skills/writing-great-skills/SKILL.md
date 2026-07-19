---
name: writing-great-skills
description: Reference for writing and editing skills well — the vocabulary and principles that make a skill predictable.
disable-model-invocation: true
---

A skill exists to wrangle determinism out of a stochastic system. **Predictability** — the agent taking the same _process_ every run, not producing the same output — is the root virtue; every lever below serves it.

[`GLOSSARY.md`](GLOSSARY.md) is the canonical source for **bold terms**. Look up only terms whose full definitions bear on the current decision, using its linked term index; do not load the whole glossary by default.

**Writing one from zero?** These are levers, not a sequence — but a serviceable order is: settle **invocation** first (it sets what every other choice costs), mine the **leading words** you already say when you want the skill, draft, then prune and self-check the draft against the **failure modes** below. If the skill names anything in the codebase — files, symbols, flows, selectors, IDs — verify every reference against the live repo before shipping; a pointer to a target that doesn't exist is a silent variance bug that misfires the same way every run. Editing an existing skill, jump straight to the lever at issue.

When creating a skill in a live repo, use this skill for design judgment and the repo's skill-creation/scaffolding workflow for file creation, metadata, validation, and mirrors. If no repo-local owner exists, use the host's creator for compatible mechanics, then apply the sibling-derived metadata, validator-conflict, and mirror rules under **Invocation** before shipping.

## Invocation

Two choices, trading different costs:

- A **model-invoked** skill exposes a model-facing **description** or equivalent invocation pointer, so the agent can fire it autonomously _and_ other skills can reach it (you can still type its name too). It contributes to **context load** — the pointer sits in the window every turn. Mechanics: follow the host's model-discovery convention, and write model-facing trigger phrasing ("Use when the user wants…, mentions…").
- A **user-invoked** skill disables the model-facing invocation pointer: only you, typing its name, can invoke it — and no other skill can. Zero context load, but it spends **cognitive load**: _you_ are the index that must remember it exists. Mechanics: follow the host's explicit-only convention, such as `disable-model-invocation: true` or `agents/openai.yaml` policy; any remaining `description` is human-facing. The constraint is on triggers, not length: it may be richly descriptive, since it is the human's only cue for what the skill does.

Pick model-invocation only when the agent must reach the skill on its own, or another skill must. If it only ever fires by hand, make it user-invoked and pay no context load.

Beyond this axis, the rest of a skill's front matter is plumbing, not a predictability lever — for a human-facing `description`, or to declare the `arguments` a skill accepts, copy the shape from a sibling skill rather than deriving it here.

After choosing invocation, inspect sibling skills and sync every host metadata surface the repo uses: front matter, invocation policy such as `agents/openai.yaml`, optional UI metadata, and discovery mirrors such as `.agents/skills` symlinks. A host policy that enforces user-only reach is required behavior, not optional display metadata. Treat generic validator output as a check on that host's schema, not as authority to overwrite the repo's house shape.

When user-invoked skills multiply past what you can remember, that piled-up cognitive load is cured by a **router skill**: one user-invoked skill that names the others and when to reach for each.

Before shipping a new skill, run this pre-ship check: initializer placeholders removed, every context pointer resolves to current material, invocation metadata and policy match sibling skills, optional display metadata is coherent, repo mirrors resolve where the repo uses them, and the final text has passed the failure-mode scan.

## Proving predictability

Before shipping, enumerate every material **branch** and, for each, walk one representative raw invocation through the model-facing **description** or explicit entrypoint, every **context pointer** it should fire, the **steps** and **completion criteria** it reaches, and the artifact or terminal state it should produce. The proof is about process, not identical output.

Record the walk in the repo workflow's validation artifact, or in the final response when no such artifact exists. Use one row per material branch:

| Branch | Raw invocation | Entrypoint | Context pointers | Steps and criteria | Artifact or terminal state | Evidence |
| ------ | -------------- | ---------- | ---------------- | ------------------ | -------------------------- | -------- |

Prefix each Branch cell with `load-bearing -` when the skill cannot fulfil its purpose without that branch; otherwise use `supporting -`. Write Evidence as `exercised - <fixture, command, or trace>` or `unexercised - <reason>`. Tests and validators may supply evidence, but do not substitute their coverage for the raw-invocation walk or infer one branch from a neighboring branch.

The receipt is structurally complete only when every enumerated branch has exactly one row and every unexercised row is reported at closeout. Immediately before any readiness or completion claim, reconcile the enumerated branch set against the receipt rows and confirm zero missing, extra, or duplicate branches.

Record `Branch proof status: proven` only when the receipt is structurally complete and every load-bearing branch is exercised; otherwise record `Branch proof status: unproven - <reason>`. Do not call the skill ready, complete, ship-ready, or equivalent unless the recorded status is `proven`. If exercise is unsafe, unavailable, or disproportionate, stop and obtain explicit owner acceptance before shipping it as `unproven`; keep the `unproven` label at closeout and report every unexercised load-bearing row. A supporting branch may remain unexercised with its reason reported without making the skill `unproven`.

Use the repo's skill-creation or refactoring workflow for fixtures, forward tests, validator commands, custody, and mirror proof rather than duplicating those mechanics here. Do not create a standalone skill document solely for the receipt.

## Writing the description

A model-invoked **description** does two jobs — state what the skill is, and list the **branches** that should trigger it. Every word increases **context load**, so a description earns even harder pruning than the body:

- **Front-load the skill's leading word** — the description is where it does its invocation work.
- **One trigger per branch.** Synonyms that rename a single branch are **duplication** — "build features using TDD … asks for test-first development" is one branch written twice. Collapse them; keep only genuinely distinct branches.
- **Cut identity that's already in the body.** Keep the description to triggers, plus any "when another skill needs…" reach clause.

## Information hierarchy

A skill is built from two content types — **steps** and **reference** — that mix freely: a skill can be all steps, all reference, or both. The core decision is which to use and where each sits on the **information hierarchy**, a ladder ranked by how immediately the agent needs the material:

1. **In-skill step** — an ordered action in `SKILL.md`, the primary tier: what the agent does, in order. Each step ends on a **completion criterion**, the condition that tells the agent the work is done. Make it _checkable_ (can the agent tell done from not-done?) and, where it matters, _exhaustive_ ("every modified model accounted for", not "produce a change list") — a vague criterion invites **premature completion**.
2. **In-skill reference** — a definition, rule, or fact in `SKILL.md`, consulted on demand. Often a legitimately flat peer-set (every rule of a review on one rung) — a fine arrangement, not a smell. _This skill is all reference._
3. **External reference** — reference pushed out of `SKILL.md` into a separate file, reached by a **context pointer**, loaded only when the pointer fires. (Spans _disclosed_ reference — a sibling file like `GLOSSARY.md`, still part of the skill — through fully **external reference** that lives outside the skill system and any skill can point at.)

A demanding completion criterion drives thorough **legwork** — the digging the agent does within the work — whether the skill has steps or not, since "every rule applied" binds flat reference just as "every step done" binds a sequence.

Push too little down and the top bloats; push too much and you hide material the agent actually needs. That tension is the whole decision.

**Progressive disclosure** is the move down the ladder — out of `SKILL.md` into a linked file — so the top stays legible. Mechanics: a linked `.md` file in the skill folder, named for what it holds (this skill discloses its full definitions to `GLOSSARY.md`). Some skills are used in more than one way, and each distinct way is a **branch** — different runs taking different paths through the skill. Branching is the cleanest disclosure test: inline what every branch needs, and push behind a pointer what only some branches reach. A **context pointer**'s _wording_, not its target, decides when and how reliably the agent reaches the material — but that presumes the target exists: confirm every pointer resolves to real, current material, since one aimed at a stale or absent target fails silently.

Where the ladder decides _how far down_ a piece sits, **co-location** decides _what sits beside it_ once there: keep a concept's definition, rules, and caveats under one heading rather than scattered, so reading one part brings its neighbours with it.

## When to split

**Granularity** is how finely you divide skills, and each cut spends one of the two loads, so split only when the cut earns it. Two cuts:

- **By invocation** — split off a **model-invoked** skill when you have a distinct **leading word** that should trigger it on its own, or another skill must reach it. You pay **context load** for the new always-loaded **description**, so that independent reach has to be worth it.
- **By sequence** — split a run of **steps** when the steps still ahead (a step's **post-completion steps**) tempt the agent to rush the one in front of it (**premature completion**). Keeping them out of view encourages the agent to do more **legwork** on the current task.

Writing a skill that deliberately parallels an existing one — a sibling in a family — mirror its section structure and vocabulary so a reader who knows one knows the other, sparing the human a fresh shape to learn per sibling (a **cognitive load** saving). Diverge only where the **leading word** or purpose genuinely differs; divergence for its own sake spends that saving for nothing.

## Pruning

Keep each meaning in a **single source of truth**: one authoritative place, so changing the behaviour is a one-place edit.

Check every line for **relevance**: does it still bear on what the skill does?

Then hunt **no-ops** sentence by sentence, not just line by line: run the no-op test on each sentence in isolation, and when one fails, delete the whole sentence rather than trim words from it. Be aggressive — most prose that fails should go, not be rewritten.

## Leading words

A **leading word** is a compact concept already living in the model's pretraining that the agent thinks with while running the skill (e.g. _lesson_, _fog of war_, _tracer bullets_). Repeated throughout the text (though not necessarily - a strong leading word might only be needed once), it accumulates a distributed definition and anchors a whole region of behaviour in the fewest tokens, by recruiting priors the model already holds.

It serves predictability twice. In the body it anchors _execution_: the agent reaches for the same behaviour every time the word appears. In the description it anchors _invocation_: when the same word lives in your prompts, docs, and code, the agent links that shared language to the skill and fires it more reliably.

Hunt for opportunities to refactor skills to use leading words. A triad spelled out at three sites (**duplication**), a description spending a sentence to gesture at one idea — each is a passage begging to **collapse** into a single token. Examples include:

- "fast, deterministic, low-overhead" -> _tight_ — one quality restated across a phase — into a single pretrained word (a _tight_ loop).
- "a loop you believe in" -> _red_ — converts a fuzzy gate into a binary observable state (the loop goes _red_ on the bug, or it doesn't).

You win twice over: fewer tokens, _and_ a sharper hook for the agent to hang its thinking on. Assume every skill is carrying restatements that leading words retire — go find them.

## Failure modes

Use these to diagnose issues the user may be having with a live skill — and as a pre-ship checklist run over a fresh draft before you ship it.

- **Premature completion** — ending a step before it's genuinely done, attention slipping to _being done_. Defence, in order: sharpen the completion criterion first (cheap, local); only if it is irreducibly fuzzy _and_ you observe the rush, hide the post-completion steps by splitting (the sequence cut).
- **Duplication** — the same meaning in more than one place. Costs maintenance and tokens, and inflates a meaning's prominence on the ladder past its real rank.
- **Sediment** — stale layers that settle because adding feels safe and removing feels risky. The default fate of any skill without a pruning discipline.
- **Sprawl** — a skill simply too long, even when every line is live and unique. Hurts readability and maintainability and wastes tokens. The cure is the ladder: disclose **reference** behind pointers, and split by **branch** or sequence so each path carries only what it needs.
- **No-op** — a line the model already obeys by default, so you pay load to say nothing. The test: does it change behaviour versus the default? A weak leading word (_be thorough_ when the agent is already thorough-ish) is a no-op; the fix is a stronger word (_relentless_), not a different technique.
