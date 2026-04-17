import { Command } from "commander";
import { createOrchestrator } from "./command-support.js";
import { printJson } from "../presentation/console-output.js";

export function createImplementCommand(): Command {
  return new Command("implement")
    .description("Generate implementation planning artifacts for a feature.")
    .argument("<featureSlug>", "feature slug")
    .option("--request <request>", "override feature request", "")
    .option("--dry-run", "record a dry run", false)
    .action(async (featureSlug: string, options: { request: string; dryRun: boolean }) => {
      const orchestrator = await createOrchestrator();
      const result = await orchestrator.implement({
        featureSlug,
        request: options.request || featureSlug,
        dryRun: options.dryRun
      });
      printJson(result.run);
    });
}
