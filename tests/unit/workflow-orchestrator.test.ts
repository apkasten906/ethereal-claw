import { access, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { WorkflowOrchestrator } from "../../packages/core/src/orchestration/workflow-orchestrator.js";
import { MockProvider } from "../../packages/core/src/providers/mock-provider.js";
import type { LlmProvider, ProviderRequest, ProviderResponse } from "../../packages/core/src/providers/llm-provider.js";

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
    workspace: {
      rootDirectory: "./.ec",
      configDirectory: "./.ec/config",
      featuresDirectory: "./.ec/features",
      runsDirectory: "./.ec/runs"
    }
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

    expect(results).toHaveLength(6);
    expect(results[0]?.run.stage).toBe("plan");
    expect(results[0]?.run.executions).toHaveLength(2);
    expect(results[1]?.run.stage).toBe("bdd");
    expect(results[1]?.run.executions).toHaveLength(0);
    expect(results[2]?.run.stage).toBe("review-consistency");
    expect(results[2]?.run.executions).toHaveLength(0);
    expect(results[5]?.run.executions).toHaveLength(1);
    expect(results[5]?.run.executions[0]?.agent).toBe("reviewer");

    const runFiles = await readdir(path.join(root, ".ec", "runs"));
    expect(runFiles).toHaveLength(7);
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

    const featurePath = path.join(root, ".ec", "features", "feature-auth-refresh", "feature.yaml");
    const beforeRun = await readFile(featurePath, "utf8");

    const results = await orchestrator.run({
      featureSlug: "feature-auth-refresh",
      request: "different request override",
      dryRun: true
    });

    const afterRun = await readFile(featurePath, "utf8");

    expect(results.map((result) => result.run.stage)).toEqual([
      "plan",
      "bdd",
      "review-consistency",
      "implement",
      "test",
      "review"
    ]);
    expect(beforeRun).toContain("status: ideated");
    expect(afterRun).toContain("status: reviewed");
    expect(afterRun).toContain("request: refresh tokens for admins");
  });

  it("creates runtime directories during init", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "ethereal-claw-orchestrator-"));
    tempDirs.push(root);

    const orchestrator = new WorkflowOrchestrator(new MockProvider(), createConfig(), root);
    await orchestrator.init();

    await expect(access(path.join(root, ".ec", "features"))).resolves.toBeUndefined();
    await expect(access(path.join(root, ".ec", "runs"))).resolves.toBeUndefined();
  });

  it("uses a consistent default feature slug across stages", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "ethereal-claw-orchestrator-"));
    tempDirs.push(root);

    const orchestrator = new WorkflowOrchestrator(new MockProvider(), createConfig(), root);
    const ideateResult = await orchestrator.ideate({
      request: "refresh tokens for admins",
      dryRun: true
    });
    await orchestrator.plan({
      featureSlug: ideateResult.run.featureSlug,
      request: "refresh tokens for admins",
      dryRun: true
    });
    await orchestrator.bdd({
      featureSlug: ideateResult.run.featureSlug,
      request: "refresh tokens for admins",
      dryRun: true
    });
    await orchestrator.reviewConsistency({
      featureSlug: ideateResult.run.featureSlug,
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

  it("refuses to ideate into an existing workspace without overwrite enabled", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "ethereal-claw-orchestrator-"));
    tempDirs.push(root);

    const orchestrator = new WorkflowOrchestrator(new MockProvider(), createConfig(), root);
    await orchestrator.ideate({
      featureSlug: "feature-auth-refresh",
      request: "refresh tokens for admins",
      dryRun: true
    });

    await expect(
      orchestrator.ideate({
        featureSlug: "feature-auth-refresh",
        request: "refresh tokens for admins",
        dryRun: true
      })
    ).rejects.toThrow('Feature workspace "feature-auth-refresh" already exists. Re-run with overwrite enabled to replace it.');
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

    const runLogRaw = await readFile(path.join(root, ".ec", "runs", `${result.run.id}.json`), "utf8");
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
    await orchestrator.plan({
      featureSlug: "feature-multiline-title",
      request: "feature with multiline title",
      dryRun: true
    });
    await orchestrator.bdd({
      featureSlug: "feature-multiline-title",
      request: "feature with multiline title",
      dryRun: true
    });

    const bddContent = await readFile(
      path.join(root, ".ec", "features", "feature-multiline-title", "bdd", "001-initial.feature"),
      "utf8"
    );

    expect(bddContent).not.toContain("\nLine two");
    expect(bddContent).toMatch(/^Feature: Line one Line two$/m);
    expect(bddContent).toContain("Scenario: 001.1 AC-1");
  });

  it("moves story generation to plan and leaves ideate focused on ideation artifacts", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "ethereal-claw-orchestrator-"));
    tempDirs.push(root);

    const orchestrator = new WorkflowOrchestrator(new MockProvider(), createConfig(), root);
    await orchestrator.ideate({
      featureSlug: "feature-auth-refresh",
      request: "refresh tokens for admins",
      dryRun: true
    });

    await expect(access(path.join(root, ".ec", "features", "feature-auth-refresh", "ideation.md"))).resolves.toBeUndefined();
    await expect(access(path.join(root, ".ec", "features", "feature-auth-refresh", "stories", "001-initial-story.md"))).rejects.toThrow();
    await expect(access(path.join(root, ".ec", "features", "feature-auth-refresh", "bdd", "001-initial.feature"))).rejects.toThrow();

    await orchestrator.plan({
      featureSlug: "feature-auth-refresh",
      request: "refresh tokens for admins",
      dryRun: true
    });

    await expect(access(path.join(root, ".ec", "features", "feature-auth-refresh", "stories", "001-initial-story.md"))).resolves.toBeUndefined();
  });

  it("generates BDD, traceability, and consistency review artifacts as separate stages", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "ethereal-claw-orchestrator-"));
    tempDirs.push(root);

    const orchestrator = new WorkflowOrchestrator(new MockProvider(), createConfig(), root);
    await orchestrator.ideate({
      featureSlug: "feature-auth-refresh",
      request: "refresh tokens for admins",
      dryRun: true
    });
    await orchestrator.plan({
      featureSlug: "feature-auth-refresh",
      request: "refresh tokens for admins",
      dryRun: true
    });

    const bddResult = await orchestrator.bdd({
      featureSlug: "feature-auth-refresh",
      request: "refresh tokens for admins",
      dryRun: true
    });
    const reviewResult = await orchestrator.reviewConsistency({
      featureSlug: "feature-auth-refresh",
      request: "refresh tokens for admins",
      dryRun: true
    });

    expect(bddResult.run.stage).toBe("bdd");
    expect(reviewResult.run.stage).toBe("review-consistency");
    await expect(access(path.join(root, ".ec", "features", "feature-auth-refresh", "bdd", "001-initial.feature"))).resolves.toBeUndefined();
    await expect(access(path.join(root, ".ec", "features", "feature-auth-refresh", "traceability", "traceability-map.json"))).resolves.toBeUndefined();
    await expect(access(path.join(root, ".ec", "features", "feature-auth-refresh", "review", "consistency-review.md"))).resolves.toBeUndefined();
  });

  it("allows rerunning BDD when generated artifacts have not diverged", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "ethereal-claw-orchestrator-"));
    tempDirs.push(root);

    const orchestrator = new WorkflowOrchestrator(new MockProvider(), createConfig(), root);
    await orchestrator.ideate({
      featureSlug: "feature-auth-refresh",
      request: "refresh tokens for admins",
      dryRun: true
    });
    await orchestrator.plan({
      featureSlug: "feature-auth-refresh",
      request: "refresh tokens for admins",
      dryRun: true
    });
    await orchestrator.bdd({
      featureSlug: "feature-auth-refresh",
      request: "refresh tokens for admins",
      dryRun: true
    });

    const traceabilityPath = path.join(root, ".ec", "features", "feature-auth-refresh", "traceability", "traceability-map.json");
    const initialTraceability = await readFile(traceabilityPath, "utf8");

    await expect(
      orchestrator.bdd({
        featureSlug: "feature-auth-refresh",
        request: "refresh tokens for admins",
        dryRun: true
      })
    ).resolves.toMatchObject({
      run: {
        stage: "bdd"
      }
    });

    await expect(readFile(traceabilityPath, "utf8")).resolves.toBe(initialTraceability);
  });

  it("refuses to overwrite a diverged story artifact", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "ethereal-claw-orchestrator-"));
    tempDirs.push(root);

    const orchestrator = new WorkflowOrchestrator(new MockProvider(), createConfig(), root);
    await orchestrator.ideate({
      featureSlug: "feature-auth-refresh",
      request: "refresh tokens for admins",
      dryRun: true
    });
    await orchestrator.plan({
      featureSlug: "feature-auth-refresh",
      request: "refresh tokens for admins",
      dryRun: true
    });

    const storyPath = path.join(root, ".ec", "features", "feature-auth-refresh", "stories", "001-initial-story.md");
    await writeFile(storyPath, "# manually diverged\n", "utf8");

    await expect(
      orchestrator.plan({
        featureSlug: "feature-auth-refresh",
        request: "refresh tokens for admins",
        dryRun: true
      })
    ).rejects.toThrow(/Refusing to overwrite diverged artifact/);
  });

  it("reports artifact divergence during consistency review", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "ethereal-claw-orchestrator-"));
    tempDirs.push(root);

    const orchestrator = new WorkflowOrchestrator(new MockProvider(), createConfig(), root);
    await orchestrator.ideate({
      featureSlug: "feature-auth-refresh",
      request: "refresh tokens for admins",
      dryRun: true
    });
    await orchestrator.plan({
      featureSlug: "feature-auth-refresh",
      request: "refresh tokens for admins",
      dryRun: true
    });
    await orchestrator.bdd({
      featureSlug: "feature-auth-refresh",
      request: "refresh tokens for admins",
      dryRun: true
    });

    const traceabilityPath = path.join(root, ".ec", "features", "feature-auth-refresh", "traceability", "traceability-map.json");
    await writeFile(traceabilityPath, JSON.stringify({
      featureSlug: "feature-auth-refresh",
      stories: [
        {
          storyId: "001",
          storyTitle: "Initial vertical slice",
          acceptanceCriteria: [
            {
              id: "AC-1",
              description: "Drifted description",
              bddScenarios: []
            }
          ]
        }
      ]
    }, null, 2), "utf8");

    const result = await orchestrator.reviewConsistency({
      featureSlug: "feature-auth-refresh",
      request: "refresh tokens for admins",
      dryRun: true
    });

    const review = await readFile(
      path.join(root, ".ec", "features", "feature-auth-refresh", "review", "consistency-review.md"),
      "utf8"
    );

    expect(result.run.stage).toBe("review-consistency");
    expect(review).toContain("Status: needs-attention");
    expect(review).toContain("Acceptance criterion AC-1 description diverges");
    expect(review).toContain("Acceptance criterion AC-1 has no BDD scenario mappings.");
  });

  it("restores the existing feature workspace when an overwrite attempt fails", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "ethereal-claw-orchestrator-"));
    tempDirs.push(root);

    const originalIdeation = "original ideation\n";
    const featureRoot = path.join(root, ".ec", "features", "feature-auth-refresh");
    const originalConfig = createConfig();
    const bootstrap = new WorkflowOrchestrator(new MockProvider(), originalConfig, root);
    await bootstrap.ideate({
      featureSlug: "feature-auth-refresh",
      request: "refresh tokens for admins",
      dryRun: true
    });
    await writeFile(path.join(featureRoot, "ideation.md"), originalIdeation, "utf8");

    class FailingProvider implements LlmProvider {
      readonly name = "failing";

      async complete(request: ProviderRequest): Promise<ProviderResponse> {
        void request;
        throw new Error("provider unavailable");
      }
    }

    const orchestrator = new WorkflowOrchestrator(new FailingProvider(), originalConfig, root);

    await expect(
      orchestrator.ideate({
        featureSlug: "feature-auth-refresh",
        request: "refresh tokens for admins",
        dryRun: true,
        overwriteExisting: true
      })
    ).rejects.toThrow("provider unavailable");

    await expect(readFile(path.join(featureRoot, "ideation.md"), "utf8")).resolves.toBe(originalIdeation);

    const featureMetadata = await readFile(path.join(featureRoot, "feature.yaml"), "utf8");
    expect(featureMetadata).toContain("status: ideated");

    const runHistoryFiles = await readdir(path.join(featureRoot, "run-history"));
    expect(runHistoryFiles.length).toBeGreaterThan(0);
    const latestRun = JSON.parse(
      await readFile(path.join(featureRoot, "run-history", runHistoryFiles.sort().at(-1) ?? ""), "utf8")
    ) as { success: boolean; notes: string[] };
    expect(latestRun.success).toBe(false);
    expect(latestRun.notes.some((note) => note.includes("provider unavailable"))).toBe(true);
  });

  it("keeps the replacement workspace when backup cleanup fails after commit", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "ethereal-claw-orchestrator-"));
    tempDirs.push(root);

    const featureRoot = path.join(root, ".ec", "features", "feature-auth-refresh");
    const orchestrator = new WorkflowOrchestrator(new MockProvider(), createConfig(), root);
    await orchestrator.ideate({
      featureSlug: "feature-auth-refresh",
      request: "refresh tokens for admins",
      dryRun: true
    });
    await writeFile(path.join(featureRoot, "ideation.md"), "old ideation\n", "utf8");

    const { FeatureStructureService } = await import("../../packages/core/src/artifacts/feature-structure-service.js");
    const originalReplace = FeatureStructureService.prototype.replaceWorkspaceFromStaging;
    const replacementSpy = vi.spyOn(FeatureStructureService.prototype, "replaceWorkspaceFromStaging").mockImplementation(async function (slug, stagingRoot) {
      const replacement = await originalReplace.call(this, slug, stagingRoot);

      return {
        finalize: async () => {
          await replacement.finalize();
          throw new Error("cleanup failed");
        },
        rollback: replacement.rollback
      };
    });

    try {
      await expect(
        orchestrator.ideate({
          featureSlug: "feature-auth-refresh",
          request: "refresh tokens for admins",
          dryRun: true,
          overwriteExisting: true
        })
      ).resolves.toMatchObject({
        success: true
      });

      const ideation = await readFile(path.join(featureRoot, "ideation.md"), "utf8");
      expect(ideation).not.toBe("old ideation\n");
    } finally {
      replacementSpy.mockRestore();
    }
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
      workspace: { rootDirectory: "./.ec", configDirectory: "./.ec/config", featuresDirectory: "./.ec/features", runsDirectory: "./.ec/runs" }
    };

    const orchestrator = new WorkflowOrchestrator(new MockProvider(), tinyBudgetConfig, root);

    await expect(
      orchestrator.ideate({
        featureSlug: "feature-budget-test",
        request: "test budget enforcement",
        dryRun: true
      })
    ).rejects.toThrow(/Budget (stop|hard-stop):/);

    const runFiles = await readdir(path.join(root, ".ec", "runs"));
    expect(runFiles).toHaveLength(1);

    const runLog = JSON.parse(
      await readFile(path.join(root, ".ec", "runs", runFiles[0] ?? ""), "utf8")
    ) as { success: boolean; notes: string[] };

    expect(runLog.success).toBe(false);
    expect(runLog.notes.some((n) => n.startsWith("Error:"))).toBe(true);

    const featureMetadata = await readFile(
      path.join(root, ".ec", "features", "feature-budget-test", "feature.yaml"),
      "utf8"
    );
    expect(featureMetadata).toContain("status: draft");
  });
});
