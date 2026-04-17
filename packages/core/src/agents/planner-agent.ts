import { BaseAgent } from "./base-agent.js";

export class PlannerAgent extends BaseAgent {
  protected prompt(subject: string): string {
    return `Create an implementation-ready plan for feature: ${subject}`;
  }
}
