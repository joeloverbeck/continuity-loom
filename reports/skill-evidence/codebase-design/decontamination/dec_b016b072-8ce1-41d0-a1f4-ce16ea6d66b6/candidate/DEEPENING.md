# Deepening

How to deepen a cluster of shallow modules safely, given its dependencies. Assumes the vocabulary in [SKILL.md](SKILL.md) — **module**, **interface**, **seam**, **adapter**.

## Dependency categories

When assessing a candidate for deepening, classify its dependencies. The category determines how the deepened module is tested across its seam.

If a candidate spans more than one dependency type, tag the dominant external seam and name the secondary dependencies in the evidence or prose. For example, a browser module that combines in-process React state with an owned HTTP call should usually carry the ports & adapters tag while noting the in-process state behind the same deepening.

### 1. In-process

Pure computation, in-memory state, no I/O. Always deepenable — merge the modules and test through the new interface directly. No adapter needed. An embedded database (SQLite / `better-sqlite3`) is *not* in-process despite running in the same process — it does file I/O and is exercised against a stand-in in tests, so it belongs under Local-substitutable.

### 2. Local-substitutable

Dependencies that have local test stand-ins (PGLite for Postgres, an embedded SQLite database on a temp file or `:memory:`, an in-memory filesystem). Deepenable if the stand-in exists. The deepened module is tested with the stand-in running in the test suite. The seam is internal; no port at the module's external interface.

### 3. Remote but owned (Ports & Adapters)

Your own services across a network boundary (microservices, internal APIs). Define a **port** (interface) at the seam. The deep module owns the logic; the transport is injected as an **adapter**. Tests use an in-memory adapter. Production uses an HTTP/gRPC/queue adapter.

Recommendation shape: *"Define a port at the seam, implement an HTTP adapter for production and an in-memory adapter for testing, so the logic sits in one deep module even though it's deployed across a network."*

### 4. True external (Mock)

Third-party services (Stripe, Twilio, etc.) you don't control. The deepened module takes the external dependency as an injected port; tests provide a mock adapter.

## Historical/versioned contracts

Some seams are real because callers live at different points in time rather than behind different runtime adapters: migrations, seed snapshots, file formats, import/export schemas, and protocol versions.

For these, the deepening move is to freeze the historical contract behind its own small interface or data snapshot. Do not import the current runtime catalog, schema helper, or UI option source into a historical migration when future edits to that source would rewrite old behavior.

Test through the versioned behavior: migrate an old artifact, import an old file, or exercise the old protocol shape. The current implementation may still have one production adapter; the seam earns its keep because locality protects historical behavior from current changes.

## Seam discipline

- **One adapter means a hypothetical seam. Two adapters means a real one.** Don't introduce a port unless at least two adapters are justified (typically production + test). A single-adapter seam is just indirection.
- **Version can justify a seam.** The two-adapter test catches speculative ports; it is not a veto on seams that separate historical contracts from current runtime behavior.
- **Internal seams vs external seams.** A deep module can have internal seams (private to its implementation, used by its own tests) as well as the external seam at its interface. Don't expose internal seams through the interface just because tests use them.

## Testing strategy: replace, don't layer

- Old unit tests on shallow modules become waste once tests at the deepened module's interface exist — delete them.
- Write new tests at the deepened module's interface. The **interface is the test surface**.
- Tests assert on observable outcomes through the interface, not internal state.
- Tests should survive internal refactors — they describe behaviour, not implementation. If a test has to change when the implementation changes, it's testing past the interface.
