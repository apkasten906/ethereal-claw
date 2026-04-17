import { z } from "zod";

const budgetSchema = z.object({
  runBudgetUsd: z.number().positive().default(5),
  warnAtPercent: z.number().min(1).max(100).default(50),
  confirmAtPercent: z.number().min(1).max(100).default(75),
  stopAtPercent: z.number().min(1).max(100).default(90),
  hardCapPercent: z.number().min(1).max(100).default(100)
}).superRefine((budget, context) => {
  const orderedThresholds = [
    ["warnAtPercent", budget.warnAtPercent],
    ["confirmAtPercent", budget.confirmAtPercent],
    ["stopAtPercent", budget.stopAtPercent],
    ["hardCapPercent", budget.hardCapPercent]
  ] as const;

  for (let index = 1; index < orderedThresholds.length; index += 1) {
    const [previousKey, previousValue] = orderedThresholds[index - 1];
    const [currentKey, currentValue] = orderedThresholds[index];

    if (previousValue > currentValue) {
      context.addIssue({
        code: "custom",
        path: [currentKey],
        message: `${previousKey} must be less than or equal to ${currentKey}`
      });
    }
  }
});

export const clawConfigSchema = z.object({
  provider: z.enum(["mock", "openai", "github"]).default("mock"),
  budget: budgetSchema,
  providers: z.object({
    openai: z.object({
      model: z.string().default("gpt-5.4-mini")
    }).optional(),
    github: z.object({
      model: z.string().default("github-model-default")
    }).optional()
  }).default({})
});

export type ClawConfig = z.infer<typeof clawConfigSchema>;
