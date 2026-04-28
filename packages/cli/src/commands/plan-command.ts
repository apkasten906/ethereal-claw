import { Command } from "commander";
import { createOrchestrator, printStageResult, resolveStageRequest } from "./command-support.js";

export function createPlanCommand(): Command {
  return new Command("plan")
    .description("Generate planning artifacts for an existing feature.")
    .argument("<featureSlug>", "feature slug")
    .option("--request <request>", "override feature request", "")
    .option("--dry-run", "record a dry run", false)
    .option("--json", "emit machine-readable JSON", false)
    .action(async (featureSlug: string, options: { request: string; dryRun: boolean; json: boolean }) => {
      const { orchestrator, config } = await createOrchestrator();
      const request = await resolveStageRequest(featureSlug, options.request, orchestrator.rootDir);
      const result = await orchestrator.plan({
        featureSlug,
        request,
        dryRun: options.dryRun
      });
      printStageResult("plan", result, config, orchestrator.rootDir, [`feature=${featureSlug}`, `request=${request}`, `dryRun=${options.dryRun}`], options.json);
    });
}
