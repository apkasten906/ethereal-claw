# M2-07 - Consistency Review Stage

## Goal
Add `ec review-consistency` to detect lifecycle inconsistencies before implementation.

## Scope
- Add `review-consistency` workflow stage
- Add CLI command
- Generate `review/consistency-review.md`
- Check missing acceptance criteria, BDD coverage, ambiguity, non-testable acceptance criteria, and artifact drift

## Expected Input
```bash
ec review-consistency <feature-id>
```

## Reads
- `.ec/features/<feature-id>/feature.yaml`
- `.ec/features/<feature-id>/plan.md`
- `.ec/features/<feature-id>/stories/*.md`
- `.ec/features/<feature-id>/bdd/*.feature`
- `.ec/features/<feature-id>/traceability/traceability-map.json`

## Writes
- `.ec/features/<feature-id>/review/consistency-review.md`
- `.ec/runs/<run-id>.json`

## Acceptance Criteria
- Missing acceptance-criteria coverage is detected
- Missing BDD mappings are detected
- Non-testable acceptance criteria are flagged
- Artifact drift is reported

## Testing
- AC-backed tests for expected detection behavior
- Structural tests for partial or incomplete features
- Output tests for review report format

## Output Contract Requirement
The command output must include:
- command name
- feature id where applicable
- input summary
- files read
- files written
- result status
- next recommended command
