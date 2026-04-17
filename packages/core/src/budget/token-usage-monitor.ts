import type { AgentExecution } from "@ethereal-claw/shared";

export class TokenUsageMonitor {
  private executions: AgentExecution[] = [];

  record(execution: AgentExecution): void {
    this.executions.push(execution);
  }

  all(): AgentExecution[] {
    return [...this.executions];
  }

  reset(): void {
    this.executions = [];
  }
}
