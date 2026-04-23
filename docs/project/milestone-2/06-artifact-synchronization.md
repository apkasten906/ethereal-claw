# Enforce Artifact Synchronization (Human vs Agent)

## Description
Ensure all critical artifacts remain synchronized between:
- Human-readable forms (Markdown, .feature)
- Agent-readable forms (JSON, YAML, typed models)

As Ethereal-CLAW evolves, divergence between these representations can cause:
- incorrect agent behavior
- misleading human reviews
- broken traceability

This issue introduces rules and mechanisms to keep both representations consistent.

## Scope

- Define source-of-truth rules for each artifact type
- Implement sync validation checks
- Add validation to `review-consistency` stage
- Detect and flag divergence between formats

### Example decisions

- Stories:
  - Source of truth: structured type
  - Markdown: projection

- Traceability:
  - Source of truth: JSON
  - Markdown (optional): summary

- BDD:
  - Source of truth: `.feature`
  - Agent model: parsed representation

## Acceptance Criteria

- Each artifact has a defined source of truth
- System detects mismatches between representations
- Divergence is reported in `review-consistency`
- System does not silently overwrite conflicting data

## Testing Requirements

### Structural
- Sync checks detect mismatches
- Partial or missing data handled gracefully

### System-level
- Sync validation runs during `review-consistency`
- End-to-end workflow fails if critical divergence exists

## Checklist

- [ ] define synchronization rules per artifact
- [ ] implement validation logic
- [ ] integrate into consistency review stage
- [ ] add test coverage for mismatch detection
- [ ] document synchronization behavior

## Definition of Done

- Clear source-of-truth rules exist
- Divergence is detectable and reported
- Workflow enforces synchronization integrity
