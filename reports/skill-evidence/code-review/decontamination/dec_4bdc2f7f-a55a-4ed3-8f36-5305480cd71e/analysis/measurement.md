# Baseline/candidate comparison

Counts use `wc`; token figures are rough UTF-8 byte-count divided by four estimates. Scripts and test fixtures are excluded from runtime prose counts.

| Measure | Baseline | Candidate | Change |
|---|---:|---:|---:|
| Always-loaded `SKILL.md` | 6,461 words; about 11,286 tokens | 1,625 words; about 2,855 tokens | 74.9% fewer words |
| Normal no-fix implementation path (`SKILL` + identity owner; candidate also loads routed closeout) | 7,459 words; about 13,047 tokens | 3,607 words; about 6,499 tokens | 51.6% fewer words |
| Fallback implementation path (all four candidate runtime docs versus baseline three) | 10,983 words; about 19,473 tokens | 7,131 words; about 12,925 tokens | 35.1% fewer words |
| Total runtime Markdown across the target | 10,983 words; 77,891 bytes | 7,131 words; 51,698 bytes | 35.1% fewer words; 33.6% fewer bytes |
| Normal-path mandatory references | none, but closeout text is inline | `implementation-closeout.md` only when invoked by `implement` | rare branch is conditional |
| Fallback mandatory references | `fallback-evidence.md` plus identity/TDD owners as applicable | same, plus the routed normal overlay only when `implement` scope requires it | behavior preserved |
| Process structure | five core steps mixed with normal/fallback closeout gates | five core sections plus explicit conditional routes | common path separated |
| Incident/provenance passages | none | none | unchanged |
| Duplicated definitions | TDD, identity, exact-acceptance, browser/currentness, and handoff fields repeated inline | core exact-acceptance retained once; closeout uses owner pointers | materially reduced |
| Executable helpers | 3 runtime modules, 2 validators, 2 test suites | same | none added or removed |

Candidate deterministic checks before paired trials:

- candidate normal validator suite: 29/29 passed;
- candidate fallback validator suite: 15/15 passed;
- candidate script syntax checks: passed;
- unchanged baseline suites: 44/44 passed.
