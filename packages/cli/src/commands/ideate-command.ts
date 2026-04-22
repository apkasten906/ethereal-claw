import { Command } from "commander";
import { createOrchestrator } from "./command-support.js";
import { printJson } from "../presentation/console-output.js";

export function createIdeateCommand(): Command {
  return new Command("ideate")
    .description("Create a feature workspace from a rough request.")
    .argument("<request>", "feature request")
    .option("--dry-run", "record a dry run", false)
    .action(async (request: string, options: { dryRun: boolean }) => {
      const orchestrator = await createOrchestrator();
      const result = await orchestrator.ideate({ request, dryRun: options.dryRun });
      printJson(result.run);
    });
}
