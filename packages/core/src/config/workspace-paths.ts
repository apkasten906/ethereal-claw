import path from "node:path";
import type { ClawConfig } from "./config-schema.js";
import { resolveWithin } from "../utils/file-system.js";

export interface WorkspacePaths {
  rootDirectory: string;
  configDirectory: string;
  featuresDirectory: string;
  runsDirectory: string;
  cacheDirectory: string;
  tempDirectory: string;
}

export function resolveWorkspacePaths(
  rootDir = process.cwd(),
  workspace: ClawConfig["workspace"]
): WorkspacePaths {
  const rootDirectory = resolveWithin(rootDir, workspace.rootDirectory);

  return {
    rootDirectory,
    configDirectory: resolveWithin(rootDir, workspace.configDirectory),
    featuresDirectory: resolveWithin(rootDir, workspace.featuresDirectory),
    runsDirectory: resolveWithin(rootDir, workspace.runsDirectory),
    cacheDirectory: path.join(rootDirectory, "cache"),
    tempDirectory: path.join(rootDirectory, "temp")
  };
}
