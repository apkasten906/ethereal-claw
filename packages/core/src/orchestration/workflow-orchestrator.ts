import { access } from "node:fs/promises";
import path from "node:path";
import type { AgentExecution, FeatureRecord, RunLog, WorkflowStage } from "@ethereal-claw/shared";
import { BudgetManager } from "../budget/budget-manager.js";
import { TokenUsageMonitor } from "../budget/token-usage-monitor.js";
import { createAgents } from "../agents/agent-registry.js";
import { ArtifactService } from "../artifacts/artifact-service.js";
import { FeatureStructureService } from "../artifacts/feature-structure-service.js";
import type { AgentResult } from "../agents/base-agent.js";
import type { ClawConfig } from "../config/config-schema.js";
import { resolveWorkspacePaths } from "../config/workspace-paths.js";
import { GitService } from "../git/git-service.js";
import { createLogger } from "../logging/logger.js";
import type { LlmProvider } from "../providers/llm-provider.js";
import { slugify } from "../utils/slugs.js";
import { nowUtcIso, runId } from "../utils/timestamps.js";
import type { RunResult } from "./run-result.js";

export interface StageOptions {
  featureSlug?: string;
  title?: string;
  request: string;
  dryRun?: boolean;
}

export class WorkflowOrchestrator {
  private readonly logger = createLogger();
  private readonly budget: BudgetManager;
  private readonly usage = new TokenUsageMonitor();
  private readonly artifacts: ArtifactService;
  private readonly featureStructure: FeatureStructureService;
  private readonly git = new GitService();
  private readonly agents: ReturnType<typeof createAgents>;

  constructor(
    private readonly provider: LlmProvider,
    private readonly config: ClawConfig,
    readonly rootDir = process.cwd()
  ) {
    this.budget = new BudgetManager(config.budget);
    const workspacePaths = resolveWorkspacePaths(this.rootDir, config.workspace);
    this.artifacts = new ArtifactService(workspacePaths);
    this.featureStructure = new FeatureStructureService(workspacePaths);
    this.agents = createAgents(provider);
  }

  async init(): Promise<void> {
    await this.artifacts.ensureRuntimeDirectories();
  }

  async ideate(options: StageOptions): Promise<RunResult> {
    this.resetStageState();
    const startedAt = nowUtcIso();
    const feature = this.buildFeature(options);

    try {

      await this.featureStructure.createWorkspace(feature);
      
      const ideation = await this.agents.ideation.run(options.request);
      this.recordExecution("ideation", ideation, "ideate");

      const storyDraft = await this.agents.story.run(options.request);
      this.recordExecution("story", storyDraft, "ideate");

      await this.artifacts.writeFeatureArtifact(feature.slug, "ideation.md", ideation.content);
      await this.artifacts.writeFeatureArtifact(feature.slug, path.join("stories", "001-initial-story.md"), storyDraft.content);
      await this.artifacts.writeFeatureArtifact(feature.slug, path.join("bdd", "001-initial.feature"), this.wrapGherkin(feature.title));

      return this.finishRun(feature.slug, "ideate", startedAt, options.dryRun ?? false, ["Ideation artifacts generated."]);
    } catch (error) {
      await this.finishRun(feature.slug, "ideate", startedAt, options.dryRun ?? false,
        [`Error: ${error instanceof Error ? error.message : String(error)}`], false)
        .catch((logError: unknown) => { this.logger.warn({ logError }, "failed to write error run log"); });
      throw error;
    }
  }

  async plan(options: StageOptions): Promise<RunResult> {
    this.resetStageState();
    const startedAt = nowUtcIso();
    const featureSlug = this.resolveFeatureSlug(options);
    await this.ensureExistingFeatureWorkspace(featureSlug);

    try {
      const plan = await this.agents.planner.run(options.request);
      this.recordExecution("planner", plan, "plan");

      await this.artifacts.writeFeatureArtifact(featureSlug, "plan.md", plan.content);
      await this.artifacts.writeFeatureArtifact(featureSlug, path.join("implementation", "tasks.md"), this.defaultTasks());

      return this.finishRun(featureSlug, "plan", startedAt, options.dryRun ?? false, ["Planning artifacts generated."]);
    } catch (error) {
      await this.finishRun(featureSlug, "plan", startedAt, options.dryRun ?? false,
        [`Error: ${error instanceof Error ? error.message : String(error)}`], false)
        .catch((logError: unknown) => { this.logger.warn({ logError }, "failed to write error run log"); });
      throw error;
    }
  }

  async implement(options: StageOptions): Promise<RunResult> {
    this.resetStageState();
    const startedAt = nowUtcIso();
    const featureSlug = this.resolveFeatureSlug(options);
    await this.ensureExistingFeatureWorkspace(featureSlug);

    try {
      const result = await this.agents.implementer.run(options.request);
      this.recordExecution("implementer", result, "implement");

      await this.artifacts.writeFeatureArtifact(featureSlug, path.join("implementation", "change-summary.md"), result.content);

      return this.finishRun(featureSlug, "implement", startedAt, options.dryRun ?? false, ["Implementation plan generated."]);
    } catch (error) {
      await this.finishRun(featureSlug, "implement", startedAt, options.dryRun ?? false,
        [`Error: ${error instanceof Error ? error.message : String(error)}`], false)
        .catch((logError: unknown) => { this.logger.warn({ logError }, "failed to write error run log"); });
      throw error;
    }
  }

  async test(options: StageOptions): Promise<RunResult> {
    this.resetStageState();
    const startedAt = nowUtcIso();
    const featureSlug = this.resolveFeatureSlug(options);
    await this.ensureExistingFeatureWorkspace(featureSlug);

    try {
      const result = await this.agents.tester.run(options.request);
      this.recordExecution("tester", result, "test");

      await this.artifacts.writeFeatureArtifact(featureSlug, path.join("tests", "test-plan.md"), result.content);
      await this.artifacts.writeFeatureArtifact(featureSlug, path.join("tests", "generated-tests.md"), this.defaultGeneratedTests());

      return this.finishRun(featureSlug, "test", startedAt, options.dryRun ?? false, ["Test artifacts generated."]);
    } catch (error) {
      await this.finishRun(featureSlug, "test", startedAt, options.dryRun ?? false,
        [`Error: ${error instanceof Error ? error.message : String(error)}`], false)
        .catch((logError: unknown) => { this.logger.warn({ logError }, "failed to write error run log"); });
      throw error;
    }
  }

  async review(options: StageOptions): Promise<RunResult> {
    this.resetStageState();
    const startedAt = nowUtcIso();
    const featureSlug = this.resolveFeatureSlug(options);
    await this.ensureExistingFeatureWorkspace(featureSlug);

    try {
      const result = await this.agents.reviewer.run(options.request);
      this.recordExecution("reviewer", result, "review");

      await this.artifacts.writeFeatureArtifact(featureSlug, path.join("review", "consistency-review.md"), result.content);
      await this.artifacts.writeFeatureArtifact(featureSlug, path.join("review", "code-review.md"), "Human review gate pending.\n");

      return this.finishRun(featureSlug, "review", startedAt, options.dryRun ?? false, ["Review artifacts generated."]);
    } catch (error) {
      await this.finishRun(featureSlug, "review", startedAt, options.dryRun ?? false,
        [`Error: ${error instanceof Error ? error.message : String(error)}`], false)
        .catch((logError: unknown) => { this.logger.warn({ logError }, "failed to write error run log"); });
      throw error;
    }
  }

  async run(options: StageOptions): Promise<RunResult[]> {
    const featureSlug = this.resolveFeatureSlug(options);
    await this.ensureExistingFeatureWorkspace(featureSlug);

    return [
      await this.plan({ ...options, featureSlug }),
      await this.implement({ ...options, featureSlug }),
      await this.test({ ...options, featureSlug }),
      await this.review({ ...options, featureSlug })
    ];
  }

  private buildFeature(options: StageOptions): FeatureRecord {
    const title = options.title ?? options.request;
    const slug = this.resolveFeatureSlug(options, title);
    const timestamp = nowUtcIso();

    return {
      slug,
      title,
      request: options.request,
      status: "draft",
      createdAt: timestamp,
      updatedAt: timestamp
    };
  }

  private resolveFeatureSlug(options: StageOptions, title = options.title ?? options.request): string {
    if (options.featureSlug) {
      return options.featureSlug;
    }

    const slug = slugify(title);
    if (!slug) {
      throw new Error("Feature request must contain at least one alphanumeric character to generate a slug.");
    }

    return `feature-${slug}`;
  }

  private resetStageState(): void {
    this.usage.reset();
    this.budget.reset();
  }

  private async ensureExistingFeatureWorkspace(featureSlug: string): Promise<void> {
    const featurePath = this.featureStructure.featureMetadataPath(featureSlug);

    try {
      await access(featurePath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        throw error;
      }

      throw new Error(
        `Feature workspace "${featureSlug}" does not exist. Run the ideate stage first or provide a valid feature slug.`,
        { cause: error }
      );
    }
  }

  private recordExecution(agent: AgentExecution["agent"], result: AgentResult, stage: WorkflowStage): void {
    this.usage.record({
      agent,
      step: stage,
      tier: result.tier,
      estimatedInputTokens: result.promptTokens,
      estimatedOutputTokens: result.completionTokens,
      actualPromptTokens: result.promptTokens,
      actualCompletionTokens: result.completionTokens,
      estimatedCostUsd: result.estimatedCostUsd
    });

    const snapshot = this.budget.record(result.estimatedCostUsd);
    this.logger.info({ agent, stage, budget: snapshot }, "workflow step recorded");

    if (snapshot.status === "stop" || snapshot.status === "hard-stop") {
      throw new Error(
        `Budget ${snapshot.status}: $${snapshot.spentUsd.toFixed(4)} spent (${snapshot.percentConsumed}% consumed, $${snapshot.remainingUsd.toFixed(4)} remaining). Reduce your request scope or increase the run budget.`
      );
    }
  }

  private async finishRun(
    featureSlug: string,
    stage: WorkflowStage,
    startedAt: string,
    dryRun: boolean,
    notes: string[],
    success = true
  ): Promise<RunResult> {
    const branch = await this.git.currentBranch(this.rootDir);
    const run: RunLog = {
      id: `run-${runId()}`,
      featureSlug,
      stage,
      startedAt,
      completedAt: nowUtcIso(),
      success,
      dryRun,
      executions: this.usage.all(),
      notes: branch ? [...notes, `branch=${branch}`] : notes
    };

    await this.artifacts.writeRunLog(run);
    return { success, run };
  }

  private wrapGherkin(title: string): string {
    const safeTitle = title.replaceAll(/[\r\n]+/g, " ").trim();
    return [
      `Feature: ${safeTitle}`,
      "",
      "  Scenario: Initial workflow scaffold",
      "    Given a feature request exists",
      "    When the orchestrator creates artifacts",
      "    Then the feature workspace should contain BDD placeholders"
    ].join("\n");
  }

  private defaultTasks(): string {
    return [
      "# Implementation Tasks",
      "",
      "- Confirm bounded scope and acceptance criteria.",
      "- Refine story decomposition into vertical slices.",
      "- Add human review checkpoints before coding begins."
    ].join("\n");
  }

  private defaultGeneratedTests(): string {
    return [
      "# Generated Tests",
      "",
      "- Verify each acceptance criterion has at least one automated test candidate.",
      "- Verify run logs capture budget and token usage.",
      "- Verify dry-run mode writes artifacts without code changes."
    ].join("\n");
  }
}
