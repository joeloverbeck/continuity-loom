# Mocking at Boundaries

Mock only boundaries outside the behavior you own:

- external APIs and provider clients;
- clocks and randomness;
- operating-system or file-system boundaries when a real temporary resource is unsuitable; and
- databases only when a real isolated test store would be slower, less deterministic, or unavailable.

Do not mock your own domain modules or internal collaborators merely to make a unit small. Prefer testing the assembled behavior through its public interface.

## Make boundaries controllable

Inject external dependencies instead of constructing them inside domain behavior. Give each boundary operation a specific typed contract so tests can supply one valid response or failure shape without conditional mock logic. Keep the fake faithful to the public boundary, not to private implementation details.

Use call counts only as supporting evidence for boundary obligations such as “no provider request while blocked.” Also assert the public result and absence of forbidden side effects; a call count alone is not the behavior oracle.

## Control async settlement when order is observable

A deferred promise is appropriate at an asynchronous system boundary when completion order affects public state:

```typescript
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((ok, fail) => {
    resolve = ok;
    reject = fail;
  });
  return { promise, resolve, reject };
}
```

Hold attempt A pending, start and settle attempt B, then settle A. Await the UI or application framework after each settlement and assert that the final public state still belongs to the newest attempt. Run both mixed outcomes: older success after newer failure, and older failure after newer success.
