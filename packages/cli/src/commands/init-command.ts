import { constants } from "node:fs";
import { copyFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { Command } from "commander";
import { ArtifactService, bundledConfigExamplePath } from "@ethereal-claw/core";
import { printMessage } from "../presentation/console-output.js";

export function createInitCommand(): Command {
  return new Command("init")
    .description("Create baseline local configuration.")
    .action(async () => {
      const artifacts = new ArtifactService(process.cwd());
      await artifacts.ensureRuntimeDirectories();

      await mkdir(path.join(process.cwd(), "config"), { recursive: true });
      const source = bundledConfigExamplePath;
      const target = path.join(process.cwd(), "config", "ethereal-claw.config.yaml");

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
