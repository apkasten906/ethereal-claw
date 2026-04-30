import { Command } from "commander";
import { createOrchestrator, printRunResult, resolveStageRequest } from "./command-support.js";

export function createRunCommand(): Command {
  return new Command("run")
    .description("Run plan \u2192 bdd \u2192 review-consistency \u2192 implement \u2192 test \u2192 review for an existing feature workspace.")
    .argument("<featureSlug>", "feature slug")
    .option("--request <request>", "override feature request", "")
    .option("--dry-run", "record a dry run", false)
    .option("--json", "emit machine-readable JSON", false)
    .action(async (featureSlug: string, options: { request: string; dryRun: boolean; json: boolean }) => {
      const { orchestrator, config } = await createOrchestrator();
      const request = await resolveStageRequest(featureSlug, options.request, orchestrator.rootDir);
      const results = await orchestrator.run({
        featureSlug,
        request,
        dryRun: options.dryRun
      });
      printRunResult(results, config, orchestrator.rootDir, [`feature=${featureSlug}`, `request=${request}`, `dryRun=${options.dryRun}`], options.json);
    });
}
