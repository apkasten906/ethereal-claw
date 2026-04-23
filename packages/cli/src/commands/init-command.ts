import { constants, existsSync } from "node:fs";
import { copyFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { Command } from "commander";
import {
  ArtifactService,
  bundledAgentPoliciesPath,
  bundledConfigExamplePath,
  clawConfigSchema,
  loadConfig,
  resolveWorkspacePaths
} from "@ethereal-claw/core";
import { printMessage } from "../presentation/console-output.js";

export function createInitCommand(): Command {
  return new Command("init")
    .description("Create baseline local configuration.")
    .action(async () => {
      const target = path.join(process.cwd(), ".ec", "config", "project.yaml");
      const config = existsSync(target) ? await loadConfig(target) : clawConfigSchema.parse({});
      const workspacePaths = resolveWorkspacePaths(process.cwd(), config.workspace);
      const policiesTarget = path.join(workspacePaths.configDirectory, "agent-policies.yaml");
      const artifacts = new ArtifactService(workspacePaths);
      await artifacts.ensureRuntimeDirectories();

      await mkdir(workspacePaths.configDirectory, { recursive: true });
      const source = bundledConfigExamplePath;

      try {
        await copyFile(source, target, constants.COPYFILE_EXCL);
        printMessage(`Wrote ${path.relative(process.cwd(), target)}`);
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === "EEXIST") {
          printMessage("Config already exists.");
        } else {
          throw error;
        }
      }

      try {
        await copyFile(bundledAgentPoliciesPath, policiesTarget, constants.COPYFILE_EXCL);
        printMessage(`Wrote ${path.relative(process.cwd(), policiesTarget)}`);
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "EEXIST") {
          throw error;
        }
      }
    });
}
