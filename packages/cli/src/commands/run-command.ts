import { Command } from "commander";
import { createOrchestrator } from "./command-support.js";
import { printJson } from "../presentation/console-output.js";

export function createRunCommand(): Command {
  return new Command("run")
    .description("Run the end-to-end artifact workflow for a feature.")
    .argument("<featureSlug>", "feature slug")
    .option("--request <request>", "override feature request", "")
    .option("--dry-run", "record a dry run", false)
    .action(async (featureSlug: string, options: { request: string; dryRun: boolean }) => {
      const orchestrator = await createOrchestrator();
      const results = await orchestrator.run({
        featureSlug,
        request: options.request || featureSlug,
        dryRun: options.dryRun
      });
      printJson(results.map((result) => result.run));
    });
}
