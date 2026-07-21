# Parser design note

## Diagnosis of current depth

The current profile modules are already deep and aligned with the platform-free `core` boundary: each caller supplies raw text plus trusted context and receives one typed valid-or-rejected result, while substantial deterministic behavior stays hidden.

`parseSegmentReconciliationOutput` owns pure-JSON and exact-key enforcement, source-echo matching, sequential proposal IDs, citation scopes, brief and record target validation, lifecycle transitions, JSON Patch application on a clone, record-schema validation, reference-token resolution, creation dependency cycles, duplicate targets, and the accepted-prose echo firewall. Its malformed result intentionally retains `rawOutput`.

`parseAcceptedSegmentChangeReviewOutput` owns a different contract: strict items and exactly six coverage dimensions, unique citations and target hints, profile enums, future-possibility rejection, explicit-source support for established claims, and the echo firewall. Its failure is a quarantined result with fixed recovery guidance and intentionally does not return raw output.

`strict-output-primitives.ts` is a narrow implementation module for genuinely shared syntax mechanics: reason-tagged errors, one pure JSON object, plain-object recognition, exact keys, and citation-list mechanics. It is not the owner of either profile's schema or semantics. There is no I/O dependency, so this is an in-process seam and needs no port or adapter.

## Two plausible interface shapes

### Shape A: profile-owned parser interfaces

Keep one exported parse function per profile, with shared syntax primitives private to the parser implementation cluster. The module interface is the function, context, and result contract; callers never learn parsing phases or helper seams.

```ts
export function parseSegmentReconciliationOutput(
  rawOutput: string,
  context: SegmentReconciliationParseContext
): SegmentReconciliationParseResult;

export function parseAcceptedSegmentChangeReviewOutput(
  rawOutput: string,
  context: AcceptedSegmentChangeReviewParseContext
): AcceptedSegmentChangeReviewParseResult;
```

This is essentially the current shape. It has high leverage: a small interface hides schema decoding, cross-field checks, trusted-context comparison, domain validation, and failure normalization. Deleting either module would spread that knowledge into its callers.

### Shape B: descriptor-driven shared parser engine

A shared engine could parse syntax and invoke a profile descriptor:

```ts
function defineStrictOutputParser<Context, Output, Reason extends string>(spec: {
  decode(object: Record<string, unknown>, context: Context): Output;
  classify(error: unknown): Reason;
  reject(raw: string, reason: Reason, summary: string): unknown;
}): (raw: string, context: Context) => unknown;
```

This is genuinely different because it makes parsing control flow configurable. It could be justified with many uniform profiles, but with these two it is shallower: the descriptor exposes implementation phases, the generic result erases useful type relationships, and `reject` exists largely to parameterize the important raw-output versus quarantine difference. Most complexity would remain in two large `decode` callbacks, so the engine would not pass the deletion test.

## Recommendation

Choose Shape A and retain the two profile-owned parser modules. Do not add a union facade, parser class, compatibility alias, or descriptor framework. The existing exported functions are the deeper interface. Keep `strict-output-primitives` limited to stable syntax mechanics used by both profiles; do not move exact profile keys, reason codes, duplicate policy, source-echo rules, or domain checks into it merely to remove lines.

If locality needs improvement inside the long reconciliation implementation, use private functions or private files under `compiler/reconciliation/` for JSON Pointer application and creation-graph validation. They remain implementation details and are not exported from `core` or tested past the parser interface.

## Syntax versus domain ownership

- Shared syntax implementation owns: rejecting surrounding text, malformed/non-object JSON, plain-object recognition, exact key-set mechanics, generic citation-list shape/membership mechanics, and reason-tagged exceptions.
- Reconciliation owns: its contract/source shape and echo, allowed citation sets (including its duplicate policy), proposal IDs/actions, brief paths/values, record targets, JSON Patch behavior, lifecycle destinations, payload/enum validation through the record registry, reference tokens, dependency graph, duplicate targets, its failure taxonomy, raw-output retention, and the echo firewall invocation.
- Change review owns: its contract/item/coverage shapes, unique citation policy, sequential item IDs, complete ordered coverage, enums, nonblank fields, established-claim witness rule, future-possibility rule, its quarantine taxonomy/recovery contract, non-retention of raw output, and the echo firewall invocation.
- The record registry and accepted-segment echo module remain coherent domain modules called by the profile parsers; neither should be re-exposed as a caller concern.

## Tests at the chosen interface

Tests should call only the two exported parse functions and assert observable results:

- For both: valid deterministic fixtures; surrounding text, malformed JSON, non-object JSON, extra/missing keys, wrong contract, unknown citations, and material accepted-prose echo.
- Reconciliation: stale source fingerprint; invalid brief path/value; sequential and duplicate proposal targets; invalid lifecycle destination; immutable or unresolved JSON Pointer paths; schema-invalid patches without mutation of the source record; invalid record type/enum/payload; raw UUID rejection and valid token resolution; unknown/cyclic creation dependencies; and preservation of `rawOutput` on failure.
- Change review: non-sequential items; duplicate citations/target hints; missing, duplicate, or unknown coverage dimensions; invalid enums; future possibilities; unsupported “established change” claims; valid explicit-source witnesses; and absence of raw output on every quarantine result.

Focused primitive tests are appropriate only for syntax behavior shared by both parsers. Once parser-interface cases cover an internal branch, tests coupled to private helper layout should be removed. This preserves strict deterministic, fail-closed behavior without weakening either profile's distinct schema or semantic contract.
