# Prior-turn artifact

The architecture report offered three verified candidates. Candidate 2 is
"Manifest intake module": move alias resolution, unit defaults, and validation
ordering behind one Manifest intake interface used by CLI, HTTP, and import-file
adapters. The report deliberately did not propose an interface.

The repository glossary defines Manifest and Intake but has no term for the
proposed orchestration module. There is no ADR covering its ownership.

The companion grilling workflow is available. The user has now selected the
candidate and explicitly constrained side effects to a design brief only. No
design decisions have yet been ratified in this resumed turn.
