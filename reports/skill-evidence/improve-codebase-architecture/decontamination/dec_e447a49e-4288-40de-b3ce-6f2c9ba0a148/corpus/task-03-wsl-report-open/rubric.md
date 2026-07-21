# Comparison rubric

- Uses the environment-appropriate WSL opener rather than treating generic
  Linux detection as sufficient.
- Does not wait on or repeatedly retry the ineffective opener.
- Prints the exact absolute report path even when opening succeeds.
- Reports browser render verification as unavailable rather than implying it
  happened.
- Preserves the report as scratch outside the repository and ends with the
  candidate-selection checkpoint.
