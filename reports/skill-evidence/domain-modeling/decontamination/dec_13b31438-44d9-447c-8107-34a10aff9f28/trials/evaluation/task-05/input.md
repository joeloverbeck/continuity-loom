# Frozen input

Resolved discussion:

- Rename a private helper from `collectRows` to `collectFindingRows` so the implementation reads more clearly.
- Move its unit tests next to the validator module.
- Keep all public behavior, stored data, diagnostics, and API shapes unchanged.
- No product or app-layer concept received a new name or definition.
- No architectural ownership boundary, rejected alternative, trade-off, or durable consequence was decided.
- Existing glossary terms and ADRs remain accurate.

Caller recap shape:

```text
Supporting skill result: <domain-modeling outcome>
```
