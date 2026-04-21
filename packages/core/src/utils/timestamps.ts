import { randomUUID } from "node:crypto";

export function nowUtcIso(): string {
  return new Date().toISOString();
}

export function runId(): string {
  return `${nowUtcIso().replaceAll(":", "").replaceAll(".", "")}-${randomUUID()}`;
}
