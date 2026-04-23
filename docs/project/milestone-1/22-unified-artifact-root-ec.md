# Introduce unified artifact root directory (/ec)

## Description
Currently, Ethereal-CLAW writes generated artifacts to `/features` and `/runs` at the repository root.

This makes it harder to:
- quickly locate all generated files
- cleanly ignore generated artifacts in git
- separate system-generated files from human-authored code

This issue introduces a single top-level directory (`/ec`) to contain all CLAW-managed artifacts.

The goal is to improve developer experience and lifecycle clarity, not to change functionality.

## Scope

- Introduce `/ec` as the base directory for all artifacts
- Move:
  - `/features` → `/ec/features`
  - `/runs` → `/ec/runs`
- Update configuration to support a base artifact directory
- Update all path resolution logic
- Update `init` command to create `/ec` structure

### Optional (design-level, not full implementation)
- Reserve future directories:
  - `/ec/cache`
  - `/ec/temp`

## Acceptance Criteria

- All generated artifacts are stored under `/ec`
- No artifacts are written to repo root (`/features`, `/runs`)
- `ec init` creates:
  - `/ec/features`
  - `/ec/runs`
- Existing commands (`ideate`, `plan`, etc.) continue to work
- Configuration supports overriding base directory

## Testing Requirements

### Structural
- Path resolution works for all commands
- Artifact creation works in new directory
- No regression in existing commands

### System-level
- Full workflow runs successfully with new structure
- `.gitignore` can cleanly ignore `/ec`

## Checklist

- [ ] add `baseDirectory` to config
- [ ] update artifact paths to use `/ec`
- [ ] update feature structure service
- [ ] update run log paths
- [ ] update init command
- [ ] update documentation
- [ ] add regression tests

## Definition of Done

- All artifacts live under `/ec`
- Repo root is clean of generated files
- No regression in CLI commands
- Developer can easily locate or ignore all CLAW artifacts
