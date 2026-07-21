# Comparison measures

| Measure | Current baseline | Candidate |
|---|---:|---:|
| Entrypoint runtime words (`SKILL.md`) | 1,200 | 562 |
| All runtime prose words | 2,299 | 1,661 |
| Entrypoint reduction | — | 638 words / 53.2% |
| Full-load reduction | — | 638 words / 27.8% |
| Files | 3 | 3 |
| Executable helpers | 0 | 0 |
| Incident/audit/provenance passages | 0 | 0 |
| Detailed dependency taxonomy homes | 2 (`SKILL.md`, `DEEPENING.md`) | 1 (`DEEPENING.md`) |
| Repeated relationship/depth explanation groups in entrypoint | 4 (glossary, diagrams, principles, relationships) | 2 (vocabulary, principles) |

## Runtime loading and gates

| Use | Current baseline | Candidate |
|---|---|---|
| Ordinary single-interface design | `SKILL.md`; repository authorities as available | Same |
| I/O, database, network, external, migration, format, or versioned seam | `SKILL.md`, with `DEEPENING.md` offered for full detail | `SKILL.md` explicitly requires `DEEPENING.md` |
| Several alternative interfaces | `SKILL.md`, with `DESIGN-IT-TWICE.md` offered | `SKILL.md` explicitly requires `DESIGN-IT-TWICE.md` |
| Hard gates | Honor repository authorities; preserve vocabulary; test at the interface; justify a real seam | Same, with detailed seam thresholds routed to `DEEPENING.md` |

## Structural change

Only `SKILL.md` differs. `DEEPENING.md` and `DESIGN-IT-TWICE.md` are byte-identical;
no helper, test, or asset was added or removed. The candidate removes diagrams,
generic code examples, the relationship restatement, and the entrypoint copy of the
dependency taxonomy. It retains explicit load triggers for both detailed references.
