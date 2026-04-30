# ADR-0003: Keep workspace paths project-root relative

## Status

Accepted

## Context

The runtime workspace is configurable through the `workspace` block in `.ec/config/project.yaml`.

There are two plausible interpretations for paths like `configDirectory`, `featuresDirectory`, and `runsDirectory`:

1. resolve them relative to `workspace.rootDirectory`
2. resolve them relative to the project root, just like `workspace.rootDirectory`

Resolving child paths relative to `rootDirectory` sounds convenient, but it creates hidden coupling: changing `rootDirectory` can silently move other directories unless each one is read carefully.

The current implementation in `resolveWorkspacePaths(...)` resolves each configured path directly from the project root.

## Decision

Keep all configured workspace paths project-root relative.

That means:

- `rootDirectory` is resolved from the project root
- `configDirectory` is resolved from the project root
- `featuresDirectory` is resolved from the project root
- `runsDirectory` is resolved from the project root

Derived directories such as `cache` and `temp` continue to live under the resolved workspace root.

## Consequences

- Path behavior is explicit and predictable.
- Partial overrides remain stable. For example, changing only `rootDirectory` does not implicitly relocate `configDirectory`, `featuresDirectory`, or `runsDirectory`.
- Configuration files and tests should document this behavior so contributors do not assume child paths are rooted under `rootDirectory`.
- Backward-compatible utility signatures should be preserved when possible because workspace path resolution is used broadly across CLI, core, and tests.