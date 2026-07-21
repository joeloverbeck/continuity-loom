# Blind evaluation: task 03

## Independent adequacy

### Output A

Adequate and execution-ready. It identifies a valid first red at the server sanitizer/normalizer boundary, distinguishes setup failures and already-green characterization from a genuine red, proposes narrow green changes at each public seam, delays refactoring until the vertical slices are green, and makes the missing repository-specific paths, commands, field names, and supported-reason vocabulary explicit rather than inventing them.

### Output B

Adequate and execution-ready. It likewise begins at the server normalizer, supplies independent adversarial oracles, carries a primitive-only safe contract through the route and client, centralizes presentation, migrates all five consumers, limits refactoring, and distinguishes genuine failing behavior from fixture/precondition failures and already-green regression coverage. Its unknown implementation details are explicitly identified.

## Rubric comparison

1. **Failing sanitizer/normalizer examples with secret and payload canaries:** Both satisfy this fully. A covers line normalization, the 240-character bound, authorization headers, bearer tokens, OpenRouter-style keys, JSON-like dumps, all four prose/state markers, and arbitrary structured values. B covers the same classes and adds an explicit complete-normalized-value oracle. Both require literal independent expectations and a red caused by missing safe-detail preservation.
2. **Separate server normalization, wire survival, shared presentation, and consumer integration:** Both satisfy this fully. A makes the HTTP route and browser-client survival separate slices and explicitly names the shared DTO/schema. B uses the same separation, including a route-level external-provider fake and a public client boundary. Both give each of the five consumers a rendered integration assertion.
3. **Small shared seams without overfitting:** Both satisfy this. A is especially precise that a retained reason must come from an explicit allowlist or existing provider contract and not merely from being a string, and it avoids a second browser sanitizer. B proposes one primitive-only normalizer, the existing shared contract or the narrowest platform-free DTO, and one pure presenter; it rejects a general error hierarchy and permissive details bag. Neither is tied only to the observed failure.
4. **Privacy and no-automatic-retry as regression invariants:** Both satisfy this fully. A states the invariants globally and checks JSON, logger output where observable, rendered UI, actions, and success-path preservation. B does the same and is slightly more concrete at the route seam by asserting one provider attempt, no fallback, no success payload, and no persisted candidate. Both prohibit new retry, fallback, or send behavior.
5. **Focused checks followed by canonical gates:** Both satisfy this fully. Each orders focused server, route/client, presenter, and five-consumer checks before package suites and the four root gates. Both add a browser smoke and acknowledge that literal focused commands cannot be named from the frozen packet.

## Task-constraint coverage

- **Stable category/generic message plus optional status, retry timing, and supported reason:** Fully covered by both.
- **One line, 240-character maximum, and credential redaction:** Fully covered by both.
- **Discard JSON-like dumps and prompt/record/candidate/accepted-prose marker strings:** Fully covered by both.
- **No arbitrary response serialization or sensitive logs/UI:** Fully covered by both, including structured-object and canary assertions.
- **One shared presenter with category-appropriate manual recovery in all consumers:** Fully covered by both.
- **No automatic retry, fallback, new send action, or success-path change:** Fully covered by both.
- **Adversarial fixtures and typed survival through route and UI boundaries:** Fully covered by both.

## Regressions and omissions

Neither output has a material or severe regression, privacy omission, or safety omission. A's logger assertion is conditioned on harness support, while B conditions it on whether the path logs; neither treats unsafe logging as permissible, and both require production logging to use only sanitized metadata. B is a little less explicit than A about how the supported provider-reason vocabulary is authorized, but it repeatedly calls for a supported reason and repository-valid fixtures, so this is a minor specificity difference rather than a contract gap.

## Selection

**A** by a narrow margin. Its explicit supported-reason allowlist/existing-contract rule and its clearer warning against a second divergent browser sanitizer make the privacy boundary marginally harder to misimplement. B's stronger one-attempt/no-persisted-candidate route assertions are valuable, but they do not outweigh that small boundary-definition advantage. The difference is not material.

## Symmetric noninferiority

- **A noninferior to B:** Yes. A loses no material rubric or constraint coverage relative to B.
- **B noninferior to A:** Yes. B loses no material rubric or constraint coverage relative to A.

The pair is symmetrically noninferior despite the slight preference for A.
