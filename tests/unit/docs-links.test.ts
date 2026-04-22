import { access, readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

async function collectMarkdownFiles(rootDir: string): Promise<string[]> {
  const queue: string[] = [rootDir];
  const files: string[] = [];

  while (queue.length > 0) {
    const current = queue.pop();
    if (!current) {
      continue;
    }

    const entries = await readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);

      if (entry.isDirectory()) {
        if (entry.name === "node_modules" || entry.name === ".git") {
          continue;
        }

        queue.push(fullPath);
        continue;
      }

      if (entry.isFile() && fullPath.endsWith(".md")) {
        files.push(fullPath);
      }
    }
  }

  return files.sort((a, b) => a.localeCompare(b));
}

function isExternalTarget(target: string): boolean {
  return /^[a-z][a-z0-9+.-]*:/i.test(target) || target.startsWith("//");
}

function headingSlug(value: string): string {
  const noFormatting = value
    .trim()
    .toLowerCase()
    .replace(/<[^>]+>/g, "")
    .replace(/[`*_~]/g, "")
    .replace(/\[(.*?)\]\(.*?\)/g, "$1")
    .replace(/&[a-z0-9#]+;/gi, "")
    .replace(/[^a-z0-9 _-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return noFormatting;
}

function collectHeadingAnchors(markdown: string): Set<string> {
  const headingRegex = /^(#{1,6})\s+(.+?)\s*#*\s*$/gm;
  const counts = new Map<string, number>();
  const anchors = new Set<string>();

  for (const match of markdown.matchAll(headingRegex)) {
    const rawHeading = match[2] ?? "";
    const base = headingSlug(rawHeading);
    if (!base) {
      continue;
    }

    const seen = counts.get(base) ?? 0;
    counts.set(base, seen + 1);
    anchors.add(seen === 0 ? base : `${base}-${seen}`);
  }

  return anchors;
}

async function assertExists(targetPath: string): Promise<void> {
  await access(targetPath);
}

describe("Markdown links", () => {
  it("resolves local file and anchor links", async () => {
    const markdownFiles = await collectMarkdownFiles(repoRoot);
    const anchorCache = new Map<string, Set<string>>();
    const errors: string[] = [];

    for (const sourceFile of markdownFiles) {
      const content = await readFile(sourceFile, "utf8");
      const linkRegex = /\[[^\]]*\]\(([^)]+)\)/g;

      for (const match of content.matchAll(linkRegex)) {
        const index = match.index ?? 0;
        const previousChar = index > 0 ? content[index - 1] : "";
        if (previousChar === "!") {
          continue;
        }

        const rawTarget = (match[1] ?? "").trim();
        if (!rawTarget || rawTarget.startsWith("mailto:") || isExternalTarget(rawTarget)) {
          continue;
        }

        const [rawPath, rawAnchor] = rawTarget.split("#", 2);
        const normalizedPath = decodeURIComponent(rawPath || "");

        const targetFile = normalizedPath
          ? path.resolve(path.dirname(sourceFile), normalizedPath)
          : sourceFile;

        try {
          await assertExists(targetFile);
        } catch {
          errors.push(`${path.relative(repoRoot, sourceFile)} -> ${rawTarget} (missing file)`);
          continue;
        }

        if (!rawAnchor) {
          continue;
        }

        const cached = anchorCache.get(targetFile);
        const anchors = cached ?? collectHeadingAnchors(await readFile(targetFile, "utf8"));
        if (!cached) {
          anchorCache.set(targetFile, anchors);
        }

        const expectedAnchor = decodeURIComponent(rawAnchor).toLowerCase();
        if (!anchors.has(expectedAnchor)) {
          errors.push(`${path.relative(repoRoot, sourceFile)} -> ${rawTarget} (missing anchor)`);
        }
      }
    }

    expect(errors).toEqual([]);
  });
});
