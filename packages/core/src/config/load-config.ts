import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { load } from "js-yaml";
import { clawConfigSchema, type ClawConfig } from "./config-schema.js";
import { readUtf8 } from "../utils/file-system.js";

const moduleDir = path.dirname(fileURLToPath(import.meta.url));
export const bundledConfigExamplePath = path.resolve(moduleDir, "../../config/ethereal-claw.config.example.yaml");

export async function loadConfig(configPath?: string): Promise<ClawConfig> {
  const defaultConfigPath = path.join(process.cwd(), "config", "ethereal-claw.config.yaml");
  const candidate = configPath ?? defaultConfigPath;
  const usingFallback = !existsSync(candidate);
  const resolvedPath = usingFallback ? bundledConfigExamplePath : candidate;

  if (usingFallback) {
    process.stderr.write(
      `[ethereal-claw] No config found at "${candidate}". Using bundled defaults (mock provider). Run "ethereal init" to create a local config.\n`
    );
  }

  const raw = await readUtf8(resolvedPath);
  const parsed = load(raw) ?? {};

  return clawConfigSchema.parse(parsed);
}
