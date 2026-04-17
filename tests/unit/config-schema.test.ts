import { describe, expect, it } from "vitest";
import { clawConfigSchema } from "../../packages/core/src/config/config-schema.js";

describe("clawConfigSchema", () => {
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
