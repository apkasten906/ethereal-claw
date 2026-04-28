# Ethereal-CLAW Blueprint

**Version:** 0.2.1
**Status:** Milestone 2 — In Progress
**Last Updated:** 2026-04-24

---

## Version Notes

### 0.3.0 Target

Milestone 2 is complete when:

* `.ec/` is the project-local workspace in host repos
* `.ec/config/` contains project-local runtime config
* `ec status` gives human-readable workflow visibility
* `bdd` is a first-class stage
* `review-consistency` is a first-class stage
* stories and acceptance criteria are structured
* `traceability/traceability-map.json` is generated and validated
* artifact synchronization is checked during `review-consistency`
* placeholder BDD generation is removed from `ideate()`
* one Milestone 2 vertical slice runs end to end

### 0.2.2

* Moved `.ec` workspace and `ec status` into Milestone 1 (foundation)
* Clarified Milestone 1 vs Milestone 2 boundary

### 0.2.1

* Consolidated blueprint to avoid duplication
* Added explicit CLI input/output contract
* Clarified `.ec/` host-workspace model
* Deferred packaging until after Milestone 2 stabilization

### 0.2.0

* Introduced `.ec/` workspace model
* Defined human-readable and agent-readable artifact split
* Added traceability and synchronization principles

### 0.1.0

* Initial CLI scaffold
* `init`, `ideate`, `plan`
* Mock provider, budget manager, run logging

---

## Purpose

Ethereal-CLAW is a CLI-first orchestration layer for AI-assisted software development workflows.

It helps move a feature through:

```text
ideate -> plan -> bdd -> review-consistency -> implement -> test -> review
```

The tool should manage development state, generate auditable artifacts, control token usage, and preserve human review gates.

---

## Core Design Principles

* CLI first
* deterministic artifact layout
* human-readable output by default
* `--json` available for automation
* one workflow state per feature
* budget-aware model routing
* low-cost model first where possible
* human review gates before risky work
* host solution and Ethereal-CLAW state remain separate
* artifacts are readable by humans and structured enough for agents

---

## Workspace Model

### Ethereal-CLAW source repo

The tool source lives in the Ethereal-CLAW repository or published package.

```text
ethereal-claw/
├─ packages/
│  ├─ cli/
│  ├─ core/
│  └─ shared/
├─ docs/
├─ config/                 # package/example config templates
└─ tests/
```

### Host solution repo

When a user runs Ethereal-CLAW against a project, all project-local EC state lives under `.ec/`.

```text
host-solution/
├─ src/
├─ tests/
├─ docs/
└─ .ec/
   ├─ config/              # human-authored project-local EC config
   │  ├─ project.yaml
   │  └─ agent-policies.yaml
   ├─ features/            # generated feature workspaces
   ├─ runs/                # generated run logs
   ├─ cache/               # future
   └─ temp/                # future
```

### Rule

> `.ec/` is scaffolding around the host solution, not part of the host solution itself.

---

## Feature Artifact Structure

```text
.ec/features/<feature-id>/
├─ feature.yaml
├─ ideation.md
├─ plan.md
├─ stories/
│  └─ 001-example-story.md
├─ bdd/
│  └─ 001-example-story.feature
├─ traceability/
│  └─ traceability-map.json
├─ implementation/
│  ├─ tasks.md
│  └─ change-summary.md
├─ tests/
│  ├─ test-plan.md
│  └─ generated-tests.md
├─ review/
│  ├─ consistency-review.md
│  └─ code-review.md
└─ run-history/
```

Global run logs live under:

```text
.ec/runs/
```

Feature-local run history may contain links, copies, or summaries, but global `.ec/runs/` is the primary run-log location.

---

## Human vs Agent Artifact Model

Artifacts must serve two audiences.

| Concern             | Human-readable form    | Agent-readable form        |
| ------------------- | ---------------------- | -------------------------- |
| Feature metadata    | YAML                   | typed `FeatureRecord`      |
| Stories             | Markdown               | typed `Story`              |
| Acceptance criteria | Markdown numbered list | typed `AcceptanceCriteria` |
| BDD                 | `.feature`             | parsed scenario model      |
| Traceability        | optional summary       | `traceability-map.json`    |
| Run logs            | status output          | JSON run log               |

### Synchronization rule

Each artifact type must define a source of truth. Derived representations must be reproducible or validated. Divergence must be reported during `review-consistency`; the system must not silently overwrite conflicting data.

### Conflict and write-safety rules

The workflow must fail closed when existing state conflicts with a newly requested write.

Rules:

* overwrites must be explicit
* interactive commands may prompt for overwrite confirmation
* non-interactive and `--json` flows must never prompt
* duplicate or conflict conditions in automation mode must return deterministic errors
* whole-workspace replacement must use stage-then-swap semantics
* post-commit cleanup failures must be warnings, not rollback triggers
* deterministic artifacts must avoid volatile fields in equality or synchronization checks
* user-edited or diverged artifacts must not be silently replaced

Implications:

* `ideate` may replace a feature workspace only when overwrite is explicitly confirmed
* commands that regenerate artifacts should either reproduce byte-stable output or fail with a divergence error
* run logs are the correct place for volatile metadata such as timing and provider execution details
* future source-code writing stages must adopt the same explicit-overwrite and rollback-boundary rules

---

## CLI Output Contract

Every command should answer six human questions:

1. What did I ask the tool to do?
2. What input did it use?
3. What did it read?
4. What changed on disk?
5. What stage is the feature in now?
6. What should I run next?

### Default human output shape

```text
Ethereal-CLAW
Command: <command>
Feature: <feature-id or none>
Stage: <previous-stage> -> <new-stage>

Input
- <what the command received>

Read
- <important files read>

Written
- <important files written>

Budget
- Provider: <provider>
- Model tier: <tier>
- Estimated tokens/cost: <value>
- Actual tokens/cost: <value if available>

Result
- Status: success | failed | needs-review
- Notes: <short summary>

Next
- <recommended next command>
```

### Rules

* Human-readable plain text is default
* Raw JSON should require `--json`
* Always show the next recommended command
* Missing input and provider failure must be clearly different
* Important paths must be visible, not buried in logs

---

## Workflow Phase Contract

### 1. `ec init`

**Input:** none or optional init flags
**Reads:** package defaults/templates
**Writes:** `.ec/config/`, `.ec/features/`, `.ec/runs/`
**Next:** `ec status` or `ec ideate "..."`

### 2. `ec status [feature-id]`

**Input:** optional feature id
**Reads:** `.ec/config/`, `.ec/features/`, `.ec/runs/`
**Writes:** nothing
**Next:** depends on current feature state

### 3. `ec ideate "<request>"`

**Input:** rough feature request
**Reads:** `.ec/config/project.yaml`, `.ec/config/agent-policies.yaml`
**Writes:** `feature.yaml`, `ideation.md`, run log
**Must not write after Milestone 2:** `.feature` files
**Human question:** Is this the right bounded feature?
**Next:** `ec plan <feature-id>`

### 4. `ec plan <feature-id>`

**Input:** existing feature id
**Reads:** `feature.yaml`, `ideation.md`
**Writes:** `plan.md`, `stories/*.md`, `implementation/tasks.md`, run log
**Human question:** Are stories and AC clear enough for BDD?
**Next:** `ec bdd <feature-id>`

### 5. `ec bdd <feature-id>`

**Input:** feature id with planned stories and AC
**Reads:** `feature.yaml`, `plan.md`, `stories/*.md`
**Writes:** `bdd/*.feature`, `traceability/traceability-map.json`, run log
**Human question:** Do scenarios represent the AC?
**Next:** `ec review-consistency <feature-id>`

### 6. `ec review-consistency <feature-id>`

**Input:** feature id with plan, stories, BDD, and traceability
**Reads:** `feature.yaml`, `plan.md`, `stories/*.md`, `bdd/*.feature`, `traceability-map.json`
**Writes:** `review/consistency-review.md`, run log
**Checks:** missing AC, missing BDD coverage, non-testable criteria, artifact drift
**Human question:** Is this ready for implementation planning?
**Next:** `ec implement <feature-id> --dry-run`

### 7. `ec implement <feature-id> --dry-run`

**Input:** feature id that passed consistency review
**Reads:** plan, stories, BDD, traceability, consistency review
**Writes:** `implementation/change-summary.md`, run log
**Human question:** Is the proposed implementation safe?
**Next:** `ec test <feature-id>`

### 8. `ec test <feature-id>`

**Input:** feature id with implementation notes or changes
**Reads:** stories, BDD, implementation summary
**Writes:** `tests/test-plan.md`, `tests/generated-tests.md`, run log
**Human question:** Do tests cover AC and regressions?
**Next:** `ec review <feature-id>`

### 9. `ec review <feature-id>`

**Input:** feature id with implementation and test artifacts
**Reads:** relevant feature artifacts
**Writes:** `review/code-review.md`, run log
**Human question:** Is this ready for a human-approved PR?

---

## Budget and Token Controls

The orchestrator must:

* estimate cost before model calls
* record actual usage after calls
* maintain run-level and session-level counters
* default low-cost models for formatting and structural work
* escalate only for ambiguity, risk, architecture, security, or final review
* stop or require approval when thresholds are exceeded

### Suggested default routing

| Stage              | Default tier | Escalate when                        |
| ------------------ | ------------ | ------------------------------------ |
| ideate             | low/medium   | request is vague or architectural    |
| plan               | low          | dependencies span several subsystems |
| bdd                | low          | AC are inconsistent                  |
| review-consistency | low          | traceability gaps are complex        |
| implement          | medium       | change touches auth/security/infra   |
| test               | low          | integration complexity is high       |
| review             | medium       | change risk is high                  |

---

## Milestone 1 Scope (Foundation)

Milestone 1 establishes the usable CLI foundation and local workspace.

### In scope

* `.ec/` workspace and `.ec/config/`
* `ec init`
* `ec status`
* basic CLI commands (`ideate`, `plan`)
* run logging
* mock provider and budget manager

### Outcome

* Tool can be initialized in any repo
* User can understand state via `ec status`
* Artifacts are stored cleanly under `.ec/`

---

## Milestone 2 Scope

Milestone 2 turns the current scaffold into a stateful SDLC workflow manager.

### In scope

* `.ec/` workspace and `.ec/config/`
* `ec status`
* improved human-readable command output
* structured stories and acceptance criteria
* first-class `bdd` stage
* first-class `review-consistency` stage
* traceability map
* artifact synchronization validation
* cleanup of placeholder BDD generation from `ideate()`

### Out of scope

* npm publishing
* final package distribution workflow
* automatic code patching/merge
* production deployment automation
* browser UI

---

## Milestone 2 Smaller Stories

### (Moved to Milestone 1) — `.ec` Workspace and Config

Create the host-repo `.ec/` scaffolding model and load project-local config from `.ec/config/`.

### (Moved to Milestone 1) — `ec status`

Add read-only workflow visibility for global and feature-specific state.

### Story M2-03 — Human-Readable CLI Output — Human-Readable CLI Output

Make all commands show input, reads, writes, result, budget, and next step.

### Story M2-04 — Structured Stories and Acceptance Criteria

Make `plan` generate stable story/AC artifacts for downstream stages.

### Story M2-05 — First-Class BDD Stage

Move BDD generation into `ec bdd` and remove `.feature` generation from `ideate()`.

### Story M2-06 — Traceability Map

Generate and validate `traceability/traceability-map.json`.

### Story M2-07 — Consistency Review Stage

Add `ec review-consistency` to detect missing links, ambiguity, non-testable AC, and artifact drift.

### Story M2-08 — Artifact Synchronization

Define source-of-truth rules and detect divergence between human-readable and agent-readable artifacts.

### Story M2-09 — Cleanup and Workflow Enforcement

Remove placeholder logic, enforce stage transitions, and add regression/e2e tests.

---

## Milestone 2 Done Means 0.3.0

0.3.0 means Ethereal-CLAW can reliably manage early SDLC state in a host repository with:

* clean `.ec/` separation
* clear CLI feedback
* structured stories and AC
* operational BDD and consistency review
* traceability and sync validation
* human review gates

0.3.0 does **not** require package publishing. Packaging starts after Milestone 2 stabilizes.

---

## Post–Milestone 2: Packaging Preparation

After 0.3.0, prepare package distribution:

* package entry points for `ethereal` and `ec`
* default config templates shipped with package
* `ec init` materializes `.ec/config/`
* fresh external repo installation test
* install/init docs

---

## Self-Hosting Policy

Ethereal-CLAW may help build itself, but it is not the final authority on correctness.

Safe now:

* ideation
* planning
* drafting stories/AC
* drafting BDD
* identifying ambiguity
* proposing implementation for human review

Not safe yet:

* approving its own workflow changes
* implementing from unverified stories
* advancing stages without traceability validation
* merging without human review
