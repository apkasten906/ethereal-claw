import { BaseAgent } from "./base-agent.js";

export class ReviewerAgent extends BaseAgent {
  protected prompt(subject: string): string {
    return `Review artifacts for feature: ${subject}`;
  }
}
