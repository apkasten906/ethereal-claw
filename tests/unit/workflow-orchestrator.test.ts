import { access, mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { WorkflowOrchestrator } from "../../packages/core/src/orchestration/workflow-orchestrator.js";
import { MockProvider } from "../../packages/core/src/providers/mock-provider.js";

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.map((dir) => rm(dir, { recursive: true, force: true })));
  tempDirs.length = 0;
});

function createConfig() {
  return {
    provider: "mock" as const,
    budget: {
      runBudgetUsd: 5,
      warnAtPercent: 50,
      confirmAtPercent: 75,
      stopAtPercent: 90,
      hardCapPercent: 100
    },
    providers: {},
    baseDirectory: "ec"
  };
}

describe("WorkflowOrchestrator", () => {
  it("resets usage per stage during a full run", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "ethereal-claw-orchestrator-"));
    tempDirs.push(root);

    const orchestrator = new WorkflowOrchestrator(new MockProvider(), createConfig(), root);
    await orchestrator.ideate({
      featureSlug: "feature-auth-refresh",
      request: "refresh tokens for admins",
      dryRun: true
    });
    const results = await orchestrator.run({
      featureSlug: "feature-auth-refresh",
      request: "refresh tokens for admins",
      dryRun: true
    });

    expect(results).toHaveLength(4);
    expect(results[0]?.run.stage).toBe("plan");
    expect(results[0]?.run.executions).toHaveLength(1);
    expect(results[3]?.run.executions).toHaveLength(1);
    expect(results[3]?.run.executions[0]?.agent).toBe("reviewer");

    const runFiles = await readdir(path.join(root, "ec", "runs"));
    expect(runFiles).toHaveLength(5);
  });

  it("does not rerun ideation or rewrite feature metadata during a full run", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "ethereal-claw-orchestrator-"));
    tempDirs.push(root);

    const orchestrator = new WorkflowOrchestrator(new MockProvider(), createConfig(), root);
    await orchestrator.ideate({
      featureSlug: "feature-auth-refresh",
      title: "Auth Refresh",
      request: "refresh tokens for admins",
      dryRun: true
    });

    const featurePath = path.join(root, "ec", "features", "feature-auth-refresh", "feature.yaml");
    const beforeRun = await readFile(featurePath, "utf8");

    const results = await orchestrator.run({
      featureSlug: "feature-auth-refresh",
      request: "different request override",
      dryRun: true
    });

    const afterRun = await readFile(featurePath, "utf8");

    expect(results.map((result) => result.run.stage)).toEqual(["plan", "implement", "test", "review"]);
    expect(afterRun).toBe(beforeRun);
  });

  it("creates runtime directories during init", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "ethereal-claw-orchestrator-"));
    tempDirs.push(root);

    const orchestrator = new WorkflowOrchestrator(new MockProvider(), createConfig(), root);
    await orchestrator.init();

    await expect(access(path.join(root, "ec", "features"))).resolves.toBeUndefined();
    await expect(access(path.join(root, "ec", "runs"))).resolves.toBeUndefined();
  });

  it("uses a consistent default feature slug across stages", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "ethereal-claw-orchestrator-"));
    tempDirs.push(root);

    const orchestrator = new WorkflowOrchestrator(new MockProvider(), createConfig(), root);
    const ideateResult = await orchestrator.ideate({
      request: "refresh tokens for admins",
      dryRun: true
    });
    const implementResult = await orchestrator.implement({
      featureSlug: ideateResult.run.featureSlug,
      request: "refresh tokens for admins",
      dryRun: true
    });

    expect(ideateResult.run.featureSlug).toBe("feature-refresh-tokens-for-admins");
    expect(implementResult.run.featureSlug).toBe("feature-refresh-tokens-for-admins");
  });

  it("does not record the caller cwd branch for non-git workspaces", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "ethereal-claw-orchestrator-"));
    tempDirs.push(root);

    const orchestrator = new WorkflowOrchestrator(new MockProvider(), createConfig(), root);
    await orchestrator.ideate({
      featureSlug: "feature-auth-refresh",
      request: "refresh tokens for admins",
      dryRun: true
    });
    const result = await orchestrator.plan({
      featureSlug: "feature-auth-refresh",
      request: "refresh tokens for admins",
      dryRun: true
    });

    expect(result.run.notes.some((note) => note.startsWith("branch="))).toBe(false);
  });

  it("records distinct start and completion timestamps", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "ethereal-claw-orchestrator-"));
    tempDirs.push(root);

    const orchestrator = new WorkflowOrchestrator(new MockProvider(), createConfig(), root);
    await orchestrator.ideate({
      featureSlug: "feature-auth-refresh",
      request: "refresh tokens for admins",
      dryRun: true
    });
    const result = await orchestrator.plan({
      featureSlug: "feature-auth-refresh",
      request: "refresh tokens for admins",
      dryRun: true
    });

    expect(Date.parse(result.run.startedAt)).toBeLessThanOrEqual(Date.parse(result.run.completedAt));

    const runLogRaw = await readFile(path.join(root, "ec", "runs", `${result.run.id}.json`), "utf8");
    const runLog = JSON.parse(runLogRaw) as { startedAt: string; completedAt: string };
    expect(runLog.startedAt).toBe(result.run.startedAt);
    expect(runLog.completedAt).toBe(result.run.completedAt);
  });

  it("requires an existing feature workspace before non-ideate stages", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "ethereal-claw-orchestrator-"));
    tempDirs.push(root);

    const orchestrator = new WorkflowOrchestrator(new MockProvider(), createConfig(), root);

    await expect(
      orchestrator.plan({
        featureSlug: "feature-auth-refresh",
        request: "refresh tokens for admins",
        dryRun: true
      })
    ).rejects.toThrow('Feature workspace "feature-auth-refresh" does not exist. Run the ideate stage first or provide a valid feature slug.');
  });

  it("preserves unexpected filesystem errors when checking feature workspaces", async () => {
    vi.resetModules();
    vi.doMock("node:fs/promises", async () => {
      const actual = await vi.importActual<typeof import("node:fs/promises")>("node:fs/promises");

      return {
        ...actual,
        access: vi.fn().mockRejectedValue(Object.assign(new Error("permission denied"), { code: "EPERM" }))
      };
    });

    const [{ WorkflowOrchestrator: MockedWorkflowOrchestrator }, { MockProvider: MockedProvider }] = await Promise.all([
      import("../../packages/core/src/orchestration/workflow-orchestrator.js"),
      import("../../packages/core/src/providers/mock-provider.js")
    ]);

    try {
      const orchestrator = new MockedWorkflowOrchestrator(new MockedProvider(), createConfig(), process.cwd());

      await expect(
        orchestrator.plan({
          featureSlug: "feature-auth-refresh",
          request: "refresh tokens for admins",
          dryRun: true
        })
      ).rejects.toThrow("permission denied");
    } finally {
      vi.doUnmock("node:fs/promises");
      vi.resetModules();
    }
  });

  it("rejects feature requests that cannot produce a default slug", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "ethereal-claw-orchestrator-"));
    tempDirs.push(root);

    const orchestrator = new WorkflowOrchestrator(new MockProvider(), createConfig(), root);

    await expect(
      orchestrator.ideate({
        request: "!!!",
        dryRun: true
      })
    ).rejects.toThrow("Feature request must contain at least one alphanumeric character to generate a slug.");
  });

  it("sanitizes newlines in feature title before writing Gherkin scaffold", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "ethereal-claw-orchestrator-"));
    tempDirs.push(root);

    const orchestrator = new WorkflowOrchestrator(new MockProvider(), createConfig(), root);
    await orchestrator.ideate({
      featureSlug: "feature-multiline-title",
      title: "Line one\nLine two",
      request: "feature with multiline title",
      dryRun: true
    });

    const bddContent = await readFile(
      path.join(root, "ec", "features", "feature-multiline-title", "bdd", "001-initial.feature"),
      "utf8"
    );

    expect(bddContent).not.toContain("\nLine two");
    expect(bddContent).toMatch(/^Feature: Line one Line two$/m);
  });

  it("throws when the budget hard-stop threshold is reached", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "ethereal-claw-orchestrator-"));
    tempDirs.push(root);

    const tinyBudgetConfig = {
      provider: "mock" as const,
      budget: {
        runBudgetUsd: 0.000001,
        warnAtPercent: 25,
        confirmAtPercent: 50,
        stopAtPercent: 75,
        hardCapPercent: 100
      },
      providers: {},
      baseDirectory: "ec"
    };

    const orchestrator = new WorkflowOrchestrator(new MockProvider(), tinyBudgetConfig, root);

    await expect(
      orchestrator.ideate({
        featureSlug: "feature-budget-test",
        request: "test budget enforcement",
        dryRun: true
      })
    ).rejects.toThrow(/Budget (stop|hard-stop):/);

    const runFiles = await readdir(path.join(root, "ec", "runs"));
    expect(runFiles).toHaveLength(1);

    const runLog = JSON.parse(
      await readFile(path.join(root, "ec", "runs", runFiles[0] ?? ""), "utf8")
    ) as { success: boolean; notes: string[] };

    expect(runLog.success).toBe(false);
    expect(runLog.notes.some((n) => n.startsWith("Error:"))).toBe(true);
  });
});
