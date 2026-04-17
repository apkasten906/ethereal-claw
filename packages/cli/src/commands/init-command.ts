import path from "node:path";
import { copyFile, mkdir } from "node:fs/promises";
import { Command } from "commander";
import { printMessage } from "../presentation/console-output.js";

export function createInitCommand(): Command {
  return new Command("init")
    .description("Create baseline local configuration.")
    .action(async () => {
      await mkdir(path.join(process.cwd(), "config"), { recursive: true });
      const source = path.join(process.cwd(), "config", "ethereal-claw.config.example.yaml");
      const target = path.join(process.cwd(), "config", "ethereal-claw.config.yaml");

      try {
        await copyFile(source, target);
        printMessage(`Wrote ${path.relative(process.cwd(), target)}`);
      } catch {
        printMessage("Config already exists or example config is missing.");
      }
    });
}
