# Add review-consistency workflow stage and command

## Description
Introduce a `review-consistency` stage that validates whether the development state is coherent before implementation moves further.

This stage is about checking lifecycle integrity:
- are stories complete?
- are acceptance criteria testable?
- does BDD match the stories?
- are there missing traceability links?

It is a workflow validation stage, not a generic “review everything” bucket.

## Scope
- Add `review-consistency` to the workflow stage model
- Add CLI command: `ethereal review-consistency <feature-id>` / `ec review-consistency`
- Implement consistency review logic
- Generate `review/consistency-review.md`
- Integrate with the traceability map

## Acceptance Criteria
- Command produces a consistency review artifact
- Review identifies:
  - missing AC coverage
  - ambiguous or non-testable criteria
  - missing traceability links
  - mismatches between stories and BDD
- Feature stage updates to `review-consistency`
- Run history logs include the `review-consistency` stage

## Testing Requirements

### Behavioral (AC-backed)
- Missing AC → BDD mappings are detected
- Non-testable acceptance criteria are flagged
- BDD/story mismatches are flagged

### Structural
- Reviewer handles empty or partial data gracefully
- Output format is deterministic
- Stage transition and run logging behave correctly

## Checklist
- [ ] update workflow stage model
- [ ] create CLI command
- [ ] implement consistency review logic
- [ ] generate consistency review artifact
- [ ] integrate with traceability map
- [ ] update feature metadata
- [ ] add run log entry
- [ ] add tests for detection logic and edge cases

## Definition of Done
- `review-consistency` exists as a real workflow stage
- Review artifact is created predictably
- Major lifecycle inconsistencies are detected automatically
- The stage can be used as a human review gate before implementation proceeds
