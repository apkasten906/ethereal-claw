export interface TraceabilityCriterion {
  id: string;
  description: string;
  bddScenarios: string[];
}

export interface TraceabilityStory {
  storyId: string;
  storyTitle: string;
  acceptanceCriteria: TraceabilityCriterion[];
}

export interface TraceabilityMap {
  featureSlug: string;
  generatedAt: string;
  stories: TraceabilityStory[];
}

export class TraceabilityMapError extends Error {}

export function parseTraceabilityMap(raw: string): TraceabilityMap {
  const parsed = JSON.parse(raw) as unknown;
  if (!isTraceabilityMap(parsed)) {
    throw new TraceabilityMapError("Traceability map is malformed.");
  }

  return parsed;
}

function isTraceabilityMap(value: unknown): value is TraceabilityMap {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Record<string, unknown>;
  return (
    typeof record.featureSlug === "string" &&
    typeof record.generatedAt === "string" &&
    Array.isArray(record.stories) &&
    record.stories.every((story) => isTraceabilityStory(story))
  );
}

function isTraceabilityStory(value: unknown): value is TraceabilityStory {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Record<string, unknown>;
  return (
    typeof record.storyId === "string" &&
    typeof record.storyTitle === "string" &&
    Array.isArray(record.acceptanceCriteria) &&
    record.acceptanceCriteria.every((criterion) => isTraceabilityCriterion(criterion))
  );
}

function isTraceabilityCriterion(value: unknown): value is TraceabilityCriterion {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Record<string, unknown>;
  return (
    typeof record.id === "string" &&
    typeof record.description === "string" &&
    Array.isArray(record.bddScenarios) &&
    record.bddScenarios.every((scenario) => typeof scenario === "string")
  );
}
