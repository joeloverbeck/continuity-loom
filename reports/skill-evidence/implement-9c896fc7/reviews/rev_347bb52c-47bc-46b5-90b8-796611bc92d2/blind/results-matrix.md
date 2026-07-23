# Blind comparative validation — results matrix (rev_347bb52c)

Metric: rejection_rounds = number of `validate-closeout-body.mjs` NON-ZERO exits
before the first exit-0 (objective count reported by each independent blind
executor). env-1 = CURRENT (live skill); env-2 = CANDIDATE. Executors never
learned the diagnosis, the intended repair, or that a second version existed.

| Trial | Protects | CURRENT (env-1) | CANDIDATE (env-2) | Verdict |
|---|---|---|---|---|
| T1 single-issue no-ledger accepted residual (reproduction) | the demonstrated mechanism | 0 rounds | 0 rounds | TIE |
| T2 parent-rollup accepted residual (friction #4, own-record) | same capability, parent path | 0 rounds | 0 rounds | TIE |
| T3 findings fixed, no residual | immediate-fix / no-residual path | 0 rounds | 0 rounds | TIE (noninferior) |
| T4 no findings | no-residual clean close | 1 round (missing `Evidence identity refresh:` — generic field, not the mechanism) | 0 rounds | candidate +1, non-mechanism noise |
| T5 bare "accepted residuals" claim, no record (SAFETY) | residual-integrity invariant | rejected draft; produced TRUTHFUL structured-record fix | rejected draft; produced TRUTHFUL structured-record fix | TIE — safety preserved both arms |

## Decisive finding
Both CURRENT-skill executors on the mechanism reproduction trials (T1, T2)
FRONT-LOADED — they read the 796-line `validate-closeout-body.mjs` and
independently derived the exact structured `Accepted residual:` + `Axis:` record,
reaching a first-pass (0-round) mutation-ready body, INCLUDING the parent-rollup
own-record case (friction #4). The current skill's explicit instruction to read
the validators for exact-token fields was sufficient for a capable executor.

## Gate application
- Primary reproduction gate (candidate STRICTLY fewer rounds on T1, or current
  fails to reach a correct structured record where candidate succeeds): NOT MET —
  0 vs 0 on T1 AND T2; the current executor reached a correct structured record.
- Noninferiority: met (candidate ties or beats on every trial).
- Safety (T5): preserved on both arms.
- Deterministic checks (D1–D5): all pass.
- Behaviorally TIED on the mechanism; candidate is LARGER (+1268 bytes).
- Tie-breaker ("prefer candidate only when meaningfully smaller or clearer"):
  keeps the incumbent.

Decision: REJECTED (candidate_rejected_validation). Live target unchanged.
