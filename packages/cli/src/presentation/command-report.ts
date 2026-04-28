import type { ClawConfig, RunResult } from "@ethereal-claw/core";

export interface CommandReport {
  command: string;
  featureSlug?: string;
  stage?: string;
  input: string[];
  read: string[];
  written: string[];
  provider?: string;
  result: {
    status: "success" | "failed" | "needs-review";
    notes: string[];
  };
  budget?: {
    modelTier: string;
    estimatedInputTokens: number;
    estimatedOutputTokens: number;
    actualPromptTokens: number;
    actualCompletionTokens: number;
    estimatedCostUsd: number;
  };
  next: string;
}

export function formatCommandReport(report: CommandReport): string {
  return [
    "Ethereal-CLAW",
    `Command: ${report.command}`,
    `Feature: ${report.featureSlug ?? "none"}`,
    ...(report.stage ? [`Stage: ${report.stage}`] : []),
    "",
    "Input",
    ...formatItems(report.input),
    "",
    "Read",
    ...formatItems(report.read),
    "",
    "Written",
    ...formatItems(report.written),
    "",
    "Budget",
    ...(report.budget
      ? [
        `- Provider: ${report.provider ?? "unknown"}`,
        `- Model tier: ${report.budget.modelTier}`,
        `- Estimated tokens/cost: ${report.budget.estimatedInputTokens} input / ${report.budget.estimatedOutputTokens} output, $${report.budget.estimatedCostUsd.toFixed(4)}`,
        `- Actual tokens/cost: ${report.budget.actualPromptTokens} input / ${report.budget.actualCompletionTokens} output, $${report.budget.estimatedCostUsd.toFixed(4)}`
      ]
      : ["- none"]),
    "",
    "Result",
    `- Status: ${report.result.status}`,
    `- Notes: ${report.result.notes.length > 0 ? report.result.notes.join("; ") : "none"}`,
    "",
    "Next",
    `- ${report.next}`
  ].join("\n");
}

export function stageRunToReport(
  command: string,
  result: RunResult,
  config: ClawConfig,
  input: string[],
  read: string[],
  written: string[],
  next: string
): CommandReport {
  const budget = summarizeBudget(result);
  return {
    command,
    featureSlug: result.run.featureSlug,
    stage: result.run.stage,
    input,
    read,
    written,
    provider: config.provider,
    result: {
      status: result.success ? "success" : "failed",
      notes: result.run.notes
    },
    budget,
    next
  };
}

export function multiRunToReport(
  command: string,
  results: RunResult[],
  config: ClawConfig,
  input: string[],
  read: string[],
  written: string[],
  next: string
): CommandReport {
  const last = results.at(-1);
  const combined = summarizeBudgetFromRuns(results);

  return {
    command,
    featureSlug: last?.run.featureSlug,
    stage: results.map((result) => result.run.stage).join(" -> "),
    input,
    read,
    written,
    provider: config.provider,
    result: {
      status: results.every((result) => result.success) ? "success" : "failed",
      notes: results.flatMap((result) => result.run.notes)
    },
    budget: combined,
    next
  };
}

function formatItems(items: string[]): string[] {
  return items.length > 0 ? items.map((item) => `- ${item}`) : ["- none"];
}

function summarizeBudget(result: RunResult): CommandReport["budget"] {
  return summarizeBudgetFromRuns([result]);
}

function summarizeBudgetFromRuns(results: RunResult[]): CommandReport["budget"] {
  const executions = results.flatMap((result) => result.run.executions);
  const modelTier = executions.length > 0
    ? Array.from(new Set(executions.map((execution) => execution.tier))).join(", ")
    : "none";

  return {
    modelTier,
    estimatedInputTokens: executions.reduce((sum, execution) => sum + execution.estimatedInputTokens, 0),
    estimatedOutputTokens: executions.reduce((sum, execution) => sum + execution.estimatedOutputTokens, 0),
    actualPromptTokens: executions.reduce((sum, execution) => sum + (execution.actualPromptTokens ?? 0), 0),
    actualCompletionTokens: executions.reduce((sum, execution) => sum + (execution.actualCompletionTokens ?? 0), 0),
    estimatedCostUsd: executions.reduce((sum, execution) => sum + execution.estimatedCostUsd, 0)
  };
}
