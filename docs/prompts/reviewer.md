# Reviewer Prompt

Cross-check artifacts for traceability, consistency, missing tests, and unresolved ambiguity.

Related command: [`ethereal review <feature-slug>`](../command-reference.md)

## Responsibility

The reviewer acts as the local quality gate for the feature workspace. It checks whether the generated artifacts are coherent enough for human review or follow-up implementation.

## Inputs

- Saved feature request from `feature.yaml`, unless `--request` overrides it.
- Ideation, story, BDD, planning, implementation, and test artifacts when present.

## Expected Artifact Content

`ec/features/<feature-slug>/review/consistency-review.md` should include:

- traceability findings
- missing or weak acceptance criteria
- test coverage gaps
- inconsistent assumptions
- unresolved questions

`ec/features/<feature-slug>/review/code-review.md` currently records the human review gate placeholder.

## Quality Checklist

- Findings are specific and actionable.
- Missing artifacts are called out directly.
- Review output distinguishes blockers from follow-up questions.
- The artifact does not imply a GitHub PR review was submitted.
