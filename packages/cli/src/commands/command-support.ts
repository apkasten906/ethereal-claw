import { GitHubModelProvider, loadConfig, MockProvider, OpenAiProvider, WorkflowOrchestrator } from "@ethereal-claw/core";

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
