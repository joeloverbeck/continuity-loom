# Blind paired evaluation: task 03

## Output A

**Independent adequacy: Adequate.**

- **Failing sanitizer/normalizer examples:** It begins the implementation sequence with a table-driven server-normalization red. The cases cover safe optional detail, CR/LF normalization, the 240-character limit, authorization/Bearer/OpenRouter-key canaries, JSON-like dumps, every named prose marker, and non-scalar/arbitrary response values. It also correctly requires literal expectations rather than reproducing the sanitizer in the test.
- **Separated boundary evidence:** It gives distinct tests and green changes for server normalization, the HTTP route/DTO, the browser client, the shared presenter, and each of the five consumers. It explicitly rejects treating success at one boundary as evidence for another.
- **Small shared seams/general behavior:** The proposed production surface is one server-owned sanitizer, a narrow extension of the existing DTO, the existing client failure path, and one presenter. It avoids browser-side provider parsing, duplicate error shapes, compatibility aliases, and tailoring the design to one observed OpenRouter response. The instruction to define a supported-reason allowlist or reuse an existing provider contract is appropriately cautious.
- **Privacy and behavior invariants:** It makes credential/prose leakage, arbitrary-object serialization, automatic retry, fallback, new send behavior, and success-path changes global invariants. Wire, logger-when-observable, presentation, consumer, and browser-smoke checks reinforce them. It also preserves the category and generic safe fallback when optional detail is rejected.
- **Verification:** It orders focused normalizer, route, client, presenter, and five-consumer checks before package suites and all four canonical gates. It honestly leaves exact filenames and runner syntax unresolved because the supplied corpus does not contain them.

All task constraints are covered, including one-line bounded detail, supported optional status/retry/reason fields, route and UI survival, common presentation with category-specific manual recovery, five-consumer integration, adversarial fixtures, and unchanged candidate/success behavior. The principal minor weakness is that the no-automatic-retry proof is less direct than Output B's exact provider-call, fallback, and timer assertions at the dispatch boundary. A still treats the rule as a regression invariant and tests it at presentation/consumer/smoke levels, so this is not a material omission.

**Material or severe regression/safety omission:** None.

## Output B

**Independent adequacy: Adequate.**

- **Failing sanitizer/normalizer examples:** Its first slice is a focused, table-driven normalizer red with literal safe text plus authorization, Bearer, OpenRouter-key, dump/marker, object/array, length, line-break, status, and retry cases. It distinguishes the intended missing-detail failure from a fixture or discovery failure.
- **Separated boundary evidence:** Server sanitizer/normalizer, real route serialization, public API-client parsing, the shared presenter, and all five rendered consumers receive separate public-boundary evidence, even though route and client are grouped under one larger wire-survival slice.
- **Small shared seams/general behavior:** It limits production work to a pure server sanitizer/normalizer, the existing platform-free DTO/parser seam, and one web presenter. It forbids server-internal imports into web, parallel error envelopes, raw-object serialization, compiler/provider generalization, and old compatibility formatters. The cases are category- and contract-driven rather than tied to one failure instance.
- **Privacy and behavior invariants:** It checks serialized bodies and captured logs for literal canaries, ignores unsupported client keys, keeps browser input typed, and explicitly proves one provider request, no fallback request, no scheduled/automatic retry, and unchanged success responses. Each consumer also gets negative provider/retry/fallback/new-action assertions.
- **Verification:** It moves from exact focused red/green evidence through focused server and web suites to lint, typecheck, full tests, and build. Its completion conditions restate survival at every boundary, five-consumer presenter use, all leakage canaries, and behavior invariants.

All task constraints are covered. The suggestion of a very small import/source check is appropriately conditional and supplementary to rendered behavior; it is a reasonable way to prove the explicit requirement that all five consumers use the same function. The note about defensive credential redaction does not authorize retaining sensitive input: the plan first rejects sensitive material and repeatedly requires literal canary absence.

**Material or severe regression/safety omission:** None.

## Selection

**Winner: B, narrowly.** Both outputs are execution-ready and adequate. B is slightly more task-fit because it turns the no-retry/no-fallback requirement into more direct behavioral evidence at the provider boundary, including request counts and scheduled-retry checks, and repeats that proof at consumer integration. A's coverage remains sufficient; B's advantage is completeness of regression evidence, not correction of a substantive flaw.

**Noninferiority conclusion:** Under a symmetric material-regression standard, neither output is materially inferior to the other. A clears the same substantive privacy, contract, integration, and verification bar as B; B earns only a minor preference for more explicit provider-activity assertions. This conclusion does not depend on which output is a baseline or candidate.
