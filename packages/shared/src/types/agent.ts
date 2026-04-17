export type AgentName =
  | "ideation"
  | "planner"
  | "story"
  | "implementer"
  | "tester"
  | "reviewer";

export type ModelTier = "low" | "medium" | "high";

export interface AgentExecution {
  agent: AgentName;
  step: string;
  tier: ModelTier;
  estimatedInputTokens: number;
  estimatedOutputTokens: number;
  actualPromptTokens: number;
  actualCompletionTokens: number;
  estimatedCostUsd: number;
}
