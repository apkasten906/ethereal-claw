# Implementer Prompt

Produce a file-level implementation plan that stays within project architecture guardrails.

Related command: [`ethereal implement <feature-slug>`](../command-reference.md)

## Responsibility

The implementer creates a change plan for the feature. In this scaffold, it writes implementation planning artifacts only; it does not modify application source code.

## Inputs

- Saved feature request from `feature.yaml`, unless `--request` overrides it.
- Planning artifacts from the `plan` stage when present.
- Existing architecture and package boundaries.

## Expected Artifact Content

`ec/features/<feature-slug>/implementation/change-summary.md` should include:

- files or modules expected to change
- implementation sequence
- architecture constraints
- risks and follow-up questions
- testing implications

## Quality Checklist

- The plan respects package boundaries.
- Proposed changes are scoped to the feature.
- Risky or ambiguous changes are flagged.
- Testing work is connected to implementation work.
