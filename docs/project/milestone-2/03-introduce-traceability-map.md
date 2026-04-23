# Introduce traceability map between lifecycle artifacts

## Description
Create a machine-readable traceability artifact that links planning state across the workflow.

The purpose is to help Ethereal-CLAW manage feature state clearly from one stage to the next. This is about lifecycle visibility and validation: plan → story → acceptance criteria → BDD → implementation tasks.

## Scope
- Add `traceability/traceability-map.json`
- Map:
  - plan → stories
  - stories → acceptance criteria
  - acceptance criteria → BDD scenarios
  - stories → implementation tasks
- Ensure missing links are detectable

## Acceptance Criteria
- A traceability map is generated for each feature
- Each story includes its linked acceptance criteria
- Each acceptance criterion is traceable to at least one BDD scenario
- Each story can be linked to implementation tasks where applicable
- Missing or broken links are detectable

## Testing Requirements

### Behavioral (AC-backed)
- Every acceptance criterion appears in at least one BDD scenario

### Structural
- Traceability map generation is deterministic
- Invalid references are detected
- Missing links are flagged clearly
- Orphaned artifacts are detectable

## Checklist
- [ ] define traceability map structure
- [ ] create generation logic
- [ ] link stories to AC
- [ ] link AC to BDD
- [ ] link stories to implementation tasks
- [ ] persist artifact to disk
- [ ] validate integrity rules
- [ ] add tests for map generation and validation

## Definition of Done
- Traceability map exists and is correct
- Broken or missing links are surfaced automatically
- The map can be used by later review and enforcement stages
