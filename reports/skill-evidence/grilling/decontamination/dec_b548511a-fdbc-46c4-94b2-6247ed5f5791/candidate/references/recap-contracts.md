# Recap Contracts

Every grilling run ends with a recap that lets the user act or resume without reconstructing the session. Route by the requested outcome and subject, not by whether live tools supplied evidence.

| Class | Required content |
| --- | --- |
| Design / plan stress-test | Findings and explored facts; ratified and provisional decisions; recommendation; unresolved branches; resume point. |
| Determination / recommendation | Source or question; candidate set when relevant; verdict or winner; rejected alternatives; recommendation; out of scope; freshness. |
| Diagnostic / audit | Subject and scope; verdict; key evidence and authorities; rejected/no-op alternatives; recommendation; out of scope; freshness. |
| Operational / delegated execution | Context; findings and evidence; rejected operations; recommendation; out of scope; freshness. After mutation, add exact changes, verification, and readback. |

## Routing rules

- When one subject changes class, combine the content required by every class it occupied.
- For independent simultaneous items, use the dominant requested outcome and carry the other item's material fields into it without duplicating templates.
- When a durable artifact becomes the subject of live mutation, combine its provenance with the operational mutation proof.
- Facts use `Finding:` or `Explored fact:`. Only user-owned choices use `Decision:`.
- Include tracker overlap, existing-prep status, supporting-skill results, or external-research posture only when they were relevant or used; state a meaningful limitation rather than filling empty fields.

## PRD-ready or issue-ready handoff

Include enough provenance that a later publication pass does not need the chat:

- source artifact and selected section;
- inspected current authorities and relevant tracker work;
- candidate or verdict, rejected alternatives, and scope boundary;
- testing seam still owed by the publication workflow;
- relevant prior IDs and supporting-skill results; and
- source durability or publication visibility when a local artifact will be cited.

If a source is dirty, untracked, or temporary, mark it pending publication or summarize it without pretending it is a stable citation. A written determination artifact must also report its own tracked/dirty/untracked posture.

Use [prd-ready-determination-artifact.md](prd-ready-determination-artifact.md) for a requested written artifact.

## Pause or recap-only

Preserve:

- topic and current recommendation;
- settled decisions;
- unresolved decisions and dependencies;
- evidence and its limits;
- actions explicitly not taken; and
- the exact next decision on resume.

Do not ask a new question or create an artifact when the user asked only for a recap.

## Final check

Before responding, confirm that the applicable content is present, any mutation proof reflects current state, and supporting-skill exact blocks remain intact. Prefer a compact truthful recap over empty `N/A` fields.
