# Command Reference

`ethereal` is the primary command and `ec` is the short alias. Both resolve to the same CLI.

For local development inside the repo:

- Use `npm run ethereal -- <args>` or `npm run ec -- <args>` immediately.
- Use `npm run link:cli` after a build if you want bare `ethereal` and `ec` commands in your shell.

## `ethereal init`

Creates baseline runtime directories and local example configuration if needed.

## `ethereal ideate "<request>"`

Creates a feature workspace, writes `feature.yaml` and `ideation.md`, and records a run log.

## `ethereal plan <feature-slug>`

Writes planning artifacts for an existing feature workspace.

## `ethereal implement <feature-slug>`

Writes implementation planning artifacts.

## `ethereal test <feature-slug>`

Writes test planning artifacts.

## `ethereal review <feature-slug>`

Writes review artifacts and unresolved questions.

## `ethereal run <feature-slug>`

Executes the end-to-end non-coding workflow sequence for a feature.
