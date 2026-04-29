# Contributing

## Branching

- Keep feature work on topic-specific branches.
- Open pull requests into `main`.
- Prefer small, reviewable changes over large mixed-scope branches.

Branch names must follow:

```text
type/kebab-case-description
```

Examples:

- `feat/milestone-1-scaffold`
- `fix/run-log-budget-status`
- `docs/command-reference-update`

Allowed branch prefixes:

- `feat`
- `fix`
- `chore`
- `docs`
- `refactor`
- `test`
- `ci`
- `release`
- `hotfix`

## Local Validation

Run the standard checks before opening a pull request:

```bash
npm ci
npm run typecheck
npm run build
npm run test
```

## Commit Convention

Commit messages must follow `type(scope): subject`.

Examples:

- `feat(cli): add init command defaults`
- `fix(core): preserve feature slug in run logs`
- `docs(workflow): clarify review gates`

Allowed scopes:

- `cli`
- `core`
- `shared`
- `repo`
- `docs`
- `prompts`
- `config`
- `ci`
- `release`
- `deps`
- `tests`
- `workflow`
- `features`

The repo enforces this with a local Husky `commit-msg` hook and a CI commitlint check.

## Branch Name Enforcement

The repo enforces branch naming with a local Husky `pre-push` hook and a CI branch-name check.

## Changes

- Update docs when behavior or commands change.
- Add or update tests for meaningful behavior changes.
- Record release-facing changes in `CHANGELOG.md`.

## Architecture Decisions

- Add or update an ADR in `docs/adr/` when a change introduces or revises a durable architectural decision.
- Write an ADR for decisions that affect module boundaries, runtime model, filesystem layout, workflow semantics, safety guarantees, or contributor expectations.
- Do not use ADRs for routine refactors, one-off bug fixes, or temporary implementation notes.
- Link related docs or implementation changes when they help explain the decision.

## Pull Requests

- Explain the user-visible impact.
- Note risks and follow-up work.
- Keep generated artifacts and sample outputs out of the PR unless they are intentional fixtures.
