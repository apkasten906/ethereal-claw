#!/usr/bin/env node

import path from "node:path";
import { Command } from "commander";
import { createIdeateCommand } from "./commands/ideate-command.js";
import { createImplementCommand } from "./commands/implement-command.js";
import { createInitCommand } from "./commands/init-command.js";
import { createPlanCommand } from "./commands/plan-command.js";
import { createReviewCommand } from "./commands/review-command.js";
import { createRunCommand } from "./commands/run-command.js";
import { createTestCommand } from "./commands/test-command.js";

const program = new Command();
const shimName = process.argv0 ? path.basename(process.argv0) : "";
const rawInvokedName = process.argv[1] ? path.basename(process.argv[1]) : "";

function getDefaultCommandName(): string {
  if (process.env.npm_lifecycle_event === "ec") {
    return "ec";
  }
  return "ethereal";
}

const fallbackName = rawInvokedName && !/^index\.[^.]+$/i.test(rawInvokedName)
  ? rawInvokedName
  : getDefaultCommandName();

const invokedName =
  shimName && !/^node(\.exe)?$/i.test(shimName)
    ? shimName
    : fallbackName;

program
  .name(invokedName)
  .description("CLI-first orchestration scaffold for AI-assisted delivery.")
  .version("0.1.0");

program.addCommand(createInitCommand());
program.addCommand(createIdeateCommand());
program.addCommand(createPlanCommand());
program.addCommand(createImplementCommand());
program.addCommand(createTestCommand());
program.addCommand(createReviewCommand());
program.addCommand(createRunCommand());

await program.parseAsync(process.argv).catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
});
