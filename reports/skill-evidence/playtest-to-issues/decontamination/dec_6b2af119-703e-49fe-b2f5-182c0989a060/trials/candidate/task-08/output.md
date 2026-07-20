# Disposition

`invalid`

The declared prep contract version `99` is newer than the supported version `2`. The exact contract diagnostic is:

- Code: `PREP_CONTRACT_UNSUPPORTED_FUTURE_VERSION`
- Disposition: `invalid`
- Message: `Prep contract version 99 is newer than supported version 2.`

Stop custody. Do not reinterpret, migrate, rewrite, or downgrade the artifact; do not resolve its rows, publish issues, or invoke `/to-prd` from it.

## Producer-owned route

None is available. Intake returns `migrationInvocation: null`, so there is no producer invocation to run. The current consumer must not manufacture a downgrade route for an unknown future contract.
