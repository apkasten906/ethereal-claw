import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FeatureStructureService } from "../../packages/core/src/artifacts/feature-structure-service.js";
import { clawConfigSchema, type ClawConfig } from "../../packages/core/src/config/config-schema.js";
import { resolveWorkspacePaths } from "../../packages/core/src/config/workspace-paths.js";
import { resolveStageRequest } from "../../packages/cli/src/commands/command-support.js";

const originalCwd = process.cwd();
const tempDirs: string[] = [];
const defaultWorkspace = clawConfigSchema.parse({}).workspace;

function createFeatureStructure(root: string): FeatureStructureService {
  return new FeatureStructureService(resolveWorkspacePaths(root, defaultWorkspace));
}

function createConfig(): ClawConfig {
  return clawConfigSchema.parse({
    provider: "mock",
    providers: {}
  });
}

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
    await mkdir(path.join(root, ".ec", "config"), { recursive: true });
    await writeFile(
      path.join(root, ".ec", "config", "project.yaml"),
      ["provider: mock", "providers: {}", ""].join("\n")
    );

    const featureStructure = createFeatureStructure(root);
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

    const featureStructure = createFeatureStructure(root);
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

    process.stderr.write = ((chunk: string | Uint8Array) => {
      stderrChunks.push(typeof chunk === "string" ? chunk : String(chunk));
      return true;
    }) as typeof process.stderr.write;

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

describe("resolveIdeateConflict", () => {
  it("returns the derived slug when no existing feature collides", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "ethereal-claw-command-support-"));
    tempDirs.push(root);

    const { resolveIdeateConflict } = await import("../../packages/cli/src/commands/command-support.js");
      await expect(resolveIdeateConflict("refresh tokens for admins", root, createConfig())).resolves.toEqual({
        featureSlug: "feature-refresh-tokens-for-admins",
        overwritten: false,
        cancelled: false
      });
  });

  it("cancels when overwrite is declined", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "ethereal-claw-command-support-"));
    tempDirs.push(root);

    const featureStructure = createFeatureStructure(root);
    await featureStructure.createWorkspace({
      slug: "feature-refresh-tokens-for-admins",
      title: "Auth Refresh",
      request: "refresh tokens for admins",
      status: "draft",
      createdAt: "2026-04-17T00:00:00.000Z",
      updatedAt: "2026-04-17T00:00:00.000Z"
    });

    vi.resetModules();
    vi.doMock("node:readline/promises", () => ({
      createInterface: () => ({
        question: vi.fn().mockResolvedValue("n"),
        close: vi.fn()
      })
    }));
    const savedStdinTty = process.stdin.isTTY;
    const savedStdoutTty = process.stdout.isTTY;
    Object.defineProperty(process.stdin, "isTTY", { configurable: true, value: true });
    Object.defineProperty(process.stdout, "isTTY", { configurable: true, value: true });

    try {
      const { resolveIdeateConflict } = await import("../../packages/cli/src/commands/command-support.js");
      await expect(resolveIdeateConflict("refresh tokens for admins", root, createConfig())).resolves.toEqual({
        featureSlug: "feature-refresh-tokens-for-admins",
        overwritten: false,
        cancelled: true
      });
    } finally {
      Object.defineProperty(process.stdin, "isTTY", { configurable: true, value: savedStdinTty });
      Object.defineProperty(process.stdout, "isTTY", { configurable: true, value: savedStdoutTty });
      vi.doUnmock("node:readline/promises");
      vi.resetModules();
    }
  });

  it("overwrites the existing workspace when confirmed", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "ethereal-claw-command-support-"));
    tempDirs.push(root);

    const featureStructure = createFeatureStructure(root);
    await featureStructure.createWorkspace({
      slug: "feature-refresh-tokens-for-admins",
      title: "Auth Refresh",
      request: "refresh tokens for admins",
      status: "draft",
      createdAt: "2026-04-17T00:00:00.000Z",
      updatedAt: "2026-04-17T00:00:00.000Z"
    });

    await writeFile(
      path.join(root, ".ec", "features", "feature-refresh-tokens-for-admins", "ideation.md"),
      "existing\n",
      "utf8"
    );

    vi.resetModules();
    vi.doMock("node:readline/promises", () => ({
      createInterface: () => ({
        question: vi.fn().mockResolvedValue("y"),
        close: vi.fn()
      })
    }));
    const savedStdinTty = process.stdin.isTTY;
    const savedStdoutTty = process.stdout.isTTY;
    Object.defineProperty(process.stdin, "isTTY", { configurable: true, value: true });
    Object.defineProperty(process.stdout, "isTTY", { configurable: true, value: true });

    try {
      const { resolveIdeateConflict } = await import("../../packages/cli/src/commands/command-support.js");
      await expect(resolveIdeateConflict("refresh tokens for admins", root, createConfig())).resolves.toEqual({
        featureSlug: "feature-refresh-tokens-for-admins",
        overwritten: true,
        cancelled: false
      });
      await expect(
        createFeatureStructure(root).workspaceExists("feature-refresh-tokens-for-admins")
      ).resolves.toBe(true);
    } finally {
      Object.defineProperty(process.stdin, "isTTY", { configurable: true, value: savedStdinTty });
      Object.defineProperty(process.stdout, "isTTY", { configurable: true, value: savedStdoutTty });
      vi.doUnmock("node:readline/promises");
      vi.resetModules();
    }
  });

  it("requires --overwrite for non-interactive conflicts", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "ethereal-claw-command-support-"));
    tempDirs.push(root);

    const featureStructure = createFeatureStructure(root);
    await featureStructure.createWorkspace({
      slug: "feature-refresh-tokens-for-admins",
      title: "Auth Refresh",
      request: "refresh tokens for admins",
      status: "draft",
      createdAt: "2026-04-17T00:00:00.000Z",
      updatedAt: "2026-04-17T00:00:00.000Z"
    });

    const savedStdinTty = process.stdin.isTTY;
    const savedStdoutTty = process.stdout.isTTY;
    Object.defineProperty(process.stdin, "isTTY", { configurable: true, value: false });
    Object.defineProperty(process.stdout, "isTTY", { configurable: true, value: false });

    try {
      const { resolveIdeateConflict } = await import("../../packages/cli/src/commands/command-support.js");
      await expect(
        resolveIdeateConflict("refresh tokens for admins", root, createConfig(), { json: true })
      ).rejects.toThrow('Feature workspace "feature-refresh-tokens-for-admins" already exists. Re-run with --overwrite to replace it.');
    } finally {
      Object.defineProperty(process.stdin, "isTTY", { configurable: true, value: savedStdinTty });
      Object.defineProperty(process.stdout, "isTTY", { configurable: true, value: savedStdoutTty });
      vi.resetModules();
    }
  });
});
