import { Command } from "commander";
import { createOrchestrator, printStageResult, resolveStageRequest } from "./command-support.js";

export function createImplementCommand(): Command {
  return new Command("implement")
    .description("Generate implementation planning artifacts for a feature.")
    .argument("<featureSlug>", "feature slug")
    .option("--request <request>", "override feature request", "")
    .option("--dry-run", "record a dry run", false)
    .option("--json", "emit machine-readable JSON", false)
    .action(async (featureSlug: string, options: { request: string; dryRun: boolean; json: boolean }) => {
      const { orchestrator, config } = await createOrchestrator();
      const request = await resolveStageRequest(featureSlug, options.request, orchestrator.rootDir);
      const result = await orchestrator.implement({
        featureSlug,
        request,
        dryRun: options.dryRun
      });
      printStageResult("implement", result, config, orchestrator.rootDir, [`feature=${featureSlug}`, `request=${request}`, `dryRun=${options.dryRun}`], options.json);
    });
}
