# Trial integrity ledger

## Excluded candidate T03 attempt

The first candidate T03 runner reported that a targeted issue-number search incidentally returned
matching lines from two unrelated `*-prd-prep.md` files. It did not open or rely on those files and
wrote no retained result, but the attempt was interrupted and excluded before validation because
the target skill forbids unrelated-report scanning. A fresh-context replacement was assigned the
same frozen task with repository searches constrained to code, active docs, tickets/specs, and
exact tracker reads. Only that replacement result may populate `trials/candidate/t03` or enter the
paired comparison.
