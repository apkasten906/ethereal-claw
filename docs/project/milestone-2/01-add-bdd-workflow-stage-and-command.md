# Add BDD workflow stage and CLI command

## Description
Introduce a first-class `bdd` stage in the workflow.

Right now, `.feature` files are created as placeholder artifacts during `ideate()`. That makes the development state less clear than it should be. BDD should become its own explicit stage so the workflow reflects the real lifecycle of a feature.

This issue is about improving **state management and artifact discipline**, not inventing a new language.

## Scope
- Add `bdd` to the workflow stage model
- Add CLI command: `ethereal bdd <feature-id>` / `ec bdd`
- Add orchestrator method `bdd()`
- Move `.feature` generation out of `ideate()`
- Generate `.feature` files from structured story and acceptance-criteria inputs
- Update feature stage and run log

## Acceptance Criteria
- Running `ethereal bdd <feature-id>` generates `.feature` files
- No `.feature` files are created during `ideate()`
- Feature stage updates to `bdd`
- Run history logs include the `bdd` stage
- Re-running the command with the same inputs produces stable output

## Testing Requirements

### Behavioral (AC-backed)
- Each acceptance criterion produces at least one BDD scenario
- Generated `.feature` files are valid Gherkin and readable by humans

### Structural
- CLI command executes without error
- Orchestrator transitions correctly to `bdd`
- Artifact generation is deterministic for the same inputs

## Checklist
- [ ] update workflow stage model
- [ ] create `bdd-command.ts`
- [ ] wire CLI command
- [ ] add `bdd()` orchestrator method
- [ ] implement `.feature` generation
- [ ] remove placeholder BDD creation from `ideate()`
- [ ] update feature metadata
- [ ] add run log entry
- [ ] add tests for command behavior and stage transition

## Definition of Done
- `bdd` exists as a real workflow stage
- `.feature` files are created only in the `bdd` stage
- Stage transition and artifact creation are predictable
- Existing `ideate()` and `plan()` behavior is not broken
