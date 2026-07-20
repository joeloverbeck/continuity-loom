# Frozen paired-trial corpus

Frozen before semantic inspection of the claimed triage baseline. The seven tasks cover initial categorisation, verified bug readiness, missing reporter information, an unresolved design seam, an external pull request, an approved state transition, and ambiguous issue/PR identity with a security concern.

All tasks are analysis-only simulations. Executors must not query or mutate the live GitHub tracker. Each task includes the raw user prompt, the complete supplied tracker snapshot, and an observable comparison rubric. `checks.mjs` performs only stable mechanical checks; semantic adequacy belongs to blind paired evaluation.
