import { execFileSync } from "node:child_process";

const allowedPrefixes = [
  "feat",
  "fix",
  "chore",
  "docs",
  "refactor",
  "test",
  "ci",
  "release",
  "hotfix"
];

const branchPattern = new RegExp(
  `^(?:${allowedPrefixes.join("|")})\\/[a-z0-9]+(?:-[a-z0-9]+)*$`
);
const dependabotBranchPattern = /^dependabot\/.+$/;

function getBranchName() {
  const explicitBranch = process.argv[2];
  if (explicitBranch) {
    return explicitBranch;
  }

  const envBranch =
    process.env.GITHUB_HEAD_REF ||
    process.env.GITHUB_REF_NAME ||
    process.env.BRANCH_NAME;
  if (envBranch) {
    return envBranch;
  }

  return execFileSync("git", ["branch", "--show-current"], {
    encoding: "utf8"
  }).trim();
}

function printFailure(branchName) {
  const prefixes = allowedPrefixes.map((prefix) => `${prefix}/...`).join(", ");
  process.stderr.write(
    [
      `Invalid branch name: "${branchName}"`,
      "Expected format: <type>/<kebab-case-description>",
      `Allowed prefixes: ${prefixes}`,
      "Examples: feat/milestone-1-scaffold, fix/run-log-bug, docs/command-reference-update"
    ].join("\n") + "\n"
  );
}

try {
  const branchName = getBranchName();

  if (!branchPattern.test(branchName) && !dependabotBranchPattern.test(branchName)) {
    printFailure(branchName);
    process.exit(1);
  }
} catch (error) {
  process.stderr.write(`Unable to determine branch name: ${String(error)}\n`);
  process.exit(1);
}
