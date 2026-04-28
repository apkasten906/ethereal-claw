# Support Solution/Application/Platform-Level Ideation

## Goal

Allow `ec ideate` to capture higher-level concepts such as a solution, application, or platform instead of forcing immediate feature-level scoping.

## Description

The current workflow assumes:

```text
feature -> stories -> acceptance criteria
```

However, real-world ideation often starts at a higher level:

```text
solution/application/platform -> candidate features -> stories -> acceptance criteria
```

This issue introduces a higher-level ideation layer to avoid premature feature boundaries and improve planning quality.

This is intentionally deferred until after Milestone 2 / 0.3.0 so the current feature-level workflow can stabilize first.

## Scope

- Extend `ec ideate` to support solution-level input
- Introduce a new artifact type: `solution`
- Support decomposition into candidate features during planning
- Keep the existing feature workflow intact

## Proposed Artifact Structure

```text
.ec/solutions/<solution-id>/
├─ solution.yaml
├─ ideation.md
├─ candidate-features.md
└─ run-history/
```

Existing feature structure remains unchanged:

```text
.ec/features/<feature-id>/
```

## Expected Input

```bash
ec ideate "Build a multi-tenant SaaS platform for internal tools"
```

Potential future explicit form:

```bash
ec ideate --level solution "Build a multi-tenant SaaS platform for internal tools"
```

## Reads

- `.ec/config/project.yaml`
- `.ec/config/agent-policies.yaml`

## Writes

- `.ec/solutions/<solution-id>/solution.yaml`
- `.ec/solutions/<solution-id>/ideation.md`
- `.ec/solutions/<solution-id>/candidate-features.md`
- `.ec/runs/<run-id>.json`

## CLI Output Requirements

Output must clearly show:

- solution id created
- ideation artifact written
- candidate features identified
- where artifacts were written
- next recommended command

Example:

```text
Ethereal-CLAW
Command: ideate
Level: solution
Solution: solution-internal-tools-platform
Stage: none -> ideated

Written
- .ec/solutions/solution-internal-tools-platform/solution.yaml
- .ec/solutions/solution-internal-tools-platform/ideation.md
- .ec/solutions/solution-internal-tools-platform/candidate-features.md

Next
- ec plan solution-internal-tools-platform
```

## Acceptance Criteria

- `ec ideate` can create a solution-level artifact
- Candidate features are suggested and stored
- Existing feature-level ideation still works unchanged
- No breaking changes to the existing feature-based workflow
- Output clearly distinguishes solution-level and feature-level ideation

## Testing Requirements

### Structural

- Create solution without features
- Create solution with candidate features
- Existing feature ideation remains stable
- Missing config is handled clearly

### System-level

- Solution-level ideation can later feed feature-level planning
- Existing Milestone 2 flow remains unaffected

## Definition of Done

- Solution-level ideation is supported
- Feature decomposition is possible but not required
- Existing workflows remain stable
- CLI output clearly communicates the ideation level
