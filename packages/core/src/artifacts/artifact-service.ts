import { access } from "node:fs/promises";
import type { RunLog } from "@ethereal-claw/shared";
import type { WorkspacePaths } from "../config/workspace-paths.js";
import { assertFeatureSlug, ensureDir, resolveWithin, writeFileEnsured } from "../utils/file-system.js";

const runIdPattern = /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/;

export class ArtifactService {
  constructor(private readonly workspacePaths: WorkspacePaths) {}

  async writeFeatureArtifact(featureSlug: string, relativePath: string, content: string): Promise<void> {
    const safeFeatureSlug = assertFeatureSlug(featureSlug);
    const featureRoot = resolveWithin(this.workspacePaths.featuresDirectory, safeFeatureSlug);
    const targetPath = resolveWithin(featureRoot, relativePath);
    await writeFileEnsured(targetPath, content);
  }

  async featureArtifactExists(featureSlug: string, relativePath: string): Promise<boolean> {
    const safeFeatureSlug = assertFeatureSlug(featureSlug);
    const featureRoot = resolveWithin(this.workspacePaths.featuresDirectory, safeFeatureSlug);
    const targetPath = resolveWithin(featureRoot, relativePath);

    try {
      await access(targetPath);
      return true;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return false;
      }

      throw error;
    }
  }

  async ensureRuntimeDirectories(): Promise<void> {
    await Promise.all([
      ensureDir(this.workspacePaths.rootDirectory),
      ensureDir(this.workspacePaths.configDirectory),
      ensureDir(this.workspacePaths.featuresDirectory),
      ensureDir(this.workspacePaths.runsDirectory),
      ensureDir(this.workspacePaths.cacheDirectory),
      ensureDir(this.workspacePaths.tempDirectory)
    ]);
  }

  async writeRunLog(run: RunLog): Promise<void> {
    const safeRunId = this.assertRunId(run.id);
    const runsDir = this.workspacePaths.runsDirectory;
    const targetPath = resolveWithin(runsDir, `${safeRunId}.json`);
    const safeFeatureSlug = assertFeatureSlug(run.featureSlug);
    await writeFileEnsured(targetPath, `${JSON.stringify(run, null, 2)}\n`);
    await writeFileEnsured(
      resolveWithin(this.workspacePaths.featuresDirectory, safeFeatureSlug, "run-history", `${safeRunId}.json`),
      `${JSON.stringify(run, null, 2)}\n`
    );
  }

  private assertRunId(runId: string): string {
    if (!runIdPattern.test(runId)) {
      throw new Error(`Invalid run id: "${runId}"`);
    }

    return runId;
  }
}
