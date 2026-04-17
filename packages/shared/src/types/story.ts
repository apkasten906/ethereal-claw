import type { AcceptanceCriterion } from "./acceptance-criteria.js";

export interface Story {
  id: string;
  title: string;
  summary: string;
  acceptanceCriteria: AcceptanceCriterion[];
}
