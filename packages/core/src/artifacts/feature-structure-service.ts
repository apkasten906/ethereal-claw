import path from "node:path";
import { load } from "js-yaml";
import { dump } from "js-yaml";
import type { FeatureRecord } from "@ethereal-claw/shared";
import { assertFeatureSlug, ensureDir, readUtf8, resolveWithin, writeFileEnsured } from "../utils/file-system.js";

const featureStatuses = new Set<FeatureRecord["status"]>([
  "draft",
  "ideated",
  "planned",
  "implemented",
  "tested",
  "reviewed"
]);

export class FeatureStructureService {
  constructor(private readonly rootDir = process.cwd()) {}

  featureRoot(slug: string): string {
    return resolveWithin(this.rootDir, "features", assertFeatureSlug(slug));
  }

  featureMetadataPath(slug: string): string {
    return resolveWithin(this.featureRoot(slug), "feature.yaml");
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

  async loadFeature(slug: string): Promise<FeatureRecord> {
    const featurePath = this.featureMetadataPath(slug);
    const parsed = load(await readUtf8(featurePath));

    if (!this.isFeatureRecord(parsed)) {
      throw new Error(`Invalid feature metadata in ${featurePath}`);
    }

    return parsed;
  }

  private isFeatureRecord(value: unknown): value is FeatureRecord {
    if (!value || typeof value !== "object") {
      return false;
    }

    const record = value as Record<string, unknown>;

    return (
      typeof record.slug === "string" &&
      typeof record.title === "string" &&
      typeof record.request === "string" &&
      typeof record.status === "string" &&
      featureStatuses.has(record.status as FeatureRecord["status"]) &&
      typeof record.createdAt === "string" &&
      typeof record.updatedAt === "string"
    );
  }
}
