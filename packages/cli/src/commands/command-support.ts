import path from "node:path";
import { createInterface } from "node:readline/promises";
import type { ClawConfig, RunResult } from "@ethereal-claw/core";
import { FeatureStructureService, FeatureWorkspaceConflictError, GitHubModelProvider, loadConfig, MockProvider, OpenAiProvider, resolveWorkspacePaths, slugify, WorkflowOrchestrator } from "@ethereal-claw/core";
import { formatCommandReport, multiRunToReport, stageRunToReport } from "../presentation/command-report.js";
import { printJson, printMessage } from "../presentation/console-output.js";

export async function createOrchestrator(): Promise<{ orchestrator: WorkflowOrchestrator; config: ClawConfig }> {
  const config = await loadConfig();

  let provider: OpenAiProvider | GitHubModelProvider | MockProvider;
  if (config.provider === "openai") {
    provider = new OpenAiProvider();
  } else if (config.provider === "github") {
    provider = new GitHubModelProvider();
  } else {
    provider = new MockProvider();
  }

  return {
    orchestrator: new WorkflowOrchestrator(provider, config),
    config
  };
}

export async function resolveStageRequest(featureSlug: string, requestOverride: string, rootDir = process.cwd()): Promise<string> {
  if (requestOverride) {
    return requestOverride;
  }

  const config = await loadConfig(path.join(rootDir, ".ec", "config", "project.yaml"));
  const featureStructure = new FeatureStructureService(resolveWorkspacePaths(rootDir, config.workspace));
  const feature = await featureStructure.loadFeature(featureSlug);

  if (!feature.request.trim()) {
    throw new Error(
      `Feature workspace "${featureSlug}" is missing a saved request. Re-run the ideate stage or pass --request.`
    );
  }

  return feature.request;
}

export interface IdeateResolution {
  featureSlug?: string;
  overwritten: boolean;
  cancelled: boolean;
}

export interface ResolveIdeateConflictOptions {
  overwrite?: boolean;
  json?: boolean;
}

export async function resolveIdeateConflict(
  request: string,
  rootDir: string,
  config: ClawConfig,
  options: ResolveIdeateConflictOptions = {}
): Promise<IdeateResolution> {
  const slug = slugify(request);
  if (!slug) {
    throw new Error("Feature request must contain at least one alphanumeric character to generate a slug.");
  }

  const baseSlug = `feature-${slug}`;
  const featureStructure = new FeatureStructureService(resolveWorkspacePaths(rootDir, config.workspace));

  if (!await featureStructure.workspaceExists(baseSlug)) {
    return { featureSlug: baseSlug, overwritten: false, cancelled: false };
  }

  if (options.overwrite) {
    return { featureSlug: baseSlug, overwritten: true, cancelled: false };
  }

  const interactive = !options.json && process.stdin.isTTY === true && process.stdout.isTTY === true;
  if (!interactive) {
    throw new FeatureWorkspaceConflictError(
      baseSlug,
      `Feature workspace "${baseSlug}" already exists. Re-run with --overwrite to replace it.`
    );
  }

  const rl = createInterface({
    input: process.stdin,
    output: process.stdout
  });

  try {
    const answer = (await rl.question(
      'A feature with the name you provided already exists. Overwrite? [Y]es or [N]o. '
    )).trim().toLowerCase();

    if (answer === "yes" || answer === "y") {
      return { featureSlug: baseSlug, overwritten: true, cancelled: false };
    }

    if (answer === "no" || answer === "n" || answer === "") {
      return { featureSlug: baseSlug, overwritten: false, cancelled: true };
    }

    throw new Error('Expected "yes" or "no".');
  } finally {
    rl.close();
  }
}

export function stagePaths(command: string, featureSlug: string, rootDir: string, config: ClawConfig): { read: string[]; written: string[]; next: string } {
  const workspace = resolveWorkspacePaths(rootDir, config.workspace);
  const featureRoot = path.relative(rootDir, path.join(workspace.featuresDirectory, featureSlug)).replaceAll("\\", "/");
  const configPath = path.relative(rootDir, path.join(rootDir, ".ec", "config", "project.yaml")).replaceAll("\\", "/");

  switch (command) {
    case "ideate":
      return {
        read: [configPath],
        written: [
          `${featureRoot}/feature.yaml`,
          `${featureRoot}/ideation.md`,
          path.relative(rootDir, workspace.runsDirectory).replaceAll("\\", "/")
        ],
        next: `ec plan ${featureSlug}`
      };
    case "plan":
      return {
        read: [configPath, `${featureRoot}/feature.yaml`, `${featureRoot}/ideation.md`],
        written: [
          `${featureRoot}/plan.md`,
          `${featureRoot}/stories/001-initial-story.md`,
          `${featureRoot}/implementation/tasks.md`,
          path.relative(rootDir, workspace.runsDirectory).replaceAll("\\", "/")
        ],
        next: `ec bdd ${featureSlug}`
      };
    case "bdd":
      return {
        read: [configPath, `${featureRoot}/feature.yaml`, `${featureRoot}/plan.md`, `${featureRoot}/stories/001-initial-story.md`],
        written: [
          `${featureRoot}/bdd/001-initial.feature`,
          `${featureRoot}/traceability/traceability-map.json`,
          path.relative(rootDir, workspace.runsDirectory).replaceAll("\\", "/")
        ],
        next: `ec review-consistency ${featureSlug}`
      };
    case "review-consistency":
      return {
        read: [
          configPath,
          `${featureRoot}/feature.yaml`,
          `${featureRoot}/plan.md`,
          `${featureRoot}/stories/001-initial-story.md`,
          `${featureRoot}/bdd/001-initial.feature`,
          `${featureRoot}/traceability/traceability-map.json`
        ],
        written: [
          `${featureRoot}/review/consistency-review.md`,
          path.relative(rootDir, workspace.runsDirectory).replaceAll("\\", "/")
        ],
        next: `ec implement ${featureSlug}`
      };
    case "implement":
      return {
        read: [configPath, `${featureRoot}/review/consistency-review.md`],
        written: [
          `${featureRoot}/implementation/change-summary.md`,
          path.relative(rootDir, workspace.runsDirectory).replaceAll("\\", "/")
        ],
        next: `ec test ${featureSlug}`
      };
    case "test":
      return {
        read: [configPath, `${featureRoot}/implementation/change-summary.md`, `${featureRoot}/stories/001-initial-story.md`, `${featureRoot}/bdd/001-initial.feature`],
        written: [
          `${featureRoot}/tests/test-plan.md`,
          `${featureRoot}/tests/generated-tests.md`,
          path.relative(rootDir, workspace.runsDirectory).replaceAll("\\", "/")
        ],
        next: `ec review ${featureSlug}`
      };
    case "review":
      return {
        read: [configPath, `${featureRoot}/stories/001-initial-story.md`, `${featureRoot}/tests/test-plan.md`, `${featureRoot}/tests/generated-tests.md`],
        written: [
          `${featureRoot}/review/code-review.md`,
          path.relative(rootDir, workspace.runsDirectory).replaceAll("\\", "/")
        ],
        next: "Review artifacts and close out the feature"
      };
    default:
      return { read: [configPath], written: [], next: "none" };
  }
}

export function printStageResult(
  command: string,
  result: RunResult,
  config: ClawConfig,
  rootDir: string,
  input: string[],
  json: boolean
): void {
  if (json) {
    printJson(result.run);
    return;
  }

  const paths = stagePaths(command, result.run.featureSlug, rootDir, config);
  printMessage(formatCommandReport(stageRunToReport(command, result, config, input, paths.read, paths.written, paths.next)));
}

export function printRunResult(
  results: RunResult[],
  config: ClawConfig,
  rootDir: string,
  input: string[],
  json: boolean
): void {
  if (json) {
    printJson(results.map((result) => result.run));
    return;
  }

  const featureSlug = results[0]?.run.featureSlug;
  const read = featureSlug
    ? [
      ...stagePaths("plan", featureSlug, rootDir, config).read,
      ...stagePaths("bdd", featureSlug, rootDir, config).read,
      ...stagePaths("review-consistency", featureSlug, rootDir, config).read,
      ...stagePaths("implement", featureSlug, rootDir, config).read,
      ...stagePaths("test", featureSlug, rootDir, config).read,
      ...stagePaths("review", featureSlug, rootDir, config).read
    ]
    : [];
  const written = featureSlug
    ? [
      ...stagePaths("plan", featureSlug, rootDir, config).written,
      ...stagePaths("bdd", featureSlug, rootDir, config).written,
      ...stagePaths("review-consistency", featureSlug, rootDir, config).written,
      ...stagePaths("implement", featureSlug, rootDir, config).written,
      ...stagePaths("test", featureSlug, rootDir, config).written,
      ...stagePaths("review", featureSlug, rootDir, config).written
    ]
    : [];

  printMessage(
    formatCommandReport(
      multiRunToReport(
        "run",
        results,
        config,
        input,
        Array.from(new Set(read)),
        Array.from(new Set(written)),
        "Review artifacts and close out the feature"
      )
    )
  );
}
