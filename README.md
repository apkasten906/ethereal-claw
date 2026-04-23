# ethereal-claw

CLI-first orchestration scaffold for an AI-assisted software development lifecycle.

## Status

Initial scaffold for `0.1.0`.

## Workspace

- `packages/cli`: command-line entrypoint
- `packages/core`: orchestration, artifacts, providers, agents, budget, logging
- `packages/shared`: shared types and constants
- `.ec/features/`: stable feature workspaces
- `.ec/runs/`: execution logs and run artifacts
- `docs/`: architecture, workflow, prompts, command reference

## Documentation

- [Command reference](docs/command-reference.md): exact CLI syntax, options, preconditions, and artifacts.
- [Workflow](docs/workflow.md): stage order, handoffs, review gates, and artifact flow.
- [Architecture](docs/architecture.md): package boundaries and runtime flow.
- Prompt docs: [ideation](docs/prompts/ideation.md), [story writer](docs/prompts/story-writer.md), [planner](docs/prompts/planner.md), [implementer](docs/prompts/implementer.md), [tester](docs/prompts/tester.md), and [reviewer](docs/prompts/reviewer.md).

## Quick Start

```bash
npm install
npm run build
npm run test
npm run cli -- ideate "multi-tenant auth for admin portal"
```

Installed binaries:

- `ethereal`
- `ec`
- `ethereal-claw`

## Local CLI Use

Immediate repo-local execution:

```bash
npm run ethereal -- ideate "multi-tenant auth for admin portal"
npm run ec -- plan feature-auth-refresh
```

To enable bare local commands in your shell:

```bash
npm run build
npm run link:cli
ethereal --help
ec --help
```

To remove the global link later:

```bash
npm run unlink:cli
```

## Commands

`ethereal` is the primary command and `ec` is the short alias. The repo also exposes `ethereal-claw` as a binary name.

| Command | Purpose |
| --- | --- |
| `ethereal init` | Create baseline runtime directories and local config. |
| `ethereal ideate "<request>"` | Create a feature workspace from a rough request. |
| `ethereal plan <feature-slug>` | Generate planning artifacts for an existing feature. |
| `ethereal implement <feature-slug>` | Generate an implementation plan without modifying source code. |
| `ethereal test <feature-slug>` | Generate test planning artifacts; this does not run the project test suite. |
| `ethereal review <feature-slug>` | Generate review artifacts and unresolved questions. |
| `ethereal run <feature-slug>` | Run `plan`, `implement`, `test`, and `review` for an existing feature. |

See the [command reference](docs/command-reference.md) for syntax, options, outputs, and related workflow documentation.

## Versioning

The project starts semantic versioning at `0.1.0`.

## GitHub Conventions

The repository includes standard GitHub automation for CI, releases, Dependabot, and issue or pull request templates under `.github/`.

## Commit Conventions

Commits use a scoped conventional commit format:

```text
type(scope): subject
```

Example:

```text
feat(cli): add ideate dry-run support
```

Local enforcement is installed through Husky on `npm install`, and CI validates commit messages in GitHub as well.

## Branch Conventions

Branches use this format:

```text
type/kebab-case-description
```

Example:

```text
feat/milestone-1-scaffold
```

Allowed prefixes are `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `ci`, `release`, and `hotfix`.

Local enforcement runs in a Husky `pre-push` hook, and CI validates branch names in GitHub.
