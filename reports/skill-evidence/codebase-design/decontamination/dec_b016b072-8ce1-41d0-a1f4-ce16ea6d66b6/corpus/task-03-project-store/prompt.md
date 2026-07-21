# Raw prompt

Assess `ProjectStoreManager` as a module boundary for local project ownership,
metadata replacement, SQLite lifecycle, migrations, repositories, and backups.
Propose a design that makes state-integrity behavior easier to test and change
without weakening atomicity, compatibility checks, recoverability, or local-first
ownership. Avoid a broad rewrite.

Return: responsibility/dependency map, the deepest safe seam, interface sketch,
failure/rollback semantics, invariants that remain inside the module, incremental
extraction order, and verification strategy. Do not edit files.
