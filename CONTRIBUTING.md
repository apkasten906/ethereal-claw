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

## Changes

- Update docs when behavior or commands change.
- Add or update tests for meaningful behavior changes.
- Record release-facing changes in `CHANGELOG.md`.

## Pull Requests

- Explain the user-visible impact.
- Note risks and follow-up work.
- Keep generated artifacts and sample outputs out of the PR unless they are intentional fixtures.
