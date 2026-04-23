import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { FeatureStructureService } from "../../packages/core/src/artifacts/feature-structure-service.js";
import { resolveStageRequest } from "../../packages/cli/src/commands/command-support.js";

const originalCwd = process.cwd();
const tempDirs: string[] = [];

afterEach(async () => {
  process.chdir(originalCwd);
  await Promise.all(tempDirs.map((dir) => rm(dir, { recursive: true, force: true })));
  tempDirs.length = 0;
});

describe("resolveStageRequest", () => {
  it("loads the saved feature request when no override is provided", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "ethereal-claw-command-support-"));
    tempDirs.push(root);
    process.chdir(root);
    await mkdir(path.join(root, "config"), { recursive: true });
    await writeFile(
      path.join(root, "config", "ethereal-claw.config.yaml"),
      ["provider: mock", "baseDirectory: ec", "providers: {}", ""].join("\n")
    );

    const featureStructure = new FeatureStructureService(root);
    await featureStructure.createWorkspace({
      slug: "feature-auth-refresh",
      title: "Auth Refresh",
      request: "refresh tokens for admins",
      status: "draft",
      createdAt: "2026-04-17T00:00:00.000Z",
      updatedAt: "2026-04-17T00:00:00.000Z"
    });

    await expect(resolveStageRequest("feature-auth-refresh", "")).resolves.toBe("refresh tokens for admins");
  });

  it("falls back to bundled defaults when no config file exists", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "ethereal-claw-command-support-"));
    tempDirs.push(root);
    process.chdir(root);

    const featureStructure = new FeatureStructureService(root);
    await featureStructure.createWorkspace({
      slug: "feature-auth-refresh",
      title: "Auth Refresh",
      request: "refresh tokens for admins",
      status: "draft",
      createdAt: "2026-04-17T00:00:00.000Z",
      updatedAt: "2026-04-17T00:00:00.000Z"
    });

    const savedCi = process.env["CI"];
    const savedQuiet = process.env["ETHEREAL_QUIET"];
    delete process.env["CI"];
    delete process.env["ETHEREAL_QUIET"];

    const stderrChunks: string[] = [];
    const originalWrite = process.stderr.write.bind(process.stderr);
    process.stderr.write = (chunk: string | Uint8Array, ...args: unknown[]) => {
      stderrChunks.push(typeof chunk === "string" ? chunk : String(chunk));
      return originalWrite(chunk, ...(args as Parameters<typeof originalWrite>).slice(1));
    };

    try {
      await expect(resolveStageRequest("feature-auth-refresh", "")).resolves.toBe("refresh tokens for admins");
      expect(stderrChunks.some((line) => line.includes("[ethereal-claw] No config found"))).toBe(true);
    } finally {
      process.stderr.write = originalWrite;
      if (savedCi !== undefined) {
        process.env["CI"] = savedCi;
      }
      if (savedQuiet !== undefined) {
        process.env["ETHEREAL_QUIET"] = savedQuiet;
      }
    }
  });
});
