# Candidate comparison measures

| Measure | Current baseline | Candidate | Difference |
|---|---:|---:|---:|
| Runtime Markdown words (`SKILL.md` + five references) | 7,839 | 2,843 | -4,996 (-63.7%) |
| Runtime Markdown lines | 509 | 469 | -40 (-7.9%; shorter paragraphs are wrapped for readability) |
| Mandatory normal-publication references | 5 | 5 | unchanged |
| Top-level process steps | 3 + completion blocker | 3 + completion blocker | unchanged |
| Core mechanical gates | intake; Step 2 receipt; exact-title; staged validation; staged durability; labels/checklist; published identity/validation; published durability; cleanup/closeout | same nine gates | unchanged |
| Explicit environment/incident passages | 2 (`Codex-style` editing prescription; sandbox/helper warning) | 0 | -2 |
| Repeated gate-definition clusters | Step 2 decision state repeated across 3 files; durability proof repeated across 3 prose blocks plus a long loop; readback/cleanup repeated in `SKILL.md` and closeout reference | one canonical Step 2 summary; one four-cell durability gate; one closeout procedure | reduced without removing a gate |
| Executable helpers | 2 scripts + 2 test files | same byte-identical 4 files | unchanged |

## Files changed in the candidate

- `SKILL.md`
- `references/intake.md`
- `references/prd-body.md`
- `references/publication.md`
- `references/source-durability.md`
- `references/validation-and-closeout.md`

No executable helper, test, frontmatter trigger, reference filename, or public
workflow step was added, removed, or renamed.

