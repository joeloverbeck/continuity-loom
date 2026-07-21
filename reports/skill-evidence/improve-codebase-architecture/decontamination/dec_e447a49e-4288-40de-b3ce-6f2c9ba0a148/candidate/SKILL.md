---
name: improve-codebase-architecture
description: Scan a codebase for deepening opportunities, present them as a visual HTML report, then grill through whichever one you pick.
disable-model-invocation: true
---

# Improve Codebase Architecture

Surface architectural friction and propose **deepening opportunities** that
improve testability and AI-navigability by turning shallow modules into deep
ones.

Load `/codebase-design` for the architecture vocabulary, principles, dependency
categories, and repository-authority rules. Use the relevant domain glossary's
terms for the code under review, and do not re-litigate governing principles or
ADRs without concrete friction that warrants reopening them.

## 1. Explore and verify

Follow the repository entrypoint and the domain and architecture authorities
identified by `/codebase-design`. Missing optional domain or ADR files are not a
blocker.

Use authorized Explore agents for breadth when the codebase warrants fan-out.
When delegation is unavailable or policy-disallowed, scan locally and state that
reason. In either case, do the depth and evidence work directly: read the
relevant files and call sites yourself, and support promoted candidates with
compact counts, deletion-test results, and exact line references.

Explore organically:

- Where does one concept require bouncing among many small modules?
- Which modules are shallow?
- Where were pure helpers extracted for tests while call-site bugs stayed hidden?
- Where does coupled behavior leak across seams?
- What is difficult to test through its current interface?

Apply `/codebase-design`'s deletion test. Promote only friction that survives
call-site and authority verification; if a type, caller, test, principle, or ADR
already neutralizes the claim, drop or downgrade it.

## 2. Present the HTML report

Write a fresh self-contained report outside the repository at
`$TMPDIR/architecture-review-<timestamp>.html`, falling back to `/tmp` (or
`%TEMP%` on Windows). Follow [HTML-REPORT.md](HTML-REPORT.md) for the visual,
evidence, vocabulary, and card contract.

Open the report when the environment allows, using the OS-appropriate command;
on WSL prefer `wslview` or Windows Explorer. Dispatch terminal openers detached
so they cannot hold the run open. Always print both the exact opener command and
the absolute report path, because dispatch success does not prove a visible GUI.
Failure to open a GUI does not invalidate a report that exists at the printed
path.

Use relevant principle or ADR callouts only when an authority conflicts with or
endorses a verified candidate. End with one Top recommendation.

Do **not** propose interfaces in the report. After writing it, ask exactly:
"Which of these would you like to explore?"

## 3. Grill the selected candidate

Once the user picks a candidate, run `/grilling` to resolve constraints,
dependencies, module shape, seam placement, hidden implementation, and surviving
tests. Respect every explicit mutation limit from the user.

Use `/domain-modeling` when resolved terms or durable decisions require domain
artifacts, and let that skill own glossary/ADR routing and closeout. For
alternative interface designs, use `/codebase-design`'s design-it-twice flow.

## 4. Hand off authorized implementation

If the user asks to implement after grilling, first recap the selected modules,
domain and architectural authorities, accepted constraints, domain-model changes,
behavior posture, and expected tests/docs. Default to behavior-preserving work
unless the user explicitly approved a behavior change.

Then use the repository's implementation workflow (`/implement` for published
issue or PRD work; otherwise the local coding guidelines). Keep edits scoped to
the agreed candidate and verify focused tests plus relevant full gates, including
doc, ADR, or principle checks when those authorities changed or justified the
design.
