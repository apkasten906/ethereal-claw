import { IdeationAgent } from "./ideation-agent.js";
import { ImplementerAgent } from "./implementer-agent.js";
import { PlannerAgent } from "./planner-agent.js";
import { ReviewerAgent } from "./reviewer-agent.js";
import { StoryAgent } from "./story-agent.js";
import { TesterAgent } from "./tester-agent.js";
import type { LlmProvider } from "../providers/llm-provider.js";

export function createAgents(provider: LlmProvider) {
  return {
    ideation: new IdeationAgent("ideation", provider, "medium"),
    planner: new PlannerAgent("planner", provider, "low"),
    story: new StoryAgent("story", provider, "low"),
    implementer: new ImplementerAgent("implementer", provider, "medium"),
    tester: new TesterAgent("tester", provider, "low"),
    reviewer: new ReviewerAgent("reviewer", provider, "medium")
  };
}
