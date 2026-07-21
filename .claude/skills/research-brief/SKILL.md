---
name: research-brief
description: "Use when you need to hand a research task to an external deep researcher (ChatGPT-Pro) and want the comprehensive prompt authored here, with full repo access, instead of in a throwaway ChatGPT-Pro session. Interviews you to 95% confidence, then emits a self-contained, paste-ready requirements prompt and refreshes the upload manifest. Triggers: needing a next spec, a thorny fix, a hardening / anti-contamination pass, or a foundational/doc overhaul deep-researched externally. Produces: reports/<topic>-research-brief.md + a refreshed reports/manifest_<date>_<shortsha>.txt. Mutates: only reports/ on user approval."
user-invocable: true
arguments:
  - name: research_target
    description: "What the external deep researcher (ChatGPT-Pro) should produce — the thing to be deep-researched (string). A sentence is fine; the skill sharpens it through exploration and interview."
    required: true
  - name: reference_path
    description: "Optional path to a report, finding-set, or analysis to fold into the brief as established context."
    required: false
---

# Research Brief

Author the comprehensive, paste-ready prompt for an **external deep-research session** (ChatGPT-Pro) — here, where Claude has direct access to the whole Continuity Loom repository — instead of reconstructing it interactively in ChatGPT-Pro.

This skill replaces **"Session 1"** of the user's two-stage routine:

- **Session 1 (replaced by this skill)**: explore the repo, interview the user to 95% confidence about their *actual* intent, then author a requirements-style prompt.
- **Session 2 (ChatGPT-Pro, the actual deep researcher)**: receives the uploaded manifest + the emitted prompt, explores and researches online as deeply as needed, and **produces the deliverable directly** — it does not re-interview.

The emitted brief is **self-contained**: ChatGPT-Pro Session 2 has none of this session's context, so everything it needs must live in the prompt plus the uploaded manifest.

<HARD-GATE>
Do NOT Write the brief file or refresh the manifest until BOTH hold:
(a) the interview has reached ~95% confidence (or the user issued an early-exit "just go" — in which case remaining gaps are written into the brief as explicit, labeled assumptions); AND
(b) the Step 5 brief outline + settled-intentions summary has been presented in chat and the user has approved it (silence on a section while answering other questions counts as approval; an explicit objection re-opens that section and requires re-presenting the correction first).
The skill mutates only `reports/`. It NEVER edits `docs/`, `specs/`, `tickets/`, `.claude/skills/`, or source code.
</HARD-GATE>

## Invocation

```
/research-brief "<what ChatGPT-Pro should deep-research>"   [reference_path]
```

## Step 1: Classify the research target

Read `research_target` (and `reference_path` in full if given). Classify into one type — this selects the load-bearing "read in full" set for Session 2 (the type→reads map is in `references/brief-template.md`):

- **new-spec** — what to build/create next for the repo.
- **thorny-fix** — diagnose and resolve a stubborn defect or design knot.
- **hardening / anti-contamination** — strengthen an existing system against drift, weak proof, or prompt-context contamination (accepted prose, rejected/superseded candidates, or auto-derived summaries leaking into compiled prompt context — see `docs/principles/FOUNDATIONS.md` and `docs/ACTIVE-DOCS.md`).
- **foundational / doc-overhaul** — overhaul a governing doc (or the cascade from an upstream authority change).
- **other** — anything else; build the read set from exploration alone.

Announce the classification on its own line as your **first user-facing output**, before any exploration tool call — emit `Classification: <type>` so the audit trail records it independent of your reasoning. When ambiguous, give a one-sentence justification.

A target may carry a **dominant type plus a secondary** (e.g. a hardening pass whose deliverable is a new spec). When so, classify by the dominant type to pick the primary read-set, then union in the secondary type's load-bearing reads, and name both in the announcement (`Classification: <dominant> (secondary: <type>)`).

When a secondary type is only determinable **after exploration or the interview** (e.g. a foundational secondary that hinges on whether the deliverable will *author amendment wording* versus merely *flag* the need), announce the dominant type provisionally as your first-output line, note in one clause that a secondary may attach pending findings, and **restate the finalized `Classification:` line in the Step 5 outline** so the audit trail records the resolved type rather than a silently-changed one.

A **determination-first** target — one whose job is to *decide whether* work is warranted before any is produced ("audit whether X needs changing; if so, specify it") — has no class of its own. Classify it by the type it would *feed* (usually **new-spec**), and handle the decide-then-produce shape through the determination-plus-conditional deliverable modes in `references/brief-template.md` §7, not the classification line. A determination-first target that *also* carries a secondary still announces that secondary — `Classification: <fed-type> (secondary: <type>)` — while the determination-first shape stays off the line and lives only in the §7 deliverable mode.

The determination-first shape never appears on the classification line. Do **not** write it there — `Classification: new-spec (determination-first → new-spec)` is **wrong**. For a determination-first → new-spec target with no secondary, the line is exactly `Classification: new-spec`; append `(secondary: <type>)` only for a genuine secondary type.

A deliverable element that merely **flags whether** a governing doc (e.g. `docs/principles/FOUNDATIONS.md`) needs amending — common in Loom targets phrased "indicate if foundational amendments are warranted" — does **not** make `foundational / doc-overhaul` a secondary type. That flag is a §7 determination-plus-conditional deliverable element (`references/brief-template.md` §7), off the classification line. Append `(secondary: foundational / doc-overhaul)` only when the deliverable will itself *overhaul* a governing doc (or carry the cascade from an upstream authority change — including a **precursor that authors exact proposed amendment wording** for a governing doc, even though it does not itself edit that doc), never for a flag-only conditional.

## Step 2: Explore the repo to ground the brief

**First, read `references/brief-template.md` in full.** §A is the canonical eight-section anatomy your Step 6 brief must follow (Context · Read-in-full · Settled intentions · The task · Exploration mandate · Doctrine & constraints · Deliverable spec · Self-check); §B is the target-type→reads map that grounds the Step 1 classification's read-set. Hold both in view through drafting — do not reconstruct the brief's structure from memory, or the emitted brief drifts off the anatomy (e.g. the consolidated Settled-intentions block gets scattered into prose).

The point of authoring here is that Claude can read the repo directly — so the *user never types out what the researcher should read*. Build, from exploration:

- the **authority-ordered read list**, following Loom's hierarchy in `docs/ACTIVE-DOCS.md`: `docs/principles/FOUNDATIONS.md` (constitution) → product/user-facing (`README.md`, `docs/user-guide.md`) → prompt/compiler/validation/schema (`docs/specs/compiler-contract.md`, `docs/specs/prompt-template.md`, `docs/prompt-template-rationale.md`, `docs/specs/story-record-schema.md`) → stress/demo/regression (`docs/specs/stress-suite.md`, `docs/specs/stress-coverage-matrix.md`, `docs/demo-blocker-recipes.md`) → agent/process (`AGENTS.md`, `CLAUDE.md`, `docs/archival-workflow.md`, `tickets/README.md`), then relevant `reports/`, `specs/`, `archive/`. Give each entry a one-line reason it is load-bearing for *this* target;
- the **relevant code seams** Session 2 should inspect (name files/modules across `packages/core`, `packages/server`, `packages/web` — don't paste them; Session 2 reads them itself);
- any **prior report / spec / archived work** that already bears on the target, so the brief frames the task as a delta rather than a cold start. **Before treating any target as a cold start, scan `archive/specs/` + `archive/reports/` for a prior spec or report on the same surface** — the predecessor is often an already-**implemented** feature whose spec lives in `archive/specs/` (its research brief archived alongside), not only an earlier research brief or one pass of a multi-block campaign. When the target continues a multi-block campaign, follows an earlier brief, or extends a shipped spec, name the predecessor (`reports/<...>-research-brief.md` and/or `archive/specs/SPEC-NNN-*.md`) explicitly and state what it already delivered (see `references/brief-template.md` §1) so Session 2 does not re-commission completed work; if that predecessor's deliverable was already **implemented** (its recommendations became merged code, not just completed research), also pin the implementing commit/PR and the shifted post-implementation baseline per `references/brief-template.md` §1.

Launch Explore agents for broad surveys. Verify any repo claim in `research_target` or `reference_path` against the actual tree; flag contradictions prominently.

## Step 3: Light online research (optional)

Only to **sharpen scope and interview questions** — surface the named techniques, prior art, or decision axes the interview should resolve. The *deep* research is Session 2's job; do not do it here. If skipped, announce it in-session as a one-liner (e.g., "Online research: skipped — repo-internal realignment") so the audit trail is visible independent of the brief body. **The research is optional; the run-or-skip announcement is not** — emit it either way, as a peer of the Step 1 `Classification:` line.

## Step 4: Interview to 95% confidence

Reach **95% confidence about what the user actually wants** — not what they think they should want — before drafting. Display this block after each answer (or, when a batch is sent, once before the batch and once after it):

```
Confidence: X%
Gaps: [specific remaining unknowns]
```

Rules: ask one *conceptual* question at a time when probing motivation or uncertainty sequentially, where each answer reshapes the next; but batch independent, already-scoped bounded choices into a single `AskUserQuestion` call (≤4 questions). A reshaping conceptual question *may* ride in a batch with bounded ones only when the bounded options stay valid across every plausible answer to it (and you supply recommendations); if any bounded option would change meaning depending on the reshaping answer, ask the reshaping question standalone first. Prefer bounded multiple-choice (`AskUserQuestion` when available). Probe motivation before solution; challenge premature specificity; name uncertainty specifically; respect demonstrated expertise and "you decide" delegation (re-evaluate and recommend, don't re-ask). Distinct from that user→author delegation is the user routing a *decision axis to Session 2* ("let the research decide the technique mix"): offer this as an explicit `AskUserQuestion` option for axes the deep research is better positioned to settle, and record the result in §3 as a committed decision — the delegation **plus its bounding constraints/anchor** — so Session 2 owns "research and recommend," not a question reopened to the user. Confidence rises from both answers and exploration findings; note which gaps each closes. On receiving batched answers, re-display the `Confidence / Gaps` after-block before proceeding — unless confidence reaches threshold, in which case the "95% — drafting the brief" announcement subsumes it. This applies between **every** two consecutive question rounds, batched or single: when the answers leave you below threshold and the next action is *another* round of questions (not the drafting announcement), re-display the block first — do not chain question rounds without it. Announce "95% — drafting the brief" when reached. Residual low-stakes gaps with strong defaults do not force another question round: carry each into the Step 5 outline as a labeled default closed by the outline approval (silence = approval), provided it is surfaced explicitly there; reserve another round only for a gap that would change a settled intention.

**Early exit**: if the user says "just go," announce current confidence, list remaining gaps, and carry them into the brief as labeled assumptions (`assumption: X`) so Session 2 — which will not ask — treats them as decisions the user can later correct.

## Step 5: Present the brief outline (HARD-GATE)

Before writing, present in chat:

1. the **settled intentions** — the resolved decisions the interview produced (these become §3 of the brief and are what make Session 2 "locked");
2. the **deliverable spec** — exactly which downloadable markdown docs Session 2 must produce (replace vs. new, filenames, or a **spec-precursor change-proposal document** — a hand-off filename rather than a repo path, never authored as a `SPEC-NNN`); when the research target's wording merely says "spec," that word alone is ambiguous between a numbered `SPEC-NNN` draft and this change-proposal precursor — default to the **precursor** (the canonical Loom pipeline) and confirm the choice in the interview rather than letting "spec" trigger a numbered-spec deliverable; for *determination-plus-conditional* targets ("decide if X is needed, and if so produce X"), state both the required verdict and which of the three production modes governs the artifact — unconditionally (verdict embedded), only on a positive verdict, or always-produce-form-follows-verdict (one document whose shape — e.g. spec vs. rationale report — depends on the verdict; this mode needs both Branch A / Branch B shapes specified) — see `references/brief-template.md` §7;
3. the **read-in-full list** (authority-ordered, with the one-line reasons).

Before presenting, confirm both audit-trail announcements were emitted earlier this run: the Step 1 `Classification:` line and the Step 3 online-research run-or-skip one-liner. If either was missed, emit it now. If the Step 1 classification carried a provisional secondary pending findings, restate the finalized `Classification:` line here. Also confirm every path in the read-in-full list resolves at the fetch-baseline commit before you present it (run the §2-completeness check from Step 6), and that every `§N`/named section anchor you intend to cite *into* a read-list doc resolves at that commit (grep the heading — a path can resolve while the cited section does not): drop or correct any path or anchor that doesn't — predecessor reports often cross-reference files since deleted — so the list you present is the list Session 2 can actually fetch.

Get approval (per the HARD-GATE). Revise on pushback before writing.

## Step 6: Write the brief and refresh the manifest

On approval, do BOTH:

1. **Write the brief** to `reports/<topic>-research-brief.md`, emitting the eight sections of `references/brief-template.md` §A in order. The settled intentions you presented in Step 5 must appear as a dedicated `§3 Settled intentions` block — the consolidated list of locked decisions that makes Session 2 no-questions — not folded into the task statement, doctrine, or deliverable prose. `<topic>` is a short kebab-case slug of the target.
2. **Refresh the manifest**: write the current repository path inventory to `reports/manifest_<today>_<shortsha>.txt`, where `<today>` is the real current date (`date +%F`), `<shortsha>` is the fetch-baseline commit's short hash (`git rev-parse --short HEAD`), and the inventory is that exact commit's tree — `git ls-tree -r --name-only HEAD` (use the same `<baseline>` you pin in the brief's §1, not `git ls-files`, so the manifest provably equals the commit Session 2 fetches from). The `<shortsha>` suffix keeps each brief's bundle 1:1 with its §1 commit: a second brief authored the same calendar day at a different HEAD gets a distinct filename and never overwrites a predecessor brief's manifest — a date-only name would silently invalidate the older brief's upload bundle (its §1 pins a different commit than the regenerated manifest then reflects). Name this exact file in the brief's §1 manifest pointer so Session 2 uploads the matching inventory. Leave older manifests in place for the user to clean — this includes a manifest superseded by re-pinning the *same* brief (see the **Re-pinning** note below), not only manifests from other briefs; the skill never deletes one, since deleting it would stage a change that re-advances HEAD off the freshly-pinned baseline if committed. Always write the manifest — its creation is unconditional. The only special case is a re-run at the same commit: when one already exists for this exact `<today>_<shortsha>`, overwrite it fresh rather than trusting the possibly-stale one.

**Baseline-commit rule.** The brief instructs Session 2 to fetch every file from one exact commit, so the manifest must list exactly that commit's tree. Derive the fetch-baseline commit from verified repo HEAD (`git rev-parse HEAD`) at manifest-refresh time, and generate the manifest from that same commit (`git ls-tree -r --name-only HEAD`) — do NOT use `git ls-files`, which reflects the staged index and silently diverges from HEAD under any uncommitted add/delete/rename. If you do fall back to `git ls-files`, first confirm `git status --porcelain` is clean (or reconcile every listed delta) and note the check in the Step 7 summary, since otherwise the manifest and the §1 fetch baseline will not agree. NEVER adopt a commit string copied from a report, doc, or `research_target` without confirming it contains every file in the §2 read-in-full list (`git ls-tree <commit> <path>` / `git cat-file -e <commit>:<path>`) — a "commit of record" cited inside a report is that report's *own* baseline and often predates later merges. If a referenced source cites a different commit, call out the divergence inside the brief rather than propagating it. **§2-completeness check (the verified-HEAD case too).** Even when the baseline is verified HEAD rather than a borrowed string, confirm every file in the §2 read-in-full list — including files discovered transitively, e.g. a predecessor report's own cross-references — actually exists at the baseline before presenting the list (Step 5) and before writing (`git ls-tree <baseline> <path>` / `git cat-file -e <baseline>:<path>`). A path present in your working tree but absent at the baseline (cleaned up in an earlier commit, so it never appears in `git status`) would ship as a dangling §2 reference and break Session 2's fetch — self-containment is the contract. Drop or correct any that do not resolve, and flag the contradiction. **Dirty-tree path caution:** when the working tree has staged or unstaged moves/renames/deletes affecting files named in the brief's §2 read-list (a predecessor brief mid-archival, a relocated doc), cite those files at their **baseline-commit** path — confirm with `git ls-tree HEAD <path>` — not the working-tree path, so every §2 reference resolves against the same commit Session 2 fetches from.

**Re-pinning after the baseline moves.** When repo HEAD has advanced since the brief was authored — commonly because the bundle itself (brief + manifest) was committed — the brief's §1/§8 now pin a commit the user no longer wants. Re-pin: (a) re-run the §2-completeness check against the new HEAD and drop/correct any path that no longer resolves; (b) regenerate the manifest at the new `<shortsha>` (a new filename, not an overwrite); (c) update **every** §1 and §8 commit reference in the brief to the new HEAD; (d) leave the superseded manifest in place per the rule above. Note the inherent self-reference: the bundle's own files are never listed in the manifest they ship with (they are uncommitted at authoring), and committing the bundle necessarily moves HEAD one commit past §1 — harmless for Session 2's fetch as long as every §2 read-list path predates the bundle, which step (a) confirms.

Resolve both paths against the worktree root if in a worktree. Do NOT commit.

## Step 7: Summarize

Report:

- the two written files (brief + refreshed manifest) — the **upload bundle** for ChatGPT-Pro Session 2;
- a one-line reminder that Session 2 is **locked / no-questions**: paste the brief, upload the manifest, and ChatGPT-Pro should produce the deliverable directly;
- any labeled assumptions carried from an early exit, so the user can correct them before pasting.

This is an inline-completion deliverable — no next-steps menu. Surface any adjacent improvement spotted during exploration as a flagged note with a concrete trigger, not as scope creep.

## Guardrails

- **Self-containment is the contract.** Session 2 has none of this session's context. Every path, decision, constraint, and acceptance check it needs lives in the brief or the uploaded manifest — never implied.
- **Claude authors; ChatGPT-Pro researches.** Don't perform the deep research here. The brief *commissions* it.
- **Locked, no questions.** The emitted brief instructs Session 2 to produce directly and NOT interview or ask clarifying questions — the interview already happened here.
- **Mutates only `reports/`.** Never touch `docs/`, `specs/`, `tickets/`, `.claude/skills/`, or source.
- **No scope inflation.** The brief commissions what was asked. Resist "while we're at it" additions to the deliverable spec.
