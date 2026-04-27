export interface FeatureRecord {
  slug: string;
  title: string;
  request: string;
  status:
    | "draft"
    | "ideated"
    | "planned"
    | "bdd-authored"
    | "consistency-reviewed"
    | "implemented"
    | "tested"
    | "reviewed";
  createdAt: string;
  updatedAt: string;
}
