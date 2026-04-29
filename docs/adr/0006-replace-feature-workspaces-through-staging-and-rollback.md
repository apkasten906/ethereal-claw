# ADR-0006: Replace feature workspaces through staging and rollback

## Status

Accepted

## Context

Milestone 2 introduces stronger safety requirements around overwriting an existing feature workspace.

An overwrite is not just a single file write. It can affect:

- feature metadata
- generated artifacts across multiple stage directories
- feature-scoped run history

If replacement is done in place, a provider failure or filesystem error can leave the workspace half-written and harder to recover.

The implementation now has explicit support for:

- creating a staging workspace under the runtime temp directory
- moving an existing target workspace to a backup location before replacement
- promoting the staging workspace into place
- finalizing by deleting the backup
- rolling back by deleting the replacement and restoring the backup

Tests also cover failure cases where provider execution fails before commit and where backup cleanup fails after commit.

## Decision

Replace existing feature workspaces through a staging-and-rollback flow rather than by mutating the existing workspace in place.

The intended flow is:

1. create a complete replacement workspace in a staging directory
2. move the current workspace to a backup location if it exists
3. rename the staging workspace into the target location
4. finalize by removing the backup
5. if commit fails, restore the backup

If cleanup fails after the replacement has already been committed, keep the replacement workspace as the source of truth and surface the cleanup failure rather than trying to reverse a successful commit.

## Consequences

- Overwrite behavior is safer and more transactional from the user’s perspective.
- A failed overwrite should preserve the previously valid workspace.
- Temporary and backup directories become part of the runtime contract and should remain under the configured workspace temp area.
- Tests should continue to cover both rollback-on-failure and keep-replacement-on-post-commit-cleanup-failure scenarios.
- Future changes to overwrite semantics should update this ADR because they directly affect artifact safety guarantees.
