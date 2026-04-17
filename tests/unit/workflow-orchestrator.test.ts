import { access, mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
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
    providers: {}
  };
}

describe("WorkflowOrchestrator", () => {
  it("resets usage per stage during a full run", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "ethereal-claw-orchestrator-"));
    tempDirs.push(root);

    const orchestrator = new WorkflowOrchestrator(new MockProvider(), createConfig(), root);
    const results = await orchestrator.run({
      featureSlug: "feature-auth-refresh",
      request: "refresh tokens for admins",
      dryRun: true
    });

    expect(results).toHaveLength(5);
    expect(results[0]?.run.executions).toHaveLength(2);
    expect(results[1]?.run.executions).toHaveLength(1);
    expect(results[4]?.run.executions).toHaveLength(1);
    expect(results[0]?.run.executions[1]?.tier).toBe("low");
    expect(results[4]?.run.executions[0]?.agent).toBe("reviewer");

    const runFiles = await readdir(path.join(root, "runs"));
    expect(runFiles).toHaveLength(5);
  });

  it("creates runtime directories during init", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "ethereal-claw-orchestrator-"));
    tempDirs.push(root);

    const orchestrator = new WorkflowOrchestrator(new MockProvider(), createConfig(), root);
    await orchestrator.init();

    await expect(access(path.join(root, "features"))).resolves.toBeUndefined();
    await expect(access(path.join(root, "runs"))).resolves.toBeUndefined();
  });

  it("records distinct start and completion timestamps", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "ethereal-claw-orchestrator-"));
    tempDirs.push(root);

    const orchestrator = new WorkflowOrchestrator(new MockProvider(), createConfig(), root);
    const result = await orchestrator.plan({
      featureSlug: "feature-auth-refresh",
      request: "refresh tokens for admins",
      dryRun: true
    });

    expect(Date.parse(result.run.startedAt)).toBeLessThanOrEqual(Date.parse(result.run.completedAt));

    const runLogRaw = await readFile(path.join(root, "runs", `${result.run.id}.json`), "utf8");
    const runLog = JSON.parse(runLogRaw) as { startedAt: string; completedAt: string };
    expect(runLog.startedAt).toBe(result.run.startedAt);
    expect(runLog.completedAt).toBe(result.run.completedAt);
  });
});
