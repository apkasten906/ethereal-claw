import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export class GitService {
  async currentBranch(cwd = process.cwd()): Promise<string | null> {
    try {
      const { stdout } = await execFileAsync("git", ["branch", "--show-current"], { cwd });
      return stdout.trim() || null;
    } catch {
      return null;
    }
  }
}
