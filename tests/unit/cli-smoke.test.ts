import { access, copyFile, mkdir, mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { execFile } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { afterEach, describe, expect, it } from "vitest";

const execFileAsync = promisify(execFile);
const tempDirs: string[] = [];
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const tsxCli = path.join(repoRoot, "node_modules", "tsx", "dist", "cli.mjs");
const cliEntry = path.join(repoRoot, "packages", "cli", "src", "index.ts");
const exampleConfig = path.join(repoRoot, "config", "ethereal-claw.config.example.yaml");

afterEach(async () => {
  await Promise.all(tempDirs.map((dir) => rm(dir, { recursive: true, force: true })));
  tempDirs.length = 0;
});

async function createTempWorkspace(): Promise<string> {
  const root = await mkdtemp(path.join(os.tmpdir(), "ethereal-claw-cli-"));
  tempDirs.push(root);
  return root;
}

async function runCli(workdir: string, args: string[]) {
  return execFileAsync(process.execPath, [tsxCli, cliEntry, ...args], {
    cwd: workdir,
    env: {
      ...process.env,
      LOG_LEVEL: "silent"
    }
  });
}

describe("CLI smoke", () => {
  it("init writes a local config file", async () => {
    const root = await createTempWorkspace();

    await runCli(root, ["init"]);

    await expect(access(path.join(root, "config", "ethereal-claw.config.yaml"))).resolves.toBeUndefined();
    await expect(access(path.join(root, "features"))).resolves.toBeUndefined();
    await expect(access(path.join(root, "runs"))).resolves.toBeUndefined();
  });

  it("ideate writes feature artifacts and a run log with budget data", async () => {
    const root = await createTempWorkspace();
    await mkdir(path.join(root, "config"), { recursive: true });
    await copyFile(exampleConfig, path.join(root, "config", "ethereal-claw.config.example.yaml"));

    const { stdout } = await runCli(root, ["ideate", "Add secure login audit history", "--dry-run"]);
    const parsed = JSON.parse(stdout.trim());

    await expect(access(path.join(root, "features", "feature-add-secure-login-audit-history", "ideation.md"))).resolves.toBeUndefined();
    await expect(access(path.join(root, "features", "feature-add-secure-login-audit-history", "stories", "001-initial-story.md"))).resolves.toBeUndefined();

    const runFiles = await readdir(path.join(root, "runs"));
    expect(runFiles).toHaveLength(1);

    const runLog = JSON.parse(
      await readFile(path.join(root, "runs", runFiles[0] ?? ""), "utf8")
    );

    expect(parsed.executions.length).toBeGreaterThan(0);
    expect(runLog.executions[0]).toHaveProperty("estimatedInputTokens");
    expect(runLog.executions[0]).toHaveProperty("estimatedCostUsd");
    expect(runLog.dryRun).toBe(true);
  });

  it("loads the saved feature request for later stages when --request is omitted", async () => {
    const root = await createTempWorkspace();

    await runCli(root, ["ideate", "Add secure login audit history", "--dry-run"]);
    const { stdout } = await runCli(root, ["plan", "feature-add-secure-login-audit-history", "--dry-run"]);
    const parsed = JSON.parse(stdout.trim());

    expect(parsed.featureSlug).toBe("feature-add-secure-login-audit-history");
    await expect(
      access(path.join(root, "features", "feature-add-secure-login-audit-history", "plan.md"))
    ).resolves.toBeUndefined();
  });
});
