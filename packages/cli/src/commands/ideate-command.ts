import { Command } from "commander";
import { FeatureWorkspaceConflictError } from "@ethereal-claw/core";
import { createOrchestrator, printStageResult, resolveIdeateConflict } from "./command-support.js";
import { printJson, printMessage } from "../presentation/console-output.js";

export function createIdeateCommand(): Command {
  return new Command("ideate")
    .description("Create a feature workspace from a rough request.")
    .argument("<request>", "feature request")
    .option("--dry-run", "record a dry run", false)
    .option("--overwrite", "replace an existing feature workspace with the same slug", false)
    .option("--json", "emit machine-readable JSON", false)
    .action(async (request: string, options: { dryRun: boolean; overwrite: boolean; json: boolean }) => {
      const { orchestrator, config } = await createOrchestrator();
      try {
        const resolution = await resolveIdeateConflict(request, orchestrator.rootDir, config, {
          overwrite: options.overwrite,
          json: options.json
        });

        if (resolution.cancelled) {
          // Print JSON message for cancellation if in JSON mode, otherwise print a simple message.
          // This allows calling scripts to detect cancellation and handle it appropriately, depending
          // on whether they're running in interactive mode or not.
          if (options.json) {
            printJson({
              cancelled: true,
              message: "Cancelling operation."
            });
          } else {
            printMessage("Cancelling operation.");
          }
          return;
        }

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
      } catch (error) {
        if (error instanceof FeatureWorkspaceConflictError && options.json) {
          printJson({
            error: {
              code: "feature_conflict",
              message: error.message,
              featureSlug: error.featureSlug
            }
          });
          process.exitCode = 1;
          return;
        }

        throw error;
      }
    });
}
