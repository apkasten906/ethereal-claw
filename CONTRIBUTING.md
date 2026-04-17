# Contributing

## Branching

- Keep feature work on topic-specific branches.
- Open pull requests into `main`.
- Prefer small, reviewable changes over large mixed-scope branches.

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

## Changes

- Update docs when behavior or commands change.
- Add or update tests for meaningful behavior changes.
- Record release-facing changes in `CHANGELOG.md`.

## Pull Requests

- Explain the user-visible impact.
- Note risks and follow-up work.
- Keep generated artifacts and sample outputs out of the PR unless they are intentional fixtures.
