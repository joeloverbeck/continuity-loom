# Evidence available for the three reviewed issues

- **#369 (settings persistence).** The order that matters is: the settings load, the author edits a
  value, the value is persisted, the page reloads, the value is still there, the author clears it,
  it reloads again empty. The four settings tests in `packages/web/src/settings.test.ts` walk that
  whole order end to end.
- **#370 (request finalization).** The order that matters is: build the request, inspect it, derive
  the finalized properties, then transport that same object once. The presenter regression tests in
  `packages/core/src/request.test.ts` walk that order and compare object identity at the end.
- **#371 (conformance).** Principles and ADR conformance is a static property of the diff. No order
  of events can change whether it holds.
