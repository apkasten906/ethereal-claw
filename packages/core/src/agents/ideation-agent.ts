import { BaseAgent } from "./base-agent.js";

export class IdeationAgent extends BaseAgent {
  protected prompt(subject: string): string {
    return `Turn this request into a bounded feature concept: ${subject}`;
  }
}
