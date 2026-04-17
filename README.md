# ethereal-claw

CLI-first orchestration scaffold for an AI-assisted software development lifecycle.

## Status

Initial scaffold for `0.1.0`.

## Workspace

- `packages/cli`: command-line entrypoint
- `packages/core`: orchestration, artifacts, providers, agents, budget, logging
- `packages/shared`: shared types and constants
- `features/`: stable feature workspaces
- `runs/`: execution logs and run artifacts
- `docs/`: architecture, workflow, prompts, command reference

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

- `ethereal init`
- `ec init`
- `ethereal ideate "<request>"`
- `ec ideate "<request>"`
- `ethereal plan <feature-slug>`
- `ec plan <feature-slug>`
- `ethereal implement <feature-slug>`
- `ec implement <feature-slug>`
- `ethereal test <feature-slug>`
- `ec test <feature-slug>`
- `ethereal review <feature-slug>`
- `ec review <feature-slug>`
- `ethereal run <feature-slug>`
- `ec run <feature-slug>`

## Versioning

The project starts semantic versioning at `0.1.0`.

## GitHub Conventions

The repository includes standard GitHub automation for CI, releases, Dependabot, and issue or pull request templates under `.github/`.
