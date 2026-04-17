import type { LlmProvider, ProviderRequest, ProviderResponse } from "./llm-provider.js";

export class OpenAiProvider implements LlmProvider {
  readonly name = "openai";

  async complete(request: ProviderRequest): Promise<ProviderResponse> {
    void request;
    throw new Error("OpenAI provider is not implemented in the initial scaffold.");
  }
}
