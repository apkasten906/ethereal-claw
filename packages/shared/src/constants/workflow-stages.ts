export const workflowStages = [
  "ideate",
  "plan",
  "bdd",
  "review-consistency",
  "implement",
  "test",
  "review"
] as const;

export type WorkflowStage = (typeof workflowStages)[number];
