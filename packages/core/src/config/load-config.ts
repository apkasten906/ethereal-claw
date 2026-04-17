import { existsSync } from "node:fs";
import path from "node:path";
import { load } from "js-yaml";
import { clawConfigSchema, type ClawConfig } from "./config-schema.js";
import { readUtf8 } from "../utils/file-system.js";

const defaultConfigPath = path.join(process.cwd(), "config", "ethereal-claw.config.yaml");
const exampleConfigPath = path.join(process.cwd(), "config", "ethereal-claw.config.example.yaml");

export async function loadConfig(configPath = defaultConfigPath): Promise<ClawConfig> {
  const resolvedPath = existsSync(configPath) ? configPath : exampleConfigPath;
  const raw = await readUtf8(resolvedPath);
  const parsed = load(raw) ?? {};

  return clawConfigSchema.parse(parsed);
}
