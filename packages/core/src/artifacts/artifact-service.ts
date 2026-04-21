import path from "node:path";
import type { RunLog } from "@ethereal-claw/shared";
import { assertFeatureSlug, ensureDir, resolveWithin, writeFileEnsured } from "../utils/file-system.js";

const runIdPattern = /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/;

export class ArtifactService {
  constructor(private readonly rootDir = process.cwd()) {}

  async writeFeatureArtifact(featureSlug: string, relativePath: string, content: string): Promise<void> {
    const safeFeatureSlug = assertFeatureSlug(featureSlug);
    const featureRoot = resolveWithin(this.rootDir, "features", safeFeatureSlug);
    const targetPath = resolveWithin(featureRoot, relativePath);
    await writeFileEnsured(targetPath, content);
  }

  async ensureRuntimeDirectories(): Promise<void> {
    await Promise.all([
      ensureDir(path.join(this.rootDir, "features")),
      ensureDir(path.join(this.rootDir, "runs"))
    ]);
  }

  async writeRunLog(run: RunLog): Promise<void> {
    const safeRunId = this.assertRunId(run.id);
    const runsDir = resolveWithin(this.rootDir, "runs");
    const targetPath = resolveWithin(runsDir, `${safeRunId}.json`);
    const safeFeatureSlug = assertFeatureSlug(run.featureSlug);
    await writeFileEnsured(targetPath, `${JSON.stringify(run, null, 2)}\n`);
    await writeFileEnsured(
      resolveWithin(this.rootDir, "features", safeFeatureSlug, "run-history", `${safeRunId}.json`),
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
