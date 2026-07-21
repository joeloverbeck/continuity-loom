# Trial 07: Tampered resume handoff

Do not execute commands or edit files in this synthetic trial. Using the supplied implementation skill, write the resume decision and next actions.

Fixture:

- A prior agent claims implementation and review are complete for issue #41.
- The handoff says baseline SHA `bbbb222`, reviewed final SHA `cccc333`, all tests green, and issue still open pending close.
- Current `HEAD` is `dddd444`.
- The review report file exists, but its recorded reviewed SHA is `cccc333`; the implementation closeout file names `cccc333` too.
- `git diff cccc333..dddd444` contains changes to the same production module and its test.
- The handoff has no evidence explaining or reviewing that delta.
- Live issue #41 remains open and otherwise ready.

Output only the proposed resume/verification/closeout transcript. Do not mention decontamination or compare skill versions.

