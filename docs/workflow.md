# Workflow

The workflow turns a rough request into auditable feature artifacts. The CLI is intentionally conservative: it generates plans, test guidance, and review artifacts, but it does not autonomously edit source code or merge changes.

For exact syntax and options, see the [command reference](command-reference.md).

## Stage Summary

| Stage | Command | Input | Main outputs | Prompt docs |
| --- | --- | --- | --- | --- |
| Ideate | `ethereal ideate "<request>"` | Rough feature request | Feature workspace, metadata, ideation, initial story, BDD placeholder | [Ideation](prompts/ideation.md), [Story writer](prompts/story-writer.md) |
| Plan | `ethereal plan <feature-slug>` | Existing feature workspace | `plan.md`, `implementation/tasks.md` | [Planner](prompts/planner.md) |
| Implement | `ethereal implement <feature-slug>` | Existing feature workspace | `implementation/change-summary.md` | [Implementer](prompts/implementer.md) |
| Test | `ethereal test <feature-slug>` | Existing feature workspace | `tests/test-plan.md`, `tests/generated-tests.md` | [Tester](prompts/tester.md) |
| Review | `ethereal review <feature-slug>` | Existing feature workspace | `review/consistency-review.md`, `review/code-review.md` | [Reviewer](prompts/reviewer.md) |

Each stage writes artifacts into a feature workspace and appends a run log entry under both `ec/runs/` and `ec/features/<feature-slug>/run-history/` by default.

## Ideate

`ideate` starts the workflow. It accepts a rough request, creates a stable feature slug, writes `feature.yaml`, and creates initial ideation, story, and BDD artifacts.

Use this stage when the feature does not already have a workspace.

## Plan

`plan` expands the feature request into planning artifacts for an existing workspace. It uses the saved request from `feature.yaml` unless `--request` is provided.

Use this stage after reviewing the initial ideation artifacts.

## Implement

`implement` generates implementation planning artifacts. In this scaffold it does not modify source files; it writes a file-level change plan for later human or agent-guided implementation.

Use this stage when the plan is clear enough to discuss concrete code changes.

## Test

`test` generates test planning artifacts and test candidates. It does not execute the repository test suite.

Use this stage to map acceptance criteria and planned changes to unit, integration, and manual test coverage.

## Review

`review` generates consistency and review artifacts. It is the final local quality gate in the scaffold.

Use this stage to identify missing traceability, ambiguous requirements, and follow-up review questions.

## Full Run

`ethereal run <feature-slug>` executes `plan`, `implement`, `test`, and `review` in order for an existing workspace. It intentionally skips `ideate` so existing feature metadata is not overwritten.

## Review Gates

The scaffold stops at review checkpoints and records unresolved questions instead of pretending to be fully autonomous.

The review artifacts are local files. They are not GitHub PR reviews and do not merge or deploy code.
