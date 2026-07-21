# Paired evaluation

## Preference

**Tie.** Both responses satisfy the frozen rubric to essentially the same degree. A has a slightly clearer deletion-test explanation and an explicit statement that it stopped before grilling or implementation; B has slightly clearer scope/verification organization and more explicit reporting of unsupported operations. Neither difference is material enough to prefer one output.

## Rubric coverage

| Rubric requirement | A | B |
| --- | --- | --- |
| Consult both glossary surfaces and relevant ADRs; preserve unrelated dirt | Covered. It says dossier authorities and domain facts were consumed, applies ADR 0004, uses ADR 0007 to reject Capture, and explicitly leaves both unrelated dirty files untouched. It does not name the two glossary surfaces individually, but its domain-noun usage is consistent with consulting them. | Covered. It says the supplied domain vocabulary and both ADR constraints were checked, applies ADR 0004 and ADR 0007, and explicitly preserves both unrelated dirty files. It likewise does not name the two glossary surfaces individually. |
| Respect no-delegation policy and scan locally | Covered. It explicitly says delegation was not used because the invocation did not authorize it. | Covered. It explicitly says no Explore subagent was authorized and the review was performed directly from the dossier. |
| Verify promoted friction at concrete call sites; do not promote the presentation mapper merely for shallowness | Covered. It names `projectNextDryOut` and `projectWashRefill`, checks their UI callers and engine tests, identifies the three duplicated rule groups, and rejects `wash-plan.ts` after applying the deletion test. Its deletion-test account is especially clear: consolidate the two internal implementations while retaining both public entry points. | Covered. It names the same two public functions, checks UI call sites and the engine test surface, identifies the same duplicated rule groups, and rejects `wash-plan.ts`. The sentence about “removing either duplicated calculation path” is a little imprecise because deletion is safe only after consolidation, but the surrounding explanation makes the intended test clear. |
| Produce an outside-repo HTML deliverable with only grounded surviving cards; no padding | Covered as fixture simulation. It supplies an absolute `/tmp` HTML path, reports one grounded candidate card, and explains why the other candidates were screened out. | Covered as fixture simulation. It supplies the same absolute `/tmp` HTML path, reports one grounded candidate card, and explains why the other candidates were screened out. |
| Use domain and architecture vocabulary accurately; include before/after visuals and a top recommendation | Covered. Harbor-specific Shelf/Wash/Dry-out/Capture vocabulary and module/interface/deeper seam/leverage/locality language are accurate. It describes a before/after call-graph collapse and names a top recommendation. “Adapter” is not used explicitly, but no adapter claim is needed for the surviving candidate. | Covered. The same domain nouns and module/interface/deep seam/leverage/locality language are accurate. It describes both before and after diagrams and names a top recommendation. “Adapter” is also not used explicitly. |
| Do not implement or design the recommendation's interface; stop at candidate selection | Covered. It preserves the two existing public functions, gives no signature or interface design, reports no product/doc changes, asks the explicit selection question, and explicitly says it stopped before grilling or implementation. | Covered. It preserves the existing public functions, gives no signature or interface design, reports no repository changes, and ends the user-facing portion at the explicit selection question. Later verification prose does not cross into implementation. |
| State browser rendering was unavailable and provide absolute report path | Covered. It gives the absolute path and says the opener was not dispatched because browser/GUI automation was unavailable. | Covered. It gives the absolute path, says visible browser opening was unavailable, supplies the detached opener command, and accurately reports that opener/rendering were not performed. |

## Regression assessment

Neither output contains a material or severe regression.

- **Core stage boundaries:** Both stop at candidate selection. Neither grills, implements, edits product files, or invents a public interface.
- **Safety and authority:** Both preserve unrelated dirt and use ADR 0004 as endorsement while using ADR 0007 to reject a false Capture-boundary finding.
- **Evidence:** Both ground the sole promoted card in named engine functions, duplicated responsibilities, caller/test surfaces, and screened-out alternatives. Neither fabricates line numbers. B's deletion-test wording is mildly less exact, but not materially misleading in context.
- **Delegation:** Both obey the active no-delegation policy.
- **Opener behavior:** Both report the unavailable browser/render path honestly and still provide the absolute report path. Neither falsely claims visible verification.

The only shared minor omission is that neither response explicitly names the two glossary surfaces or uses the word “adapter.” Their demonstrated vocabulary and authority use nevertheless cover the substantive requirement, and introducing an adapter where none is evidenced would be worse than omitting the label.
