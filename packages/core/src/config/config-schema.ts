import { z } from "zod";

export const clawConfigSchema = z.object({
  provider: z.enum(["mock", "openai", "github"]).default("mock"),
  budget: z.object({
    runBudgetUsd: z.number().positive().default(5),
    warnAtPercent: z.number().min(1).max(100).default(50),
    confirmAtPercent: z.number().min(1).max(100).default(75),
    stopAtPercent: z.number().min(1).max(100).default(90),
    hardCapPercent: z.number().min(1).max(100).default(100)
  }),
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
