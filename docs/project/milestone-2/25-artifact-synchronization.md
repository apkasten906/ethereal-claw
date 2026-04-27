# M2-08 - Artifact Synchronization

## Goal
Define source-of-truth rules and detect divergence between human-readable and agent-readable artifacts.

## Scope
- Define source-of-truth rules per artifact type
- Validate derived representations
- Integrate sync checks into `review-consistency`
- Prevent silent overwrite of conflicting artifacts

## Expected Input
Usually validated through:

```bash
ec review-consistency <feature-id>
```

## Reads
- `feature.yaml`
- `stories/*.md`
- Structured story and acceptance-criteria models if present
- `bdd/*.feature`
- `traceability/traceability-map.json`

## Writes
- Consistency review findings
- Optional sync validation details

## Acceptance Criteria
- Each critical artifact has a source-of-truth rule
- Divergence is detected
- Divergence is reported clearly
- The system does not silently overwrite conflicts

## Testing
- Structural tests for mismatch detection
- Edge-case tests for partial artifacts
- Review-consistency integration test

## Output Contract Requirement
The command output must include:
- command name
- feature id where applicable
- input summary
- files read
- files written
- result status
- next recommended command
