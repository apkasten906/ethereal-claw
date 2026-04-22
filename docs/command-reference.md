# Command Reference

`ethereal` is the primary command and `ec` is the short alias. Both resolve to the same CLI. The package also exposes `ethereal-claw` as a binary name.

For local development inside the repo:

- Use `npm run ethereal -- <args>` or `npm run ec -- <args>` immediately.
- Use `npm run link:cli` after a build if you want bare `ethereal` and `ec` commands in your shell.

Related docs:

- [Workflow](workflow.md) describes the stage order and handoffs.
- [Architecture](architecture.md) describes package boundaries and runtime flow.
- [Prompt docs](prompts/ideation.md) describe the agent responsibilities behind each command.

## Shared Behavior

All workflow commands print JSON to stdout. Core logs are written to stderr so JSON output remains script-friendly.

Every stage writes a run log to both:

- `runs/<run-id>.json`
- `features/<feature-slug>/run-history/<run-id>.json`

`--dry-run` marks the run log as a dry run. In the current scaffold, stages still write their planned artifacts; the flag records intent and makes dry-run executions easy to identify in logs.

Commands after `ideate` require an existing feature workspace. The `--request` option only overrides the saved request text; it does not create a missing `features/<feature-slug>/feature.yaml`.

## `ethereal init`

Create baseline runtime directories and local configuration.

Syntax:

```bash
ethereal init
ec init
```

Creates or ensures:

- `features/`
- `runs/`
- `config/ethereal-claw.config.yaml`

If `config/ethereal-claw.config.yaml` already exists, the command leaves it unchanged.

Related docs:

- [Architecture](architecture.md)

## `ethereal ideate "<request>"`

Create a feature workspace from a rough request.

Syntax:

```bash
ethereal ideate "multi-tenant auth for admin portal"
ec ideate "multi-tenant auth for admin portal"
```

Options:

- `--dry-run`: mark the run log as a dry-run execution.

Writes:

- `features/<feature-slug>/feature.yaml`
- `features/<feature-slug>/ideation.md`
- `features/<feature-slug>/stories/001-initial-story.md`
- `features/<feature-slug>/bdd/001-initial.feature`
- run logs under `runs/` and `features/<feature-slug>/run-history/`

The feature slug is generated from the request with a `feature-` prefix unless the core API is called directly with an explicit slug.

Related docs:

- [Workflow: Ideate](workflow.md#ideate)
- [Ideation prompt](prompts/ideation.md)
- [Story writer prompt](prompts/story-writer.md)

## `ethereal plan <feature-slug>`

Generate planning artifacts for an existing feature workspace.

Syntax:

```bash
ethereal plan feature-auth-refresh
ec plan feature-auth-refresh
```

Options:

- `--request <request>`: override the saved request from `feature.yaml`.
- `--dry-run`: mark the run log as a dry-run execution.

Preconditions:

- `features/<feature-slug>/feature.yaml` must exist.
- If `--request` is omitted, `feature.yaml` must contain a non-empty `request`.

Writes:

- `features/<feature-slug>/plan.md`
- `features/<feature-slug>/implementation/tasks.md`
- run logs under `runs/` and `features/<feature-slug>/run-history/`

Related docs:

- [Workflow: Plan](workflow.md#plan)
- [Planner prompt](prompts/planner.md)

## `ethereal implement <feature-slug>`

Generate implementation planning artifacts for an existing feature.

Syntax:

```bash
ethereal implement feature-auth-refresh
ec implement feature-auth-refresh
```

Options:

- `--request <request>`: override the saved request from `feature.yaml`.
- `--dry-run`: mark the run log as a dry-run execution.

Preconditions:

- `features/<feature-slug>/feature.yaml` must exist.

Writes:

- `features/<feature-slug>/implementation/change-summary.md`
- run logs under `runs/` and `features/<feature-slug>/run-history/`

This command currently produces an implementation plan. It does not edit application source files.

Related docs:

- [Workflow: Implement](workflow.md#implement)
- [Implementer prompt](prompts/implementer.md)

## `ethereal test <feature-slug>`

Generate test planning artifacts for an existing feature.

Syntax:

```bash
ethereal test feature-auth-refresh
ec test feature-auth-refresh
```

Options:

- `--request <request>`: override the saved request from `feature.yaml`.
- `--dry-run`: mark the run log as a dry-run execution.

Preconditions:

- `features/<feature-slug>/feature.yaml` must exist.

Writes:

- `features/<feature-slug>/tests/test-plan.md`
- `features/<feature-slug>/tests/generated-tests.md`
- run logs under `runs/` and `features/<feature-slug>/run-history/`

This command generates test guidance. It does not run `npm run test`; use the npm script for the project test suite.

Related docs:

- [Workflow: Test](workflow.md#test)
- [Tester prompt](prompts/tester.md)

## `ethereal review <feature-slug>`

Generate review artifacts for an existing feature.

Syntax:

```bash
ethereal review feature-auth-refresh
ec review feature-auth-refresh
```

Options:

- `--request <request>`: override the saved request from `feature.yaml`.
- `--dry-run`: mark the run log as a dry-run execution.

Preconditions:

- `features/<feature-slug>/feature.yaml` must exist.

Writes:

- `features/<feature-slug>/review/consistency-review.md`
- `features/<feature-slug>/review/code-review.md`
- run logs under `runs/` and `features/<feature-slug>/run-history/`

This command creates local review artifacts. It does not submit a GitHub pull request review.

Related docs:

- [Workflow: Review](workflow.md#review)
- [Reviewer prompt](prompts/reviewer.md)

## `ethereal run <feature-slug>`

Run the non-coding feature workflow for an existing feature workspace.

Syntax:

```bash
ethereal run feature-auth-refresh
ec run feature-auth-refresh
```

Options:

- `--request <request>`: override the saved request from `feature.yaml` for all stages in this run.
- `--dry-run`: mark all generated run logs as dry-run executions.

Preconditions:

- `features/<feature-slug>/feature.yaml` must exist.
- Run `ideate` first for new feature requests.

Runs, in order:

1. `plan`
2. `implement`
3. `test`
4. `review`

`run` does not rerun `ideate`, so it does not recreate or overwrite `feature.yaml`.

Related docs:

- [Workflow](workflow.md)

## Artifact Map

Feature workspaces are stored under `features/<feature-slug>/`.

| Artifact | Created by | Purpose |
| --- | --- | --- |
| `feature.yaml` | `ideate` | Stable feature metadata: slug, title, request, status, timestamps. |
| `ideation.md` | `ideate` | Feature concept, assumptions, risks, and candidate stories. |
| `stories/001-initial-story.md` | `ideate` | Initial story draft. |
| `bdd/001-initial.feature` | `ideate` | Initial Gherkin-style BDD placeholder. |
| `plan.md` | `plan` | Planning output from the planner agent. |
| `implementation/tasks.md` | `plan` | Initial implementation task checklist. |
| `implementation/change-summary.md` | `implement` | File-level implementation plan and change summary. |
| `tests/test-plan.md` | `test` | Test strategy and coverage guidance. |
| `tests/generated-tests.md` | `test` | Generated test candidates or placeholders. |
| `review/consistency-review.md` | `review` | Traceability and consistency review. |
| `review/code-review.md` | `review` | Human review gate placeholder. |
| `run-history/<run-id>.json` | all stages | Per-feature run log copy. |
| `runs/<run-id>.json` | all stages | Global run log copy. |
