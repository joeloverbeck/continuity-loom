---
status: accepted
---

# OpenRouter transport decodes response facts and workflows decide usability

Continuity Loom's shared OpenRouter transport boundary decodes the response
envelope into facts: HTTP status, top-level or choice-level provider errors,
canonical provider error type, generation correlation, finish reasons, content
shape and length, usage when present, and a bounded sanitized provider reason.
An explicit provider error or error finish reason always defeats accompanying
partial content. Raw response bodies and candidate text do not cross into
diagnostics, logs, project or browser storage, exports, backups, provenance, or
other durable state.

The transport boundary does not declare every string-valued response usable.
After transport has decoded a response with no explicit provider error, the
owning workflow applies its own output contract. Strict whole-response
workflows require a normal completion before local parsing and classify length,
content-filter, unexpected-tool, missing, or unknown termination separately
from parser quarantine. Prose generation may retain a length-stopped response
only as a visibly incomplete editable Draft Candidate; it is not accepted prose
and receives no automatic continuation or retry.

Failures expose a transient author-facing classification and optional
expandable sanitized diagnostic detail. The detail may include generation id,
model and provider, provider status and typed error, safe provider reason,
finish reasons, content shape and length, and usage. It may offer a copyable
sanitized receipt and navigation to OpenRouter's own logs, but it performs no
automatic lookup, retry, repair, fallback, settings change, model change, or
resend.

## Considered Options

- Treat any string at `choices[0].message.content` as transport success. Rejected
  because OpenRouter can return partial content together with an in-band error,
  and termination semantics differ by workflow.
- Let the shared transport accept only normal-stop responses. Rejected because
  a length-stopped prose response can remain useful as an explicitly incomplete
  editable draft even though it is unusable for a strict structured-output
  workflow.
- Expose raw provider bodies or rejected candidate text for diagnosis. Rejected
  because safe structural and correlation metadata can identify the failure
  boundary without weakening assistance quarantine, local-first privacy, or
  the prohibition on durable prompt and output residue.

## Consequences

Response decoding and workflow validation become separate typed seams.
Provider-envelope failures, incomplete generation, unrecognized envelopes, and
local parser quarantine must remain distinguishable in server and browser
contracts. Every OpenRouter consumer uses the shared decoded facts while
retaining its own explicit output-usability policy. Deterministic mocked
response fixtures are sufficient for implementation proof; any live provider
request remains a separately authorized action.
