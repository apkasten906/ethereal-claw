import { Command } from "commander";
import { createOrchestrator, printStageResult, resolveIdeateConflict } from "./command-support.js";

export function createIdeateCommand(): Command {
  return new Command("ideate")
    .description("Create a feature workspace from a rough request.")
    .argument("<request>", "feature request")
    .option("--dry-run", "record a dry run", false)
    .option("--json", "emit machine-readable JSON", false)
    .action(async (request: string, options: { dryRun: boolean; json: boolean }) => {
      const { orchestrator, config } = await createOrchestrator();
      const resolution = await resolveIdeateConflict(request, orchestrator.rootDir, config);
      const result = await orchestrator.ideate({
        request,
        featureSlug: resolution.featureSlug,
        dryRun: options.dryRun,
        overwriteExisting: resolution.overwritten
      });
      printStageResult(
        "ideate",
        result,
        config,
        orchestrator.rootDir,
        [
          `request=${request}`,
          `dryRun=${options.dryRun}`,
          ...(resolution.overwritten ? ["existingFeature=overwritten"] : []),
          ...(resolution.featureSlug ? [`featureSlug=${resolution.featureSlug}`] : [])
        ],
        options.json
      );
    });
}
