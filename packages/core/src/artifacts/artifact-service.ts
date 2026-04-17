import path from "node:path";
import type { RunLog } from "@ethereal-claw/shared";
import { assertFeatureSlug, ensureDir, resolveWithin, writeFileEnsured } from "../utils/file-system.js";

export class ArtifactService {
  constructor(private readonly rootDir = process.cwd()) {}

  async writeFeatureArtifact(featureSlug: string, relativePath: string, content: string): Promise<void> {
    const safeFeatureSlug = assertFeatureSlug(featureSlug);
    const targetPath = resolveWithin(this.rootDir, "features", safeFeatureSlug, relativePath);
    await writeFileEnsured(targetPath, content);
  }

  async ensureRuntimeDirectories(): Promise<void> {
    await Promise.all([
      ensureDir(path.join(this.rootDir, "features")),
      ensureDir(path.join(this.rootDir, "runs"))
    ]);
  }

  async writeRunLog(run: RunLog): Promise<void> {
    const targetPath = resolveWithin(this.rootDir, "runs", `${run.id}.json`);
    const safeFeatureSlug = assertFeatureSlug(run.featureSlug);
    await writeFileEnsured(targetPath, `${JSON.stringify(run, null, 2)}\n`);
    await writeFileEnsured(
      resolveWithin(this.rootDir, "features", safeFeatureSlug, "run-history", `${run.id}.json`),
      `${JSON.stringify(run, null, 2)}\n`
    );
  }
}
