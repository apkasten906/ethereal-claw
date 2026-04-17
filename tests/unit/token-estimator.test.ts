import { describe, expect, it } from "vitest";
import { estimateTextTokens, estimateTokenUsage } from "../../packages/core/src/budget/token-estimator.js";

describe("token estimator", () => {
  it("estimates text tokens from prompt length", () => {
    expect(estimateTextTokens("abcd")).toBe(1);
    expect(estimateTextTokens("abcdefgh")).toBe(2);
  });

  it("returns combined token and cost estimates", () => {
    expect(
      estimateTokenUsage({
        inputText: "abcdefgh",
        expectedOutputTokens: 20,
        costPerTokenUsd: 0.01
      })
    ).toEqual({
      estimatedInputTokens: 2,
      estimatedOutputTokens: 20,
      estimatedTotalTokens: 22,
      estimatedCostUsd: 0.22
    });
  });
});
