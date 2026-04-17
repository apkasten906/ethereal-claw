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

## Commands

- `ethereal-claw init`
- `ethereal-claw ideate "<request>"`
- `ethereal-claw plan <feature-slug>`
- `ethereal-claw implement <feature-slug>`
- `ethereal-claw test <feature-slug>`
- `ethereal-claw review <feature-slug>`
- `ethereal-claw run <feature-slug>`

## Versioning

The project starts semantic versioning at `0.1.0`.

## GitHub Conventions

The repository includes standard GitHub automation for CI, releases, Dependabot, and issue or pull request templates under `.github/`.
