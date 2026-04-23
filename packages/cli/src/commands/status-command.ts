import path from "node:path";
import { Command } from "commander";
import { loadConfig, resolveWorkspacePaths, StatusService, type FeatureOverview, type FeatureStatus } from "@ethereal-claw/core";
import { printMessage } from "../presentation/console-output.js";

export function createStatusCommand(): Command {
  return new Command("status")
    .description("Show workflow status for all features or one feature.")
    .argument("[featureSlug]", "feature slug")
    .action(async (featureSlug?: string) => {
      const config = await loadConfig(path.join(process.cwd(), ".ec", "config", "project.yaml"));
      const service = new StatusService(resolveWorkspacePaths(process.cwd(), config.workspace));

      if (featureSlug) {
        const status = await service.inspectFeature(featureSlug);

        if (!status) {
          printMessage(formatMissingFeature(featureSlug));
          process.exitCode = 1;
          return;
        }

        printMessage(formatFeatureStatus(status));
        return;
      }

      printMessage(formatFeatureOverview(await service.listFeatures()));
    });
}

export function formatFeatureOverview(features: FeatureOverview[]): string {
  if (features.length === 0) {
    return [
      "No feature workspaces found.",
      "Run `ec ideate \"<request>\"` to create one."
    ].join("\n");
  }

  return [
    "Known features",
    "",
    ...features.flatMap((feature) => [
      `- ${feature.slug}: ${feature.title}`,
      `  stage: ${feature.currentStage}`,
      `  last run: ${formatLastRun(feature.lastRun)}`,
      `  next: ${feature.nextCommand}`
    ])
  ].join("\n");
}

export function formatFeatureStatus(status: FeatureStatus): string {
  return [
    `Feature: ${status.feature.title}`,
    `ID: ${status.feature.slug}`,
    `Current stage: ${status.currentStage}`,
    "",
    "Available artifacts:",
    ...formatArtifacts(status.availableArtifacts),
    "",
    "Missing artifacts:",
    ...formatArtifacts(status.missingArtifacts),
    "",
    `Last run: ${formatLastRun(status.lastRun)}`,
    `Token usage: ${formatTokenUsage(status)}`,
    `Next: ${status.nextCommand}`
  ].join("\n");
}

export function formatMissingFeature(featureSlug: string): string {
  return [
    `Feature not found: ${featureSlug}`,
    "Run `ec status` to list known features."
  ].join("\n");
}

function formatArtifacts(artifacts: FeatureStatus["availableArtifacts"]): string[] {
  if (artifacts.length === 0) {
    return ["- none"];
  }

  return artifacts.map((artifact) => `- ${artifact.label} (${artifact.path})`);
}

function formatLastRun(lastRun: FeatureStatus["lastRun"]): string {
  if (!lastRun) {
    return "none";
  }

  return `${lastRun.stage} ${lastRun.success ? "succeeded" : "failed"} at ${lastRun.completedAt}`;
}

function formatTokenUsage(status: FeatureStatus): string {
  if (!status.tokenUsage) {
    return "none";
  }

  const usage = status.tokenUsage;
  return [
    `estimated ${usage.estimatedInputTokens} input / ${usage.estimatedOutputTokens} output tokens`,
    `actual ${usage.actualPromptTokens} input / ${usage.actualCompletionTokens} output tokens`,
    `estimated cost $${usage.estimatedCostUsd.toFixed(4)}`
  ].join("; ");
}
