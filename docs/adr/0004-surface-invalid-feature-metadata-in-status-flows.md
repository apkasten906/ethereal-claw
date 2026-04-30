# ADR-0004: Surface invalid feature metadata in status flows

## Status

Accepted

## Context

The `status` command reads feature workspaces directly from the filesystem to report current stage, artifacts, run results, and next steps.

An early implementation treated many failures during feature inspection as skippable and returned `null`. That kept the command resilient to missing directories, but it also risked hiding real problems such as malformed `feature.yaml` metadata.

Silent omission is the wrong failure mode for corrupted project state because it makes the workspace appear healthier than it is.

## Decision

Status flows should only suppress expected missing-path cases such as `ENOENT`.

They should rethrow invalid feature metadata and other unexpected errors so contributors can detect and repair broken workspaces instead of silently losing visibility.

## Consequences

- Missing features can still be handled cleanly as normal control flow.
- Corrupted metadata is treated as a real project problem, not as an invisible skip.
- Tests should cover malformed metadata so future refactors do not reintroduce silent failure behavior.
- CLI output may fail louder in broken states, but that is preferable to false confidence.