# Task-local repository dossier

Repository: `parcel-route`, a medium TypeScript application.

`CONTEXT.md` defines Manifest, Intake, Route, and Dispatch. ADR 0003 states that
all dispatch implementations must pass through `DispatchRegistry`.

Initial scan notes:

1. `route-label.ts` appears to duplicate route validation from
   `manifest-validator.ts`. Call-site tracing shows `route-label.ts` receives a
   branded `ValidatedRoute` and only formats it. The type can be constructed
   solely by `manifest-validator.ts`.
2. `dispatch-controller.ts` selects drivers with a 95-line switch. Tracing shows
   every branch is already registered through `DispatchRegistry`; the switch is
   generated exhaustiveness code and has one public call site.
3. Intake normalization rules are duplicated in CLI, HTTP, and import-file
   adapters. Their outputs flow into the same Manifest constructor, but each
   adapter independently handles aliases and default units.
4. Route retry decisions and attempt logging are interleaved across
   `route-runner.ts`, `retry-policy.ts`, and `dispatch-log.ts`; tests bypass the
   runner and assert the helpers separately.

The report template supports between three and five cards, but this is a target
range rather than a quota. The user asked only for the review.
