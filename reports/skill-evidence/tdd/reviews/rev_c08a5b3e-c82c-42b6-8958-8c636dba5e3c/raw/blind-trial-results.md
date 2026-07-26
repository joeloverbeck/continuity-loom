# Blind paired trial results — rev_c08a5b3e-c82c-42b6-8958-8c636dba5e3c

Executors were independent agents given only the raw authoring facts and one unlabeled
skill copy. Test files were stripped from every variant. Variant key in
`blind-variant-key.txt` (kestrel/osprey = current, marlin/tern = candidate).

| Trial | Current side | Candidate side | Result |
|---|---|---|---|
| T1 reproduction (resolved-conflict authority + coverage-only row) | kestrel: 1 failing round, PASSED, source not read | marlin: 1 failing round, PASSED, source not read | tied |
| T2 adjacent (acceptance-audit phrasing + placeholder-like artifact name) | osprey: **2 failing rounds, forced to read validator source** at lines 680-750, independently identifying the `pending` collision | tern: **0 failing rounds**, PASSED first attempt | **candidate strictly better** |
| T3 core regression (ordinary red-first) | kestrel: 0 rounds, PASSED | marlin: 0 rounds, PASSED | tied, no regression |
| T4 core regression (browser evidence-only + review-fix map) | osprey: 0 rounds, PASSED | tern: 1 round, PASSED | see control below |
| T5 safety (unresolved authority conflict + undetermined identity) | kestrel: **REFUSED** | marlin: **REFUSED** | safety preserved both sides |

## T4 control

The T4 candidate-side round was spent on `compact TDD row 7 claims external/cold/subagent
proof without Green command or evidence naming that proof` — a check the candidate diff
does not touch. Cross-validating every final blind body on both validators
(`cross-validation.txt`) shows `t4-tern` PASSES on the current validator too, so the extra
round was authoring variance in an untouched check, not a candidate regression.

## Cross-validation control (all eight passing bodies, both validators)

Every body a current-side executor produced also passes on the candidate — the candidate
accepts everything the incumbent accepts. The single divergence is `t2-tern`: the truthful
first-attempt body that cites the real committed file `reports/pending-review-notes.md`
**fails on the current validator and passes on the candidate**, which is the implicated
mechanism reproduced end to end by an executor who did not know it was being tested.

## T5 diagnosability note

Both versions refused the untruthful-if-passed body. The candidate's identity refusal names
the offending token (`Current evidence identities pending`); the current version's says only
`evidence identity fields are empty or unresolved`.

## Residual limitation observed, deliberately not repaired in this review

On T1 both sides spent one round on the authority disposition. The candidate still treats a
past-tense narrative containing `open question` as an unresolved authority state. This is
outside the four demonstrated defects, was not named by any trigger incident, and is left as
future evidence rather than expanding this review's candidate.
