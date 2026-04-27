# Migrate workspace to `.ec/` and separate host-repo scaffolding from tool structure

## Description

Ethereal-CLAW currently writes artifacts and configuration in a way that blends with the host repository structure.

We have refined the architectural model:

- Ethereal-CLAW should behave like **scaffolding**, not part of the application
- All project-local state should live under a single `.ec/` directory
- Configuration should be **project-local**, not mixed into the host repo root

This issue updates the implementation to match the blueprint.

---

## Scope

### Workspace migration

- Replace current artifact paths:
  - `/features` → `/.ec/features`
  - `/runs` → `/.ec/runs`

- Introduce:
  - `/.ec/config` for project-local config
  - future-safe folders:
    - `/.ec/cache`
    - `/.ec/temp`

---

### Config handling

- Move runtime config from root-level locations into:
  - `/.ec/config/project.yaml`
  - `/.ec/config/agent-policies.yaml`

- Keep **example config** in tool repo (`/config`)
- Ensure runtime config is always read from `.ec/config`

---

### CLI updates

Update `ec init` to:

- create:
  - `.ec/`
  - `.ec/config/`
  - `.ec/features/`
  - `.ec/runs/`
- optionally scaffold default config into `.ec/config/`

---

### Path resolution

- Centralize all workspace paths in config:
```yaml
workspace:
  rootDirectory: ./.ec
  configDirectory: ./.ec/config
  featuresDirectory: ./.ec/features
  runsDirectory: ./.ec/runs
```

- Update all services to use these paths (no hardcoded `/features` or `/runs`)

---

## Acceptance Criteria

- All generated artifacts are written under `/.ec`
- No CLAW artifacts are written to repo root
- Config is loaded from `/.ec/config`
- `ec init` creates full workspace structure
- Existing commands (`ideate`, `plan`, etc.) continue to work
- Tool can be removed by deleting `.ec/` without affecting host repo

---

## Testing Requirements

### Structural

- Path resolution works across all commands
- Config loading works from `.ec/config`
- Missing `.ec` folder handled gracefully

### System-level

- Full workflow works:
  - ideate → plan
- Artifacts are created in `.ec`
- No regressions in existing commands

---

## Checklist

- [ ] update workspace config model
- [ ] refactor path resolution logic
- [ ] update FeatureStructureService
- [ ] update run logging paths
- [ ] update config loader
- [ ] update `init` command
- [ ] migrate existing tests
- [ ] add regression tests

---

## Definition of Done

- `.ec` is the single workspace root
- Config and artifacts are cleanly separated from host repo
- No root-level pollution remains
- CLI behaves consistently with new structure
