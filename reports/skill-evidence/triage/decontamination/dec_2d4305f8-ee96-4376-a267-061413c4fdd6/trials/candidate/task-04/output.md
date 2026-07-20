## Recommendation

Keep issue #204 as **`enhancement` / `needs-triage`**. The current labels already satisfy the repository's one-category/one-state rule. It is not ready for an agent: the reported delay has not been measured, and the two proposed implementations make materially different product and storage decisions.

Verification is **insufficient for the performance claim**. The current preview path rebuilds the open-project snapshot, runs validation, and compiles on each preview request; the browser requests that work when Prompt Preview opens. That confirms repeated compilation, but there is no timing evidence showing whether snapshot loading, validation, compilation, response transfer, or rendering is the bottleneck. A local redundancy search found no compiled-prompt cache; the existing caches are for other concerns, such as OpenRouter model metadata.

The governing authorities make this spec work. `FOUNDATIONS.md` treats generated prompts as deterministic, inspectable operational artifacts, requires prompt freshness and inspectability, forbids a permanent prompt archive by default, and keeps local project data user-owned. `ACTIVE-DOCS.md` explicitly requires a spec for prompt persistence, compiler metadata, and project-store compatibility.

## Unresolved decision tree

1. **What is actually slow?** Measure reopening Prompt Preview on representative small and large projects, separating project-store/snapshot construction, validation, compilation, transport, and browser rendering. Define a target rather than relying on “feels repetitive.”
   - If compilation is not a material bottleneck, reject this cache proposal as premature and scope the measured bottleneck instead.
   - If compilation is material, continue to the cache-lifetime decision.

2. **What lifetime must the optimization have?**
   - A memory-only memo keyed by the complete deterministic source identity can speed repeated previews in one process, but it cannot satisfy “reopening is instant” after an app restart.
   - A persisted, disposable derived cache can survive reopening, but requires an approved storage design: whether it stores full prompt text or another artifact, whether it is part of backup/export, its schema and migration behavior, overwrite/eviction and clear semantics, and recovery from missing or corrupt cache data.
   - A permanent or historical prompt archive conflicts with the default constitutional boundary. That branch must be rejected or proposed as an explicit `FOUNDATIONS.md` amendment with exact wording and maintainer sign-off; it cannot be smuggled in as a cache.

3. **How is freshness proven?** A cache key must cover every declared source for the scoped prompt class, including relevant story configuration, normalized generation state, active-working-set records, request options, and template/compiler/contract versions. Cache hits must never become hidden compiler input or a second authority. Preview and send must fail safe on stale or corrupt entries, fall back to deterministic recompilation, and preserve the existing inspected-fingerprint check before provider transport.

4. **What is the user-visible contract?** The spec must decide what users see on hit, miss, invalidation, refresh, clear, project reopen, and failure; retain the “temporary and not canon” distinction; prevent logging of full prompts; and define how locally persisted prompt material is inspected, cleared, migrated, backed up, and exported.

## Resolution workflow and owner

The **maintainer** should resolve the design tree through **`/grilling`**, then use **`/domain-modeling`** if the decision introduces durable vocabulary or merits an ADR. The resulting approved decision belongs in a new spec covering performance evidence, cache lifetime, deterministic invalidation, project-store compatibility, privacy/audit boundaries, and the applicable browser-visible guidance checklist. Triage should not manufacture a `ready-for-agent` brief before those decisions are settled.

## Condition for later readiness

Re-evaluate for `ready-for-agent` only when a representative benchmark confirms the bottleneck and target, the maintainer has approved one cache-lifetime design in an active spec, all persistence and migration consequences are specified, freshness is mechanically tied to the complete deterministic source/version contract, stale or corrupt data cannot reach Preview or Generate, the proposal does not create a default prompt archive (or the required constitutional amendment is explicitly approved), and every applicable browser-visible checklist item has a concrete home and regression scenario. Until then, `needs-triage` is the correct state.
