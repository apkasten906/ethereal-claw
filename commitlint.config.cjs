const allowedScopes = [
  "cli",
  "core",
  "shared",
  "repo",
  "docs",
  "prompts",
  "config",
  "ci",
  "release",
  "deps",
  "tests",
  "workflow",
  "features"
];

module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "body-max-line-length": [0],
    "footer-max-line-length": [0],
    "scope-empty": [2, "never"],
    "scope-enum": [2, "always", allowedScopes],
    "subject-case": [
      2,
      "never",
      ["sentence-case", "start-case", "pascal-case", "upper-case"]
    ]
  },
  prompt: {
    settings: {
      scopes: allowedScopes
    }
  }
};
