import { describe, expect, it } from "vitest";
import { BudgetManager } from "../../packages/core/src/budget/budget-manager.js";

describe("BudgetManager", () => {
  it("moves through thresholds as spend increases", () => {
    const manager = new BudgetManager({
      runBudgetUsd: 10,
      warnAtPercent: 50,
      confirmAtPercent: 75,
      stopAtPercent: 90,
      hardCapPercent: 100
    });

    expect(manager.record(5).status).toBe("warn");
    expect(manager.record(2.5).status).toBe("confirm");
    expect(manager.record(1.5).status).toBe("stop");
    expect(manager.record(1).status).toBe("hard-stop");
  });
});
