# Child-family closeout

Use this for any parent PRD, parent-linked child, two or more siblings, or shared closeout evidence.

## Shared evidence and ordering

Choose the durable audit anchor in the scope ledger. A parent rollup may carry shared final-SHA, verification, TDD, review, browser, and exact acceptance evidence. For siblings with no parent, default to the lowest issue number unless authority says otherwise.

Sequence:

1. Build and inspect the exact shared body with the manifest/scaffold helpers in `closeout-templates.md`.
2. Run every applicable validator, ending with implement `--emit-preflight --mutation-ready`.
3. Post the body, capture its URL, and verify the stored bytes with `verify-github-comment-body.mjs`.
4. Make every child/sibling close comment cite that verified URL. Inspect the exact comment text before use.
5. Close only issues whose own rows are all satisfied. Exact-read every affected issue state.
6. Record exact child CLOSED states in durable parent evidence, then close the parent only if all related blockers/children permit it.
7. Exact-read parent and children again before final response.

Never close a parent because a broad skeleton exists, infer child state from search output, or vary a fixed child comment after inspecting it.

For a fixed-template child comment, after the real rollup URL exists, make this exact final text visible before the first close command and use it unchanged:

```text
Completed by <sha>. Evidence: <verified rollup URL>
```

## Oversized evidence

If `build-closeout-body.mjs --size-plan --require-headroom` reports low headroom or exceeds the tracker ceiling, use the split-core workflow in `closeout-templates.md`:

- partition the full completed manifest/audit into disjoint subsets;
- post and exact-read a pre-index shared core that claims only its subset;
- build, validate, post, and exact-read every linked audit chunk;
- patch the core with the verified HTTPS chunk index, revalidate final-index state, and exact-read it again;
- only then cite the indexed core in close comments.

No body may claim rows owned by another subset. Linked chunks do not repeat or reinterpret the core's TDD, review, browser, identity, or preflight evidence.

## Mutation ambiguity

If a post/close command reports success but readback fails, preserve its output and returned URL. Retry only the exact read-only lookup. Replay a mutation only after readback proves it did not take effect; otherwise report the state unverified and keep dependent parent closeout blocked.
