import path from "node:path";
import { constants } from "node:fs";
import { copyFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { Command } from "commander";
import { createOrchestrator } from "./command-support.js";
import { printMessage } from "../presentation/console-output.js";

const moduleDir = path.dirname(fileURLToPath(import.meta.url));
const bundledExampleConfigPath = path.resolve(moduleDir, "../../../../config/ethereal-claw.config.example.yaml");

export function createInitCommand(): Command {
  return new Command("init")
    .description("Create baseline local configuration.")
    .action(async () => {
      const orchestrator = await createOrchestrator();
      await orchestrator.init();

      await mkdir(path.join(process.cwd(), "config"), { recursive: true });
      const source = bundledExampleConfigPath;
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
