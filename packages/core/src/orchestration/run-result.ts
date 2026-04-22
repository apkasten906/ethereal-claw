import type { RunLog } from "@ethereal-claw/shared";

export interface RunResult {
  success: boolean;
  run: RunLog;
}
