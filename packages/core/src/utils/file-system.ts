import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const featureSlugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export async function ensureDir(targetPath: string): Promise<void> {
  await mkdir(targetPath, { recursive: true });
}

export async function writeFileEnsured(targetPath: string, content: string): Promise<void> {
  await ensureDir(path.dirname(targetPath));
  await writeFile(targetPath, content, "utf8");
}

export async function readUtf8(targetPath: string): Promise<string> {
  return readFile(targetPath, "utf8");
}

export function assertFeatureSlug(featureSlug: string): string {
  if (!featureSlugPattern.test(featureSlug)) {
    throw new Error(`Invalid feature slug: "${featureSlug}"`);
  }

  return featureSlug;
}

export function resolveWithin(rootDir: string, ...segments: string[]): string {
  const resolvedRoot = path.resolve(rootDir);
  const resolvedTarget = path.resolve(resolvedRoot, ...segments);
  const relativePath = path.relative(resolvedRoot, resolvedTarget);

  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    throw new Error(`Resolved path escapes root directory: ${resolvedTarget}`);
  }

  return resolvedTarget;
}
