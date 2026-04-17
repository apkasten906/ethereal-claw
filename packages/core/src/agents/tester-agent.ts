import { BaseAgent } from "./base-agent.js";

export class TesterAgent extends BaseAgent {
  protected prompt(subject: string): string {
    return `Write test scenarios and a manual checklist for feature: ${subject}`;
  }
}
