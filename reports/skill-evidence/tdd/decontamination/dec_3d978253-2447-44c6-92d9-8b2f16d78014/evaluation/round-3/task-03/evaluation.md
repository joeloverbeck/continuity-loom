# Round 3 blind evaluation: task 03

## Independent adequacy

### Output A

**Adequate.** It is execution-ready within the corpus-imposed uncertainty and satisfies every rubric bullet:

- Its first behavioral slice is the sanitizer/normalizer red, with literal authorization, bearer-token, OpenRouter-key, JSON/payload, prose-marker, nested-object, and overlength/line-break cases. It explicitly says a pre-existing passing adversarial case remains regression coverage rather than manufacturing a red.
- It keeps server normalization, route serialization, browser-client survival, shared presentation, and each of the five rendered consumers as distinct proof boundaries.
- Its proposed production work is narrow: a server-owned sanitizer, allowlisted scalar DTO extension, existing client failure-path mapping, and one presenter. It avoids browser-side provider parsing, parallel error shapes, compatibility aliases, and provider-specific overgeneralization.
- Privacy and behavioral safety are global invariants. It covers response, logs, client, and UI; rejects arbitrary objects and dangerous markers; and repeatedly protects against automatic retry, fallback, new send controls, and success/candidate-flow changes.
- Verification proceeds from focused server and web tests through package suites and all four canonical root gates, with an additional browser smoke.

It also covers every task constraint: stable fallback category/message, optional status/retry/supported reason, one-line and 240-character bounds, required redactions and dump rejection, typed route/UI survival, one shared manual-recovery presenter, all five consumers, and unchanged success behavior. It makes the unavailable filenames, runner commands, public names, authority reads, and consumer inventory explicit instead of inventing them.

There is **no material or severe regression and no safety omission**. The preflight material is longer than necessary, but it does not displace the required first red or weaken execution readiness.

### Output B

**Adequate.** It is likewise execution-ready within the supplied evidence and satisfies every rubric bullet:

- Its first implementation slice is a tracer-by-tracer public normalizer red covering supported safe detail, newline/length handling, authorization/bearer/OpenRouter secrets, JSON-like payloads, all named prose markers, and nested arbitrary objects.
- It separately proves normalizer behavior, route serialization and logs, API-client survival, the shared presentation contract, and real rendering by all five consumers. Route and client live in one vertical slice but retain separate red/green boundaries.
- It proposes one typed shared contract constructed field-by-field, one existing route/client path, and one pure presenter. It expressly avoids spreading/stringifying upstream objects, adding competing shapes, redesigning the provider client, or broadening the supported-reason surface.
- Privacy and no-behavior-change constraints are regression invariants across normalization, wire, logging, presentation, and rendering. The provider-call-count assertion is especially direct evidence against retry/fallback.
- Verification moves from focused normalizer, route, client/presenter, and component tests to package suites and the canonical root gates.

It covers all acceptance criteria, including category-appropriate manual recovery, adversarial typed-detail survival across route and UI boundaries, preservation of the generic fallback after rejected detail, and the prohibition on arbitrary response serialization, retries, fallback, new send action, and success/candidate changes. Its unknown filenames/types/commands are correctly flagged for repository resolution.

There is **no material or severe regression and no safety omission**. It omits Output A's explicit final browser-smoke step, but the prompt and rubric require focused-to-canonical verification, not a manual smoke, and B already requires rendered consumer coverage.

## Pairwise judgment

**Result: tie.** A is marginally more explicit about inventorying each named consumer, keeping defensive browser omission distinct from authoritative server sanitization, and performing a browser smoke. B is marginally more explicit about a one-provider-call route invariant, independently known presentation copy, and not manufacturing reds when preservation assertions already pass. These are complementary emphasis differences, not adequacy differences.

**Symmetric noninferiority:**

- **A is noninferior to B:** yes. A contains no material regression, severe omission, or safety loss relative to B.
- **B is noninferior to A:** yes. B contains no material regression, severe omission, or safety loss relative to A.

Neither output warrants a downgrade on any rubric bullet or task constraint.
