# Round-one blind validation summary

Candidate tree digest before restoration:
`ac9b27a0a2bcf2cdb336d0122b82b2144cbadb90b2983c2413e47718b1ac1a90`.

| Task | A mapping | B mapping | Blind decision | Material/severe result |
| --- | --- | --- | --- | --- |
| T01 | candidate | baseline | A | neither packet material or severe |
| T02 | candidate | baseline | A | neither packet material or severe |
| T03 | baseline | candidate | A | neither packet material or severe |
| T04 | baseline | candidate | A | neither packet material or severe |
| T05 | baseline | candidate | A | neither packet material or severe |
| T06 | candidate | baseline | B | neither packet material or severe |
| T07 | candidate | baseline | B | candidate material, not severe |

T07's evaluator found that the candidate packet securely extracted the visible
static Cast prompt and preserved local import/review/save boundaries, but never
explicitly required actuating the visible **Copy prompt** control. Because
clipboard drafting was the task's defining regression surface, this under-tested
the core flow and failed noninferiority.

Authorized restoration: add one transferable rule for any static clipboard
assistance flow—exercise the visible Copy action, custody the same rendered bytes
without printing them, import locally, review before explicit canonical Save,
and keep participation controls separate from record/canon/working-set mutation.
No other candidate hypothesis or file changes are authorized. Rerun all seven
tasks and blind evaluations from fresh contexts.
