import { randomUUID } from "node:crypto";
import { access, mkdtemp, rename, rm } from "node:fs/promises";
import path from "node:path";
import { load, dump } from "js-yaml";
import type { FeatureRecord } from "@ethereal-claw/shared";
import type { WorkspacePaths } from "../config/workspace-paths.js";
import { assertFeatureSlug, ensureDir, readUtf8, resolveWithin, writeFileEnsured } from "../utils/file-system.js";

const featureStatuses = new Set<FeatureRecord["status"]>([
  "draft",
  "ideated",
  "planned",
  "bdd-authored",
  "consistency-reviewed",
  "implemented",
  "tested",
  "reviewed"
]);

export class FeatureStructureService {
  constructor(private readonly workspacePaths: WorkspacePaths) {}

  async createStagingWorkspace(feature: FeatureRecord): Promise<string> {
    await ensureDir(this.workspacePaths.tempDirectory);
    const stagingRoot = await mkdtemp(
      path.join(this.workspacePaths.tempDirectory, `${assertFeatureSlug(feature.slug)}-staging-`)
    );
    await this.initializeWorkspace(stagingRoot, feature);
    return stagingRoot;
  }

  featureRoot(slug: string): string {
    return resolveWithin(this.workspacePaths.featuresDirectory, assertFeatureSlug(slug));
  }

  featureMetadataPath(slug: string): string {
    return resolveWithin(this.featureRoot(slug), "feature.yaml");
  }

  async workspaceExists(slug: string): Promise<boolean> {
    try {
      await access(this.featureRoot(slug));
      return true;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return false;
      }

      throw error;
    }
  }

  async createWorkspace(feature: FeatureRecord): Promise<string> {
    const root = this.featureRoot(feature.slug);
    await this.initializeWorkspace(root, feature);
    return root;
  }

  async writeWorkspaceArtifact(workspaceRoot: string, relativePath: string, content: string): Promise<void> {
    await writeFileEnsured(resolveWithin(workspaceRoot, relativePath), content);
  }

  async loadFeature(slug: string): Promise<FeatureRecord> {
    const featurePath = this.featureMetadataPath(slug);
    const parsed = load(await readUtf8(featurePath));

    if (!this.isFeatureRecord(parsed)) {
      throw new Error(`Invalid feature metadata in ${featurePath}`);
    }

    return parsed;
  }

  async updateFeature(slug: string, updates: Partial<Pick<FeatureRecord, "status" | "updatedAt" | "request" | "title">>): Promise<FeatureRecord> {
    const feature = await this.loadFeature(slug);
    const nextFeature = {
      ...feature,
      ...updates
    };

    await writeFileEnsured(
      this.featureMetadataPath(slug),
      dump(nextFeature, { lineWidth: -1 })
    );

    return nextFeature;
  }

  async removeWorkspace(slug: string): Promise<void> {
    await rm(this.featureRoot(slug), { recursive: true, force: true });
  }

  async discardWorkspaceRoot(workspaceRoot: string): Promise<void> {
    await rm(workspaceRoot, { recursive: true, force: true });
  }

  async replaceWorkspaceFromStaging(slug: string, stagingRoot: string): Promise<WorkspaceReplacement> {
    const targetRoot = this.featureRoot(slug);
    const backupRoot = await this.moveWorkspaceToBackupIfPresent(slug);

    try {
      await ensureDir(path.dirname(targetRoot));
      await rename(stagingRoot, targetRoot);

      return {
        finalize: async () => {
          if (backupRoot) {
            await rm(backupRoot, { recursive: true, force: true });
          }
        },
        rollback: async () => {
          await rm(targetRoot, { recursive: true, force: true });
          if (backupRoot) {
            await rename(backupRoot, targetRoot);
          }
        }
      };
    } catch (error) {
      await this.discardWorkspaceRoot(stagingRoot);
      if (backupRoot) {
        await rename(backupRoot, targetRoot);
      }
      throw error;
    }
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

  private async initializeWorkspace(root: string, feature: FeatureRecord): Promise<void> {
    const directories = [
      "stories",
      "bdd",
      "traceability",
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
  }

  private async moveWorkspaceToBackupIfPresent(slug: string): Promise<string | undefined> {
    const targetRoot = this.featureRoot(slug);

    try {
      await access(targetRoot);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return undefined;
      }

      throw error;
    }

    await ensureDir(this.workspacePaths.tempDirectory);
    const backupRoot = path.join(this.workspacePaths.tempDirectory, `${assertFeatureSlug(slug)}-backup-${randomUUID()}`);
    await rename(targetRoot, backupRoot);
    return backupRoot;
  }
}

export interface WorkspaceReplacement {
  finalize(): Promise<void>;
  rollback(): Promise<void>;
}
