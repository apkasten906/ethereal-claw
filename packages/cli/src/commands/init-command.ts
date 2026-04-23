import { constants, existsSync } from "node:fs";
import { copyFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { Command } from "commander";
import { ArtifactService, bundledConfigExamplePath, clawConfigSchema, loadConfig } from "@ethereal-claw/core";
import { printMessage } from "../presentation/console-output.js";

export function createInitCommand(): Command {
  return new Command("init")
    .description("Create baseline local configuration.")
    .action(async () => {
      const target = path.join(process.cwd(), "config", "ethereal-claw.config.yaml");
      const config = existsSync(target) ? await loadConfig(target) : clawConfigSchema.parse({});
      const artifacts = new ArtifactService(process.cwd(), config.baseDirectory);
      await artifacts.ensureRuntimeDirectories();

      await mkdir(path.join(process.cwd(), "config"), { recursive: true });
      const source = bundledConfigExamplePath;

      try {
        await copyFile(source, target, constants.COPYFILE_EXCL);
        printMessage(`Wrote ${path.relative(process.cwd(), target)}`);
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === "EEXIST") {
          printMessage("Config already exists.");
          return;
        }

        throw error;
      }
    });
}
