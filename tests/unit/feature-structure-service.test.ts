import { access, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { FeatureStructureService } from "../../packages/core/src/artifacts/feature-structure-service.js";
import { clawConfigSchema } from "../../packages/core/src/config/config-schema.js";
import { resolveWorkspacePaths } from "../../packages/core/src/config/workspace-paths.js";

const tempDirs: string[] = [];
const defaultWorkspace = clawConfigSchema.parse({}).workspace;

function createService(root: string, workspace = defaultWorkspace): FeatureStructureService {
  return new FeatureStructureService(resolveWorkspacePaths(root, workspace));
}

afterEach(async () => {
  await Promise.all(tempDirs.map((dir) => rm(dir, { recursive: true, force: true })));
  tempDirs.length = 0;
});

describe("FeatureStructureService", () => {
  it("creates the expected feature workspace", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "ethereal-claw-"));
    tempDirs.push(root);

    const service = createService(root);
    await service.createWorkspace({
      slug: "feature-auth-refresh",
      title: "Auth Refresh",
      request: "refresh tokens for admins",
      status: "draft",
      createdAt: "2026-04-17T00:00:00.000Z",
      updatedAt: "2026-04-17T00:00:00.000Z"
    });

    await expect(access(path.join(root, ".ec", "features", "feature-auth-refresh", "stories"))).resolves.toBeUndefined();
  });

  it("serializes feature metadata safely as YAML", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "ethereal-claw-"));
    tempDirs.push(root);

    const service = createService(root);
    await service.createWorkspace({
      slug: "feature-title-with-punctuation",
      title: "Auth: Refresh #1",
      request: "refresh tokens for admins: phase #1",
      status: "draft",
      createdAt: "2026-04-17T00:00:00.000Z",
      updatedAt: "2026-04-17T00:00:00.000Z"
    });

    const featureYaml = await readFile(
      path.join(root, ".ec", "features", "feature-title-with-punctuation", "feature.yaml"),
      "utf8"
    );

    expect(featureYaml).toContain("title: 'Auth: Refresh #1'");
    expect(featureYaml).toContain("request: 'refresh tokens for admins: phase #1'");
  });

  it("loads saved feature metadata", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "ethereal-claw-"));
    tempDirs.push(root);

    const service = createService(root);
    await service.createWorkspace({
      slug: "feature-auth-refresh",
      title: "Auth Refresh",
      request: "refresh tokens for admins",
      status: "draft",
      createdAt: "2026-04-17T00:00:00.000Z",
      updatedAt: "2026-04-17T00:00:00.000Z"
    });

    await expect(service.loadFeature("feature-auth-refresh")).resolves.toMatchObject({
      slug: "feature-auth-refresh",
      request: "refresh tokens for admins"
    });
  });

  it("treats an existing feature directory without metadata as an existing workspace", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "ethereal-claw-"));
    tempDirs.push(root);

    await mkdir(path.join(root, ".ec", "features", "feature-auth-refresh"), { recursive: true });

    const service = createService(root);

    await expect(service.workspaceExists("feature-auth-refresh")).resolves.toBe(true);
  });

  it("rejects feature metadata with an invalid status", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "ethereal-claw-"));
    tempDirs.push(root);

    await mkdir(path.join(root, ".ec", "features", "feature-auth-refresh"), { recursive: true });
    await writeFile(
      path.join(root, ".ec", "features", "feature-auth-refresh", "feature.yaml"),
      [
        "slug: feature-auth-refresh",
        "title: Auth Refresh",
        "request: refresh tokens for admins",
        "status: shipped",
        "createdAt: '2026-04-17T00:00:00.000Z'",
        "updatedAt: '2026-04-17T00:00:00.000Z'",
        ""
      ].join("\n")
    );

    const service = createService(root);

    await expect(service.loadFeature("feature-auth-refresh")).rejects.toThrow("Invalid feature metadata");
  });

  it("supports workspace directory overrides", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "ethereal-claw-"));
    tempDirs.push(root);

    const service = createService(root, {
      rootDirectory: "./artifacts",
      configDirectory: "./artifacts/config",
      featuresDirectory: "./artifacts/features",
      runsDirectory: "./artifacts/runs"
    });
    await service.createWorkspace({
      slug: "feature-auth-refresh",
      title: "Auth Refresh",
      request: "refresh tokens for admins",
      status: "draft",
      createdAt: "2026-04-17T00:00:00.000Z",
      updatedAt: "2026-04-17T00:00:00.000Z"
    });

    await expect(access(path.join(root, "artifacts", "features", "feature-auth-refresh", "feature.yaml"))).resolves.toBeUndefined();
  });
});
