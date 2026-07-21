# Comparative validation summary

Decision recorded by helper: `accepted`

- Event: `evt_0dd9d289-ce26-4471-bfde-b9ca8275c433`
- Risk tier: high
- Frozen paired trials: 7
- Candidate hash: `76ae338982455c854f5b35b6a6c76491c5e0364354bb95f3ae853783fb2c769c`
- Blind results: candidate preferred on 4 tasks, tied on 3, preferred against on 0
- Material or severe candidate regressions: 0
- Runtime words: 2,374 -> 1,131 (52.4% reduction)

## Trial results

| Task | Result | Material observations |
|---|---|---|
| Large multi-context scan | tie | Both honored domain/ADR authorities, local-only policy, direct evidence, screening, and the report/selection boundary. |
| Small concentrated scan | candidate win | Candidate was clearer about policy plus scale and avoided the baseline response's contradictory claim that a simulated opener had run. Both were fixture simulations rather than real HTML generation. |
| WSL delivery | candidate win | Candidate used `wslview`, printed the absolute path, disclosed absent browser verification, preserved scratch placement, and ended at the checkpoint. |
| Browser fallback | tie | Both used loopback-only serving, waited for Mermaid, triaged benign console noise, stopped the server, and asked for selection. Candidate opener detachment was less explicit but not material. |
| Verify before promote | tie | Both dropped the type- and registry-neutralized false candidates, kept two verified cards without padding, and preserved ADR 0003. |
| Design-brief-only handoff | candidate win | Candidate asked the more bounded design question and kept mutation limits. Both outputs had not yet reached the final brief, so neither stated the eventual glossary/ADR disposition in this first-question turn. |
| Load-bearing rejection | candidate win | Candidate explicitly withdrew the recommendation, preserved code/docs, recognized the durable release boundary, and stopped at ADR authorization. |

## Noninferiority judgment

The candidate retained the scan, evidence, authority, scratch report, explicit
selection, grilling, domain-artifact, rejection, and authorized-implementation
behaviors exercised by the corpus. No evaluator found a material or severe
candidate regression. The two shared caveats came from frozen-fixture scope, not
candidate simplification: report files/openers were simulated in scan tasks, and
the design-brief trial ended at its first question before closeout dispositions
would be due.

The candidate is meaningfully simpler and leaves unusual behavior behind
transferable conditions: WSL/nonblocking delivery, policy-aware delegation,
authority conflict/endorsement, explicit mutation limits, and behavior-preserving
implementation handoff. It therefore clears the noninferiority gate.
