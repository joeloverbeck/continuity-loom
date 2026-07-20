Before I draft or publish, please confirm this single checkpoint:

- **Publication package:** one PRD for manual, local-only backup export from an open project. Import/restore, encryption, scheduling, and upload remain out of scope; no follow-on PRD is included.
- **Testing seams:**
  1. Pure bundle-assembler and manifest-verifier tests covering the required inclusions and exclusions, versioned manifest entries and digests, full verification before atomic rename, and invalid-bundle rejection.
  2. Localhost export-route integration tests with cancellation and injected write failures, proving temporary-sibling cleanup, preservation of an existing destination, API-key secrecy, and zero network requests.
  3. One production browser flow proving the plaintext-private-notes disclosure, cancellation, successful export to a user-selected destination, and zero network traffic.
- **Decision disposition:** the discussion leaves no product decision open for this PRD. Plaintext private notes, the excluded data classes, atomic destination handling, and the import/restore exclusion are settled. The package should therefore carry the configured enhancement and ready-for-implementation label equivalents; no missing label is proposed or invented from the supplied discussion.

Please reply **confirmed** to ratify exactly these seams and this one-PRD package. Publication has not begun.
