# Tester Prompt

Generate unit, integration, and manual testing guidance mapped back to acceptance criteria.

Related command: [`ethereal test <feature-slug>`](../command-reference.md)

## Responsibility

The tester maps planned behavior and implementation work to validation coverage. It should identify meaningful automated and manual checks without claiming tests have been executed.

## Inputs

- Saved feature request from `feature.yaml`, unless `--request` overrides it.
- Story, BDD, planning, and implementation artifacts when present.

## Expected Artifact Content

`ec/features/<feature-slug>/tests/test-plan.md` should include:

- unit test candidates
- integration test candidates
- manual validation checklist
- acceptance-criteria mapping
- known coverage gaps

`ec/features/<feature-slug>/tests/generated-tests.md` should include generated test candidates or placeholders for later implementation.

## Quality Checklist

- Each acceptance criterion has at least one validation path.
- Automated and manual checks are clearly separated.
- Gaps are explicit.
- The artifact does not imply tests were run by the command.
