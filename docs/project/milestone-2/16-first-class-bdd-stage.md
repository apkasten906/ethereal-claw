# M2-05 - First-Class BDD Stage

## Goal
Move BDD generation into `ec bdd` and remove `.feature` generation from `ideate()`.

## Scope
- Add `bdd` workflow stage
- Add `ec bdd <feature-id>`
- Add orchestrator `bdd()` method
- Generate `.feature` files from stories and acceptance criteria
- Remove placeholder BDD creation from `ideate`

## Expected Input
```bash
ec bdd <feature-id>
```

## Reads
- `.ec/features/<feature-id>/feature.yaml`
- `.ec/features/<feature-id>/plan.md`
- `.ec/features/<feature-id>/stories/*.md`

## Writes
- `.ec/features/<feature-id>/bdd/*.feature`
- `.ec/runs/<run-id>.json`

## Acceptance Criteria
- `ec bdd <feature-id>` generates `.feature` files
- `ideate` no longer writes `.feature` files
- The same input produces stable output
- Missing stories produce a clear failure message

## Testing
- AC-backed tests for BDD generation
- Structural tests for stage transition
- Regression test confirming `ideate` does not write BDD

## Output Contract Requirement
The command output must include:
- command name
- feature id where applicable
- input summary
- files read
- files written
- result status
- next recommended command
