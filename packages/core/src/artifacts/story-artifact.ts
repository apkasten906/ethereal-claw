import type { AcceptanceCriterion, Story } from "@ethereal-claw/shared";

const agentModelHeader = "## Agent Model";
const jsonFence = "```json";
const closingFence = "```";

export class StoryArtifactError extends Error {}

export function renderStoryMarkdown(story: Story): string {
  return [
    `# Story ${story.id}: ${story.title}`,
    "",
    "## Summary",
    story.summary,
    "",
    "## Acceptance Criteria",
    ...story.acceptanceCriteria.map((criterion, index) => `${index + 1}. [${criterion.id}] ${criterion.description}`),
    "",
    agentModelHeader,
    jsonFence,
    JSON.stringify(story, null, 2),
    closingFence
  ].join("\n");
}

export function parseStoryMarkdown(markdown: string): Story {
  const normalized = markdown.replaceAll("\r\n", "\n");
  const lines = normalized.split("\n");
  const titleLine = lines[0]?.trim() ?? "";
  const titleMatch = /^# Story ([^:]+): (.+)$/.exec(titleLine);

  if (!titleMatch) {
    throw new StoryArtifactError("Story markdown is missing a valid '# Story <id>: <title>' heading.");
  }

  const summary = sectionContent(lines, "## Summary");
  const acceptanceCriteriaLines = sectionContent(lines, "## Acceptance Criteria")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (acceptanceCriteriaLines.length === 0) {
    throw new StoryArtifactError("Story markdown is missing acceptance criteria.");
  }

  const acceptanceCriteria = acceptanceCriteriaLines.map(parseAcceptanceCriterion);
  const embeddedStory = parseEmbeddedStory(normalized);

  const rendered = renderStoryMarkdown(embeddedStory);
  if (rendered !== normalized.trimEnd()) {
    throw new StoryArtifactError("Story markdown is out of sync with its embedded agent model.");
  }

  if (embeddedStory.id !== titleMatch[1] || embeddedStory.title !== titleMatch[2]) {
    throw new StoryArtifactError("Story heading does not match the embedded agent model.");
  }

  if (embeddedStory.summary !== summary) {
    throw new StoryArtifactError("Story summary does not match the embedded agent model.");
  }

  if (JSON.stringify(embeddedStory.acceptanceCriteria) !== JSON.stringify(acceptanceCriteria)) {
    throw new StoryArtifactError("Acceptance criteria do not match the embedded agent model.");
  }

  return embeddedStory;
}

export function extractBddScenarioRefs(filename: string, content: string): string[] {
  return content
    .replaceAll("\r\n", "\n")
    .split("\n")
    .map((line) => /^\s*Scenario:\s+(.+)$/.exec(line)?.[1]?.trim())
    .filter((scenario): scenario is string => Boolean(scenario))
    .map((scenario) => `${filename}::${scenario}`);
}

function sectionContent(lines: string[], heading: string): string {
  const start = lines.indexOf(heading);
  if (start === -1) {
    throw new StoryArtifactError(`Story markdown is missing section '${heading}'.`);
  }

  const nextHeadingIndex = lines.findIndex((line, index) => index > start && /^##\s+/.test(line));
  const sectionLines = lines.slice(start + 1, nextHeadingIndex === -1 ? undefined : nextHeadingIndex);
  return sectionLines.join("\n").trim();
}

function parseAcceptanceCriterion(line: string): AcceptanceCriterion {
  const match = /^\d+\.\s+\[([^\]]+)\]\s+(.+)$/.exec(line);
  if (!match) {
    throw new StoryArtifactError(`Malformed acceptance criterion: ${line}`);
  }

  return {
    id: match[1],
    description: match[2],
    testable: !/\b(ambiguous|tbd|todo)\b/i.test(match[2])
  };
}

function parseEmbeddedStory(markdown: string): Story {
  const headerIndex = markdown.indexOf(agentModelHeader);
  if (headerIndex === -1) {
    throw new StoryArtifactError("Story markdown is missing the embedded agent model section.");
  }

  const fenceStart = markdown.indexOf(jsonFence, headerIndex);
  const fenceEnd = markdown.indexOf(`\n${closingFence}`, fenceStart);

  if (fenceStart === -1 || fenceEnd === -1) {
    throw new StoryArtifactError("Story markdown is missing a valid embedded JSON block.");
  }

  const jsonStart = fenceStart + jsonFence.length;
  const jsonBody = markdown.slice(jsonStart, fenceEnd).trim();
  const parsed = JSON.parse(jsonBody) as unknown;

  if (!isStory(parsed)) {
    throw new StoryArtifactError("Story markdown contains an invalid embedded agent model.");
  }

  return parsed;
}

function isStory(value: unknown): value is Story {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Record<string, unknown>;
  return (
    typeof record.id === "string" &&
    typeof record.title === "string" &&
    typeof record.summary === "string" &&
    Array.isArray(record.acceptanceCriteria) &&
    record.acceptanceCriteria.every((criterion) => isAcceptanceCriterion(criterion))
  );
}

function isAcceptanceCriterion(value: unknown): value is AcceptanceCriterion {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Record<string, unknown>;
  return (
    typeof record.id === "string" &&
    typeof record.description === "string" &&
    typeof record.testable === "boolean"
  );
}
