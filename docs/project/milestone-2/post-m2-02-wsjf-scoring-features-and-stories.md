# Add WSJF Scoring to Features and Stories

## Goal

Introduce WSJF (Weighted Shortest Job First) scoring to support prioritization of candidate features and stories.

## Description

Once features and stories are structurally stable, Ethereal-CLAW should support WSJF scoring as a default prioritization mechanism.

This should be:

- enabled by default
- non-blocking
- editable manually
- visible in status and planning output
- usable before AI-assisted scoring is introduced

This is intentionally deferred until after Milestone 2 / 0.3.0 so scoring is applied to stable feature and story artifacts.

## Scope

- Add WSJF fields to feature metadata
- Add WSJF fields to story metadata or structured story model
- Implement WSJF calculation
- Display WSJF in `ec status`
- Display WSJF in `ec plan` or planning summaries
- Allow manual values and overrides

## WSJF Fields

```text
businessValue
timeCriticality
riskReductionOrOpportunityEnablement
jobSize
wsjfScore
```

## Formula

```text
WSJF = (businessValue + timeCriticality + riskReductionOrOpportunityEnablement) / jobSize
```

## Applies To

- Candidate features
- Feature workspaces
- Stories

## Expected Input

Manual scoring example:

```yaml
wsjf:
  businessValue: 8
  timeCriticality: 5
  riskReductionOrOpportunityEnablement: 3
  jobSize: 4
  wsjfScore: 4.00
```

## Reads

- `.ec/features/<feature-id>/feature.yaml`
- `.ec/features/<feature-id>/stories/*.md`
- structured story metadata, if present

## Writes

- updated feature metadata with WSJF fields
- updated story metadata or structured representation with WSJF fields
- calculated `wsjfScore`

## CLI Output Requirements

WSJF should be visible but not noisy.

### `ec status`

Global status should show a compact priority view:

```text
Priority
- Highest WSJF: feature-bdd-stage (8.25)
- Missing WSJF: 2 features
```

Feature status should show:

```text
WSJF
- Business Value: 8
- Time Criticality: 5
- Risk Reduction / Opportunity Enablement: 3
- Job Size: 4
- Score: 4.00
```

Story-level status should show a ranked summary where useful:

```text
Stories by WSJF
1. 001-first-class-bdd-stage — 8.25
2. 002-remove-ideate-placeholder — 5.50
```

## Acceptance Criteria

- WSJF fields exist for features and stories
- WSJF score is calculated correctly
- Missing WSJF values are visible but do not block workflow execution
- CLI displays scores clearly
- Manual overrides are preserved

## Testing Requirements

### Structural

- correct WSJF calculation
- missing field handling
- divide-by-zero protection for `jobSize`
- manual override persistence

### System-level

- `ec status` displays feature WSJF
- `ec status <feature-id>` displays feature and story WSJF
- scoring does not prevent normal workflow execution

## Definition of Done

- WSJF scoring is available and visible
- WSJF is useful for prioritization decisions
- Missing scores are highlighted without blocking progress
- Workflow execution remains stable
