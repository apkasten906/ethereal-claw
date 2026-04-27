import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { FeatureStructureService } from "../../packages/core/src/artifacts/feature-structure-service.js";
import { clawConfigSchema } from "../../packages/core/src/config/config-schema.js";
import { resolveWorkspacePaths } from "../../packages/core/src/config/workspace-paths.js";
import { StatusService } from "../../packages/core/src/status/status-service.js";
import { formatFeatureStatus } from "../../packages/cli/src/commands/status-command.js";

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.map((dir) => rm(dir, { recursive: true, force: true })));
  tempDirs.length = 0;
});

async function createServices() {
  const root = await mkdtemp(path.join(os.tmpdir(), "ethereal-claw-status-"));
  tempDirs.push(root);
  const workspacePaths = resolveWorkspacePaths(root, clawConfigSchema.parse({}).workspace);

  return {
    root,
    featureStructure: new FeatureStructureService(workspacePaths),
    status: new StatusService(workspacePaths)
  };
}

describe("StatusService", () => {
  it("lists known features with their latest run stage", async () => {
    const { root, featureStructure, status } = await createServices();
    await featureStructure.createWorkspace({
      slug: "feature-auth-refresh",
      title: "Auth Refresh",
      request: "refresh tokens",
      status: "draft",
      createdAt: "2026-04-17T00:00:00.000Z",
      updatedAt: "2026-04-17T00:00:00.000Z"
    });
    await writeRunLog(root, "feature-auth-refresh", "plan", true);

    await expect(status.listFeatures()).resolves.toMatchObject([
      {
        slug: "feature-auth-refresh",
        currentStage: "plan",
        nextCommand: "ec implement feature-auth-refresh"
      }
    ]);
  });

  it("inspects available and missing artifacts for a partially completed feature", async () => {
    const { root, featureStructure, status } = await createServices();
    await featureStructure.createWorkspace({
      slug: "feature-auth-refresh",
      title: "Auth Refresh",
      request: "refresh tokens",
      status: "draft",
      createdAt: "2026-04-17T00:00:00.000Z",
      updatedAt: "2026-04-17T00:00:00.000Z"
    });
    await writeFile(path.join(root, ".ec", "features", "feature-auth-refresh", "ideation.md"), "idea\n");
    await writeFile(path.join(root, ".ec", "features", "feature-auth-refresh", "stories", "001.md"), "story\n");
    await writeRunLog(root, "feature-auth-refresh", "plan", true);

    const inspected = await status.inspectFeature("feature-auth-refresh");

    expect(inspected).toMatchObject({
      currentStage: "plan",
      nextCommand: "ec implement feature-auth-refresh"
    });
    expect(inspected?.availableArtifacts.map((artifact) => artifact.label)).toEqual(["ideation", "stories"]);
    expect(inspected?.missingArtifacts.map((artifact) => artifact.label)).toEqual([
      "bdd",
      "plan",
      "implementation tasks"
    ]);
  });

  it("formats feature status output readably", async () => {
    const { featureStructure, status } = await createServices();
    await featureStructure.createWorkspace({
      slug: "feature-auth-refresh",
      title: "Auth Refresh",
      request: "refresh tokens",
      status: "draft",
      createdAt: "2026-04-17T00:00:00.000Z",
      updatedAt: "2026-04-17T00:00:00.000Z"
    });

    const inspected = await status.inspectFeature("feature-auth-refresh");

    expect(formatFeatureStatus(inspected!)).toContain("Feature: Auth Refresh");
    expect(formatFeatureStatus(inspected!)).toContain("Available artifacts:\n- none");
    expect(formatFeatureStatus(inspected!)).toContain("Next: ec plan feature-auth-refresh");
  });

  it("surfaces malformed feature metadata during feature listing", async () => {
    const { root, status } = await createServices();
    await mkdir(path.join(root, ".ec", "features", "feature-auth-refresh"), { recursive: true });
    await writeFile(
      path.join(root, ".ec", "features", "feature-auth-refresh", "feature.yaml"),
      [
        "slug: feature-auth-refresh",
        "title: Auth Refresh",
        "request: refresh tokens",
        "status: shipped",
        "createdAt: '2026-04-17T00:00:00.000Z'",
        "updatedAt: '2026-04-17T00:00:00.000Z'",
        ""
      ].join("\n")
    );

    await expect(status.listFeatures()).rejects.toThrow("Invalid feature metadata");
  });
});

async function writeRunLog(root: string, featureSlug: string, stage: string, success: boolean): Promise<void> {
  const runHistory = path.join(root, ".ec", "features", featureSlug, "run-history");
  const runs = path.join(root, ".ec", "runs");
  await mkdir(runHistory, { recursive: true });
  await mkdir(runs, { recursive: true });
  const run = {
    id: `run-${stage}`,
    featureSlug,
    stage,
    startedAt: "2026-04-17T00:00:00.000Z",
    completedAt: "2026-04-17T00:01:00.000Z",
    success,
    dryRun: true,
    executions: [
      {
        agent: "planner",
        step: stage,
        tier: "low",
        estimatedInputTokens: 10,
        estimatedOutputTokens: 20,
        actualPromptTokens: 10,
        actualCompletionTokens: 20,
        estimatedCostUsd: 0.001
      }
    ],
    notes: []
  };
  const content = `${JSON.stringify(run, null, 2)}\n`;
  await writeFile(path.join(runHistory, `${run.id}.json`), content);
  await writeFile(path.join(runs, `${run.id}.json`), content);
}
