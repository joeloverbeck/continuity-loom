# Checks

- Storage safety, compatibility, rollback, recoverability, secret exclusion, and local ownership are stated as invariants.
- The recommendation keeps one high-leverage project lifecycle seam and preserves transaction-coupled repository and migration knowledge.
- Failure semantics cover create, preflight, migration, activation, close, and backup, including the unresolved cross-resource crash risk.
- Tests cross the public store interface with temp files and real SQLite; fault injection is private and narrowly justified.
- The extraction is staged, has an explicit abort point, and replaces old getters without aliases or shims.
- No target or source file was edited.
