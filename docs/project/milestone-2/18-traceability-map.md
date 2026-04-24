# M2-06 - Traceability Map

## Goal
Generate and validate `traceability/traceability-map.json`.

## Scope
- Define a traceability schema
- Generate `traceability-map.json`
- Link stories to acceptance criteria
- Link acceptance criteria to BDD
- Link stories to implementation tasks where possible
- Detect broken or missing links

## Expected Input
Usually generated during or after:

```bash
ec bdd <feature-id>
```

## Reads
- `.ec/features/<feature-id>/plan.md`
- `.ec/features/<feature-id>/stories/*.md`
- `.ec/features/<feature-id>/bdd/*.feature`
- `.ec/features/<feature-id>/implementation/tasks.md`

## Writes
- `.ec/features/<feature-id>/traceability/traceability-map.json`

## Acceptance Criteria
- Every acceptance criterion maps to at least one BDD scenario
- Orphaned stories, acceptance criteria, and scenarios are detectable
- Generated map is deterministic

## Testing
- Structural tests for graph generation
- Tests for missing references
- Tests for deterministic output

## Output Contract Requirement
The command output must include:
- command name
- feature id where applicable
- input summary
- files read
- files written
- result status
- next recommended command
