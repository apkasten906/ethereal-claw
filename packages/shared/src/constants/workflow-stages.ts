export const workflowStages = [
  "ideate",
  "plan",
  "implement",
  "test",
  "review"
] as const;

export type WorkflowStage = (typeof workflowStages)[number];
