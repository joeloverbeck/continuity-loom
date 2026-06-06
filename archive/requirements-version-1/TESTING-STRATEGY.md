# Testing Strategy — Continuity Loom v1

## Purpose

This spec defines the v1 testing strategy needed to protect deterministic continuity behavior. It describes what must be tested and why, without writing test files or implementation tickets.

## Scope

This spec covers compiler determinism tests, validation tests, storage/migration tests, UI workflow smoke tests, OpenRouter integration tests with mocked transport, security tests for API-key leakage, demo fixture tests, and regressions for no accepted-prose prompt inclusion.

It does not define actual tests, fixtures in code, CI configuration, database migrations, or production implementation details.

## Non-goals

This spec does not write test files, define tickets, require live OpenRouter calls in automated tests, test literary quality as a deterministic property, or authorize test-only bypasses of validation/security rules.

## Testing doctrine

Continuity Loom’s riskiest bugs are not visual glitches. They are authority bugs: prose becomes canon, validation weakens, active records are silently changed, active cast is compressed, or prompt inputs drift.

The test strategy should therefore prioritize deterministic domain behavior before UI polish.

## Deterministic compiler tests

Compiler tests must prove:

- identical validated inputs produce byte-identical prompt output;
- prompt section order matches `compiler-contract(8).md`;
- every placeholder renders from the mapped deterministic source;
- empty-state constants are exact;
- active/onstage CAST MEMBER dossiers include all populated fields;
- present-minor and offstage bands render only their allowed compressed/relevance content;
- current voice pressure pins render before full dossiers;
- temporary cast voice overrides are scoped to the current generation;
- warnings do not compile;
- accepted prose/rejected/superseded candidate text is absent;
- prompt output changes only when source inputs or versioned template/compiler/contract change.

Golden-output tests are appropriate for prompt rendering, as long as they are maintained deliberately when prompt contracts change.

## Validation tests

Validation tests must cover universal minimum completeness and every focus tag in `compiler-contract(8).md` that v1 supports.

Required validation areas:

- missing current authoritative state;
- missing manual directive;
- missing stop guidance;
- stop guidance requesting chapter/act/beat/arc/future summary/multiple response points;
- current state vs handoff contradiction;
- two locations for one entity;
- two holders for one object;
- offstage interruption without route;
- hidden secret leaked into POV knowledge;
- active physical action without positions/routes/visibility/time;
- active speaker lacking voice anchor or current pressure;
- ensemble speakers lacking distinct voice pins;
- active silent cast lacking body/silence pressure;
- present-minor speech without compressed voice note;
- content envelope contradiction;
- accepted prose pasted into prompt-facing fields;
- validation warnings not blocking.

Tests should assert diagnostic severity, code, affected fields, and actionable message shape.

## Storage and migration tests

Storage tests must verify:

- project metadata parsing and invalid metadata diagnostics;
- SQLite open/create behavior;
- runtime schema validation on record load/save;
- reference projection updates;
- safe delete/archive behavior with references;
- accepted segments stored separately from compiler inputs;
- backup copy consistency when project is open/closed;
- migration version detection;
- migration failure rollback/recovery behavior.

Migrations themselves are not defined here, but the strategy requires transactional migration tests whenever migrations are implemented.

## UI workflow smoke tests

UI smoke tests should cover complete user loops:

- create/open project;
- create/edit atomic record;
- create/edit CAST MEMBER dossier;
- select active working set records and cast bands;
- edit generation-time brief;
- see blockers;
- fix blockers;
- preview prompt;
- send through mocked OpenRouter;
- edit candidate;
- regenerate/discard;
- accept;
- browse accepted segment;
- see durable-change reminder;
- manually update records after acceptance.

The goal is not exhaustive visual testing. The goal is ensuring the continuity surfaces do not blur in normal workflows.

## OpenRouter integration tests

Use mocked transport for automated tests. Do not call OpenRouter live in normal test runs.

Mock cases:

- missing key before request;
- invalid key / 401;
- insufficient credits / 402;
- invalid request / 400;
- provider forbidden/guardrail / 403;
- timeout / 408;
- rate limit / 429 with Retry-After;
- provider/model failure / 502/503;
- malformed response with no message content;
- successful non-streaming response;
- request cancellation if implemented.

Assertions:

- no records mutate on send failure;
- no accepted segment is written before user acceptance;
- candidate appears only on success;
- errors are normalized;
- prompts and keys are not logged.

## Security tests

Security tests must detect API-key leakage across:

- project metadata;
- SQLite project store;
- prompt preview text;
- compiled prompt string;
- logs;
- accepted segment metadata;
- candidate session serialization if any;
- generated demo fixtures;
- generated files.

Tests should include fake key patterns and ensure redaction/exclusion. The app must treat detected key leakage in prompt/project/log surfaces as a bug-level failure.

## Demo fixture tests

The tame demo fixture must test:

- project opens as normal data;
- required records exist;
- valid generation setup passes validation;
- documented invalid variants produce expected blockers;
- prompt preview compiles and excludes accepted prose;
- mocked OpenRouter response becomes candidate;
- acceptance writes one accepted segment;
- durable-change reminder appears;
- Red Bunny content is absent from bundled demo data.

## Regression tests for accepted-prose exclusion

This deserves dedicated regression coverage:

- accepted segment exists but compiler input does not include it;
- user-authored handoff note is allowed;
- verbatim accepted text in handoff blocks;
- rejected/superseded candidate text in prompt-facing field blocks;
- automatic prose-derived summary field does not exist;
- accepted segment browser has no “include in prompt” action.

## User-facing behavior under test

Tests should confirm the user cannot accidentally:

- preview prompt with blockers;
- send with blockers;
- accept prose before candidate exists;
- store rejected candidates permanently;
- store API keys in project files through settings;
- use accepted prose as prompt context;
- silently add records to active working set through helper panels.

## Data/logic implications

The domain core should be testable without the UI and without network. Validation and compilation should accept explicit snapshots and return structured results. Storage tests should use temporary project folders. OpenRouter tests should mock HTTP.

## Alignment with `FOUNDATIONS.md`

The test strategy protects the foundation’s hardest rules: deterministic compilation, fail-closed validation, no accepted prose as prompt/canon, no LLM record mutation, no hidden active working set changes, no active cast compression, prompt inspection boundaries, local-first storage, and secret handling.

## Security/privacy implications

Automated tests must use fake keys only. Test fixtures must not include real secrets. Prompt/candidate/accepted prose test data should be local and synthetic. Test logs must not include large prompt payloads.

## Validation implications

Validation test coverage is a phase gate before OpenRouter integration and candidate acceptance are considered reliable. The app must not rely on UI-level disabled buttons alone; domain validation must enforce blocking behavior.

## Failure modes

Testing failure modes include:

- snapshot tests accepted blindly after prompt drift;
- UI tests pass while domain validation can be bypassed;
- mocked OpenRouter tests accidentally store prompts;
- demo fixture omits negative blocker scenarios;
- security tests look only at logs but not project stores;
- accepted-prose exclusion is tested only in happy path;
- prompt length warnings mistakenly block.

## Done Means

Testing strategy is satisfied when:

- compiler determinism and placeholder coverage are testable with golden outputs;
- validation blockers/warnings are covered by deterministic tests;
- storage and migration safety are testable with temporary project folders;
- UI smoke tests cover the full continuity loop;
- OpenRouter is tested through mocked transport with all common error categories;
- API-key leakage tests cover project data, prompts, logs, fixtures, and accepted metadata;
- demo fixture tests cover both valid and invalid states;
- accepted-prose exclusion has dedicated regression coverage;
- no test strategy requires live cloud services, production code in specs, or generated test files here.
