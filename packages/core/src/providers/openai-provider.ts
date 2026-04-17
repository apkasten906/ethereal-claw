import type { LlmProvider, ProviderRequest, ProviderResponse } from "./llm-provider.js";

export class OpenAiProvider implements LlmProvider {
  readonly name = "openai";

  async complete(_request: ProviderRequest): Promise<ProviderResponse> {
    throw new Error("OpenAI provider is not implemented in the initial scaffold.");
  }
}
