import path from "node:path";
import { dump } from "js-yaml";
import type { FeatureRecord } from "@ethereal-claw/shared";
import { assertFeatureSlug, ensureDir, resolveWithin, writeFileEnsured } from "../utils/file-system.js";

export class FeatureStructureService {
  constructor(private readonly rootDir = process.cwd()) {}

  featureRoot(slug: string): string {
    return resolveWithin(this.rootDir, "features", assertFeatureSlug(slug));
  }

  async createWorkspace(feature: FeatureRecord): Promise<string> {
    const root = this.featureRoot(feature.slug);
    const directories = [
      "stories",
      "bdd",
      "implementation",
      "tests",
      "review",
      "run-history"
    ];

    await ensureDir(root);
    await Promise.all(directories.map((segment) => ensureDir(path.join(root, segment))));
    await writeFileEnsured(
      path.join(root, "feature.yaml"),
      dump({
        slug: feature.slug,
        title: feature.title,
        request: feature.request,
        status: feature.status,
        createdAt: feature.createdAt,
        updatedAt: feature.updatedAt
      }, { lineWidth: -1 })
    );

    return root;
  }
}
