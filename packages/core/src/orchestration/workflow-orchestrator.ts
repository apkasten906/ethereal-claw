import { access } from "node:fs/promises";
import path from "node:path";
import type { AcceptanceCriterion, AgentExecution, FeatureRecord, RunLog, Story, WorkflowStage } from "@ethereal-claw/shared";
import { BudgetManager } from "../budget/budget-manager.js";
import { TokenUsageMonitor } from "../budget/token-usage-monitor.js";
import { createAgents } from "../agents/agent-registry.js";
import { ArtifactService } from "../artifacts/artifact-service.js";
import { FeatureStructureService } from "../artifacts/feature-structure-service.js";
import { extractBddScenarioRefs, parseStoryMarkdown, renderStoryMarkdown, StoryArtifactError } from "../artifacts/story-artifact.js";
import { parseTraceabilityMap, TraceabilityMapError, type TraceabilityMap } from "../artifacts/traceability-map.js";
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
  overwriteExisting?: boolean;
}

type ConsistencyReviewStatus = "ready-for-implement" | "needs-attention";

interface ConsistencyReviewResult {
  content: string;
  findings: string[];
  status: ConsistencyReviewStatus;
}

export class FeatureWorkspaceConflictError extends Error {
  constructor(
    readonly featureSlug: string,
    message = `Feature workspace "${featureSlug}" already exists. Re-run with overwrite enabled to replace it.`
  ) {
    super(message);
  }
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
    const workspaceExists = await this.featureStructure.workspaceExists(feature.slug);
    if (workspaceExists && options.overwriteExisting !== true) {
      throw new FeatureWorkspaceConflictError(feature.slug);
    }

    const overwriteExisting = options.overwriteExisting === true && workspaceExists;
    let stagingRoot: string | undefined;
    let replacement: import("../artifacts/feature-structure-service.js").WorkspaceReplacement | undefined;
    let result!: RunResult;

    try {
      if (overwriteExisting) {
        stagingRoot = await this.featureStructure.createStagingWorkspace(feature);
      } else {
        await this.featureStructure.createWorkspace(feature);
      }
      const ideation = await this.agents.ideation.run(options.request);
      this.recordExecution("ideation", ideation, "ideate");
      const ideationPath = "ideation.md";
      if (stagingRoot) {
        await this.featureStructure.writeWorkspaceArtifact(stagingRoot, ideationPath, ideation.content);
        replacement = await this.featureStructure.replaceWorkspaceFromStaging(feature.slug, stagingRoot);
      } else {
        await this.artifacts.writeFeatureArtifact(feature.slug, ideationPath, ideation.content);
      }

      result = await this.finishRun(feature.slug, "ideate", startedAt, options.dryRun ?? false, ["Ideation artifacts generated."]);
    } catch (error) {
      if (replacement) {
        await replacement.rollback().catch((rollbackError: unknown) => {
          this.logger.warn({ rollbackError }, "failed to restore overwritten feature workspace");
        });
      } else if (stagingRoot) {
        await this.featureStructure.discardWorkspaceRoot(stagingRoot).catch((discardError: unknown) => {
          this.logger.warn({ discardError }, "failed to discard staged feature workspace");
        });
      }
      await this.finishRun(feature.slug, "ideate", startedAt, options.dryRun ?? false,
        [`Error: ${error instanceof Error ? error.message : String(error)}`], false)
        .catch((logError: unknown) => { this.logger.warn({ logError }, "failed to write error run log"); });
      throw error;
    }

    await replacement?.finalize().catch((finalizeError: unknown) => {
      this.logger.warn({ finalizeError }, "failed to clean up overwritten feature workspace backup");
    });

    return result;
  }

  async plan(options: StageOptions): Promise<RunResult> {
    this.resetStageState();
    const startedAt = nowUtcIso();
    const featureSlug = this.resolveFeatureSlug(options);
    await this.ensureExistingFeatureWorkspace(featureSlug);

    try {
      await this.ensureFeatureArtifacts(featureSlug, ["ideation.md"], "Plan requires ideation artifacts. Run `ec ideate` first.");
      const plan = await this.agents.planner.run(options.request);
      this.recordExecution("planner", plan, "plan");
      const storyDraft = await this.agents.story.run(options.request);
      this.recordExecution("story", storyDraft, "plan");
      const { story, usedFallback } = this.resolvePlannedStory(storyDraft.content, options.request);
      const planPath = "plan.md";
      const storyPath = path.join("stories", "001-initial-story.md");
      const tasksPath = path.join("implementation", "tasks.md");
      const storyContent = renderStoryMarkdown(story);

      await this.assertSafeToWriteArtifact(featureSlug, planPath, plan.content);
      await this.assertSafeToWriteStory(featureSlug, storyPath, storyContent, story);
      await this.assertSafeToWriteArtifact(featureSlug, tasksPath, this.defaultTasks());
      await this.artifacts.writeFeatureArtifact(featureSlug, planPath, plan.content);
      await this.artifacts.writeFeatureArtifact(featureSlug, storyPath, storyContent);
      await this.artifacts.writeFeatureArtifact(featureSlug, tasksPath, this.defaultTasks());

      return this.finishRun(
        featureSlug,
        "plan",
        startedAt,
        options.dryRun ?? false,
        usedFallback
          ? [
            "Planning artifacts generated.",
            "Structured story agent output is not implemented yet; used the transitional story scaffold."
          ]
          : ["Planning artifacts generated."]
      );
    } catch (error) {
      await this.finishRun(featureSlug, "plan", startedAt, options.dryRun ?? false,
        [`Error: ${error instanceof Error ? error.message : String(error)}`], false)
        .catch((logError: unknown) => { this.logger.warn({ logError }, "failed to write error run log"); });
      throw error;
    }
  }

  async bdd(options: StageOptions): Promise<RunResult> {
    this.resetStageState();
    const startedAt = nowUtcIso();
    const featureSlug = this.resolveFeatureSlug(options);
    await this.ensureExistingFeatureWorkspace(featureSlug);

    try {
      await this.ensureFeatureArtifacts(
        featureSlug,
        ["plan.md", path.join("stories", "001-initial-story.md")],
        "BDD requires planned stories and a plan. Run `ec plan` first."
      );
      const feature = await this.featureStructure.loadFeature(featureSlug);
      const story = await this.loadPrimaryStory(featureSlug);
      const bddContent = this.renderGherkin(feature.title, story);
      const traceabilityContent = this.buildTraceabilityMap(featureSlug, story);
      const bddPath = path.join("bdd", "001-initial.feature");
      const traceabilityPath = path.join("traceability", "traceability-map.json");

      await this.assertSafeToWriteArtifact(featureSlug, bddPath, bddContent);
      await this.assertSafeToWriteArtifact(featureSlug, traceabilityPath, traceabilityContent);
      await this.artifacts.writeFeatureArtifact(
        featureSlug,
        bddPath,
        bddContent
      );
      await this.artifacts.writeFeatureArtifact(
        featureSlug,
        traceabilityPath,
        traceabilityContent
      );

      return this.finishRun(featureSlug, "bdd", startedAt, options.dryRun ?? false, ["BDD and traceability artifacts generated."]);
    } catch (error) {
      await this.finishRun(featureSlug, "bdd", startedAt, options.dryRun ?? false,
        [`Error: ${error instanceof Error ? error.message : String(error)}`], false)
        .catch((logError: unknown) => { this.logger.warn({ logError }, "failed to write error run log"); });
      throw error;
    }
  }

  async reviewConsistency(options: StageOptions): Promise<RunResult> {
    this.resetStageState();
    const startedAt = nowUtcIso();
    const featureSlug = this.resolveFeatureSlug(options);
    await this.ensureExistingFeatureWorkspace(featureSlug);

    try {
      await this.ensureFeatureArtifacts(
        featureSlug,
        ["plan.md", path.join("stories", "001-initial-story.md"), path.join("bdd", "001-initial.feature"), path.join("traceability", "traceability-map.json")],
        "Consistency review requires planned stories, BDD, and traceability artifacts. Run `ec plan` and `ec bdd` first."
      );
      const review = await this.buildConsistencyReview(featureSlug);
      const reviewPath = path.join("review", "consistency-review.md");
      await this.assertSafeToWriteArtifact(featureSlug, reviewPath, review.content);
      await this.artifacts.writeFeatureArtifact(featureSlug, reviewPath, review.content);

      return this.finishRun(
        featureSlug,
        "review-consistency",
        startedAt,
        options.dryRun ?? false,
        review.status === "ready-for-implement"
          ? ["Consistency review generated."]
          : ["Consistency review generated with findings that must be resolved before implementation."],
        review.status === "ready-for-implement"
      );
    } catch (error) {
      await this.finishRun(featureSlug, "review-consistency", startedAt, options.dryRun ?? false,
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
      await this.ensureFeatureArtifacts(
        featureSlug,
        [path.join("review", "consistency-review.md")],
        "Implementation planning requires a completed consistency review. Run `ec review-consistency` first."
      );
      await this.ensureConsistencyReviewPassed(featureSlug);
      const result = await this.agents.implementer.run(options.request);
      this.recordExecution("implementer", result, "implement");
      const summaryPath = path.join("implementation", "change-summary.md");
      await this.assertSafeToWriteArtifact(featureSlug, summaryPath, result.content);
      await this.artifacts.writeFeatureArtifact(featureSlug, summaryPath, result.content);

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
      await this.ensureFeatureArtifacts(
        featureSlug,
        [path.join("implementation", "change-summary.md")],
        "Test planning requires implementation notes. Run `ec implement` first."
      );
      const result = await this.agents.tester.run(options.request);
      this.recordExecution("tester", result, "test");
      const testPlanPath = path.join("tests", "test-plan.md");
      const generatedTestsPath = path.join("tests", "generated-tests.md");
      await this.assertSafeToWriteArtifact(featureSlug, testPlanPath, result.content);
      await this.assertSafeToWriteArtifact(featureSlug, generatedTestsPath, this.defaultGeneratedTests());
      await this.artifacts.writeFeatureArtifact(featureSlug, testPlanPath, result.content);
      await this.artifacts.writeFeatureArtifact(featureSlug, generatedTestsPath, this.defaultGeneratedTests());

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
      await this.ensureFeatureArtifacts(
        featureSlug,
        [path.join("tests", "test-plan.md"), path.join("tests", "generated-tests.md")],
        "Review requires generated test artifacts. Run `ec test` first."
      );
      const result = await this.agents.reviewer.run(options.request);
      this.recordExecution("reviewer", result, "review");
      const reviewPath = path.join("review", "code-review.md");
      await this.assertSafeToWriteArtifact(featureSlug, reviewPath, result.content);
      await this.artifacts.writeFeatureArtifact(featureSlug, reviewPath, result.content);

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
      await this.bdd({ ...options, featureSlug }),
      await this.reviewConsistency({ ...options, featureSlug }),
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
    if (success) {
      await this.featureStructure.updateFeature(featureSlug, {
        status: this.featureStatusForStage(stage),
        updatedAt: run.completedAt
      });
    }
    return { success, run };
  }

  private renderGherkin(title: string, story: Story): string {
    const safeTitle = title.replaceAll(/[\r\n]+/g, " ").trim();
    return [
      `Feature: ${safeTitle}`,
      "",
      ...story.acceptanceCriteria.flatMap((criterion, index) => [
        `  Scenario: ${story.id}.${index + 1} ${criterion.id} ${this.sanitizeScenarioText(criterion.description)}`,
        `    Given the story "${story.title}" is in scope`,
        `    When the team validates "${criterion.id}"`,
        `    Then ${criterion.description}`,
        ""
      ])
    ].slice(0, -1).join("\n");
  }

  private resolvePlannedStory(storyDraftContent: string, request: string): { story: Story; usedFallback: boolean } {
    try {
      return {
        story: parseStoryMarkdown(storyDraftContent),
        usedFallback: false
      };
    } catch {
      return {
        story: this.buildInitialStoryFallback(request),
        usedFallback: true
      };
    }
  }

  // Transitional fallback until the StoryAgent emits the structured story contract expected by plan().
  // Keep this path deterministic so tests remain stable and downstream stages have a known shape.
  private buildInitialStoryFallback(request: string): Story {
    const normalizedRequest = request.replaceAll(/[\r\n]+/g, " ").trim() || "feature request";
    const acceptanceCriteria: AcceptanceCriterion[] = [
      {
        id: "AC-1",
        description: `The workflow defines a bounded first slice for ${normalizedRequest}.`,
        testable: true
      },
      {
        id: "AC-2",
        description: "The slice can be represented as BDD scenarios and traced to implementation artifacts.",
        testable: true
      }
    ];

    return {
      id: "001",
      title: "Initial vertical slice",
      summary: `Establish the first implementation-ready slice for ${normalizedRequest}.`,
      acceptanceCriteria
    };
  }

  private buildTraceabilityMap(featureSlug: string, story: Story): string {
    return `${JSON.stringify({
      featureSlug,
      stories: [
        {
          storyId: story.id,
          storyTitle: story.title,
          acceptanceCriteria: story.acceptanceCriteria.map((criterion, index) => ({
            id: criterion.id,
            description: criterion.description,
            bddScenarios: [
              `001-initial.feature::${story.id}.${index + 1} ${criterion.id} ${this.sanitizeScenarioText(criterion.description)}`
            ]
          }))
        }
      ]
    }, null, 2)}\n`;
  }

  private async buildConsistencyReview(featureSlug: string): Promise<ConsistencyReviewResult> {
    const checks = await Promise.all([
      this.artifactCheck(featureSlug, "plan", "plan.md"),
      this.artifactCheck(featureSlug, "stories", path.join("stories", "001-initial-story.md")),
      this.artifactCheck(featureSlug, "bdd", path.join("bdd", "001-initial.feature")),
      this.artifactCheck(featureSlug, "traceability", path.join("traceability", "traceability-map.json"))
    ]);

    const findings: string[] = [];
    const missing = checks.filter((result) => !result.present).map((result) => result.label);

    if (missing.length === 0) {
      try {
        const story = await this.loadPrimaryStory(featureSlug);
        const bddScenarios = await this.loadBddScenarioRefs(featureSlug);
        const traceability = parseTraceabilityMap(
          await this.artifacts.readFeatureArtifact(featureSlug, path.join("traceability", "traceability-map.json"))
        );

        findings.push(...this.validateStoryAgainstTraceability(story, traceability), 
          ...this.validateTraceabilityAgainstBdd(traceability, bddScenarios));
      } catch (error) {
        if (error instanceof StoryArtifactError || error instanceof TraceabilityMapError || error instanceof SyntaxError) {
          findings.push(error.message);
        } else {
          throw error;
        }
      }
    } else {
      findings.push(...missing.map((artifact) => `Missing required artifact: ${artifact}`));
    }

    const status = findings.length === 0 ? "ready-for-implement" : "needs-attention";

    return {
      findings,
      status,
      content: [
        "# Consistency Review",
        "",
        `Status: ${status}`,
        "",
        "## Checks",
        ...checks.map((result) => `- ${result.label}: ${result.present ? "present" : "missing"}`),
        "",
        "## Findings",
        ...(findings.length === 0
          ? [
            "- Story markdown and embedded agent model are synchronized.",
            "- Acceptance criteria, BDD scenarios, and traceability links are consistent.",
            "- Ready to continue into implementation planning."
          ]
          : findings.map((finding) => `- ${finding}`))
      ].join("\n")
    };
  }

  private async artifactCheck(featureSlug: string, label: string, artifactPath: string): Promise<{ label: string; present: boolean }> {
    return {
      label,
      present: await this.artifacts.featureArtifactExists(featureSlug, artifactPath)
    };
  }

  private async ensureFeatureArtifacts(featureSlug: string, artifactPaths: string[], message: string): Promise<void> {
    const missing: string[] = [];
    for (const artifactPath of artifactPaths) {
      if (!await this.artifacts.featureArtifactExists(featureSlug, artifactPath)) {
        missing.push(artifactPath);
      }
    }

    if (missing.length > 0) {
      throw new Error(`${message} Missing: ${missing.join(", ")}`);
    }
  }

  private async ensureConsistencyReviewPassed(featureSlug: string): Promise<void> {
    const reviewPath = path.join("review", "consistency-review.md");
    const reviewContent = await this.artifacts.readFeatureArtifact(featureSlug, reviewPath);
    const status = this.parseConsistencyReviewStatus(reviewContent);

    if (status !== "ready-for-implement") {
      throw new Error(
        `Implementation planning requires a passing consistency review. Re-run \`ec review-consistency ${featureSlug}\` after resolving the reported findings.`
      );
    }
  }

  private async assertSafeToWriteArtifact(featureSlug: string, artifactPath: string, nextContent: string): Promise<void> {
    if (!await this.artifacts.featureArtifactExists(featureSlug, artifactPath)) {
      return;
    }

    const existingContent = await this.artifacts.readFeatureArtifact(featureSlug, artifactPath);
    if (existingContent === nextContent) {
      return;
    }

    throw new Error(
      `Refusing to overwrite diverged artifact "${artifactPath}" for "${featureSlug}". Review the existing file or delete it before rerunning the stage.`
    );
  }

  private async assertSafeToWriteStory(featureSlug: string, artifactPath: string, nextContent: string, expectedStory: Story): Promise<void> {
    if (!await this.artifacts.featureArtifactExists(featureSlug, artifactPath)) {
      return;
    }

    const existingContent = await this.artifacts.readFeatureArtifact(featureSlug, artifactPath);
    let parsedStory: Story;
    try {
      parsedStory = parseStoryMarkdown(existingContent);
    } catch (error) {
      if (error instanceof StoryArtifactError) {
        throw new Error(
          `Refusing to overwrite diverged artifact "${artifactPath}" for "${featureSlug}": ${error.message}`,
          { cause: error }
        );
      }

      throw error;
    }
    if (JSON.stringify(parsedStory) !== JSON.stringify(expectedStory)) {
      throw new Error(
        `Refusing to overwrite diverged artifact "${artifactPath}" for "${featureSlug}". Review the existing file or delete it before rerunning the stage.`
      );
    }

    if (existingContent !== nextContent) {
      throw new Error(
        `Story artifact "${artifactPath}" is synchronized but not rendered deterministically. Review the file before rerunning the stage.`
      );
    }
  }

  private async loadPrimaryStory(featureSlug: string): Promise<Story> {
    const storyContent = await this.artifacts.readFeatureArtifact(featureSlug, path.join("stories", "001-initial-story.md"));
    return parseStoryMarkdown(storyContent);
  }

  private async loadBddScenarioRefs(featureSlug: string): Promise<Set<string>> {
    const bddFiles = await this.artifacts.listFeatureArtifacts(featureSlug, "bdd");
    const refs = new Set<string>();

    for (const bddFile of bddFiles) {
      const content = await this.artifacts.readFeatureArtifact(featureSlug, bddFile);
      for (const ref of extractBddScenarioRefs(path.basename(bddFile), content)) {
        refs.add(ref);
      }
    }

    return refs;
  }

  private validateStoryAgainstTraceability(story: Story, traceability: TraceabilityMap): string[] {
    const findings: string[] = [];
    const traceStory = traceability.stories.find((candidate) => candidate.storyId === story.id);

    if (!traceStory) {
      findings.push(`Traceability map is missing story ${story.id}.`);
      return findings;
    }

    if (traceStory.storyTitle !== story.title) {
      findings.push(`Traceability story ${story.id} title does not match the story artifact.`);
    }

    for (const criterion of story.acceptanceCriteria) {
      const mappedCriterion = traceStory.acceptanceCriteria.find((candidate) => candidate.id === criterion.id);
      if (!mappedCriterion) {
        findings.push(`Acceptance criterion ${criterion.id} is missing from the traceability map.`);
        continue;
      }

      if (mappedCriterion.description !== criterion.description) {
        findings.push(`Acceptance criterion ${criterion.id} description diverges between story and traceability artifacts.`);
      }

      if (mappedCriterion.bddScenarios.length === 0) {
        findings.push(`Acceptance criterion ${criterion.id} has no BDD scenario mappings.`);
      }

      if (!criterion.testable) {
        findings.push(`Acceptance criterion ${criterion.id} is marked non-testable.`);
      }
    }

    for (const mappedCriterion of traceStory.acceptanceCriteria) {
      if (!story.acceptanceCriteria.some((criterion) => criterion.id === mappedCriterion.id)) {
        findings.push(`Traceability map contains orphaned acceptance criterion ${mappedCriterion.id}.`);
      }
    }

    return findings;
  }

  private validateTraceabilityAgainstBdd(traceability: TraceabilityMap, bddScenarios: Set<string>): string[] {
    const findings: string[] = [];
    const referencedScenarios = new Set<string>();

    for (const story of traceability.stories) {
      for (const criterion of story.acceptanceCriteria) {
        for (const scenario of criterion.bddScenarios) {
          referencedScenarios.add(scenario);
          if (!bddScenarios.has(scenario)) {
            findings.push(`Traceability reference ${scenario} does not exist in the BDD artifacts.`);
          }
        }
      }
    }

    for (const scenario of bddScenarios) {
      if (!referencedScenarios.has(scenario)) {
        findings.push(`BDD scenario ${scenario} is not referenced by the traceability map.`);
      }
    }

    return findings;
  }

  private sanitizeScenarioText(value: string): string {
    return value.replaceAll(/[\r\n]+/g, " ").replaceAll(/[^\w\s-]/g, "").trim();
  }

  private parseConsistencyReviewStatus(reviewContent: string): ConsistencyReviewStatus {
    const match = /^Status:\s*(ready-for-implement|needs-attention)\s*$/m.exec(reviewContent);
    if (!match) {
      throw new Error("Consistency review artifact is missing a valid status line. Re-run `ec review-consistency`.");
    }

    const status = match[1];
    if (status === "ready-for-implement" || status === "needs-attention") {
      return status;
    }

    throw new Error("Consistency review artifact is missing a valid status line. Re-run `ec review-consistency`.");
  }

  private featureStatusForStage(stage: WorkflowStage): FeatureRecord["status"] {
    switch (stage) {
      case "ideate":
        return "ideated";
      case "plan":
        return "planned";
      case "bdd":
        return "bdd-authored";
      case "review-consistency":
        return "consistency-reviewed";
      case "implement":
        return "implemented";
      case "test":
        return "tested";
      case "review":
        return "reviewed";
      default:
        return "draft";
    }
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
