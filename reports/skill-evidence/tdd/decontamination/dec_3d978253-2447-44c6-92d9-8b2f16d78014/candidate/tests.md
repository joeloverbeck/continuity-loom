# Test Design Reference

## A good test

A good test is an executable behavior contract. It:

- exercises a public API, route, rendered UI, command, or other agreed seam;
- describes what a user or caller can observe;
- has one behavior contract, with as many assertions as that contract needs;
- takes expected values from a specification, worked example, or known literal;
- survives internal refactoring; and
- uses fixtures valid at the public type and runtime boundary.

```typescript
test("user can retrieve a created account", async () => {
  const created = await createAccount({ name: "Alice" });
  expect(await getAccount(created.id)).toMatchObject({ name: "Alice" });
});
```

Prefer public typed fixture builders, imported public types, `satisfies`, or runtime parsers. Do not use a broad `as any` to make an incomplete boundary fixture compile. If deliberately malformed external input is the subject, send it through the public parser and assert the rejection.

For persisted fixtures, prove schema validity and any complex setup before the behavior assertion. A storage copy must be an application-consistent snapshot, using the mechanism required by that repository's storage authority; a stale or invalid copy is not behavior evidence.

## Stateful and async behavior

On one active instance, test repeated entry while state is active and the applicable terminal outcomes. Assert which outcome retains state, clears it, restores a baseline, persists it, or re-enables entry. Separate snapshots do not prove a transition.

When an action can overlap, test the public contract for preventing overlap or deliberately settle requests out of order. Cover older-success/newer-failure and older-failure/newer-success; the oracle is the final public state, not an internal attempt token or call count.

## Static contract checks

Use source-level assertions only when acceptance explicitly requires or forbids a source construct such as a route string, import, schema key, or generated path. Target the smallest construct and confirm the red fails for that contract. For user-visible behavior, also use a rendered/public behavior test or browser evidence.

## Anti-patterns

- **Implementation-coupled:** mocks internal collaborators, tests private methods, or asserts internal call order.
- **Side-channel:** verifies a result by bypassing the public interface, such as querying storage instead of using the read API.
- **Tautological:** computes the expected value with the same algorithm as production code.
- **Horizontal:** writes a bulk suite against an imagined final design before any vertical slice is understood.
- **Wrong-reason red:** counts setup, schema, dependency, build, or unrelated failures as proof the requested behavior is missing.
- **Unexpected-green complacency:** accepts a passing assertion without checking that it observes the intended route, component, or contract.

For example, prefer the independent literal `15` over recomputing a sum in the test before comparing it with `calculateTotal`.
