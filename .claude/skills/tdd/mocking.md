# When to Mock

Mock at **system boundaries** only:

- External APIs (payment, email, etc.)
- Databases (sometimes - prefer test DB)
- Time/randomness
- File system (sometimes)

Don't mock:

- Your own classes/modules
- Internal collaborators
- Anything you control

## Designing for Mockability

At system boundaries, design interfaces that are easy to mock:

**1. Use dependency injection**

Pass external dependencies in rather than creating them internally:

```typescript
// Easy to mock
function processPayment(order, paymentClient) {
  return paymentClient.charge(order.total);
}

// Hard to mock
function processPayment(order) {
  const client = new StripeClient(process.env.STRIPE_KEY);
  return client.charge(order.total);
}
```

**2. Prefer SDK-style interfaces over generic fetchers**

Create specific functions for each external operation instead of one generic function with conditional logic:

```typescript
// GOOD: Each function is independently mockable
const api = {
  getUser: (id) => fetch(`/users/${id}`),
  getOrders: (userId) => fetch(`/users/${userId}/orders`),
  createOrder: (data) => fetch('/orders', { method: 'POST', body: data }),
};

// BAD: Mocking requires conditional logic inside the mock
const api = {
  fetch: (endpoint, options) => fetch(endpoint, options),
};
```

The SDK approach means:
- Each mock returns one specific shape
- No conditional logic in test setup
- Easier to see which endpoints a test exercises
- Type safety per endpoint

## Controlling asynchronous completion order

At an asynchronous system boundary, a deferred promise is appropriate when completion order is part of the observable contract. It lets the test hold attempt A in flight, settle attempt B, then settle A without mocking internal state or asserting implementation tokens.

```typescript
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((onResolve, onReject) => {
    resolve = onResolve;
    reject = onReject;
  });
  return { promise, resolve, reject };
}

test("only the newest clipboard attempt owns visible feedback", async () => {
  const older = deferred<void>();
  const newer = deferred<void>();
  const clipboard = {
    writeText: vi.fn()
      .mockReturnValueOnce(older.promise)
      .mockReturnValueOnce(newer.promise)
  };
  const editor = renderEditor({ clipboard });

  editor.copy();
  editor.copy();
  newer.reject(new Error("newer failed"));
  await editor.flushUpdates();
  expect(editor.alert()).toHaveTextContent("newer failed");

  older.resolve();
  await editor.flushUpdates();
  expect(editor.alert()).toHaveTextContent("newer failed");
});
```

Run both mixed-outcome cases: older success after newer failure must not erase the failure, and older failure after newer success must not replace the success. Await the UI framework's processing of each deferred settlement before asserting. The oracle is the final public UI or API state, not call order, request counters, or a private attempt ID.
