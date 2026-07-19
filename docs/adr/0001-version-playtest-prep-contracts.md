---
status: accepted
---

# Version playtest prep contracts and keep migration producer-owned

Playtest PRD-prep artifacts declare `Prep contract version`; unversioned historical artifacts are
implicit version 1, while the current producer writes version 2. `playtest-to-issues` may accept
additive, evidence-preserving legacy omissions, but semantic drift returns `migration-required`
with the exact producer invocation, malformed or unknown future versions remain invalid, and only
`playtest-prd-prep` rewrites the same-stem artifact. This preserves custody evidence and replaces
compatibility decisions based on mutable validator-message text.
