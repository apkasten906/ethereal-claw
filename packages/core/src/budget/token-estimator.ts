export interface TokenEstimateInput {
  inputText: string;
  expectedOutputTokens?: number;
  costPerTokenUsd?: number;
}

export interface TokenEstimate {
  estimatedInputTokens: number;
  estimatedOutputTokens: number;
  estimatedTotalTokens: number;
  estimatedCostUsd: number;
}

const DEFAULT_OUTPUT_TOKENS = 160;
const DEFAULT_COST_PER_TOKEN_USD = 0.000002;

export function estimateTextTokens(inputText: string): number {
  return Math.max(1, Math.ceil(inputText.length / 4));
}

export function estimateTokenUsage({
  inputText,
  expectedOutputTokens = DEFAULT_OUTPUT_TOKENS,
  costPerTokenUsd = DEFAULT_COST_PER_TOKEN_USD
}: TokenEstimateInput): TokenEstimate {
  const estimatedInputTokens = estimateTextTokens(inputText);
  const estimatedOutputTokens = Math.max(1, expectedOutputTokens);
  const estimatedTotalTokens = estimatedInputTokens + estimatedOutputTokens;

  return {
    estimatedInputTokens,
    estimatedOutputTokens,
    estimatedTotalTokens,
    estimatedCostUsd: Number((estimatedTotalTokens * costPerTokenUsd).toFixed(4))
  };
}
