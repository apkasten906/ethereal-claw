# M2-09 - Cleanup and Workflow Enforcement

## Goal
Remove placeholder logic, enforce workflow integrity, and add regression and end-to-end coverage.

## Scope
- Remove obsolete placeholder logic
- Enforce valid stage transitions
- Enforce required artifact presence
- Add regression tests
- Add an end-to-end workflow test

## Expected Input
Representative workflow:

```bash
ec ideate "Add first-class BDD workflow stage"
ec plan <feature-id>
ec bdd <feature-id>
ec review-consistency <feature-id>
```

## Reads
- Full feature workspace state
- `.ec/config`
- Run history as needed

## Writes
- No new feature-behavior artifacts beyond normal workflow outputs

## Acceptance Criteria
- No placeholder BDD generation remains in `ideate`
- Invalid stage transitions fail clearly
- Missing required artifacts fail clearly
- Full Milestone 2 workflow passes end to end

## Testing
- Regression tests for existing commands
- End-to-end test for `ideate -> plan -> bdd -> review-consistency`
- No new feature-level unit tests unless tied to existing acceptance criteria

## Output Contract Requirement
The command output must include:
- command name
- feature id where applicable
- input summary
- files read
- files written
- result status
- next recommended command
