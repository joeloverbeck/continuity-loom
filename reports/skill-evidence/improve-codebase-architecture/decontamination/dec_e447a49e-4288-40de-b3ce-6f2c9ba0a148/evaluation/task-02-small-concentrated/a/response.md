# Simulated user-facing response

Architecture review ready: `/tmp/architecture-review-20260721T000000.html`

Opener dispatched with:

```bash
xdg-open /tmp/architecture-review-20260721T000000.html >/dev/null 2>&1 &
```

The top recommendation is **Deepen Session record capture**: four modules currently each own one format conversion, so concentrating that implementation behind one seam offers the clearest locality and leverage.

Which of these would you like to explore?

# Compact execution record

This was a dossier-only simulation. No product files were accessed or modified, no HTML artifact was actually written, and the opener command was not actually run.

## Exploration

- Used the supplied `counter-table` dossier as the complete repository view.
- Used the dossier summaries of `CONTEXT.md` for the domain terms **GameModule**, **Hub**, **Session record**, and **Tabletop kit**.
- Treated ADR 0001 as protecting the current workspace split.
- Performed breadth directly because delegation was policy-disallowed.
- Could not perform whole-file reads, call-site searches, method counts, or line-number checks because the frozen fixture supplied summaries rather than product files. The report therefore labels its evidence as dossier-derived and does not invent exact line references.

## Simulated report contents

### 1. Deepen Session record capture — Strong · ports & adapters

**Files:** `packages/framework/src/session.ts`, `apps/web/src/storage.ts`, `apps/web/src/record-writer.ts`, and the Vite development endpoint whose path is not supplied by the dossier.

**Evidence:** Record capture crosses four named responsibilities, and each hand-off owns one format conversion. The deletion test indicates that removing the intermediate shallow modules would concentrate conversion complexity rather than eliminate it. Exact call-site counts and line references are unavailable in the fixture.

**Problem:** Session record representation leaks across several seams, so understanding or testing one capture requires tracing every conversion.

**Solution:** Deepen record capture into one Session record module and keep environment-specific writing at an adapter seam; no interface shape is proposed yet.

**Wins:**

- Locality: conversions stay together
- Leverage: one capture seam
- Tests cover complete capture
- Format leakage stops crossing seams

**Before / after visual:** A Mermaid flow shows `session.ts → storage.ts → record-writer.ts → Vite endpoint`, with red leakage arrows at each conversion. The after view is a hand-built thick, dark Session record module containing the conversions, with one dashed adapter seam to the environment-specific writer.

### 2. Localize Session lifecycle ownership — Worth exploring · in-process

**Files:** `apps/web/src/App.tsx`, `packages/framework/src/session.ts`.

**Evidence:** `App.tsx` imports the fixture GameModule action and state types and starts and restores sessions directly, while `session.ts` already contains generic creation and restoration functions. The dossier supports the dependency direction but not method counts, exact call sites, or line references. The seam remains hypothetical until a second adapter is demonstrated.

**Problem:** The Hub UI knows both the concrete GameModule and generic Session lifecycle implementation, reducing locality.

**Solution:** Deepen Session lifecycle coordination into an app-owned module that absorbs concrete GameModule knowledge while using the framework implementation internally; no interface shape is proposed yet.

**Wins:**

- Locality: lifecycle knowledge concentrates
- Hub loses fixture leakage
- Tests hit lifecycle behavior
- Interface hides framework detail

**Before / after visual:** A call-graph collapse shows the Hub reaching into fixture types and generic Session functions before, then one dark app-owned Session lifecycle module with faded internals after.

### 3. Make package templates authoritative — Worth exploring · local-substitutable

**Files:** `scripts/scaffold-game.mjs`, `templates/game-package/README.md`.

**Evidence:** The scaffold script embeds package templates as string literals, while the maintained template directory contains only a README describing intended generated files. Deleting that directory would not remove the generator implementation, showing that the present template module is shallow. Exact literal counts, generated-file counts, and line references are unavailable in the fixture.

**Problem:** The intended template module and the actual scaffolding implementation are split, so the documented seam has no leverage.

**Solution:** Move generated file bodies into the maintained template module and leave the scaffold script as its filesystem adapter; preserve the workspace split protected by ADR 0001. No interface shape is proposed yet.

**Wins:**

- Locality: templates live together
- Leverage: one template authority
- Scaffold tests compare artifacts
- Adapter keeps filesystem detail

**Before / after visual:** A mass diagram shows a nearly empty template module beside a large script-literal implementation before. After, a deep template module contains the generated files behind a small filesystem adapter.

## Report-shape verification

- Planned one self-contained HTML document using the required Tailwind CDN and Mermaid 11 ESM CDN.
- Planned the required header legend, three candidate cards, side-by-side before/after visuals, recommendation badges, dependency tags, and a one-card top recommendation section.
- Kept Wins bullets to six words or fewer.
- Used the required architecture vocabulary: module, interface, implementation, depth, deep, shallow, seam, adapter, leverage, and locality.
- Avoided proposing concrete interfaces and ended at the required selection checkpoint.
- Marked the dossier’s missing source locations instead of fabricating exact evidence.
