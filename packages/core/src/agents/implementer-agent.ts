import { BaseAgent } from "./base-agent.js";

export class ImplementerAgent extends BaseAgent {
  protected prompt(subject: string): string {
    return `Write a file-level implementation plan for feature: ${subject}`;
  }
}
