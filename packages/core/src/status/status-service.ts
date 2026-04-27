import type { Dirent } from "node:fs";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import type { FeatureRecord, RunLog, WorkflowStage } from "@ethereal-claw/shared";
import { workflowStages } from "@ethereal-claw/shared";
import type { WorkspacePaths } from "../config/workspace-paths.js";
import { FeatureStructureService } from "../artifacts/feature-structure-service.js";
import { assertFeatureSlug, resolveWithin } from "../utils/file-system.js";

export type FeatureStatusStage = WorkflowStage | "draft";

export interface ArtifactStatus {
  label: string;
  path: string;
  available: boolean;
}

export interface TokenUsageSummary {
  estimatedInputTokens: number;
  estimatedOutputTokens: number;
  actualPromptTokens: number;
  actualCompletionTokens: number;
  estimatedCostUsd: number;
}

export interface FeatureStatus {
  feature: FeatureRecord;
  currentStage: FeatureStatusStage;
  availableArtifacts: ArtifactStatus[];
  missingArtifacts: ArtifactStatus[];
  lastRun: RunLog | null;
  tokenUsage: TokenUsageSummary | null;
  nextCommand: string;
}

export interface FeatureOverview {
  slug: string;
  title: string;
  currentStage: FeatureStatusStage;
  lastRun: RunLog | null;
  nextCommand: string;
}

type ArtifactKind = "file" | "directory";

interface ArtifactDefinition {
  label: string;
  path: string;
  kind: ArtifactKind;
  stage: FeatureStatusStage;
}

const artifactDefinitions: ArtifactDefinition[] = [
  { label: "ideation", path: "ideation.md", kind: "file", stage: "ideate" },
  { label: "plan", path: "plan.md", kind: "file", stage: "plan" },
  { label: "stories", path: "stories", kind: "directory", stage: "plan" },
  { label: "implementation tasks", path: "implementation/tasks.md", kind: "file", stage: "plan" },
  { label: "bdd", path: "bdd", kind: "directory", stage: "bdd" },
  { label: "traceability map", path: "traceability/traceability-map.json", kind: "file", stage: "bdd" },
  { label: "consistency review", path: "review/consistency-review.md", kind: "file", stage: "review-consistency" },
  { label: "implementation summary", path: "implementation/change-summary.md", kind: "file", stage: "implement" },
  { label: "test plan", path: "tests/test-plan.md", kind: "file", stage: "test" },
  { label: "generated tests", path: "tests/generated-tests.md", kind: "file", stage: "test" },
  { label: "code review", path: "review/code-review.md", kind: "file", stage: "review" }
];

const stageOrder: FeatureStatusStage[] = ["draft", ...workflowStages];

export class StatusService {
  private readonly featureStructure: FeatureStructureService;

  constructor(private readonly workspacePaths: WorkspacePaths) {
    this.featureStructure = new FeatureStructureService(workspacePaths);
  }

  async listFeatures(): Promise<FeatureOverview[]> {
    const entries = await this.readDirectoryEntries(this.workspacePaths.featuresDirectory);
    const overviews = await Promise.all(
      entries.map(async (entry) => {
        if (!entry.isDirectory()) {
          return null;
        }

        try {
          const feature = await this.featureStructure.loadFeature(entry.name);
          const lastRun = await this.loadLatestRun(entry.name);
          const currentStage = this.resolveCurrentStage(feature, lastRun);

          return {
            slug: feature.slug,
            title: feature.title,
            currentStage,
            lastRun,
            nextCommand: this.nextCommand(feature, currentStage, lastRun)
          };
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code === "ENOENT") {
            return null;
          }

          if (error instanceof Error && error.message.startsWith("Invalid feature metadata")) {
            throw error;
          }

          throw error;
        }
      })
    );

    return overviews
      .filter((overview): overview is FeatureOverview => overview !== null)
      .sort((left, right) => left.slug.localeCompare(right.slug));
  }

  async inspectFeature(featureSlug: string): Promise<FeatureStatus | null> {
    assertFeatureSlug(featureSlug);

    try {
      const feature = await this.featureStructure.loadFeature(featureSlug);
      const lastRun = await this.loadLatestRun(featureSlug);
      const currentStage = this.resolveCurrentStage(feature, lastRun);
      const artifactStatuses = await Promise.all(
        artifactDefinitions.map((definition) => this.inspectArtifact(featureSlug, definition))
      );
      const currentStageIndex = stageOrder.indexOf(currentStage);
      const expectedArtifacts = artifactStatuses.filter((artifact) => {
        const definition = artifactDefinitions.find((candidate) => candidate.path === artifact.path);
        return definition ? stageOrder.indexOf(definition.stage) <= currentStageIndex : false;
      });

      return {
        feature,
        currentStage,
        availableArtifacts: artifactStatuses.filter((artifact) => artifact.available),
        missingArtifacts: expectedArtifacts.filter((artifact) => !artifact.available),
        lastRun,
        tokenUsage: lastRun ? this.summarizeTokenUsage(lastRun) : null,
        nextCommand: this.nextCommand(feature, currentStage, lastRun)
      };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return null;
      }

      if (error instanceof Error && error.message.startsWith("Invalid feature metadata")) {
        throw error;
      }

      throw error;
    }
  }

  private async inspectArtifact(featureSlug: string, definition: ArtifactDefinition): Promise<ArtifactStatus> {
    const featureRoot = this.featureStructure.featureRoot(featureSlug);
    const targetPath = resolveWithin(featureRoot, definition.path);
    const available = definition.kind === "directory"
      ? await this.directoryHasEntries(targetPath)
      : await this.fileExists(targetPath);

    return {
      label: definition.label,
      path: definition.path,
      available
    };
  }

  private async loadLatestRun(featureSlug: string): Promise<RunLog | null> {
    const runHistoryDir = resolveWithin(
      this.workspacePaths.featuresDirectory,
      assertFeatureSlug(featureSlug),
      "run-history"
    );
    const entries = await this.readDirectoryEntries(runHistoryDir);
    const runs = await Promise.all(
      entries
        .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
        .map(async (entry) => this.loadRunLog(path.join(runHistoryDir, entry.name)))
    );
    const validRuns = runs.filter((run): run is RunLog => run !== null);

    validRuns.sort((left, right) => {
      const leftTime = left.completedAt || left.startedAt;
      const rightTime = right.completedAt || right.startedAt;
      return rightTime.localeCompare(leftTime);
    });
    
    return validRuns[0] ?? null;
  }

  private async loadRunLog(runPath: string): Promise<RunLog | null> {
    try {
      const parsed = JSON.parse(await readFile(runPath, "utf8")) as unknown;
      return this.isRunLog(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }

  private isRunLog(value: unknown): value is RunLog {
    if (!value || typeof value !== "object") {
      return false;
    }

    const record = value as Record<string, unknown>;

    return (
      typeof record.id === "string" &&
      typeof record.featureSlug === "string" &&
      typeof record.stage === "string" &&
      ([...workflowStages, "full-run"] as readonly string[]).includes(record.stage) &&
      typeof record.startedAt === "string" &&
      typeof record.completedAt === "string" &&
      typeof record.success === "boolean" &&
      typeof record.dryRun === "boolean" &&
      Array.isArray(record.executions) &&
      Array.isArray(record.notes)
    );
  }

  private resolveCurrentStage(feature: FeatureRecord, lastRun: RunLog | null): FeatureStatusStage {
    if (lastRun) {
      return lastRun.stage === "full-run" ? "review" : lastRun.stage;
    }

    switch (feature.status) {
      case "ideated":
        return "ideate";
      case "planned":
        return "plan";
      case "bdd-authored":
        return "bdd";
      case "consistency-reviewed":
        return "review-consistency";
      case "implemented":
        return "implement";
      case "tested":
        return "test";
      case "reviewed":
        return "review";
      default:
        return "draft";
    }
  }

  private nextCommand(feature: FeatureRecord, currentStage: FeatureStatusStage, lastRun: RunLog | null): string {
    if (lastRun && !lastRun.success) {
      return currentStage === "ideate"
        ? `ec ideate "${feature.request}"`
        : `ec ${currentStage} ${feature.slug}`;
    }

    switch (currentStage) {
      case "draft":
      case "ideate":
        return `ec plan ${feature.slug}`;
      case "plan":
        return `ec bdd ${feature.slug}`;
      case "bdd":
        return `ec review-consistency ${feature.slug}`;
      case "review-consistency":
        return `ec implement ${feature.slug}`;
      case "implement":
        return `ec test ${feature.slug}`;
      case "test":
        return `ec review ${feature.slug}`;
      case "review":
        return "Review artifacts and close out the feature";
      default:
        return `ec plan ${feature.slug}`;
    }
  }

  private summarizeTokenUsage(run: RunLog): TokenUsageSummary {
    return run.executions.reduce<TokenUsageSummary>((summary, execution) => ({
      estimatedInputTokens: summary.estimatedInputTokens + execution.estimatedInputTokens,
      estimatedOutputTokens: summary.estimatedOutputTokens + execution.estimatedOutputTokens,
      actualPromptTokens: summary.actualPromptTokens + (execution.actualPromptTokens ?? 0),
      actualCompletionTokens: summary.actualCompletionTokens + (execution.actualCompletionTokens ?? 0),
      estimatedCostUsd: summary.estimatedCostUsd + execution.estimatedCostUsd
    }), {
      estimatedInputTokens: 0,
      estimatedOutputTokens: 0,
      actualPromptTokens: 0,
      actualCompletionTokens: 0,
      estimatedCostUsd: 0
    });
  }

  private async fileExists(targetPath: string): Promise<boolean> {
    try {
      const stats = await stat(targetPath);
      return stats.isFile();
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return false;
      }

      throw error;
    }
  }

  private async directoryHasEntries(targetPath: string): Promise<boolean> {
    const entries = await this.readDirectoryEntries(targetPath);
    return entries.length > 0;
  }

  private async readDirectoryEntries(targetPath: string): Promise<Dirent[]> {
    try {
      return await readdir(targetPath, { withFileTypes: true });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return [];
      }

      throw error;
    }
  }
}
