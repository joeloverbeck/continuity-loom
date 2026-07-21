# Comparison measures

Measurements describe runtime context and structure; they are not quality
scores. Hashes cover the individual files recorded below. The helper later
validates the candidate directory as a whole.

| Measure | Current baseline | Candidate |
|---|---:|---:|
| Total files | 2 | 2 |
| Total lines | 208 | 207 |
| Total words | 2,374 | 1,131 |
| Total bytes | 16,467 | 8,333 |
| `SKILL.md` words | 1,382 | 544 |
| `HTML-REPORT.md` words | 992 | 587 |
| Estimated runtime reduction | — | 1,243 words (52.4%) |
| Executable helpers | 0 | 0 |

## Runtime-loaded references

| Stage | Current baseline | Candidate |
|---|---|---|
| Initial scan | `codebase-design`; repo domain/architecture authorities when present | Same |
| Report generation | `HTML-REPORT.md` | Same |
| Selected-candidate discussion | `grilling`; `domain-modeling` as decisions resolve; `codebase-design` for alternative interfaces | Same |
| Authorized implementation | repo `/implement` or local coding guidelines | Same |

The candidate reduces entrypoint duplication rather than removing a canonical
owner. Normal report generation still loads the report reference; post-selection
and implementation references remain progressive.

## Steps and hard gates

Both versions retain four stages: explore/verify, report, grill, and authorized
implementation. Both retain these behavior gates:

1. honor repository domain and architecture authorities;
2. verify promoted candidates with direct evidence;
3. keep the report in a unique outside-repo temp path;
4. do not design interfaces in the report;
5. stop at the exact candidate-selection question;
6. respect explicit mutation limits during grilling; and
7. recap decisions and behavior posture before implementation.

## Provenance and duplication

The baseline has no explicit dated audit story. It does contain two long
history-shaped defensive passages: Explore-agent availability/excerpt behavior,
and WSL/detached-opener success semantics. The candidate retains their
transferable conditions in shorter form.

Baseline definitions repeated from canonical owners include the deep-module
vocabulary and principles, domain-authority routing, candidate-card schema,
principle/ADR callouts, and domain-artifact routing. The candidate leaves the
report schema in `HTML-REPORT.md` and points to the companion skills for the
other definitions.

## File hashes

| File | SHA-256 |
|---|---|
| Baseline `SKILL.md` | `96a5f7229fe25bac09bac5b952a1912d86feb98487836e8e6e677aaa09c8506f` |
| Baseline `HTML-REPORT.md` | `5f215d0c2653f50d6af9917b3f16998c9d31a82d0b0f93ad30bd082a54690efe` |
| Candidate `SKILL.md` | `2786b70a0f00c295d5d33668a798807bcc1b227879a65d074bcd48ba06de05a0` |
| Candidate `HTML-REPORT.md` | `9cc57e963b75b635ba601302e2793cfa96efb9e522321fad84f55acb44c4bb54` |

## Deterministic-validator note

The repository-external `quick_validate.py` rejects both copies identically
because its generic frontmatter schema does not allow the already-present
`disable-model-invocation` key. The candidate preserves that host field, so this
is a baseline validator mismatch rather than a candidate regression. Corpus
completeness and whitespace checks are tracked separately.
