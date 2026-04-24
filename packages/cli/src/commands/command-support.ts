import path from "node:path";
import { FeatureStructureService, GitHubModelProvider, loadConfig, MockProvider, OpenAiProvider, resolveWorkspacePaths, WorkflowOrchestrator } from "@ethereal-claw/core";

export async function createOrchestrator(): Promise<WorkflowOrchestrator> {
  const config = await loadConfig();

  let provider: OpenAiProvider | GitHubModelProvider | MockProvider;
  if (config.provider === "openai") {
    provider = new OpenAiProvider();
  } else if (config.provider === "github") {
    provider = new GitHubModelProvider();
  } else {
    provider = new MockProvider();
  }

  return new WorkflowOrchestrator(provider, config);
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
