Recommendation: keep the category as `enhancement` and the state as `needs-triage`.

This is not a `needs-info` case: the reporter has supplied the desired outcome, and the missing input is a maintainer architecture decision, not more reporter detail. It is not `ready-for-agent` because there is no measurement showing prompt compilation is the reopening bottleneck, and the two proposed implementations have materially different semantics. Persisting either the full prompt or compiler metadata also crosses domains that `ACTIVE-DOCS.md` says require a spec. Local ownership does not by itself settle the extra exposure created by storing a full compiled prompt, and a cache must not become a second authority that can diverge from deterministic recompilation.

The unresolved decision tree is:

1. **Measure the problem.** Define “instant” and measure project reopening/preview latency on representative projects.
   - If prompt compilation is not the material bottleneck, do not add this cache; address the measured bottleneck instead.
   - If compilation is the bottleneck, continue to the cache-semantics decision.
2. **Decide what “reopening” must cover.**
   - A memory-only cache can speed repeated previews within one process, but it cannot make a cold application/project reopen instant. If that narrower behavior is acceptable, revise the request accordingly.
   - A project-persisted cache can survive cold reopen, but requires the storage/persistence spec before implementation.
3. **For any persistent design, choose the stored representation.**
   - Full compiled prompt: decide the default persistence policy, visibility, deletion/export behavior, and how the no-full-prompt-logging rule is preserved. The logging rule is not automatically a persistence ban, but it is a warning that the exposure must be deliberately governed.
   - Derived metadata/fingerprint or partial compiler data: establish whether it can actually meet the latency target without making compiler metadata a competing authority.
4. **Define correctness and lifecycle.** The design must specify a complete cache key (all compiler inputs, validation snapshot, template/compiler version, and relevant configuration), invalidation, migration/project-store compatibility, corruption recovery, and eviction. A hit must be byte-equivalent to deterministic recompilation, and a miss or stale entry must safely recompile.

The correct resolution workflow is `/grilling` and `/domain-modeling` with the maintainer who owns storage/compiler architecture and product latency expectations. That work should turn the choices above into a ratified spec; engineering can supply the benchmark and current integration-seam evidence, but should not silently choose the product/storage policy in implementation. The supplied snapshot does not establish an existing equivalent implementation or a prior rejection, so neither an already-implemented nor `wontfix` disposition is justified from this evidence.

Later readiness condition: move this to `ready-for-agent` only after a current-tree measurement identifies compilation as the relevant bottleneck, the maintainer has ratified a spec choosing the cache scope and representation, and that spec defines privacy/local-ownership behavior, deterministic equivalence, key/invalidation rules, migrations/compatibility, failure recovery, and a verified integration seam. The resulting implementation slice must then have testable latency and correctness acceptance criteria. If the decision is memory-only, the issue must first be rescoped because that does not satisfy cold reopening from project storage.
