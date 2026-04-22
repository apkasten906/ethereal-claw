import { FeatureStructureService, GitHubModelProvider, loadConfig, MockProvider, OpenAiProvider, WorkflowOrchestrator } from "@ethereal-claw/core";

export async function createOrchestrator(): Promise<WorkflowOrchestrator> {
  const config = await loadConfig();

  const provider =
    config.provider === "openai"
      ? new OpenAiProvider()
      : config.provider === "github"
        ? new GitHubModelProvider()
        : new MockProvider();

  return new WorkflowOrchestrator(provider, config);
}

export async function resolveStageRequest(featureSlug: string, requestOverride: string, rootDir = process.cwd()): Promise<string> {
  if (requestOverride) {
    return requestOverride;
  }

  const featureStructure = new FeatureStructureService(rootDir);
  const feature = await featureStructure.loadFeature(featureSlug);

  if (!feature.request.trim()) {
    throw new Error(
      `Feature workspace "${featureSlug}" is missing a saved request. Re-run the ideate stage or pass --request.`
    );
  }

  return feature.request;
}
