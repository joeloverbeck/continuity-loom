# Frozen discussion transcript

- Goal: add a manual export bundle so a project owner can make an offline backup.
- The export is initiated from an open project, remains local-only, and is never
  scheduled or uploaded.
- The bundle contains story records, generation-time brief state, the accepted
  segment archive, and private notes.
- API keys, logs, prompt previews, generated candidates, rejected candidates,
  and superseded candidates are excluded.
- One compressed bundle is written to a user-selected local destination.
- Private notes remain plaintext within the local bundle; encryption is out of
  scope and the UI must disclose this before export.
- A versioned manifest lists every included file and its digest.
- Export writes to a temporary sibling and atomically renames only after the
  complete bundle and manifest verify. Failure or cancellation removes the
  temporary sibling and leaves an existing destination untouched.
- Import and restore are explicitly out of scope.
- The server remains bound to `127.0.0.1` and export makes no network request.
- Recommended verification uses a pure bundle assembler and manifest verifier,
  the localhost export route with injected write failures, and one production
  browser flow proving disclosure, cancellation, successful export, and zero
  network traffic.
- The feature is an enhancement. No testing-seam confirmation has yet been given
  in this conversation.

