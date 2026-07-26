# Blind comparative evaluation

## T1

- **Alpha: fail.** Alpha preserves the diagnostic verdict, provenance, rejected alternatives, authorized mutation, baseline, rollback, and read-back. Its merged label set is substantially cleaner than Beta's. However, the post-mutation `rg` result and fixture result are repeated under `Evidence`, `Mutation and read-back`, and `Baseline`, so the overlapping operational proof does not have one clear output home. That failure-causing redundancy is smaller than Beta's but still violates the trial rule.
- **Beta: fail.** Beta preserves the authoritative facts and provenance, but reproduces both sides of the class shift as overlapping field sets. `Verdict` and `Finding`, `Rejected/no-op alternatives` and `Rejected operations`, and especially `Freshness` and `Freshness/external research` create redundant or near-synonymous homes. Mutation/read-back proof is also repeated under `Evidence`, `Baseline`, and `Touched resources and read-back`.
- **Preferred output: Alpha.** Alpha is more integrated, concise, and unambiguous, with no duplicated freshness field and fewer class-scan artifacts.

## T2

- **Alpha: fail.** Alpha preserves both ratified decisions, rationale, exact scope, baseline, mutation, rollback, and read-back. It nevertheless adds diagnostic-only fields (`Source`, `Inspected authorities`, and `Tracker overlap`) to an operational closeout. It also strengthens the supplied scope decision into the unsupported claim that issue #43 "was checked." Those additions violate the action-boundary requirement and introduce an invented inspection claim.
- **Beta: pass.** Beta preserves the two ratified decisions and rationales, operational context, finding, evidence, rejected operations, exact baseline, rollback, mutation, read-back, recommendation, scope boundary, and freshness. It does not add diagnostic-only obligations or unsupported facts.
- **Preferred output: Beta.** Beta is complete and keeps the recap in the operational class.

## T3

- **Alpha: pass.** All exact required labels are present, including explicit `N/A` values. The verdict, evidence, authorities, tracker disposition, rejected alternatives, recommendation, scope, research disposition, and freshness are factually complete and clearly distinguished. No material omission, redundancy, scope error, or invented fact is present.
- **Beta: pass.** All exact required labels are present, including explicit `N/A` values. The authoritative facts and distinctions are complete, with no material omission, redundancy, scope error, or invention.
- **Preferred output: tie.** The differences are stylistic and behavior is meaningfully equivalent.

## T4

- **Alpha: pass.** Alpha includes every exact required label, one baseline receipt, the exact local branch resource, the authorized rename, rollback, and read-back proof. It adds no diagnostic-template fields. The post-rename state is repeated in `Evidence`, `Mutation and read-back`, and `Baseline`, but the fields remain operational and the repetition does not omit or obscure any required fact.
- **Beta: pass.** Beta includes every exact required label, exactly one baseline receipt, the exact touched local branch ref, rollback, and exact read-back. It stays within the operational template and invents nothing.
- **Preferred output: Beta.** Beta separates pre-mutation evidence from touched-resource/read-back proof more cleanly and avoids Alpha's extra repetition in `Evidence`.

## T5

- **Alpha: pass.** Alpha uses one operationally framed recap, preserves the issue mutation and receipt, and carries the independent diagnostic source, section, verdict, evidence, authorities, tracker state, prep status, rejected alternatives, and supporting-skill result without reproducing a second complete diagnostic template. No material fact is omitted or invented.
- **Beta: pass.** Beta leads with the dominant operational recap, preserves the exact mutation proof, and incorporates the independent diagnostic verdict and evidence. The subordinate diagnostic metadata appears as supporting fields rather than a second complete recap. No material fact is omitted or invented.
- **Preferred output: Beta.** Beta makes the operational dominance slightly clearer and is more concise while preserving the same facts.

## Overall judgment

Neither output set wins under the rubric's constrained rule. Alpha is materially better on T1, but it is not noninferior on T2 because it introduces diagnostic-only obligations and an unsupported inspection claim there. Beta is materially better on T2 and modestly preferable on T4 and T5, but it is materially worse on T1 because it reproduces overlapping class templates and duplicate freshness fields. Both sets therefore have a material regression that prevents an overall win.
