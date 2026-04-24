# M2-04 - Structured Stories and Acceptance Criteria

## Goal
Make `plan` generate stable story and acceptance-criteria artifacts for downstream stages.

## Scope
- Add `Story` type
- Add `AcceptanceCriteria` type
- Update `plan` output
- Normalize story markdown format
- Detect missing or malformed acceptance criteria

## Expected Input
```bash
ec plan <feature-id>
```

## Reads
- `.ec/features/<feature-id>/feature.yaml`
- `.ec/features/<feature-id>/ideation.md`

## Writes
- `.ec/features/<feature-id>/plan.md`
- `.ec/features/<feature-id>/stories/*.md`
- `.ec/features/<feature-id>/implementation/tasks.md`
- `.ec/runs/<run-id>.json`

## Acceptance Criteria
- Each story has a user story block
- Each story has explicit numbered acceptance criteria
- Acceptance criteria are stable enough to map to BDD
- Malformed story or acceptance-criteria output is detectable

## Testing
- AC-backed tests for expected story structure
- Structural tests for parser and formatter
- Edge-case tests for missing acceptance criteria

## Output Contract Requirement
The command output must include:
- command name
- feature id where applicable
- input summary
- files read
- files written
- result status
- next recommended command
