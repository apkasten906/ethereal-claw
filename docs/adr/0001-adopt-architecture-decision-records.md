# ADR-0001: Adopt Architecture Decision Records

## Status

Accepted

## Context

Project decisions have been getting made in milestone docs, pull requests, and implementation chat, but there has not been a stable place to record the decisions themselves.

That makes it hard to answer:

- why a direction was chosen
- whether a choice was intentional or incidental
- which decisions are still current after implementation evolves

The new `docs/adr/` directory was created to give these decisions a durable home.

## Decision

Use Architecture Decision Records under `docs/adr/` for project-level technical decisions.

The ADRs should capture:

- the context that created the decision
- the chosen direction
- the practical consequences for contributors

ADRs are for durable decisions, not changelog-style implementation notes.

## Consequences

- Future architectural choices should be recorded here when they affect project structure, module boundaries, runtime behavior, or contributor expectations.
- Existing milestone and workflow docs remain useful for planning and usage, but they are not the canonical place for long-lived decisions.
- The architecture doc should link to the ADR index so contributors can find the decision history quickly.