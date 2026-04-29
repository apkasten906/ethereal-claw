import { readFileSync } from "node:fs";
import { access, copyFile, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { afterEach, describe, expect, it } from "vitest";

const execFileAsync = promisify(execFile);
const tempDirs: string[] = [];
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const tsxPackage = JSON.parse(
  readFileSync(path.join(repoRoot, "node_modules", "tsx", "package.json"), "utf8")
) as { bin: string | Record<string, string> };
const tsxBinPath = typeof tsxPackage.bin === "string" ? tsxPackage.bin : tsxPackage.bin.tsx;
if (!tsxBinPath) {
  throw new Error("Unable to resolve the tsx package bin path.");
}
const tsxCli = path.join(repoRoot, "node_modules", "tsx", tsxBinPath);
const cliEntry = path.join(repoRoot, "packages", "cli", "src", "index.ts");
const exampleConfig = path.join(repoRoot, "packages", "core", "config", "ethereal-claw.config.example.yaml");

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

    await expect(access(path.join(root, ".ec", "config", "project.yaml"))).resolves.toBeUndefined();
    await expect(access(path.join(root, ".ec", "config", "agent-policies.yaml"))).resolves.toBeUndefined();
    await expect(access(path.join(root, ".ec", "features"))).resolves.toBeUndefined();
    await expect(access(path.join(root, ".ec", "runs"))).resolves.toBeUndefined();
    await expect(access(path.join(root, ".ec", "cache"))).resolves.toBeUndefined();
    await expect(access(path.join(root, ".ec", "temp"))).resolves.toBeUndefined();
    await expect(access(path.join(root, "config", "ethereal-claw.config.yaml"))).rejects.toThrow();
    await expect(access(path.join(root, "features"))).rejects.toThrow();
    await expect(access(path.join(root, "runs"))).rejects.toThrow();
  });

  it("init does not overwrite existing config", async () => {
    const root = await createTempWorkspace();

    await mkdir(path.join(root, ".ec", "config"), { recursive: true });
    const existing = path.join(root, ".ec", "config", "project.yaml");
    await copyFile(exampleConfig, existing);
    const before = await readFile(existing, "utf8");

    const { stdout } = await runCli(root, ["init"]);

    expect(stdout).toContain("Config already exists.");

    const after = await readFile(existing, "utf8");
    expect(after).toBe(before);
  });

  it("keeps agent policies next to project.yaml when workspace directories are overridden", async () => {
    const root = await createTempWorkspace();

    await mkdir(path.join(root, ".ec", "config"), { recursive: true });
    await writeFile(
      path.join(root, ".ec", "config", "project.yaml"),
      [
        "provider: mock",
        "workspace:",
        "  rootDirectory: ./artifacts",
        "  configDirectory: ./artifacts/config",
        "  featuresDirectory: ./artifacts/features",
        "  runsDirectory: ./artifacts/runs",
        "budget:",
        "  runBudgetUsd: 5",
        "  warnAtPercent: 50",
        "  confirmAtPercent: 75",
        "  stopAtPercent: 90",
        "  hardCapPercent: 100",
        "providers: {}",
        ""
      ].join("\n")
    );

    await runCli(root, ["init"]);

    await expect(access(path.join(root, ".ec", "config", "agent-policies.yaml"))).resolves.toBeUndefined();
    await expect(access(path.join(root, "artifacts", "config", "agent-policies.yaml"))).rejects.toThrow();
  });

  it("ideate writes ideation artifacts and a run log with budget data", async () => {
    const root = await createTempWorkspace();
    await mkdir(path.join(root, ".ec", "config"), { recursive: true });
    await copyFile(exampleConfig, path.join(root, ".ec", "config", "project.yaml"));

    const { stdout } = await runCli(root, ["ideate", "Add secure login audit history", "--dry-run", "--json"]);
    const parsed = JSON.parse(stdout.trim());

    await expect(access(path.join(root, ".ec", "features", "feature-add-secure-login-audit-history", "ideation.md"))).resolves.toBeUndefined();
    await expect(access(path.join(root, ".ec", "features", "feature-add-secure-login-audit-history", "stories", "001-initial-story.md"))).rejects.toThrow();
    await expect(access(path.join(root, ".ec", "features", "feature-add-secure-login-audit-history", "bdd", "001-initial.feature"))).rejects.toThrow();
    await expect(access(path.join(root, "features"))).rejects.toThrow();
    await expect(access(path.join(root, "runs"))).rejects.toThrow();

    const runFiles = await readdir(path.join(root, ".ec", "runs"));
    expect(runFiles).toHaveLength(1);

    const runLog = JSON.parse(
      await readFile(path.join(root, ".ec", "runs", runFiles[0] ?? ""), "utf8")
    );

    expect(parsed.executions.length).toBe(1);
    expect(runLog.executions[0]).toHaveProperty("estimatedInputTokens");
    expect(runLog.executions[0]).toHaveProperty("estimatedCostUsd");
    expect(runLog.dryRun).toBe(true);
  });

  it("returns a structured conflict error for ideate --json without prompting", async () => {
    const root = await createTempWorkspace();
    await mkdir(path.join(root, ".ec", "config"), { recursive: true });
    await copyFile(exampleConfig, path.join(root, ".ec", "config", "project.yaml"));

    await runCli(root, ["ideate", "Add secure login audit history", "--dry-run", "--json"]);

    await expect(runCli(root, ["ideate", "Add secure login audit history", "--dry-run", "--json"]))
      .rejects.toMatchObject({
        stdout: expect.stringContaining("\"code\": \"feature_conflict\""),
        stderr: ""
      });
  });

  it("loads the saved feature request for later stages when --request is omitted", async () => {
    const root = await createTempWorkspace();

    await runCli(root, ["ideate", "Add secure login audit history", "--dry-run", "--json"]);
    const { stdout } = await runCli(root, ["plan", "feature-add-secure-login-audit-history", "--dry-run", "--json"]);
    const parsed = JSON.parse(stdout.trim());

    expect(parsed.featureSlug).toBe("feature-add-secure-login-audit-history");
    await expect(
      access(path.join(root, ".ec", "features", "feature-add-secure-login-audit-history", "plan.md"))
    ).resolves.toBeUndefined();
    await expect(
      access(path.join(root, ".ec", "features", "feature-add-secure-login-audit-history", "stories", "001-initial-story.md"))
    ).resolves.toBeUndefined();
  });

  it("reports workflow status without invoking a stage", async () => {
    const root = await createTempWorkspace();

    await runCli(root, ["ideate", "Add secure login audit history", "--dry-run", "--json"]);
    await runCli(root, ["plan", "feature-add-secure-login-audit-history", "--dry-run", "--json"]);
    await runCli(root, ["bdd", "feature-add-secure-login-audit-history", "--dry-run", "--json"]);

    const overview = await runCli(root, ["status"]);
    expect(overview.stdout).toContain("Known features");
    expect(overview.stdout).toContain("feature-add-secure-login-audit-history");
    expect(overview.stdout).toContain("stage: bdd");

    const detail = await runCli(root, ["status", "feature-add-secure-login-audit-history"]);
    expect(detail.stdout).toContain("Current stage: bdd");
    expect(detail.stdout).toContain("Available artifacts:");
    expect(detail.stdout).toContain("Missing artifacts:");
    expect(detail.stdout).toContain("Next: ec review-consistency feature-add-secure-login-audit-history");
  });

  it("runs existing feature stages without rerunning ideation", async () => {
    const root = await createTempWorkspace();

    await runCli(root, ["ideate", "Add secure login audit history", "--dry-run", "--json"]);
    const { stdout } = await runCli(root, ["run", "feature-add-secure-login-audit-history", "--dry-run", "--json"]);
    const parsed = JSON.parse(stdout.trim());

    expect(parsed.map((run: { stage: string }) => run.stage)).toEqual([
      "plan",
      "bdd",
      "review-consistency",
      "implement",
      "test",
      "review"
    ]);

    const runFiles = await readdir(path.join(root, ".ec", "runs"));
    expect(runFiles).toHaveLength(7);
  });

  it("uses configured workspace directory overrides", async () => {
    const root = await createTempWorkspace();
    await mkdir(path.join(root, ".ec", "config"), { recursive: true });
    await writeFile(
      path.join(root, ".ec", "config", "project.yaml"),
      [
        "provider: mock",
        "workspace:",
        "  rootDirectory: ./artifacts",
        "  configDirectory: ./artifacts/config",
        "  featuresDirectory: ./artifacts/features",
        "  runsDirectory: ./artifacts/runs",
        "budget:",
        "  runBudgetUsd: 5",
        "  warnAtPercent: 50",
        "  confirmAtPercent: 75",
        "  stopAtPercent: 90",
        "  hardCapPercent: 100",
        "providers: {}",
        ""
      ].join("\n")
    );

    await runCli(root, ["ideate", "Add secure login audit history", "--dry-run", "--json"]);
    await runCli(root, ["plan", "feature-add-secure-login-audit-history", "--dry-run", "--json"]);
    await runCli(root, ["bdd", "feature-add-secure-login-audit-history", "--dry-run", "--json"]);

    await expect(access(path.join(root, "artifacts", "features", "feature-add-secure-login-audit-history", "ideation.md"))).resolves.toBeUndefined();
    await expect(access(path.join(root, "artifacts", "features", "feature-add-secure-login-audit-history", "plan.md"))).resolves.toBeUndefined();
    await expect(access(path.join(root, "artifacts", "features", "feature-add-secure-login-audit-history", "traceability", "traceability-map.json"))).resolves.toBeUndefined();
    await expect(access(path.join(root, "artifacts", "runs"))).resolves.toBeUndefined();
  });

  it("prints human-readable output by default for stage commands", async () => {
    const root = await createTempWorkspace();
    await mkdir(path.join(root, ".ec", "config"), { recursive: true });
    await copyFile(exampleConfig, path.join(root, ".ec", "config", "project.yaml"));

    const { stdout } = await runCli(root, ["ideate", "Add secure login audit history", "--dry-run"]);

    expect(stdout).toContain("Ethereal-CLAW");
    expect(stdout).toContain("Command: ideate");
    expect(stdout).toContain("Input");
    expect(stdout).toContain("Read");
    expect(stdout).toContain("Written");
    expect(stdout).toContain("Result");
    expect(stdout).toContain("Next");
    expect(stdout).toContain("Actual tokens (estimated cost)");
  });

  it("prints a complete aggregated read list for run reports", async () => {
    const root = await createTempWorkspace();
    await mkdir(path.join(root, ".ec", "config"), { recursive: true });
    await copyFile(exampleConfig, path.join(root, ".ec", "config", "project.yaml"));

    await runCli(root, ["ideate", "Add secure login audit history", "--dry-run", "--json"]);
    const { stdout } = await runCli(root, ["run", "feature-add-secure-login-audit-history", "--dry-run"]);

    expect(stdout).toContain("Read");
    expect(stdout).toContain(".ec/features/feature-add-secure-login-audit-history/plan.md");
    expect(stdout).toContain(".ec/features/feature-add-secure-login-audit-history/bdd/001-initial.feature");
    expect(stdout).toContain(".ec/features/feature-add-secure-login-audit-history/review/consistency-review.md");
    expect(stdout).toContain(".ec/features/feature-add-secure-login-audit-history/implementation/change-summary.md");
    expect(stdout).toContain(".ec/features/feature-add-secure-login-audit-history/tests/test-plan.md");
  });
});
