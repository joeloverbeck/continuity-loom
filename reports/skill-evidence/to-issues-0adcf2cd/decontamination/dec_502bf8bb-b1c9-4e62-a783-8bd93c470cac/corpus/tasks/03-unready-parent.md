# Task 03 — unready parent

## Raw prompt
Break issue #127 into implementation issues and publish them now. Treat this message as approval to publish if the work is ready.

## Inputs

- `../inputs/issue-127.json`
- The named shared active-spec/compiler change-control owner has not been assigned.
- No additional maintainer decision is present in comments.

## Success observations

The response must recognize that publication approval does not supply the missing technical/ownership decision. It should stop without fabricating a dependency graph or tracker writes, state the indispensable missing input precisely, and give a clean re-entry condition.

