import type { AgentName, ModelTier } from "@ethereal-claw/shared";

export interface ProviderRequest {
  agent: AgentName;
  tier: ModelTier;
  prompt: string;
}

export interface ProviderResponse {
  content: string;
  promptTokens: number;
  completionTokens: number;
  estimatedCostUsd: number;
}

export interface LlmProvider {
  readonly name: string;
  complete(request: ProviderRequest): Promise<ProviderResponse>;
}
