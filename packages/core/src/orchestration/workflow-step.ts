import type { WorkflowStage } from "@ethereal-claw/shared";

export interface WorkflowStep {
  stage: WorkflowStage;
  description: string;
}
