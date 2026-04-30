# ADR-0005: Keep BDD and review-consistency as local stages

## Status

Accepted

## Context

Milestone 2 expands the workflow with explicit `bdd` and `review-consistency` stages.

These stages operate on artifacts that already exist in the feature workspace:

- stories and acceptance criteria
- generated BDD scenarios
- traceability data
- consistency checks between related artifacts

Unlike ideation, planning, implementation, testing, and review drafting, these stages do not inherently require model-backed generation.

## Decision

Treat `bdd` and `review-consistency` as local, deterministic stages rather than provider-backed prompt stages.

Their responsibility is to transform and validate workspace artifacts already present on disk.

## Consequences

- Workflow documentation should describe these stages as local transformation and validation steps.
- These stages can run without invoking an LLM provider.
- Their behavior should be more stable and reproducible than prompt-driven stages.
- Any future move to make them model-backed should require a new ADR because it would change cost, determinism, and workflow expectations.