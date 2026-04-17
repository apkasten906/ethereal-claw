import { BaseAgent } from "./base-agent.js";

export class StoryAgent extends BaseAgent {
  protected prompt(subject: string): string {
    return `Convert the feature into user stories and BDD scenarios: ${subject}`;
  }
}
