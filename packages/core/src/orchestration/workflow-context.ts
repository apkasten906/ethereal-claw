import type { WorkflowStage } from "@ethereal-claw/shared";

export interface WorkflowContext {
  featureSlug: string;
  featureTitle: string;
  request: string;
  dryRun: boolean;
  stage: WorkflowStage;
}
