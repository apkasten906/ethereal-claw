# Add `ec status` command for workflow visibility

## Description
Introduce a `status` command to provide a quick, human-readable overview of the current development state.

As workflows become multi-step and artifact-driven, it becomes harder for users to quickly understand:
- where a feature is in the lifecycle
- what has been generated
- what is missing
- what should happen next

The `ec status` command acts as a lightweight orientation tool.

## Scope

- Add CLI command:
  - `ethereal status`
  - `ec status`
- Support:
  - `ec status` (global overview)
  - `ec status <feature-id>` (feature-specific view)

### Output should include:

For a specific feature:
- feature name / id
- current workflow stage
- list of available artifacts (plan, stories, bdd, review, etc.)
- missing expected artifacts for current stage
- last run timestamp
- last run result (success/failure)
- next recommended command

Optional (nice to have):
- token usage summary from last run

## Acceptance Criteria

- Running `ec status` shows a list of known features
- Running `ec status <feature-id>` shows:
  - current stage
  - available artifacts
  - missing artifacts
  - last run summary
  - recommended next step
- Output is readable and consistent
- Works without requiring LLM calls

## Testing Requirements

### Structural
- Command runs without error
- Handles missing features gracefully
- Handles partially completed features

### System-level
- Works correctly after each stage:
  - ideate
  - plan
  - bdd
  - review-consistency

## Checklist

- [ ] add `status-command.ts`
- [ ] wire CLI command
- [ ] read feature metadata (`feature.yaml`)
- [ ] inspect artifact directories
- [ ] compute missing artifacts
- [ ] generate readable console output
- [ ] add unit tests for parsing and output
- [ ] add integration test for end-to-end workflow visibility

## Definition of Done

- Users can run `ec status` to orient themselves quickly
- Users can run `ec status <feature-id>` to understand exact lifecycle state
- No dependency on LLM providers
- Output is stable and helpful for manual workflow navigation
