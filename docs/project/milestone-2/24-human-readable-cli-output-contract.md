# M2-03 - Human-Readable CLI Output Contract

## Goal
Make all commands easier to manually test and understand.

## Scope
- Define a reusable console output formatter
- Update commands to use consistent sections
- Preserve `--json` for automation
- Improve missing-input vs provider-failure messages

## Expected Input
Any command, for example:

```bash
ec ideate "Add first-class BDD workflow stage"
ec plan feature-add-bdd-stage
```

## Reads
- Varies by command; each command must report important files read

## Writes
- Varies by command; each command must report important files written

## Acceptance Criteria
- Every command has consistent default output
- JSON output remains available through `--json`
- Next recommended command is always shown
- Errors clearly identify missing input or invalid state

## Testing
- Snapshot tests for output formatting
- Unit tests for the formatter
- Regression test for `--json`

## Output Contract Requirement
The command output must include:
- command name
- feature id where applicable
- input summary
- files read
- files written
- result status
- next recommended command
