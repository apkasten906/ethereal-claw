export function nowUtcIso(): string {
  return new Date().toISOString();
}

export function runId(): string {
  return nowUtcIso().replaceAll(":", "").replaceAll(".", "");
}

export function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}
