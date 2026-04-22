import { Command } from "commander";
import { createOrchestrator, resolveStageRequest } from "./command-support.js";
import { printJson } from "../presentation/console-output.js";

export function createReviewCommand(): Command {
  return new Command("review")
    .description("Generate review artifacts for a feature.")
    .argument("<featureSlug>", "feature slug")
    .option("--request <request>", "override feature request", "")
    .option("--dry-run", "record a dry run", false)
    .action(async (featureSlug: string, options: { request: string; dryRun: boolean }) => {
      const orchestrator = await createOrchestrator();
      const request = await resolveStageRequest(featureSlug, options.request, orchestrator.rootDir);
      const result = await orchestrator.review({
        featureSlug,
        request,
        dryRun: options.dryRun
      });
      printJson(result.run);
    });
}
