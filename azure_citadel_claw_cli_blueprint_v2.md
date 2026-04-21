# Ethereal-CLAW CLI — Base Repo Blueprint

## Purpose

Build a **CLI-first orchestration layer** for an AI-assisted software development lifecycle.

The tool should let you issue commands like:

- `ethereal-claw ideate "multi-tenant auth for admin portal"`
- `ethereal-claw plan feature/auth-refresh`
- `ethereal-claw implement feature/auth-refresh`
- `ethereal-claw test feature/auth-refresh`
- `ethereal-claw review feature/auth-refresh`

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

- send low-risk, repetitive, formatting-heavy work to the cheapest available model tier
- reserve expensive models for ambiguity resolution, architecture tradeoffs, critical review, and final quality gates
- estimate token cost before each agent call
- record actual token usage after each agent call
- stop, downgrade, or ask for human intervention when the run crosses configured thresholds

The system should treat token budget as a first-class operational concern, not an afterthought.

---

## Recommended Tech Stack

Because you want a CLI-first solution and may later expose it through the web, this stack keeps the core portable.

### Phase 1

- **Node.js + TypeScript** for the CLI and orchestration core
- **npm workspaces** for monorepo organization
- **Commander** for CLI command parsing
- **Zod** for input and config validation
- **Pino** for structured logging
- **OpenAI / GitHub Copilot / Codex adapters** behind a provider abstraction
- **Markdown + YAML + JSON** for artifacts
- **Vitest** for unit tests

### Later extension

- Web terminal shell in:
  - Blazor
  - Next.js
  - or a lightweight terminal UI in the browser

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

- CLI first
- deterministic file layout
- one workflow state per feature
- human review gates
- provider-agnostic LLM integration
- budget-aware model routing
- graceful downgrade to cheaper models
- BDD drives implementation and testing

---

## First Release Scope

### In scope

- Create feature workspace
- Generate plan artifacts
- Generate user stories and acceptance criteria
- Generate implementation task list
- Generate test scenarios
- Log all workflow steps
- Dry-run mode

### Out of scope for v1

- Automatic code merge to main
- Autonomous deployment to production
- Parallel multi-repo execution
- Sophisticated agent memory
- Browser UI

---

## Repo Structure

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
│     ├─ ideation.md
│     ├─ planner.md
│     ├─ story-writer.md
│     ├─ reviewer.md
│     ├─ implementer.md
│     └─ tester.md
├─ config/
│  ├─ ethereal-claw.config.example.yaml
│  └─ agent-policies.yaml
├─ features/
│  └─ .gitkeep
├─ runs/
│  └─ .gitkeep
├─ packages/
│  ├─ cli/
│  │  ├─ package.json
│  │  ├─ tsconfig.json
│  │  └─ src/
│  │     ├─ index.ts
│  │     ├─ commands/
│  │     │  ├─ init-command.ts
│  │     │  ├─ ideate-command.ts
│  │     │  ├─ plan-command.ts
│  │     │  ├─ implement-command.ts
│  │     │  ├─ test-command.ts
│  │     │  ├─ review-command.ts
│  │     │  └─ run-command.ts
│  │     └─ presentation/
│  │        └─ console-output.ts
│  ├─ core/
│  │  ├─ package.json
│  │  ├─ tsconfig.json
│  │  └─ src/
│  │     ├─ orchestration/
│  │     │  ├─ workflow-orchestrator.ts
│  │     │  ├─ workflow-step.ts
│  │     │  ├─ workflow-context.ts
│  │     │  └─ run-result.ts
│  │     ├─ agents/
│  │     │  ├─ base-agent.ts
│  │     │  ├─ planner-agent.ts
│  │     │  ├─ reviewer-agent.ts
│  │     │  ├─ story-agent.ts
│  │     │  ├─ implementer-agent.ts
│  │     │  ├─ tester-agent.ts
│  │     │  └─ agent-registry.ts
│  │     ├─ artifacts/
│  │     │  ├─ artifact-service.ts
│  │     │  ├─ feature-structure-service.ts
│  │     │  └─ templates/
│  │     ├─ providers/
│  │     │  ├─ llm-provider.ts
│  │     │  ├─ openai-provider.ts
│  │     │  ├─ github-model-provider.ts
│  │     │  └─ mock-provider.ts
│  │     ├─ config/
│  │     │  ├─ load-config.ts
│  │     │  └─ config-schema.ts
│  │     ├─ git/
│  │     │  └─ git-service.ts
│  │     ├─ logging/
│  │     │  └─ logger.ts
│  │     └─ utils/
│  │        ├─ file-system.ts
│  │        └─ timestamps.ts
│  └─ shared/
│     ├─ package.json
│     ├─ tsconfig.json
│     └─ src/
│        ├─ types/
│        │  ├─ feature.ts
│        │  ├─ story.ts
│        │  ├─ acceptance-criteria.ts
│        │  ├─ run.ts
│        │  └─ agent.ts
│        └─ constants/
│           └─ workflow-stages.ts
└─ tests/
   ├─ unit/
   └─ fixtures/
```

---

## Feature Artifact Structure

Each feature gets a stable workspace.

```text
features/
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
   └─ run-history/
      ├─ run-2026-04-17T090000Z.json
      └─ run-2026-04-17T093000Z.json
```

---

## Core Workflow

### 1. Ideate

Input:

- rough feature request

Output:

- feature summary
- assumptions
- risks
- candidate stories

### 2. Plan

Input:

- approved feature summary

Output:

- story breakdown
- dependency order
- implementation tasks
- review points

### 3. Write BDD

Input:

- user stories

Output:

- Gherkin scenarios
- acceptance criteria mapping

### 4. Consistency Review

Checks:

- does every story map to acceptance criteria?
- do implementation tasks trace back to stories?
- are test scenarios missing for any criteria?

### 5. Implement

Output:

- proposed code changes
- file-level change plan
- implementation notes

### 6. Test

Output:

- unit/integration test suggestions
- manual test checklist
- gaps / risks

### 7. Review

Output:

- architecture review
- code quality review
- unresolved questions

---

## Budget-Aware Model Routing

Each workflow step should declare:

- required quality level
- maximum allowed token budget
- whether it may use a low-cost model
- whether fallback or downgrade is allowed

### Suggested routing policy

#### Use low-cost models for:

- formatting markdown artifacts
- converting notes into template structure
- story splitting when requirements are already clear
- generating checklists
- summarizing run logs
- rewriting acceptance criteria into a standard format
- simple traceability checks

#### Use stronger models for:

- resolving ambiguity in requirements
- architecture and security decisions
- implementation planning across multiple modules
- code review on risky changes
- contradiction detection across many artifacts
- final quality gate before you spend more money or merge code

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

- **cheap/free mini model first**
- escalate only on failure, ambiguity, or risk
- never use a premium model just for formatting or boilerplate

---

## Token Monitoring and Budget Controls

The orchestrator should maintain both **run-level** and **session-level** counters.

### Track at minimum

- estimated input tokens
- estimated output tokens
- actual prompt tokens
- actual completion tokens
- cumulative tokens per run
- cumulative tokens per provider
- estimated cost per call
- estimated remaining budget for the run

### Control actions

- warn at 50 percent of budget
- require confirmation or auto-downgrade at 75 percent
- stop non-critical steps at 90 percent
- abort run when hard cap is reached

### Required behaviors

- preflight estimate before every model call
- compare estimate against remaining run budget
- downgrade model if possible
- trim context before escalating
- cache reusable artifacts and summaries
- reuse prior outputs instead of resending the full history

### Hard rule

Never let the orchestrator blindly continue spending tokens because a workflow graph says so.

---

## Agent Definitions

## 1. Ideation Agent

**Purpose:** turn a raw request into a feature concept.

**Responsibilities:**

- summarize intent
- identify assumptions
- identify risks
- suggest bounded scope

## 2. Planning Agent

**Purpose:** create an implementation-ready plan.

**Responsibilities:**

- break feature into stories
- sequence work
- identify dependencies
- recommend vertical slices

## 3. Story / BDD Agent

**Purpose:** convert stories into testable behavior.

**Responsibilities:**

- write user stories
- write acceptance criteria
- write Gherkin scenarios
- highlight ambiguity

## 4. Consistency Reviewer Agent

**Purpose:** detect gaps and contradictions before coding.

**Responsibilities:**

- cross-check stories, AC, and tasks
- flag unclear wording
- flag non-testable acceptance criteria

## 5. Implementer Agent

**Purpose:** propose code changes aligned to BDD.

**Responsibilities:**

- suggest file changes
- scaffold implementation
- document rationale
- stay inside architecture guardrails

## 6. Test Agent

**Purpose:** ensure coverage against behavior.

**Responsibilities:**

- generate unit test ideas
- generate integration test ideas
- generate manual test checklist
- map tests back to scenarios

## 7. Review Agent

**Purpose:** final AI review before human verification.

**Responsibilities:**

- code quality checks
- design consistency checks
- risk notes
- tech debt notes

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

- creates config file if missing
- verifies folders
- validates provider settings

#### `ethereal-claw ideate <prompt>`

- creates feature folder
- writes ideation artifact
- generates feature metadata

#### `ethereal-claw plan <feature-id>`

- writes plan.md
- writes implementation task draft

#### `ethereal-claw bdd <feature-id>`

- writes stories and `.feature` files

#### `ethereal-claw review-consistency <feature-id>`

- checks traceability from story to BDD to tasks

#### `ethereal-claw implement <feature-id>`

- produces implementation proposal
- later can optionally patch code

#### `ethereal-claw test <feature-id>`

- writes test plan and coverage notes

#### `ethereal-claw run <feature-id>`

- executes multiple steps in sequence
- logs each stage

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

- feature id
- stage
- agent used
- provider used
- prompt hash
- artifact outputs
- success/failure
- timestamp

This gives you auditability and reproducibility.

---

## Starter Prompt Strategy

Store prompts as versioned markdown files in `docs/prompts/`.

Each prompt should include:

- purpose
- inputs
- required output schema
- constraints
- definition of done

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
providers:
  modelTiers:
    low:
      provider: openai
      model: gpt-mini
    medium:
      provider: openai
      model: gpt-5.4
    high:
      provider: githubModels
      model: gpt-4.1


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
artifacts:
  featuresDirectory: ./features
  runsDirectory: ./runs
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

- size of input context
- expected output size
- cheapest acceptable model tier
- whether cached summaries can replace full artifacts

### 2. Compress context aggressively

Do not keep resending:

- full story files
- full logs
- whole codebases
- repeated prompt boilerplate

Instead send:

- short structured summaries
- selected excerpts
- hashes and references to existing files
- only the files relevant to the current stage

### 3. Cache derived artifacts

If a low-cost model already produced:

- normalized stories
- reformatted AC
- traceability maps
- implementation summaries

then reuse those rather than regenerating them.

### 4. Escalate late

Only send work to a stronger model when:

- the cheap model fails quality checks
- the task is truly high-risk
- ambiguity remains after one cheap pass

### 5. Separate orchestration from generation

Budget logic belongs in the orchestrator, not buried inside each agent.

---

## Minimal Milestone Plan

## Milestone 1 — Local CLI Skeleton

Status: in PR

Delivered:

- repo initialized
- `ethereal` / `ec` CLI entry points
- `init` command
- `ideate` command
- local artifact writing
- mock provider
- budget manager
- token estimate utility
- run budget log

Exit criteria:

- feature workspace can be created from one command
- generated files can be inspected locally
- budget tracking is visible in the run log

## Milestone 2 — Planning + Stories + BDD + Consistency Review

### Goal
Move a feature from ideation into an implementation-ready planning state with traceable stories, acceptance criteria, and Gherkin scenarios.

### Deliver

- `ethereal plan <feature-id>`
- `ec plan <feature-id>`
- `ethereal bdd <feature-id>`
- `ec bdd <feature-id>`
- `ethereal review-consistency <feature-id>`
- `ec review-consistency <feature-id>`
- prompt file system for planning, story writing, BDD, and consistency review
- structured story artifacts
- `.feature` file generation
- traceability metadata between plan, stories, AC, and BDD
- consistency review artifact

### Success criteria

- one ideated feature can move to `plan`, `stories`, `bdd`, and `review-consistency`
- every generated story has explicit acceptance criteria
- every BDD scenario maps back to a story
- consistency review flags missing traceability and ambiguity
- token-safe routing still defaults to low-cost models for formatting and structure

## Milestone 3 — Orchestrated Run

Deliver:

- `ethereal run`
- workflow engine
- run logs
- step status output

Success criteria:

- one command can run several stages in sequence

## Milestone 4 — Real Provider Integration

Deliver:

- provider abstraction wired to real APIs
- retry and rate-limit handling
- structured prompt/response tracing

Success criteria:

- same workflow works with mock and real provider

## Milestone 5 — Code Change Proposal

Deliver:

- implementation planning artifacts
- optional code patch proposal mode
- review output

Success criteria:

- tool can generate implementation guidance against repo context

---

## Milestone 2 Scope and Artifact Model

### New commands

#### `ethereal plan <feature-id>`
Creates or updates:
- `features/<feature-id>/plan.md`
- `features/<feature-id>/implementation/tasks.md`
- feature metadata stage transition to `plan`
- run history entry

#### `ethereal bdd <feature-id>`
Creates or updates:
- `features/<feature-id>/stories/*.md`
- `features/<feature-id>/bdd/*.feature`
- traceability map file
- feature metadata stage transition to `bdd`
- run history entry

#### `ethereal review-consistency <feature-id>`
Creates or updates:
- `features/<feature-id>/review/consistency-review.md`
- feature metadata stage transition to `review-consistency`
- run history entry

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
      "bddFiles": ["001-session-timeout.feature"]
    }
  ]
}
```

### New prompt files

Add under `docs/prompts/`:
- `planner.md`
- `story-writer.md`
- `bdd-writer.md`
- `consistency-reviewer.md`

Each prompt should define:
- input files
- output schema
- traceability requirements
- token budget expectation
- escalation conditions

---

## Milestone 2 Build Order

1. Add prompt file loader support.
2. Implement planning agent.
3. Implement `plan` command.
4. Add story artifact template and generator.
5. Implement BDD agent.
6. Implement `bdd` command.
7. Implement traceability map generation.
8. Implement consistency reviewer agent.
9. Implement `review-consistency` command.
10. Add unit tests for plan-to-story-to-bdd traceability.

## Milestone 2 Definition of Done

Milestone 2 is complete when:

- `ethereal plan <feature-id>` works
- `ec plan <feature-id>` works
- `ethereal bdd <feature-id>` works
- `ec bdd <feature-id>` works
- `ethereal review-consistency <feature-id>` works
- `ec review-consistency <feature-id>` works
- plan artifact is created predictably
- at least one story markdown file is created predictably
- at least one `.feature` file is created predictably
- traceability map is created predictably
- consistency review artifact is created predictably
- feature stage transitions are recorded
- run logs capture token usage for each new stage

---

## Recommended Milestone 2 Vertical Slice

Build this first and nothing more:

### Slice

1. Run `ethereal ideate "Add secure login audit history"`
2. Run `ethereal plan feature-secure-login-audit-history`
3. Run `ethereal bdd feature-secure-login-audit-history`
4. Run `ethereal review-consistency feature-secure-login-audit-history`

### Should do

- create `plan.md`
- create one or more story files under `stories/`
- create one or more `.feature` files under `bdd/`
- create `traceability/traceability-map.json`
- create `review/consistency-review.md`
- update `feature.yaml` current stage after each successful command
- write a run history entry for each stage

Why this slice first:

- it validates the complete planning-to-BDD chain
- it proves traceability before any implementation work begins
- it keeps model usage cheap while creating high-value structure

## Recommended First Vertical Slice

Build this first and nothing more:

### Slice

`ethereal-claw ideate "Add secure login audit history"`

### Should do

- create feature folder
- write `feature.yaml`
- write `ideation.md`
- create run log json
- print next-step guidance to terminal

Why this slice first:

- smallest useful loop
- validates CLI, config, provider abstraction, file system, and logging
- gives you visible progress fast

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

- `ethereal` as the primary command
- `ec` as the short alias

In npm package terms, that means the CLI package should publish both binaries and point them to the same compiled entry file:

```json
{
  "bin": {
    "ethereal-claw": "dist/index.js",
    "ethereal": "dist/index.js",
    "ec": "dist/index.js"
  }
}
```

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
```

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

- Use explicit names, not abbreviations.
- Keep orchestration logic separate from provider logic.
- Keep file-writing separate from agent reasoning.
- Prefer vertical slices over big-bang framework building.
- Every command should be testable with a mock provider.
- Every generated artifact should have a stable path.

---

## Definition of Done for the Base Scaffold

The repo base is ready when:

- `npm install` works
- `ethereal-claw init` exists
- `ethereal-claw ideate "..."` creates a feature folder
- artifacts are written to disk predictably
- a mock provider can power the first end-to-end slice
- run logs are created
- unit tests exist for command parsing and feature creation

---

## Suggested Next Build Order

1. Create the monorepo skeleton.
2. Implement config loading.
3. Implement mock provider.
4. Implement feature directory creation.
5. Implement `ethereal-claw ideate`.
6. Add run logging.
7. Add `ethereal-claw plan`.
8. Add BDD generation.
9. Add consistency review.
10. Only then wire in real model providers.

---

## Naming Recommendation

Use **CLAW** as a product nickname, but keep code names descriptive.

CLI naming convention:

- primary command: `ethereal`
- short alias: `ec`
- repo name: `ethereal-claw`
- internal term: `workflow orchestrator`

Example:

- product nickname: CLAW
- primary CLI command: `ethereal`
- short CLI alias: `ec`
- repo name: `ethereal-claw`
- npm scope: `@ethereal-claw/*`
- internal term: `workflow orchestrator`

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

## Milestone 1 Scaffold — Exact Starter Layout

This is the first real implementation target.

### Goal

A runnable local CLI that supports:

- `ethereal init`
- `ec init`
- `ethereal ideate "..."`
- `ec ideate "..."`

and does all of the following:

- creates the local config file if missing
- creates `features/` and `runs/`
- creates a feature workspace
- writes `feature.yaml`
- writes `ideation.md`
- writes a run log JSON file
- tracks estimated and actual token usage through the budget manager
- uses the mock provider by default

### Initial file set

```text
ethereal-claw/
├─ package.json
├─ tsconfig.base.json
├─ .gitignore
├─ README.md
├─ config/
│  └─ ethereal-claw.config.example.yaml
├─ features/
│  └─ .gitkeep
├─ runs/
│  └─ .gitkeep
├─ packages/
│  ├─ cli/
│  │  ├─ package.json
│  │  ├─ tsconfig.json
│  │  └─ src/
│  │     ├─ index.ts
│  │     └─ commands/
│  │        ├─ init-command.ts
│  │        └─ ideate-command.ts
│  ├─ core/
│  │  ├─ package.json
│  │  ├─ tsconfig.json
│  │  └─ src/
│  │     ├─ agents/
│  │     │  ├─ base-agent.ts
│  │     │  └─ ideation-agent.ts
│  │     ├─ artifacts/
│  │     │  ├─ artifact-service.ts
│  │     │  └─ feature-structure-service.ts
│  │     ├─ budget/
│  │     │  ├─ budget-manager.ts
│  │     │  ├─ token-estimator.ts
│  │     │  └─ token-usage-record.ts
│  │     ├─ config/
│  │     │  ├─ config-schema.ts
│  │     │  └─ load-config.ts
│  │     ├─ providers/
│  │     │  ├─ llm-provider.ts
│  │     │  └─ mock-provider.ts
│  │     ├─ runs/
│  │     │  └─ run-log-service.ts
│  │     └─ utils/
│  │        ├─ file-system.ts
│  │        ├─ slugify.ts
│  │        └─ timestamps.ts
│  └─ shared/
│     ├─ package.json
│     ├─ tsconfig.json
│     └─ src/
│        └─ types/
│           ├─ feature.ts
│           └─ run.ts
└─ tests/
   └─ unit/
```

### Milestone 1 build order

1. Create workspace root files.
2. Wire both CLI binaries: `ethereal` and `ec`.
3. Implement config loading.
4. Implement mock provider.
5. Implement token estimator and budget manager.
6. Implement feature structure service.
7. Implement run log service.
8. Implement `init` command.
9. Implement `ideate` command.
10. Add a minimal unit test pass.

### Milestone 1 done when

- `npm install` succeeds
- `npm run build` succeeds
- `ethereal init` works
- `ec init` works
- `ethereal ideate "Add secure login audit history"` works
- `ec ideate "Add secure login audit history"` works
- feature artifacts are written to disk
- run log is written to disk
- budget tracking is visible in the run log

## What I would build next

If continuing from this blueprint after Milestone 1, the next concrete deliverable should be:

**a real implementation for Milestone 2** with:

- `plan` command
- `bdd` command
- `review-consistency` command
- planning agent
- story writer agent
- BDD writer agent
- consistency reviewer agent
- prompt file loader
- traceability map generation
- unit tests for traceability and stage transitions

That is the smallest serious foundation for moving from ideation into implementation-ready behavior specifications.
