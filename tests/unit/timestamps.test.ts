import { describe, expect, it, vi } from "vitest";
import { runId } from "../../packages/core/src/utils/timestamps.js";

describe("timestamps", () => {
  it("creates unique run ids within the same millisecond", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-17T15:16:36.000Z"));

    try {
      expect(runId()).not.toBe(runId());
    } finally {
      vi.useRealTimers();
    }
  });
});
