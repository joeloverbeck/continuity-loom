# Review evidence identity refresh

Use one shared identity block for normal and fallback reviews, whether or not TDD ran. Refresh it after every review fix or evidence rerun so current proof cannot silently retain superseded fixture, browser-session, packet, revision, or artifact identifiers.

```markdown
Evidence identity refresh:
- Current evidence identities: fixture paths <path 1 | path 2 | none / withheld because <authority and reason>; logical fixture <stable ID>; content SHA-256 <64 hexadecimal characters>; provenance <generated, derived, or copied-source statement>>; browser sessions <name 1 | name 2 | none>; packet paths/hashes <path/hash 1 | path/hash 2 | none>; active revisions <ID 1 | ID 2 | none>; artifacts <path/ID 1 | path/ID 2 | none>
- Historical red identities retained: <fixture paths ...; browser sessions ...; packet paths/hashes ...; active revisions ...; artifacts ... / none>
- Superseded evidence identities: fixture paths <path 1 | path 2 | none>; browser sessions <name 1 | name 2 | none>; packet paths/hashes <path/hash 1 | path/hash 2 | none>; active revisions <ID 1 | ID 2 | none>; artifacts <path/ID 1 | path/ID 2 | none>
- Superseded-token sweep: <`rg`/`grep` command naming every normalized exact superseded value individually; no hits outside classified identity/history lines and no active-proof hits; historical-red hits classified or none / N/A because every superseded category is none>
```

Keep historical red identities only when they are explicitly classified as earlier failing evidence. Use literal `none` when there are no historical red identities; otherwise enumerate all five categories just like the current and superseded inventories. If any superseded category is not `none`, run `rg` or `grep` for every normalized exact superseded value and record `no hits outside classified identity/history lines and no active-proof hits`, followed by how any historical-red hits were classified; do not use the all-none N/A.

Use ` | ` as the canonical delimiter between multiple values in one category. Validation compares normalized values one by one, ignoring Markdown code/emphasis wrappers and trailing punctuation. Legacy comma-separated lists remain accepted only when every comma item is Markdown-wrapped. A sweep must name each normalized value individually; it does not need to reproduce the category's raw Markdown or punctuation.

When authority forbids publishing a local fixture path, use the structured `fixture paths withheld because <authority and reason>; logical fixture <stable ID>; content SHA-256 <64 hexadecimal characters>; provenance <generated, derived, or copied-source statement>` form. Never use `fixture paths none published because ...`: it hides the path without preserving a stable identity that another reviewer can compare.

Nested-validator angle-token rule: in compact review, TDD, or audit cells and in evidence-identity values, avoid HTML-like angle tokens such as a backticked body tag even when intentional. Spell the token in prose, for example `document body`, because the shared parser classifies any angle token as an unresolved placeholder.

Evidence-artifact lifecycle rule: before deleting proof-owned fixtures, scripts, packets, or artifacts, compare them with the published `Current evidence identities:` inventory and closeout references. A published current artifact is not safe to remove until closeout is complete and its retained-or-removed disposition is recorded. If it is removed after publication, update the durable evidence so it does not imply that the local artifact remains inspectable; retain the command/result or tracker-hosted evidence needed to support the claim.

When `--browser` is used and `Current evidence identities:` names non-`none` fixture paths, `Backend process currentness:` must also state `stateful fixture snapshot method`, `snapshot source`, and `expected-state probe`, or the exact disposition `N/A because no stateful fixture was copied`. For SQLite with possible live WAL state, use `.backup` or a checkpoint-aware copy rather than raw `cp`.
