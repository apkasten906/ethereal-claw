import path from "node:path";
import type { RunLog } from "@ethereal-claw/shared";
import { writeFileEnsured } from "../utils/file-system.js";

export class ArtifactService {
  constructor(private readonly rootDir = process.cwd()) {}

  async writeFeatureArtifact(featureSlug: string, relativePath: string, content: string): Promise<void> {
    const targetPath = path.join(this.rootDir, "features", featureSlug, relativePath);
    await writeFileEnsured(targetPath, content);
  }

  async writeRunLog(run: RunLog): Promise<void> {
    const targetPath = path.join(this.rootDir, "runs", `${run.id}.json`);
    await writeFileEnsured(targetPath, `${JSON.stringify(run, null, 2)}\n`);
    await writeFileEnsured(
      path.join(this.rootDir, "features", run.featureSlug, "run-history", `${run.id}.json`),
      `${JSON.stringify(run, null, 2)}\n`
    );
  }
}
