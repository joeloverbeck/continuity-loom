# User-facing response

Architecture review ready: `/tmp/architecture-review-20260721T120000Z.html`

Opener dispatched with:

```bash
xdg-open /tmp/architecture-review-20260721T120000Z.html >/dev/null 2>&1 &
```

The report contains two verified deepening candidates:

- **Centralize Intake normalization** — **Strong**. CLI, HTTP, and import-file adapters duplicate alias and default-unit rules before constructing the same Manifest. Three adapters establish a real seam; one deep Intake normalization module would restore locality and give the shared rules one test surface.
- **Deepen Route attempt execution** — **Strong**. Retry decisions and attempt logging are interleaved across three modules, while tests bypass the runner and exercise helpers separately. Absorbing that coordination into the Route execution module would make its interface the test surface.

Top recommendation: **Centralize Intake normalization**. It has the clearest deletion-test result and the highest leverage: one rule implementation serving three adapters.

Which of these would you like to explore?

---

# Compact execution record

- **Mode:** dossier-only simulation; no repository or product files changed.
- **Report shape:** self-contained HTML; Tailwind and Mermaid CDN scaffold; two before/after candidate cards; top-recommendation card.
- **Vocabulary:** Manifest, Intake, Route, and Dispatch domain terms; module, interface, implementation, depth, deep, shallow, seam, adapter, leverage, and locality architecture terms.
- **Interface restraint:** no concrete interface was proposed before the grilling loop.

## Candidate verification

| Scan note | Verification | Disposition |
|---|---|---|
| `route-label.ts` appears to duplicate validation | Call-site trace shows it accepts only `ValidatedRoute`, which only `manifest-validator.ts` can construct. It formats rather than validates. Deleting it would move formatting, not concentrate validation complexity. | Excluded from report |
| `dispatch-controller.ts` has a 95-line switch | Every generated branch already passes through `DispatchRegistry`; the switch supplies exhaustiveness, has one public call site, and conforms to ADR 0003. Deleting it would move generated dispatch selection rather than create depth. | Excluded from report |
| Intake rules repeat in three adapters | CLI, HTTP, and import-file adapters independently implement aliases and default units before the same Manifest constructor. Two-or-more adapters establish the seam. Removing the duplicate rules concentrates implementation in one Intake module. | Promoted: **Strong**, `ports & adapters` |
| Retry and logging span three Route modules | `route-runner.ts`, `retry-policy.ts`, and `dispatch-log.ts` split one execution decision, and tests bypass the runner. Absorbing the helpers concentrates coordination behind the Route execution interface and moves tests to that interface. | Promoted: **Strong**, `in-process` |

## Report-card evidence ledger

1. **Centralize Intake normalization**
   - Files: CLI adapter, HTTP adapter, import-file adapter, Manifest constructor.
   - Deletion test: passes; three duplicate rule sets collapse into one implementation.
   - Call-site check: all three adapter outputs converge on the same Manifest constructor.
   - Wins: “locality: one rule module”; “leverage: three adapters”; “tests hit one interface”.
   - Visual: three parallel normalization paths before; three adapters crossing one seam into a deep Intake normalization module after.
2. **Deepen Route attempt execution**
   - Files: `route-runner.ts`, `retry-policy.ts`, `dispatch-log.ts`.
   - Deletion test: passes; coordination moves into the runner instead of being redistributed among helpers.
   - Test check: current tests bypass the orchestration interface and assert helpers separately.
   - Wins: “locality: attempts stay together”; “tests hit runner interface”; “retry logging stops leaking”.
   - Visual: decision and log arrows crossing three shallow modules before; one deep Route execution module with internal retry and logging implementation after.

Exact source line numbers were not present in the complete task dossier, so none were invented; verification is recorded against the dossier’s call-site, construction, generation, and test-flow facts.
