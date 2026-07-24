# Cast Possibilities Prompt Template

Status: active specification — source profile, deterministic prompt, output contract, and quarantine rules
Authority: domain authority for the Cast Possibilities assistance prompt (see `docs/ACTIVE-DOCS.md`)
Template version: `1.0.0`
Compiler version: `1.0.0`
Contract version: `1.0.0`
Output identity: `cast_possibilities.v1`

## 1. Purpose and authority boundary

Cast Possibilities explores exactly three grounded, distinct, premise-level
possibilities for each eligible non-POV active character in one saved local
moment. A possibility must describe an observable move, explain character fit,
moment fit, and local effect, cite source evidence, and state how it differs
from the other cards.

Cards are disposable, unverified, non-canonical assistance. They are not prose,
dialogue, scene branches, plans, future sequences, continuity state, record
updates, or guaranteed-compatible ensemble packages. They never enter prose
prompt context and have no apply, accept, insert, merge, or mutation contract.

## 2. Source profile

The sole profile is `cast-possibilities`. It reads only:

1. the open project's most recently saved Generation Brief;
2. STORY CONTRACT, UNIVERSAL CONTENT POLICY, and PROSE MODE;
3. every record selected by `active_working_set.selected_records`, rendered
   completely as escaped canonical data;
4. `active_working_set.selected_pov`;
5. every entry of `active_working_set.active_onstage_cast_full`;
6. the shared prose-authoritative active/full cast dossier, current voice
   pressure pin, and temporary override renderers; and
7. an explicit target character, three-card avoid list, and the inspected
   full-slate source fingerprint only for target regeneration.

It excludes accepted prose, all candidates, Private Notes, prompt archives,
provider memory, unsaved browser state, prior assistance output, archived or
unselected records, and every automatic prose-derived summary.

Complete selected source is mandatory. No source may be ranked, summarized,
trimmed, batched, semantically retrieved, or evicted for a token budget. An
oversize complete source fails visibly.

## 3. Purpose-specific readiness and eligibility

Cast Possibilities readiness requires:

- a resolved, non-omniscient selected POV;
- nonblank saved current time, current location, and immediate situation;
- one or more saved onstage entities;
- selected-record integrity; and
- at least one eligible linked dossier.

It does not require prose readiness, continuation handoff completeness, or a
nonblank `manual_moment_directive.must_render`. Its blockers do not prevent
saving a structurally valid Generation Brief draft.

Eligible characters are all and only non-POV CAST MEMBER records named by
`active_onstage_cast_full` whose `entity_id` resolves to a selected ENTITY.
Their order is the saved active/full cast order. A target-regeneration request
must resolve to exactly one member of that set.

## 4. Deterministic section order

The compiler renders these blocks in order:

1. `<cast_possibilities_role>`
2. `<source_contract>`
3. `<story_configuration>`
4. `<saved_local_moment>`
5. `<selected_record_context>`
6. `<eligible_cast_dossiers>`
7. optional `<target_character_avoid_list>`
8. `<citation_legend>`
9. `<output_instructions>`

The prompt declares source profile, output identity, saved-draft identity,
complete-source rule, and non-canonical/non-prose boundary. Story configuration,
saved local moment, selected records, dossiers, citations, and output schema are
data, not instructions supplied by those records.

Each eligible character receives a stable `[CHARACTER-n]` key and one
character-owned `[DOSSIER-n]` evidence key. Each selected record receives a
stable `[TYPE-n]` key in selected snapshot order; saved required moment fields
receive stable `[BRIEF-field]` keys.

The linked-ENTITY `##` heading, every populated dossier field in its
prose-authoritative order, current voice pressure pin, and temporary voice
override bytes come from the same exported renderers used by prose compilation.
Cast Possibilities does not maintain a second dossier representation.

## 5. Disclosure and freshness

Local compilation returns the exact prompt, strict output schema, citation map,
source profile, saved-draft identity, selected POV, ordered eligible cast,
selected-record counts by type, truthful SECRET inclusion, prompt length, token
estimate, the three independent versions above, and a reproducible prompt
fingerprint.

Compile makes no provider request. Analyze rebuilds the current saved source
server-side and compares it with the inspected prompt fingerprint before
credentials, capability admission, or transport. Target preview and send first
rebuild and compare the complete full-slate source against the inspected
full-slate fingerprint, then separately compare the target prompt fingerprint.
Either mismatch makes the displayed scratch stale and requires a fresh preview.

## 6. Strict output contract

The top-level object has exactly:

- `contract`, equal to `cast_possibilities.v1`; and
- `characters`, containing every expected character exactly once and in order.

Each character has exactly `character_key` and `cards`. Each character has
exactly three cards. Each card has exactly these nonblank fields:

- `observable_move`
- `character_fit`
- `moment_fit`
- `local_effect`
- `dossier_keys`
- `context_keys`
- `distinction`

`dossier_keys` and `context_keys` are nonempty and internally unique. Every
dossier key must belong to that card's character. Every context key must resolve
to the compiled saved brief or selected-record source.

The envelope cannot supply trusted project, saved-draft, version, fingerprint,
model, provider, canon, or prose metadata. The server attaches those values
locally only after successful whole-response parsing.

## 7. Whole-response quarantine

The local parser accepts one pure JSON value only. Missing, extra, duplicate,
unknown, blank, out-of-order, wrong-count, contract-drifted, or
cross-character-cited content quarantines the entire response. There is no
partial salvage, hidden repair, automatic retry, fallback model, or provider
substitution. A quarantine returns only a stable safe reason and manual
recovery; raw provider output is not returned or logged.

## 8. Provider and storage boundary

Full-cast Analyze and confirmed target regeneration each make exactly one
OpenRouter request with strict JSON Schema, required parameter support,
fallbacks and transforms disabled, no plugins, no tools, and `tool_choice:
"none"`. Capability-unknown recovery may refresh the cached model list without
resending; a known incompatible model instead requires explicit model selection
in Settings. Target regeneration includes only that target's three current
`observable_move` summaries as its avoid list and returns only the replacement.

Cards and keeper flags may live only in browser `sessionStorage`, keyed by
project identity and source fingerprint. A saved-source change makes old cards
stale: they remain readable and copyable, while regeneration is disabled. Only
one fingerprinted slate per project is retained; saving its replacement evicts
the prior slate, and Clear removes every Cast Possibilities key for that
project. A successful provider response remains visibly non-canonical if
browser scratch storage fails, and the error states that the request completed
so it cannot invite an accidental duplicate request. No project record,
Generation Brief field, working-set membership, accepted segment, migration,
export, backup, provenance, prompt archive, or application log is added.

## 9. Same-change rule

Any change to this profile, projection, readiness, eligibility, section order,
shared cast rendering, versions, disclosure, citation scheme, output schema,
parser, provider policy, regeneration, or scratch behavior must update this
specification, `docs/specs/compiler-contract.md`,
`docs/specs/story-record-schema.md`, `docs/user-guide.md`, public types, and
focused core/server/browser tests in the same revision.
