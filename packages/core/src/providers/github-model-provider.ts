import type { LlmProvider, ProviderRequest, ProviderResponse } from "./llm-provider.js";

export class GitHubModelProvider implements LlmProvider {
  readonly name = "github";

  async complete(_request: ProviderRequest): Promise<ProviderResponse> {
    throw new Error("GitHub model provider is not implemented in the initial scaffold.");
  }
}
