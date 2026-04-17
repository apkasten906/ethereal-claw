import path from "node:path";
import type { FeatureRecord } from "@ethereal-claw/shared";
import { ensureDir, writeFileEnsured } from "../utils/file-system.js";

export class FeatureStructureService {
  constructor(private readonly rootDir = process.cwd()) {}

  featureRoot(slug: string): string {
    return path.join(this.rootDir, "features", slug);
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
    await writeFileEnsured(path.join(root, "feature.yaml"), [
      `slug: ${feature.slug}`,
      `title: ${feature.title}`,
      `request: ${JSON.stringify(feature.request)}`,
      `status: ${feature.status}`,
      `createdAt: ${feature.createdAt}`,
      `updatedAt: ${feature.updatedAt}`
    ].join("\n"));

    return root;
  }
}
