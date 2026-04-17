import { Command } from "commander";
import { createOrchestrator, resolveStageRequest } from "./command-support.js";
import { printJson } from "../presentation/console-output.js";

export function createPlanCommand(): Command {
  return new Command("plan")
    .description("Generate planning artifacts for an existing feature.")
    .argument("<featureSlug>", "feature slug")
    .option("--request <request>", "override feature request", "")
    .option("--dry-run", "record a dry run", false)
    .action(async (featureSlug: string, options: { request: string; dryRun: boolean }) => {
      const orchestrator = await createOrchestrator();
      const request = await resolveStageRequest(featureSlug, options.request);
      const result = await orchestrator.plan({
        featureSlug,
        request,
        dryRun: options.dryRun
      });
      printJson(result.run);
    });
}
