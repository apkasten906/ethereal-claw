# Cleanup placeholder logic and enforce workflow integrity

## Description
Finalize Milestone 2 by removing temporary scaffold behavior and enforcing correct lifecycle progression across the workflow.

This issue should focus on **system integrity**, not on adding new feature behavior. It is the right place for regression tests, end-to-end tests, stage validation, and enforcement rules.

## Scope
- Remove placeholder logic that no longer belongs in the workflow
- Enforce valid stage transitions
- Enforce required artifact presence before advancing
- Add regression tests
- Add end-to-end tests for the full Milestone 2 path

## Explicitly Out of Scope
- New story-level feature behavior
- New acceptance criteria
- New feature-specific unit tests derived from stories

Those belong in the issues where the stories and AC are introduced.

## Acceptance Criteria
- No placeholder lifecycle artifacts remain in the wrong stage
- Invalid stage transitions fail
- Missing required artifacts prevent advancement
- Full Milestone 2 flow runs successfully end to end

## Testing Requirements

### Behavioral (AC-backed)
- Not applicable for new behavior in this issue

### Structural / System-level
- Regression tests validate existing behavior
- End-to-end tests validate:
  - `ideate -> plan -> bdd -> review-consistency`
- Stage transition validation is covered
- Traceability enforcement is covered

## Checklist
- [ ] remove obsolete placeholder logic
- [ ] enforce stage validation rules
- [ ] enforce required artifact checks
- [ ] add regression tests
- [ ] add end-to-end workflow test
- [ ] validate traceability enforcement
- [ ] validate review gating behavior

## Definition of Done
- Placeholder logic has been removed
- Workflow stages enforce correct order
- Regression and end-to-end tests pass
- The Milestone 2 lifecycle behaves consistently and predictably
