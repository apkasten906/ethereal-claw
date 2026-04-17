#!/usr/bin/env node

import { Command } from "commander";
import { createIdeateCommand } from "./commands/ideate-command.js";
import { createImplementCommand } from "./commands/implement-command.js";
import { createInitCommand } from "./commands/init-command.js";
import { createPlanCommand } from "./commands/plan-command.js";
import { createReviewCommand } from "./commands/review-command.js";
import { createRunCommand } from "./commands/run-command.js";
import { createTestCommand } from "./commands/test-command.js";

const program = new Command();

program
  .name("ethereal-claw")
  .description("CLI-first orchestration scaffold for AI-assisted delivery.")
  .version("0.1.0");

program.addCommand(createInitCommand());
program.addCommand(createIdeateCommand());
program.addCommand(createPlanCommand());
program.addCommand(createImplementCommand());
program.addCommand(createTestCommand());
program.addCommand(createReviewCommand());
program.addCommand(createRunCommand());

program.parseAsync(process.argv);
