import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { ArtifactService } from "../../packages/core/src/artifacts/artifact-service.js";

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.map((dir) => rm(dir, { recursive: true, force: true })));
  tempDirs.length = 0;
});

describe("ArtifactService", () => {
  it("rejects path traversal in feature slugs", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "ethereal-claw-artifacts-"));
    tempDirs.push(root);

    const service = new ArtifactService(root);

    await expect(
      service.writeFeatureArtifact("../escape", "plan.md", "content")
    ).rejects.toThrow('Invalid feature slug: "../escape"');
  });

  it("rejects path traversal when writing run history", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "ethereal-claw-artifacts-"));
    tempDirs.push(root);

    const service = new ArtifactService(root);

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
});
