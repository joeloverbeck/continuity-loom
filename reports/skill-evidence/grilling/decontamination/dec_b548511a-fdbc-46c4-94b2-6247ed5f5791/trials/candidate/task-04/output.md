I’m treating this as a design/plan stress-test.

Explored fact: I evaluated only the immutable document at commit `557b9abb332de97b712abe129b5c09a7b4639e42` (blob `3ac49195c02d3f98af6daa2dfc7188ae86b99ba3`). Its completed, archived status is historical evidence about the plan shape—not authorization to revive it, and not proof of the current repository state.

Finding: the document is a sound integration spine but is not yet safe as a direct delegation brief. Phases 1–6 share one semantic chain—draft shape → normalization/defaulting → readiness candidate → blocker taxonomy → readiness DTO → UI controls—so assigning one agent per numbered phase would create handoff ambiguity. Phase 3 is even claimed by both later owning content specs. Phase 0 also mixes two different test purposes: permanent characterization/invariant coverage and intentionally red acceptance tests. Finally, governing-document amendments cannot simply wait until Phase 7 if existing authority conflicts with the intended behavior.

My working recommendation is to keep the phases as milestones while delegating through contract-bounded capability packets under one integration owner:

```text
authority + baseline gate
          ↓
core draft contract
          ↓
   ┌──────┴─────────┐
server persistence  compiler + validation semantics
   └──────┬─────────┘
      integration gate
          ↓
readiness DTO + API
          ↓
three-page web UX
          ↓
docs, full-suite proof, and demo smoke
```

The seams should be explicit:

- The core contract owner alone defines draft-vs-malformed input, normalization, deterministic `generation_context`, and the exact meaning of `GenerationSessionReadyCandidate`. If that type can still contain readiness blockers, the brief must say so; an agent must not infer semantics from its name.
- After that contract freezes, a server owner may implement save/snapshot adaptation while one core-semantics owner handles compiler empty states and validation taxonomy. Compiler and validation stay together because blank-vs-missing and first-segment-vs-continuation rules must come from one truth table.
- Those branches rejoin before readiness work. The readiness owner freezes the diagnostic DTO and endpoint contract before the web owner changes controls or presentation.
- Governing amendments, if required, occur before conflicting code. Detailed reference docs and user guidance are synchronized after behavior and API contracts stabilize.

I would require these verification gates:

1. **Authority/baseline:** identify current authorization and governing docs; record a green baseline; separate invariant tests that stay green from focused acceptance tests that fail for the intended reason. Stop on unrelated baseline failures.
2. **Core contract:** prove strict keys/enums/IDs, partial-draft tolerance, deterministic context defaulting, and blank/missing truth-table cases. No server or web fallback may duplicate the core default.
3. **Parallel branch join:** server tests prove save/readiness separation and prose/secret boundaries; compiler/validation tests prove every blocker category positively and negatively, warnings never block or enter prompts, and selected records do not over-trigger. Golden/fingerprint changes must be enumerated and limited to the intended contract change.
4. **Readiness API:** contract tests prove the four states—validation blockers, provider blockers, warnings, and unsaved draft—and prove label fallback, grouping, dedupe, and payload secrecy before UI work begins.
5. **UX:** all three pages consume the same readiness model; Preview and Generate differ only where specified; navigation/focus, stale-readiness, disclosure, and accessibility checks pass.
6. **Closeout:** active docs match verified behavior; lint, typecheck, tests, and build pass; the demo smoke produces evidence for every final-checklist invariant. An unavailable provider path is reported, not waved through.

A delegated agent should stop and escalate rather than improvise when active authority or authorization is absent; a frozen seam must change; a task crosses into another packet’s owned files or API; the plan does not enumerate a focus-tag mapping or other semantic rule; a schema change implies migration or compatibility behavior; a golden/fingerprint delta exceeds the declared change; any path risks accepted-prose inclusion, secret exposure, non-local binding, LLM validation, or branch/beat/drama-manager logic; or a gate fails for reasons outside the packet. Snapshot updates are never a substitute for explaining the delta.

Question 1: Should the numbered phases remain milestones rather than agent assignment boundaries? My recommendation (Recommended): yes—adopt the contract-frozen capability packets above, with one integration owner and one writer for each shared semantic seam. The document’s own outcome supports this shape: delivery ultimately ran through owning content specs rather than directly from the phase list. Do you agree?
