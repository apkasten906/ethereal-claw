export interface BudgetSnapshot {
  spentUsd: number;
  remainingUsd: number;
  percentConsumed: number;
  status: "ok" | "warn" | "confirm" | "stop" | "hard-stop";
}

export interface BudgetThresholds {
  runBudgetUsd: number;
  warnAtPercent: number;
  confirmAtPercent: number;
  stopAtPercent: number;
  hardCapPercent: number;
}

export class BudgetManager {
  private spentUsd = 0;

  constructor(private readonly thresholds: BudgetThresholds) {}

  record(costUsd: number): BudgetSnapshot {
    this.spentUsd += costUsd;
    return this.snapshot();
  }

  snapshot(): BudgetSnapshot {
    const percentConsumed = Number(((this.spentUsd / this.thresholds.runBudgetUsd) * 100).toFixed(2));
    const remainingUsd = Number(Math.max(0, this.thresholds.runBudgetUsd - this.spentUsd).toFixed(4));

    let status: BudgetSnapshot["status"] = "ok";
    if (percentConsumed >= this.thresholds.hardCapPercent) {
      status = "hard-stop";
    } else if (percentConsumed >= this.thresholds.stopAtPercent) {
      status = "stop";
    } else if (percentConsumed >= this.thresholds.confirmAtPercent) {
      status = "confirm";
    } else if (percentConsumed >= this.thresholds.warnAtPercent) {
      status = "warn";
    }

    return {
      spentUsd: Number(this.spentUsd.toFixed(4)),
      remainingUsd,
      percentConsumed,
      status
    };
  }

  reset(): void {
    this.spentUsd = 0;
  }
}
