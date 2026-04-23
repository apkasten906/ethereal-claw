import { z } from "zod";

const defaultBudget = {
  runBudgetUsd: 5,
  warnAtPercent: 50,
  confirmAtPercent: 75,
  stopAtPercent: 90,
  hardCapPercent: 100
};

const defaultWorkspace = {
  rootDirectory: "./.ec",
  configDirectory: "./.ec/config",
  featuresDirectory: "./.ec/features",
  runsDirectory: "./.ec/runs"
};

function createDefaultBudget(): typeof defaultBudget {
  return { ...defaultBudget };
}

function createDefaultWorkspace(): typeof defaultWorkspace {
  return { ...defaultWorkspace };
}

const budgetSchema = z.object({
  runBudgetUsd: z.number().positive().default(defaultBudget.runBudgetUsd),
  warnAtPercent: z.number().min(1).max(100).default(defaultBudget.warnAtPercent),
  confirmAtPercent: z.number().min(1).max(100).default(defaultBudget.confirmAtPercent),
  stopAtPercent: z.number().min(1).max(100).default(defaultBudget.stopAtPercent),
  hardCapPercent: z.number().min(1).max(100).default(defaultBudget.hardCapPercent)
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
  workspace: z.object({
    rootDirectory: z.string().min(1).default(defaultWorkspace.rootDirectory),
    configDirectory: z.string().min(1).default(defaultWorkspace.configDirectory),
    featuresDirectory: z.string().min(1).default(defaultWorkspace.featuresDirectory),
    runsDirectory: z.string().min(1).default(defaultWorkspace.runsDirectory)
  }).default(createDefaultWorkspace),
  budget: budgetSchema.default(createDefaultBudget),
  providers: z.object({
    openai: z.object({
      model: z.string().default("gpt-5.4-mini")
    }).optional(),
    github: z.object({
      model: z.string().default("github-model-default")
    }).optional()
  }).default(() => ({}))
});

export type ClawConfig = z.infer<typeof clawConfigSchema>;
