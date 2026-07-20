---
status: accepted
---

# Validation gates fail closed on unparseable input

A validator that cannot parse a structure it is responsible for must emit an error; returning an
empty error set on unparseable input is forbidden, because an empty set is indistinguishable from
a clean pass. `validate-report.mjs` previously returned no errors when a finding table's divider
row failed its `-{3,}` pattern, so a two-dash divider — valid GitHub-flavored markdown — silently
disabled every finding-ledger integrity check and still reported `PASS`; a report whose prioritized
finding was absent from the cumulative ledger passed under a short divider and failed under a long
one. Parse failure and clean input are now distinct outcomes across skill validators, so formatting
drift and renamed headings surface as failures rather than as false confidence, and a stricter
downstream consumer can no longer be the first place a defect appears.
