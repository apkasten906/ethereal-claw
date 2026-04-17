# Architecture

`ethereal-claw` keeps the orchestration engine independent from the user interface.

## Flow

1. The CLI parses a command and validates input.
2. The core orchestrator creates or reuses a feature workspace.
3. Agents produce artifacts through a provider abstraction.
4. Budget and token tracking are updated per workflow step.
5. Each run writes a stable JSON log under `runs/`.

## Packages

- `packages/cli`: CLI surface, command registration, console presentation.
- `packages/core`: workflow orchestration, agents, providers, artifacts, logging, config, git, budget.
- `packages/shared`: workflow stages and portable domain types.
