import { access, mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { ArtifactService } from "../../packages/core/src/artifacts/artifact-service.js";
import { clawConfigSchema } from "../../packages/core/src/config/config-schema.js";
import { resolveWorkspacePaths } from "../../packages/core/src/config/workspace-paths.js";

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.map((dir) => rm(dir, { recursive: true, force: true })));
  tempDirs.length = 0;
});

describe("ArtifactService", () => {
  function createService(root: string, workspace = clawConfigSchema.parse({}).workspace): ArtifactService {
    return new ArtifactService(resolveWorkspacePaths(root, workspace));
  }

  it("rejects path traversal in feature slugs", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "ethereal-claw-artifacts-"));
    tempDirs.push(root);

    const service = createService(root);

    await expect(
      service.writeFeatureArtifact("../escape", "plan.md", "content")
    ).rejects.toThrow('Invalid feature slug: "../escape"');
  });

  it("rejects path traversal when writing run history", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "ethereal-claw-artifacts-"));
    tempDirs.push(root);

    const service = createService(root);

    await expect(
      service.writeRunLog({
        id: "run-123",
        featureSlug: "../escape",
        stage: "plan",
        startedAt: "2026-04-17T00:00:00.000Z",
        completedAt: "2026-04-17T00:00:01.000Z",
        success: true,
        dryRun: true,
        executions: [],
        notes: []
      })
    ).rejects.toThrow('Invalid feature slug: "../escape"');
  });

  it("rejects path traversal in run ids", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "ethereal-claw-artifacts-"));
    tempDirs.push(root);

    const service = createService(root);

    await expect(
      service.writeRunLog({
        id: "../escape",
        featureSlug: "feature-ok",
        stage: "plan",
        startedAt: "2026-04-17T00:00:00.000Z",
        completedAt: "2026-04-17T00:00:01.000Z",
        success: true,
        dryRun: true,
        executions: [],
        notes: []
      })
    ).rejects.toThrow('Invalid run id: "../escape"');
  });

  it("rejects path traversal in relative artifact paths", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "ethereal-claw-artifacts-"));
    tempDirs.push(root);

    const service = createService(root);

    await expect(
      service.writeFeatureArtifact("feature-ok", "..\\..\\escape.txt", "content")
    ).rejects.toThrow(/escapes root directory/i);
  });

  it("writes artifacts under the configured workspace directories", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "ethereal-claw-artifacts-"));
    tempDirs.push(root);

    const service = createService(root, {
      rootDirectory: "./artifacts",
      configDirectory: "./artifacts/config",
      featuresDirectory: "./artifacts/features",
      runsDirectory: "./artifacts/runs"
    });
    await service.ensureRuntimeDirectories();
    await service.writeFeatureArtifact("feature-ok", "plan.md", "content");
    await service.writeRunLog({
      id: "run-123",
      featureSlug: "feature-ok",
      stage: "plan",
      startedAt: "2026-04-17T00:00:00.000Z",
      completedAt: "2026-04-17T00:00:01.000Z",
      success: true,
      dryRun: true,
      executions: [],
      notes: []
    });

    await expect(access(path.join(root, "artifacts", "features", "feature-ok", "plan.md"))).resolves.toBeUndefined();
    await expect(access(path.join(root, "artifacts", "runs", "run-123.json"))).resolves.toBeUndefined();
  });
});
