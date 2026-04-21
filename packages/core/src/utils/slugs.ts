import toAsciiSlug from "slugify";

export function slugify(value: string): string {
  return toAsciiSlug(value, {
    lower: true,
    replacement: "-",
    strict: true,
    trim: true
  }).replace(/-{2,}/g, "-");
}
