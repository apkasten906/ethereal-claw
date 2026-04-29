# ADR-0002: Treat the test workspace as ESM

## Status

Accepted

## Context

The repository already leans ESM:

- TypeScript uses `module: NodeNext`
- `@ethereal-claw/core` is published with `"type": "module"`
- `@ethereal-claw/cli` is published with `"type": "module"`
- package code already uses `import.meta.url`

However, the `tests/` subtree did not have its own package boundary. Under `NodeNext`, that caused some test files to be interpreted as CommonJS, which in turn rejected `import.meta` even though the broader project direction is ESM.

One immediate workaround was to rewrite test files to use CommonJS-style path resolution such as `__dirname`, but that would move the tests away from the runtime model used by the packages themselves.

## Decision

Treat the `tests/` subtree as ESM by adding `tests/package.json` with:

```json
{
  "type": "module"
}
```

Tests should follow the same ESM conventions as the package code when practical.

## Consequences

- `import.meta.url` is valid in test files under `tests/`.
- Test code stays aligned with the runtime module system used by the shipped packages.
- CommonJS-style fallbacks in tests should be treated as tactical exceptions rather than the preferred direction.
- If editor diagnostics disagree with `tsc`, contributors should verify that the TypeScript language service has picked up the nested package boundary.