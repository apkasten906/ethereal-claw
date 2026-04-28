# Workflow

The workflow turns a rough request into auditable feature artifacts. The CLI is intentionally conservative: it generates plans, test guidance, and review artifacts, but it does not autonomously edit source code or merge changes.

For exact syntax and options, see the [command reference](command-reference.md).

## Stage Summary

| Stage | Command | Input | Main outputs | Prompt docs |
| --- | --- | --- | --- | --- |
| Ideate | `ethereal ideate "<request>"` | Rough feature request | Feature workspace, metadata, ideation | [Ideation](prompts/ideation.md) |
| Plan | `ethereal plan <feature-slug>` | Existing feature workspace | `plan.md`, `stories/*.md`, `implementation/tasks.md` | [Planner](prompts/planner.md), [Story writer](prompts/story-writer.md) |
| BDD | `ethereal bdd <feature-slug>` | Planned feature workspace | `bdd/*.feature`, `traceability/traceability-map.json` | [Story writer](prompts/story-writer.md) |
| Review Consistency | `ethereal review-consistency <feature-slug>` | Planned + BDD feature workspace | `review/consistency-review.md` | [Reviewer](prompts/reviewer.md) |
| Implement | `ethereal implement <feature-slug>` | Existing feature workspace | `implementation/change-summary.md` | [Implementer](prompts/implementer.md) |
| Test | `ethereal test <feature-slug>` | Existing feature workspace | `tests/test-plan.md`, `tests/generated-tests.md` | [Tester](prompts/tester.md) |
| Review | `ethereal review <feature-slug>` | Existing feature workspace | `review/code-review.md` | [Reviewer](prompts/reviewer.md) |

Each stage writes artifacts into a feature workspace and appends a run log entry under both `.ec/runs/` and `.ec/features/<feature-slug>/run-history/` by default.

Use `ethereal status` or `ec status` to list known feature workspaces and their next recommended commands. Use `ec status <feature-slug>` for a feature-specific view of current stage, available artifacts, missing artifacts, latest run result, and token usage. Status reads local workspace files only and does not call an LLM provider.

## Ideate

`ideate` starts the workflow. It accepts a rough request, creates a stable feature slug, writes `feature.yaml`, and creates the initial ideation artifact.

Use this stage when the feature does not already have a workspace.

## Plan

`plan` expands the feature request into planning artifacts for an existing workspace. It uses the saved request from `feature.yaml` unless `--request` is provided and produces the structured story artifact that later stages validate.

Use this stage after reviewing the initial ideation artifacts.

## BDD

`bdd` converts the structured story artifact into Gherkin scenarios and a traceability map.

Use this stage after the plan and story artifact are in place.

## Review Consistency

`review-consistency` validates the structured story, BDD, and traceability artifacts before implementation planning.

Use this stage to catch artifact drift, missing mappings, and non-testable acceptance criteria.

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

`ethereal run <feature-slug>` executes `plan`, `bdd`, `review-consistency`, `implement`, `test`, and `review` in order for an existing workspace. It intentionally skips `ideate` so existing feature metadata is not recreated.

## Review Gates

The scaffold stops at review checkpoints and records unresolved questions instead of pretending to be fully autonomous.

The review artifacts are local files. They are not GitHub PR reviews and do not merge or deploy code.
