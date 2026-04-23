# Introduce structured stories and acceptance criteria

## Description
Upgrade story generation so that Ethereal-CLAW manages planning state explicitly and predictably.

Stories should become structured artifacts with clear acceptance criteria, so later stages such as `bdd`, `review-consistency`, `implement`, and `test` have reliable inputs. The goal is not to make planning more theoretical. The goal is to make the development lifecycle easier to manage from the beginning.

## Scope
- Define `Story` type
- Define `AcceptanceCriteria` type
- Refactor `plan()` output so it produces structured stories
- Normalize story markdown format as the human-readable version of that structured state
- Ensure the output can feed directly into the `bdd` stage

## Acceptance Criteria
- Each story contains:
  - a user story block
  - explicit numbered acceptance criteria
- Story output is deterministic and parseable
- Structured story output can be consumed directly by `bdd()`
- Ambiguous or incomplete acceptance criteria are detectable

## Testing Requirements

### Behavioral (AC-backed)
- Each acceptance criterion is testable
- Each acceptance criterion maps to at least one future BDD scenario

### Structural
- Story parsing and formatting functions behave correctly
- Invalid or missing acceptance criteria are detected
- Edge cases are handled safely

## Checklist
- [ ] define `Story` type
- [ ] define `AcceptanceCriteria` type
- [ ] update planning output shape
- [ ] normalize story markdown template
- [ ] validate deterministic output
- [ ] add tests for structure and parsing

## Definition of Done
- Structured stories are produced consistently
- Acceptance criteria are explicit and stable
- Story output is ready for downstream BDD generation
- Unit tests cover both normal and edge-case behavior
