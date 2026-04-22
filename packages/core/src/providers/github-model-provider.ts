import type { LlmProvider, ProviderRequest, ProviderResponse } from "./llm-provider.js";

export class GitHubModelProvider implements LlmProvider {
  readonly name = "github";

  async complete(request: ProviderRequest): Promise<ProviderResponse> {
    void request;
    throw new Error("GitHub model provider is not implemented in the initial scaffold.");
  }
}
