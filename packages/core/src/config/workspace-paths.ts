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
  rootDir: string | undefined,
  workspace: ClawConfig["workspace"]
): WorkspacePaths {
  const resolvedRootDir = rootDir ?? process.cwd();
  const rootDirectory = resolveWithin(resolvedRootDir, workspace.rootDirectory);

  // Workspace config paths are project-root relative for explicit, predictable placement.
  return {
    rootDirectory,
    configDirectory: resolveWithin(resolvedRootDir, workspace.configDirectory),
    featuresDirectory: resolveWithin(resolvedRootDir, workspace.featuresDirectory),
    runsDirectory: resolveWithin(resolvedRootDir, workspace.runsDirectory),
    cacheDirectory: path.join(rootDirectory, "cache"),
    tempDirectory: path.join(rootDirectory, "temp")
  };
}
