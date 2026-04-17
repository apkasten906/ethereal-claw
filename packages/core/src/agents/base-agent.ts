import type { AgentName, ModelTier } from "@ethereal-claw/shared";
import type { LlmProvider } from "../providers/llm-provider.js";

export interface AgentResult {
  content: string;
  promptTokens: number;
  completionTokens: number;
  estimatedCostUsd: number;
}

export abstract class BaseAgent {
  constructor(
    readonly name: AgentName,
    protected readonly provider: LlmProvider,
    protected readonly tier: ModelTier
  ) {}

  protected abstract prompt(subject: string): string;

  async run(subject: string): Promise<AgentResult> {
    const response = await this.provider.complete({
      agent: this.name,
      tier: this.tier,
      prompt: this.prompt(subject)
    });

    return {
      content: response.content,
      promptTokens: response.promptTokens,
      completionTokens: response.completionTokens,
      estimatedCostUsd: response.estimatedCostUsd
    };
  }
}
