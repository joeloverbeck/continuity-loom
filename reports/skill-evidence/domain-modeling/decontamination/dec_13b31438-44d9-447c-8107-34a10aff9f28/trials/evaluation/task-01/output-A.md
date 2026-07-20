The durable update is a new root `CONTEXT.md`:

```md
# Continuity Loom

Continuity Loom models user-authored continuity state separately from generated and accepted manuscript prose.

## Language

**Story Record**:
User-authored structured continuity state that is authoritative input to prompt compilation.

**Accepted Segment**:
Prose the user deliberately accepted into the manuscript. It is manuscript content, not continuity authority or prompt context.

**Candidate**:
Generated prose presented for review before acceptance. On acceptance it becomes an Accepted Segment; rejected and superseded Candidates are neither durable story state nor prompt context.
```

No ADR is warranted: these are domain definitions, and no architectural mechanism or file-format decision was made.
