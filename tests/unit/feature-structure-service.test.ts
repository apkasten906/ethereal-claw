import { access, mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { FeatureStructureService } from "../../packages/core/src/artifacts/feature-structure-service.js";

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.map((dir) => rm(dir, { recursive: true, force: true })));
  tempDirs.length = 0;
});

describe("FeatureStructureService", () => {
  it("creates the expected feature workspace", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "ethereal-claw-"));
    tempDirs.push(root);

    const service = new FeatureStructureService(root);
    await service.createWorkspace({
      slug: "feature-auth-refresh",
      title: "Auth Refresh",
      request: "refresh tokens for admins",
      status: "draft",
      createdAt: "2026-04-17T00:00:00.000Z",
      updatedAt: "2026-04-17T00:00:00.000Z"
    });

    await expect(access(path.join(root, "features", "feature-auth-refresh", "stories"))).resolves.toBeUndefined();
  });
});
