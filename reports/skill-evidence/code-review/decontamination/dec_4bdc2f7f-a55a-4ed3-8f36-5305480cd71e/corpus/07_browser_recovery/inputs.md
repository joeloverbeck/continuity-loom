# Scenario facts

- Fixed point `cccccccccccccccccccccccccccccccccccccccc`; reviewed HEAD `dddddddddddddddddddddddddddddddddddddddd`.
- Initial Standards reviewer `standards-browser` completed with zero findings.
- Spec reviewer `spec-browser-1` was interrupted after partial output. Its raw partial output is preserved at `issue #180 comment 301`. Fresh reviewer `spec-browser-2` completed the full Spec output, and its output gate passed. All three reviewers reached terminal completion; no close primitive surfaced.
- Issue #180 changes route `/projects/:id/history`, its browser-consumed API response, and a SQLite-backed fixture. Final browser smoke on that route passed after a proof-owned backend restart; console recorded 0 errors and 0 warnings.
- Backend evidence: command `npm run dev`; non-watch API process on port 5174 owned by PID 4242; restarted after server edit; API probe confirmed `acceptedAt`; fixture snapshot used SQLite `.backup`; snapshot source `fixtures/history-source.sqlite`; expected-state probe found accepted segment `seg-7`.
- Current fixture path is `tmp/history-proof.sqlite`, logical fixture `history-proof`, content SHA-256 `0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef`, provenance `copied-source via SQLite backup`. Current browser session is `history-final`. No packet, revision, artifact, historical red identity, or superseded identity exists.
- Normal local body validation runs with browser mode. No findings were fixed after review.

