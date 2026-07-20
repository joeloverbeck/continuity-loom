## Recommendation

- **Category:** `bug`
- **State:** `needs-info`

The report describes broken behavior, but the claim is not currently reproducible. There is not enough evidence to distinguish a UI failure, validation rejection, local API failure, or provider/model error, so it is not ready for an agent. The supplied snapshot also does not establish whether this is a duplicate or a previously rejected request.

## Smallest useful questions

1. What exact sequence leads from opening the story to the failure, how often does it happen, and what validation messages or state are visible immediately before clicking **Generate**?
2. Which app version or commit, Node version, operating system/browser, provider, and model were in use?
3. What is the exact user-visible error? From the same failed attempt, please include the approximate timestamp and the corresponding **redacted** server diagnostic or error code.

Do not provide API keys, authorization headers, full prompts, generated candidates, accepted prose, or a full story-record payload. Any diagnostic should remove secrets and story content.

## What would make it verifiable

The report becomes verifiable when a triager can repeat the stated steps in a throwaway story using the reported environment, provider/model, and validation state, then correlate the visible failure with a redacted server diagnostic from the same attempt. If the failure depends on story state, a minimal synthetic reproduction containing no private story material would be sufficient. That evidence should make it possible to locate the failure at the UI, validation, local API, or provider boundary and reproduce it consistently enough to test a fix.
