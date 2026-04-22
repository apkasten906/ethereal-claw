export interface FeatureRecord {
  slug: string;
  title: string;
  request: string;
  status: "draft" | "ideated" | "planned" | "implemented" | "tested" | "reviewed";
  createdAt: string;
  updatedAt: string;
}
