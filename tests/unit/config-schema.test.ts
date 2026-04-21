import { describe, expect, it } from "vitest";
import { clawConfigSchema } from "../../packages/core/src/config/config-schema.js";

describe("clawConfigSchema", () => {
  it("defaults the budget block when it is omitted", () => {
    expect(clawConfigSchema.parse({ provider: "mock" }).budget).toEqual({
      runBudgetUsd: 5,
      warnAtPercent: 50,
      confirmAtPercent: 75,
      stopAtPercent: 90,
      hardCapPercent: 100
    });
  });

  it("rejects budget thresholds that are out of order", () => {
    expect(() =>
      clawConfigSchema.parse({
        budget: {
          runBudgetUsd: 5,
          warnAtPercent: 80,
          confirmAtPercent: 75,
          stopAtPercent: 70,
          hardCapPercent: 90
        }
      })
    ).toThrow("warnAtPercent must be less than or equal to confirmAtPercent");
  });
});
