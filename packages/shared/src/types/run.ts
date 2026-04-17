import type { AgentExecution } from "./agent.js";
import type { WorkflowStage } from "../constants/workflow-stages.js";

export interface RunLog {
  id: string;
  featureSlug: string;
  stage: WorkflowStage | "full-run";
  startedAt: string;
  completedAt: string;
  success: boolean;
  dryRun: boolean;
  executions: AgentExecution[];
  notes: string[];
}
