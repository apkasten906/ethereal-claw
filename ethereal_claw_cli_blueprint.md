# Ethereal-CLAW CLI — Base Repo Blueprint

**Version:** 0.2.0
**Status:** Milestone 2 — In Progress
**Last Updated:** 2026-04-23

---

## Version Notes

### 0.2.0

* Introduced `.ec` workspace model for host repositories
* Separated tool repo vs host repo architecture
* Added `bdd` and `review-consistency` as first-class workflow stages (Milestone 2)
* Defined artifact design principle (human vs agent readability)
* Added artifact synchronization rules
* Introduced traceability map as core artifact

### 0.1.0

* Initial CLI scaffold
* `init`, `ideate`, `plan` commands
* Mock provider and budget manager
* Basic artifact generation and run logging

---

## Purpose

Build a **CLI-first orchestration layer** for an AI-assisted software development lifecycle.

The tool should let you issue commands like:

* `ethereal-claw ideate "multi-tenant auth for admin portal"`
* `ethereal-claw plan feature/auth-refresh`
* `ethereal-claw implement feature/auth-refresh`
* `ethereal-claw test feature/auth-refresh`
* `ethereal-claw review feature/auth-refresh`

The orchestration layer coordinates multiple agents so they work toward **BDD-style acceptance criteria** and produce auditable artifacts.

---

## Product Goal

The first usable version should:

1. Accept a feature request from the CLI.
2. Break it into epics, stories, and acceptance criteria.
3. Store artifacts in the repo under a predictable structure.
4. Run a multi-step workflow where planner, reviewer, implementer, tester, and reviewer agents hand off work.
5. Keep a run log so you can inspect what happened.
6. Stop at review checkpoints rather than pretending to be fully autonomous.

This gives you a practical “CLAW” without overengineering the first iteration.

---

## Cost and Token Budget Principle

The orchestration layer must be **budget-aware by default**.

That means:

* send low-risk, repetitive, formatting-heavy work to the cheapest available model tier
* reserve expensive models for ambiguity resolution, architecture tradeoffs, critical review, and final quality gates
* estimate token cost before each agent call
* record actual token usage after each agent call
* stop, downgrade, or ask for human intervention when the run crosses configured thresholds

The system should treat token budget as a first-class operational concern, not an afterthought.

---

## Recommended Tech Stack

Because you want a CLI-first solution and may later expose it through the web, this stack keeps the core portable.

### Phase 1

* **Node.js + TypeScript** for the CLI and orchestration core
* **npm workspaces** for monorepo organization
* **Commander** for CLI command parsing
* **Zod** for input and config validation
* **Pino** for structured logging
* **OpenAI / GitHub Copilot / Codex adapters** behind a provider abstraction
* **Markdown + YAML + JSON** for artifacts
* **Vitest** for unit tests

### Later extension

* Web terminal shell in:

  * Blazor
  * Next.js
  * or a lightweight terminal UI in the browser

The key design choice is this: **keep the orchestration engine independent from the UI**.

---

## Architecture

```text
User
  -> CLI Command
    -> Command Handler
      -> Workflow Orchestrator
        -> Budget Manager
        -> Token Usage Monitor
        -> Agent Router
          -> Planner Agent
          -> Consistency Reviewer Agent
          -> Story/BDD Agent
          -> Implementer Agent
          -> Test Agent
          -> Code Review Agent
        -> Artifact Store
        -> Run Log
        -> Git Adapter
```

### Design principles

* CLI first
* deterministic file layout
* one workflow state per feature
* human review gates
* provider-agnostic LLM integration
* budget-aware model routing
* graceful downgrade to cheaper models
* BDD drives implementation and testing

---

## First Release Scope

### In scope

* Create feature workspace
* Generate plan artifacts
* Generate user stories and acceptance criteria
* Generate implementation task list
* Generate test scenarios
* Log all workflow steps
* Dry-run mode

### Out of scope for v1

* Automatic code merge to main
* Autonomous deployment to production
* Parallel multi-repo execution
* Sophisticated agent memory
* Browser UI

---

## Repo Structure

There are **two distinct structures** to think about:

### 1. Ethereal-CLAW source repository

This is the repository where Ethereal-CLAW itself is developed.

```text
ethereal-claw/
├─ package.json
├─ tsconfig.base.json
├─ .gitignore
├─ README.md
├─ docs/
│  ├─ architecture.md
│  ├─ workflow.md
│  ├─ command-reference.md
│  └─ prompts/
├─ config/
│  ├─ ethereal-claw.config.example.yaml
│  └─ agent-policies.yaml
├─ packages/
│  ├─ cli/
│  ├─ core/
│  └─ shared/
└─ tests/
   ├─ unit/
   └─ fixtures/
```

### 2. Host solution repository

This is the repository where a user runs Ethereal-CLAW against their actual solution.

```text
host-solution/
├─ src/
├─ tests/
├─ docs/
├─ package.json
├─ .gitignore
└─ .ec/
   ├─ config/         ← project-local, human-authored Ethereal config
   │  ├─ project.yaml
   │  └─ agent-policies.yaml
   ├─ features/       ← generated feature workspaces
   ├─ runs/           ← generated run logs
   ├─ cache/          ← future
   └─ temp/           ← future
```

### Design decision

> Ethereal-CLAW should be **separate from the host solution** and removable like scaffolding.

That means:

* the **tool code** lives in the Ethereal-CLAW repo or is installed as a package
* the **host repo** should only contain a small project-local Ethereal workspace
* that workspace should live in **`.ec/`** so it is clearly separate from the solution itself

### Human vs machine separation inside `.ec/`

This does **not** conflict with the need to separate human-authored and generated content.

Within `.ec/`:

* `.ec/config/` = human-authored project-local configuration
* `.ec/features/`, `.ec/runs/`, `.ec/cache/`, `.ec/temp/` = agent-managed runtime state

So the separation becomes:

| Concern                       | Location                     |
| ----------------------------- | ---------------------------- |
| Tool source code              | `ethereal-claw` repo         |
| Host solution code            | normal host repo folders     |
| Project-local Ethereal config | `.ec/config/`                |
| Generated Ethereal artifacts  | `.ec/features/`, `.ec/runs/` |

This is the cleanest model if Ethereal-CLAW is meant to be used across many host repositories.

## Feature Artifact Structure

All project-local Ethereal artifacts live under `/.ec` inside the host solution repository.

```text
.ec/
└─ features/
   └─ feature-auth-refresh/
      ├─ feature.yaml
      ├─ ideation.md
      ├─ plan.md
      ├─ stories/
      │  ├─ 001-session-timeout.md
      │  └─ 002-token-refresh.md
      ├─ bdd/
      │  ├─ 001-session-timeout.feature
      │  └─ 002-token-refresh.feature
      ├─ implementation/
      │  ├─ tasks.md
      │  └─ change-summary.md
      ├─ tests/
      │  ├─ test-plan.md
      │  └─ generated-tests.md
      ├─ review/
      │  ├─ consistency-review.md
      │  └─ code-review.md
      ├─ traceability/
      │  └─ traceability-map.json
      └─ run-history/
         ├─ run-2026-04-17T090000Z.json
         └─ run-2026-04-17T093000Z.json
```

---

## Workspace Principle — Scaffolding, Not Structure

Ethereal-CLAW should behave like **scaffolding around a building**.

That means:

* it helps create, inspect, and manage development state
* it should remain clearly separate from the actual application structure
* it should be removable without reshaping the host solution

For that reason, the preferred project-local workspace is:

```text
.ec/
```

not root-level `features/`, `runs/`, or other scattered folders.

This gives the host repository:

* less visual clutter
* clearer ownership boundaries
* easier cleanup and `.gitignore` rules
* a better mental model for users

---

## Artifact Design Principle — Human vs Agent Readability

Artifacts should serve **two audiences**:

### Human-facing

* Markdown files (`.md`, `.feature`)
* Readable, reviewable, and editable
* Used for decision-making and validation

### Agent-facing

* Structured, deterministic formats (`.json`, `.yaml`)
* Used for orchestration, traceability, and validation
* Must be stable and machine-parseable

### Rule

> Every critical artifact should have a **stable structure for agents** and a **clear representation for humans**.

Examples:

| Artifact     | Human Form               | Agent Form                 |
| ------------ | ------------------------ | -------------------------- |
| Stories      | `.md`                    | structured `Story` type    |
| AC           | numbered list            | typed `AcceptanceCriteria` |
| BDD          | `.feature`               | parsed scenario model      |
| Traceability | summary `.md` (optional) | `traceability-map.json`    |

This ensures:

* agents can operate deterministically
* humans can review and correct output
* state transitions are reliable

---

## Artifact Synchronization Rule

To maintain system integrity, artifacts must remain synchronized across representations.

### Source of Truth Principle

Each artifact type must define a **single source of truth**:

| Artifact     | Source of Truth | Derived Representation |
| ------------ | --------------- | ---------------------- |
| Stories      | Structured type | Markdown               |
| AC           | Structured type | Markdown               |
| BDD          | `.feature` file | Parsed model           |
| Traceability | JSON            | Optional summary       |

### Rules

* Derived representations must be reproducible from the source of truth
* Agents must operate only on source-of-truth structures
* Human edits must be validated against the source of truth
* Divergence between representations must be detected and surfaced

### Enforcement

* Synchronization validation occurs during `review-consistency`
* Critical mismatches should block workflow progression
* The system must not silently overwrite conflicting data

### Goal

> Ensure that human-readable artifacts and agent-readable structures never drift apart.

This enables:

* reliable automation
* trustworthy reviews
* consistent state transitions

---

---

## Core Workflow

### 1. Ideate

Input:

* rough feature request

Output:

* feature summary
* assumptions
* risks
* candidate stories

### 2. Plan

Input:

* approved feature summary

Output:

* story breakdown
* dependency order
* implementation tasks
* review points

### 3. Write BDD

Input:

* user stories

Output:

* Gherkin scenarios
* acceptance criteria mapping

### 4. Consistency Review

Checks:

* does every story map to acceptance criteria?
* do implementation tasks trace back to stories?
* are test scenarios missing for any criteria?

### 5. Implement

Output:

* proposed code changes
* file-level change plan
* implementation notes

### 6. Test

Output:

* unit/integration test suggestions
* manual test checklist
* gaps / risks

### 7. Review

Output:

* architecture review
* code quality review
* unresolved questions

---

## Budget-Aware Model Routing

Each workflow step should declare:

* required quality level
* maximum allowed token budget
* whether it may use a low-cost model
* whether fallback or downgrade is allowed

### Suggested routing policy

#### Use low-cost models for:

* formatting markdown artifacts
* converting notes into template structure
* story splitting when requirements are already clear
* generating checklists
* summarizing run logs
* rewriting acceptance criteria into a standard format
* simple traceability checks

#### Use stronger models for:

* resolving ambiguity in requirements
* architecture and security decisions
* implementation planning across multiple modules
* code review on risky changes
* contradiction detection across many artifacts
* final quality gate before you spend more money or merge code

### Example policy table

| Workflow step      | Default tier | Escalate when                        |
| ------------------ | ------------ | ------------------------------------ |
| ideate             | medium       | request is vague or architectural    |
| plan               | low          | dependencies span several subsystems |
| bdd                | low          | acceptance criteria are inconsistent |
| review-consistency | low          | traceability gaps are complex        |
| implement          | medium       | change touches security, auth, infra |
| test               | low          | integration complexity is high       |
| review             | medium       | change risk or scope is high         |

A practical default for your case is:

* **cheap/free mini model first**
* escalate only on failure, ambiguity, or risk
* never use a premium model just for formatting or boilerplate

---

## Token Monitoring and Budget Controls

The orchestrator should maintain both **run-level** and **session-level** counters.

### Track at minimum

* estimated input tokens
* estimated output tokens
* actual prompt tokens
* actual completion tokens
* cumulative tokens per run
* cumulative tokens per provider
* estimated cost per call
* estimated remaining budget for the run

### Control actions

* warn at 50 percent of budget
* require confirmation or auto-downgrade at 75 percent
* stop non-critical steps at 90 percent
* abort run when hard cap is reached

### Required behaviors

* preflight estimate before every model call
* compare estimate against remaining run budget
* downgrade model if possible
* trim context before escalating
* cache reusable artifacts and summaries
* reuse prior outputs instead of resending the full history

### Hard rule

Never let the orchestrator blindly continue spending tokens because a workflow graph says so.

---

## Agent Definitions

## 1. Ideation Agent

**Purpose:** turn a raw request into a feature concept.

**Responsibilities:**

* summarize intent
* identify assumptions
* identify risks
* suggest bounded scope

## 2. Planning Agent

**Purpose:** create an implementation-ready plan.

**Responsibilities:**

* break feature into stories
* sequence work
* identify dependencies
* recommend vertical slices

## 3. Story / BDD Agent

**Purpose:** convert stories into testable behavior.

**Responsibilities:**

* write user stories
* write acceptance criteria
* write Gherkin scenarios
* highlight ambiguity

## 4. Consistency Reviewer Agent

**Purpose:** detect gaps and contradictions before coding.

**Responsibilities:**

* cross-check stories, AC, and tasks
* flag unclear wording
* flag non-testable acceptance criteria

## 5. Implementer Agent

**Purpose:** propose code changes aligned to BDD.

**Responsibilities:**

* suggest file changes
* scaffold implementation
* document rationale
* stay inside architecture guardrails

## 6. Test Agent

**Purpose:** ensure coverage against behavior.

**Responsibilities:**

* generate unit test ideas
* generate integration test ideas
* generate manual test checklist
* map tests back to scenarios

## 7. Review Agent

**Purpose:** final AI review before human verification.

**Responsibilities:**

* code quality checks
* design consistency checks
* risk notes
* tech debt notes

---

## Suggested CLI Commands

```bash
ethereal init
ec init

ethereal ideate "Add tenant-aware RBAC to admin portal"
ec ideate "Add tenant-aware RBAC to admin portal"

ethereal plan feature-rbac
ec plan feature-rbac

ethereal bdd feature-rbac
ec bdd feature-rbac

ethereal review-consistency feature-rbac
ec review-consistency feature-rbac

ethereal implement feature-rbac --dry-run
ec implement feature-rbac --dry-run

ethereal test feature-rbac
ec test feature-rbac

ethereal review feature-rbac
ec review feature-rbac

ethereal run feature-rbac --from ideate --to review
ec run feature-rbac --from ideate --to review
```

### Command behavior

#### `ethereal-claw init`

* creates config file if missing
* verifies folders
* validates provider settings

#### `ethereal-claw ideate <prompt>`

* creates feature folder
* writes ideation artifact
* generates feature metadata

#### `ethereal-claw plan <feature-id>`

* writes plan.md
* writes implementation task draft

#### `ethereal-claw bdd <feature-id>`

* writes stories and `.feature` files

#### `ethereal-claw review-consistency <feature-id>`

* checks traceability from story to BDD to tasks

#### `ethereal-claw implement <feature-id>`

* produces implementation proposal
* later can optionally patch code

#### `ethereal-claw test <feature-id>`

* writes test plan and coverage notes

#### `ethereal-claw run <feature-id>`

* executes multiple steps in sequence
* logs each stage

---

## Workflow State Model

```ts
export type WorkflowStage =
  | 'ideate'
  | 'plan'
  | 'bdd'
  | 'review-consistency'
  | 'implement'
  | 'test'
  | 'review';
```

Each run should capture:

* feature id
* stage
* agent used
* provider used
* prompt hash
* artifact outputs
* success/failure
* timestamp

This gives you auditability and reproducibility.

---

## Starter Prompt Strategy

Store prompts as versioned markdown files in `docs/prompts/`.

Each prompt should include:

* purpose
* inputs
* required output schema
* constraints
* definition of done

This avoids prompt chaos and makes the system maintainable.

---

## Example `feature.yaml`

```yaml
id: feature-rbac
name: Tenant-aware RBAC
status: ideation
createdAt: 2026-04-17T09:00:00Z
sourcePrompt: Add tenant-aware RBAC to admin portal
owner: andy
currentStage: ideate
```

---

## Example `ethereal-claw.config.example.yaml`

```yaml
budget:
  enabled: true
  sessionTokenLimit: 400000
  defaultRunTokenLimit: 50000
  warningThresholds:
    - 0.5
    - 0.75
    - 0.9
  autoDowngrade: true
  stopAtHardLimit: true
  requireApprovalAtPercent: 0.75
routing:
  defaultTierByStage:
    ideate: low
    plan: low
    bdd: low
    review-consistency: low
    implement: medium
    test: low
    review: medium
  escalationRules:
    - stage: ideate
      condition: ambiguous_requirements
      upgradeTo: medium
    - stage: plan
      condition: multi_module_change
      upgradeTo: medium
    - stage: implement
      condition: security_or_auth_change
      upgradeTo: high

defaultProvider: mock
providers:
  openai:
    apiKeyEnvVar: OPENAI_API_KEY
    model: gpt-5.4
  githubModels:
    apiKeyEnvVar: GITHUB_TOKEN
    model: gpt-4.1
  mock:
    enabled: true
logging:
  level: info
workspace:
  rootDirectory: ./.ec
  configDirectory: ./.ec/config
  featuresDirectory: ./.ec/features
  runsDirectory: ./.ec/runs
workflow:
  stopOnFailure: true
  requireHumanApprovalAfter:
    - ideate
    - review-consistency
    - review
```

---

## Token-Safe Execution Strategy

### 1. Preflight before each stage

Before a stage runs, estimate:

* size of input context
* expected output size
* cheapest acceptable model tier
* whether cached summaries can replace full artifacts

### 2. Compress context aggressively

Do not keep resending:

* full story files
* full logs
* whole codebases
* repeated prompt boilerplate

Instead send:

* short structured summaries
* selected excerpts
* hashes and references to existing files
* only the files relevant to the current stage

### 3. Cache derived artifacts

If a low-cost model already produced:

* normalized stories
* reformatted AC
* traceability maps
* implementation summaries

then reuse those rather than regenerating them.

### 4. Escalate late

Only send work to a stronger model when:

* the cheap model fails quality checks
* the task is truly high-risk
* ambiguity remains after one cheap pass

### 5. Separate orchestration from generation

Budget logic belongs in the orchestrator, not buried inside each agent.

---

## Minimal Milestone Plan

## Milestone 1 — Local CLI Skeleton

Status: completed

Delivered:

* repo initialized
* `ethereal` / `ec` CLI entry points
* `init` command
* `ideate` command
* local artifact writing
* mock provider
* budget manager
* token estimate utility
* run budget log

Completed outcome:

* feature workspace can be created from one command
* generated files can be inspected locally
* budget tracking is visible in the run log

## Current Repo Reality Check

The live codebase already includes more than the original Milestone 1 plan:

* `plan` already exists as a command
* the orchestrator already supports `ideate`, `plan`, `implement`, `test`, `review`, and `run`
* `ideate` already creates a starter story artifact and a placeholder `.feature` file
* feature workspaces already include `stories/`, `bdd/`, `implementation/`, `tests/`, `review/`, and `run-history/`

That means Milestone 2 should be treated as an **augmentation of the existing pipeline**, not a fresh implementation of planning from scratch.

## Milestone 2 — First-Class BDD and Consistency Review

### Goal

Upgrade the current scaffold so that planning becomes traceable and behavior-driven, with BDD and consistency review represented as real workflow stages rather than placeholders.

### Already present in the repo

* `ethereal plan <feature-id>`
* `ec plan <feature-id>`
* a working `plan()` orchestrator stage
* story generation during `ideate()`
* placeholder `.feature` generation during `ideate()`

### New work for Milestone 2

* `ethereal bdd <feature-id>`
* `ec bdd <feature-id>`
* `ethereal review-consistency <feature-id>`
* `ec review-consistency <feature-id>`
* explicit `bdd` workflow stage
* explicit `review-consistency` workflow stage
* structured story artifacts with explicit acceptance criteria
* traceability metadata between plan, stories, AC, BDD, and implementation tasks
* `traceability/traceability-map.json`
* consistency review artifact that checks gaps and ambiguity
* prompt file system for planner, story writer, BDD writer, and consistency reviewer

### Success criteria

* one ideated feature can move through `plan`, `bdd`, and `review-consistency`
* `plan` produces story-ready structure instead of only a generic planning artifact
* every generated story has explicit acceptance criteria
* every BDD scenario maps back to a story and acceptance criteria
* consistency review flags missing traceability, ambiguity, and non-testable criteria
* the placeholder BDD file generation is moved out of `ideate()` and replaced by a real `bdd()` stage
* token-safe routing still defaults to low-cost models for formatting and structural work

## Milestone 3 — Orchestrated Run Refinement

Deliver:

* update `ethereal run`
* update `ec run`
* include `bdd` and `review-consistency` in the workflow graph when enabled
* richer step status output

Success criteria:

* one command can run the expanded planning-to-review sequence predictably

## Milestone 4 — Real Provider Integration

Deliver:

* provider abstraction wired to real APIs
* retry and rate-limit handling
* structured prompt/response tracing

Success criteria:

* same workflow works with mock and real provider

## Milestone 5 — Code Change Proposal

Deliver:

* implementation planning artifacts
* optional code patch proposal mode
* review output

Success criteria:

* tool can generate implementation guidance against repo context

---

## Milestone 2 Scope and Artifact Model

### New and changed commands

#### `ethereal plan <feature-id>`

Current state:

* already implemented in the repo

Milestone 2 expectation:

* upgrades `features/<feature-id>/plan.md`
* produces implementation-ready story decomposition
* writes or updates `features/<feature-id>/implementation/tasks.md`
* writes structured inputs for later BDD generation
* updates feature metadata and run history

#### `ethereal bdd <feature-id>`

Creates or updates:

* `features/<feature-id>/stories/*.md`
* `features/<feature-id>/bdd/*.feature`
* `features/<feature-id>/traceability/traceability-map.json`
* feature metadata stage transition to `bdd`
* run history entry

#### `ethereal review-consistency <feature-id>`

Creates or updates:

* `features/<feature-id>/review/consistency-review.md`
* feature metadata stage transition to `review-consistency`
* run history entry

### Required shared model changes

Update workflow and metadata models to support the real Milestone 2 shape:

* add `bdd` to workflow stages
* add `review-consistency` to workflow stages
* add corresponding feature statuses or current-stage tracking
* add story, acceptance criteria, and traceability types

### Story file shape

Each story file should follow a stable format:

```md
# Story 001 — Session Timeout Handling

## User Story
As an authenticated admin
I want my session lifecycle handled safely
So that my work is protected without unexpected data loss

## Acceptance Criteria
1. Given an authenticated admin session, when inactivity exceeds the configured threshold, then the user is warned before expiration.
2. Given the warning dialog is shown, when the user confirms continuation, then the session is refreshed.
3. Given the session expires, when the user performs another action, then they are redirected to sign-in.

## Dependencies
- feature-auth-refresh plan.md

## Traceability
- Plan section: Session management
- BDD file: 001-session-timeout.feature
```

### BDD file shape

```gherkin
Feature: Session timeout handling

  Scenario: Warn before session expiration
    Given an authenticated admin session
    And inactivity is approaching the configured timeout
    When the warning threshold is reached
    Then the user is shown a session expiration warning

  Scenario: Refresh session after user confirmation
    Given the session expiration warning is shown
    When the user confirms continuation
    Then the session is refreshed

  Scenario: Redirect after session expiration
    Given the session has expired
    When the user attempts another action
    Then the user is redirected to sign-in
```

### Traceability map

Add a machine-readable artifact:

```text
features/<feature-id>/traceability/traceability-map.json
```

Suggested structure:

```json
{
  "featureId": "feature-auth-refresh",
  "stories": [
    {
      "storyId": "001-session-timeout",
      "planSections": ["Session management"],
      "acceptanceCriteriaIds": ["AC-001", "AC-002", "AC-003"],
      "bddFiles": ["001-session-timeout.feature"],
      "implementationTasks": ["TASK-001", "TASK-002"]
    }
  ]
}
```

### New prompt files

Add under `docs/prompts/`:

* `planner.md`
* `story-writer.md`
* `bdd-writer.md`
* `consistency-reviewer.md`

Each prompt should define:

* input files
* output schema
* traceability requirements
* token budget expectation
* escalation conditions

---

## Milestone 2 Build Order

1. Update shared workflow stages and feature metadata shape.
2. Add `traceability/` directory creation to feature workspace creation.
3. Add shared types for story, acceptance criteria, and traceability.
4. Add prompt file loader support.
5. Refine the planning agent and `plan` stage to emit structured planning output.
6. Implement BDD agent.
7. Implement `bdd` command and orchestrator stage.
8. Implement traceability map generation.
9. Implement consistency reviewer agent.
10. Implement `review-consistency` command and orchestrator stage.
11. Remove placeholder BDD creation from `ideate()`.
12. Add unit tests for plan-to-story-to-bdd traceability and stage transitions.

## Milestone 2 Definition of Done

Milestone 2 is complete when:

* `ethereal plan <feature-id>` still works with the richer structure
* `ec plan <feature-id>` still works with the richer structure
* `ethereal bdd <feature-id>` works
* `ec bdd <feature-id>` works
* `ethereal review-consistency <feature-id>` works
* `ec review-consistency <feature-id>` works
* plan artifact is created predictably
* at least one story markdown file is created predictably
* at least one `.feature` file is created predictably
* traceability map is created predictably
* consistency review artifact is created predictably
* feature stage transitions are recorded correctly
* placeholder BDD generation is no longer done during `ideate()`
* run logs capture token usage for each new stage

---

## Recommended Milestone 2 Vertical Slice

Build this first and nothing more:

### Slice

1. Run `ethereal ideate "Add secure login audit history"`
2. Run `ethereal plan feature-secure-login-audit-history`
3. Run `ethereal bdd feature-secure-login-audit-history`
4. Run `ethereal review-consistency feature-secure-login-audit-history`

### Should do

* create or refine `plan.md`
* create one or more story files under `stories/`
* create one or more `.feature` files under `bdd/`
* create `traceability/traceability-map.json`
* create `review/consistency-review.md`
* update `feature.yaml` or equivalent current stage after each successful command
* write a run history entry for each stage

Why this slice first:

* it validates the complete planning-to-BDD chain on top of the existing scaffold
* it proves traceability before any implementation work begins
* it keeps model usage cheap while creating high-value structure

## Recommended First Vertical Slice

Build this first and nothing more:

### Slice

1. Run `ethereal ideate "Add secure login audit history"`
2. Run `ethereal plan feature-secure-login-audit-history`
3. Run `ethereal bdd feature-secure-login-audit-history`
4. Run `ethereal review-consistency feature-secure-login-audit-history`

### Should do

* create `plan.md`
* create one or more story files under `stories/`
* create one or more `.feature` files under `bdd/`
* create `traceability/traceability-map.json`
* create `review/consistency-review.md`
* update `feature.yaml` current stage after each successful command
* write a run history entry for each stage

Why this slice first:

* it validates the complete planning-to-BDD chain
* it proves traceability before any implementation work begins
* it keeps model usage cheap while creating high-value structure

## Recommended First Vertical Slice

Build this first and nothing more:

### Slice

`ethereal-claw ideate "Add secure login audit history"`

### Should do

* create feature folder
* write `feature.yaml`
* write `ideation.md`
* create run log json
* print next-step guidance to terminal

Why this slice first:

* smallest useful loop
* validates CLI, config, provider abstraction, file system, and logging
* gives you visible progress fast

---

## Starter File Content Suggestions

## Root `package.json`

```json
{
  "name": "ethereal-claw",
  "private": true,
  "version": "0.1.0",
  "workspaces": [
    "packages/*"
  ],
  "scripts": {
    "build": "npm run build --workspaces",
    "dev": "npm run dev --workspace @ethereal-claw/cli",
    "test": "vitest run",
    "lint": "eslint .",
    "start": "node packages/cli/dist/index.js"
  },
  "engines": {
    "node": ">=22.0.0",
    "npm": ">=10.0.0"
  },
  "devDependencies": {
    "typescript": "^5.8.0",
    "vitest": "^3.1.0"
  }
}
```

## `packages/cli/src/index.ts`

```ts
import { Command } from 'commander';

const program = new Command();

program
  .name('ethereal')
  .description('CLI orchestration layer for AI-assisted SDLC')
  .version('0.1.0');

program
  .command('init')
  .description('Initialize Ethereal-CLAW in the current repository')
  .action(() => {
    console.log('Initialize command not implemented yet.');
  });

program
  .command('ideate')
  .description('Create a feature ideation artifact from a raw prompt')
  .argument('<prompt>', 'Feature prompt')
  .action((prompt: string) => {
    console.log(`Ideate command not implemented yet: ${prompt}`);
  });

program.parse();
```

## CLI Alias Strategy

Expose two entry points that run the same CLI:

* `ethereal` as the primary command
* `ec` as the short alias

In npm package terms, that means the CLI package should publish both binaries and point them to the same compiled entry file.ts import { Command } from 'commander';

const program = new Command();

program .name('ethereal-claw') .description('CLI orchestration layer for AI-assisted SDLC') .version('0.1.0');

program .command('init') .description('Initialize CLAW in the current repository') .action(() => { console.log('Initialize command not implemented yet.'); });

program .command('ideate') .description('Create a feature ideation artifact from a raw prompt') .argument('', 'Feature prompt') .action((prompt: string) => { console.log(`Ideate command not implemented yet: ${prompt}`); });

program.parse();

````

## `packages/core/src/agents/base-agent.ts`
```ts
export interface AgentInput {
  featureId?: string;
  prompt: string;
  context?: Record<string, string>;
}

export interface AgentOutput {
  summary: string;
  artifacts: Array<{
    path: string;
    content: string;
  }>;
}

export interface BaseAgent {
  readonly name: string;
  execute(input: AgentInput): Promise<AgentOutput>;
}
````

## `packages/core/src/providers/llm-provider.ts`

```ts
export interface LlmProviderRequest {
  systemPrompt: string;
  userPrompt: string;
}

export interface LlmProviderResponse {
  content: string;
}

export interface LlmProvider {
  readonly name: string;
  generate(request: LlmProviderRequest): Promise<LlmProviderResponse>;
}
```

## `packages/core/src/budget/token-usage-record.ts`

```ts
export interface TokenUsageRecord {
  stage: string;
  agentName: string;
  providerName: string;
  modelName: string;
  estimatedInputTokens: number;
  estimatedOutputTokens: number;
  actualInputTokens?: number;
  actualOutputTokens?: number;
  cumulativeRunTokens: number;
  estimatedCost?: number;
  timestamp: string;
}
```

## `packages/core/src/budget/budget-manager.ts`

```ts
export interface BudgetCheckResult {
  allowed: boolean;
  reason?: string;
  shouldDowngrade: boolean;
  warningLevel?: number;
}

export class BudgetManager {
  public constructor(
    private readonly runTokenLimit: number,
    private cumulativeTokensUsed: number = 0
  ) {}

  public canProceed(estimatedTokensForNextCall: number): BudgetCheckResult {
    const projectedUsage = this.cumulativeTokensUsed + estimatedTokensForNextCall;

    if (projectedUsage > this.runTokenLimit) {
      return {
        allowed: false,
        reason: 'Run token budget exceeded.',
        shouldDowngrade: false
      };
    }

    const usageRatio = projectedUsage / this.runTokenLimit;

    return {
      allowed: true,
      shouldDowngrade: usageRatio >= 0.75,
      warningLevel: usageRatio
    };
  }

  public recordActualUsage(tokensUsed: number): void {
    this.cumulativeTokensUsed += tokensUsed;
  }

  public getRemainingTokens(): number {
    return this.runTokenLimit - this.cumulativeTokensUsed;
  }
}
```

## `packages/core/src/providers/mock-provider.ts`

```ts
import type { LlmProvider, LlmProviderRequest, LlmProviderResponse } from './llm-provider';

export class MockProvider implements LlmProvider {
  public readonly name = 'mock';

  public async generate(request: LlmProviderRequest): Promise<LlmProviderResponse> {
    return {
      content: [
        '# Feature Ideation',
        '',
        `Input: ${request.userPrompt}`,
        '',
        '## Summary',
        'This is a mock ideation response.',
        '',
        '## Candidate Stories',
        '- Story 1',
        '- Story 2'
      ].join('\n')
    };
  }
}
```

---

## Development Standards for This Repo

* Use explicit names, not abbreviations.
* Keep orchestration logic separate from provider logic.
* Keep file-writing separate from agent reasoning.
* Prefer vertical slices over big-bang framework building.
* Every command should be testable with a mock provider.
* Every generated artifact should have a stable path.

---

## Definition of Done for the Base Scaffold

The repo base is ready when:

* `npm install` works
* `ethereal-claw init` exists
* `ethereal-claw ideate "..."` creates a feature folder
* artifacts are written to disk predictably
* a mock provider can power the first end-to-end slice
* run logs are created
* unit tests exist for command parsing and feature creation

---

## Suggested Next Build Order

1. Complete the Milestone 2 shared model changes.
2. Make `bdd` a first-class stage and command.
3. Make `review-consistency` a first-class stage and command.
4. Add traceability generation and validation.
5. Remove placeholder BDD generation from `ideate()`.
6. Refine `run()` after the new stages stabilize.
7. Only then deepen real provider integrations and prompt sophistication.

## Self-Hosting Strategy (Ethereal-CLAW building Ethereal-CLAW)

### Guiding Principle

Ethereal-CLAW can assist in building itself, but only in **controlled, review-gated phases** until Milestone 2 is fully stabilized.

### Safe Self-Hosting Capabilities (Now)

The system may safely assist with:

* ideating new features for itself
* refining plans for Milestone 2 work
* drafting stories and acceptance criteria
* drafting BDD scenarios
* generating traceability maps
* identifying ambiguity and gaps
* proposing implementation changes for human review

### Restricted Capabilities (Not Yet Safe)

The system should NOT autonomously:

* define its own feature scope without review
* implement changes from unverified stories or BDD
* modify orchestrator logic and approve its own changes
* advance workflow stages without traceability validation

### Required Safety Conditions for Deeper Self-Hosting

Before enabling stronger autonomy, the following must be true:

* `bdd` is a first-class workflow stage
* `review-consistency` is a first-class workflow stage
* traceability map is generated and validated
* placeholder BDD generation is removed from `ideate()`
* plan outputs are structured and deterministic
* stage transitions are covered by tests
* at least one full Milestone 2 vertical slice runs successfully

### Recommended Self-Hosting Workflow

Use Ethereal-CLAW to implement its own Milestone 2 features with human gates:

1. `ethereal ideate "Improve BDD traceability"`
2. `ethereal plan <feature>`
3. `ethereal bdd <feature>`
4. `ethereal review-consistency <feature>`
5. Human reviews artifacts
6. Human approves implementation work
7. Ethereal proposes implementation
8. Human approves PR

### Key Rule

> Ethereal-CLAW may assist in building itself, but may not be the final authority on correctness.

---

## Naming Recommendation

Use **CLAW** as a product nickname, but keep code names descriptive.

CLI naming convention:

* primary command: `ethereal`
* short alias: `ec`
* repo name: `ethereal-claw`
* internal term: `workflow orchestrator`

Example:

* product nickname: CLAW
* primary CLI command: `ethereal`
* short CLI alias: `ec`
* repo name: `ethereal-claw`
* npm scope: `@ethereal-claw/*`
* internal term: `workflow orchestrator`

This gives you a memorable brand without making the codebase silly.

---

## First Repo README Opening

```md
# Ethereal-CLAW

Ethereal-CLAW is a CLI-first orchestration layer for AI-assisted software development workflows.

It helps move a feature from rough idea to structured plan, BDD scenarios, implementation guidance, test planning, and review artifacts.

The first version is intentionally narrow:
- local execution
- deterministic artifact generation
- provider abstraction
- human review gates
```

---

## Historical Note — Milestone 1 Scaffold

The following scaffold section is kept as a historical reference for how the project started. The live repo has already moved beyond this point.

## What I would build next

If continuing from the current repo state, the next concrete deliverable should be:

**a real implementation for the revised Milestone 2** with:

* refinement of the existing `plan` stage
* `bdd` command
* `review-consistency` command
* BDD agent
* consistency reviewer agent
* prompt file loader
* traceability map generation
* shared types for story, acceptance criteria, and traceability
* unit tests for traceability and stage transitions

That is the smallest serious foundation for moving from ideation into implementation-ready behavior specifications on top of the code that already exists.
