# Planner Prompt

Break the approved feature concept into stories, implementation tasks, dependencies, and review checkpoints.

Related command: [`ethereal plan <feature-slug>`](../command-reference.md#ethereal-plan-feature-slug)

## Responsibility

The planner turns an existing feature workspace into a concrete execution plan. It should connect the request, stories, dependencies, and review points without jumping directly into source edits.

## Inputs

- Saved feature request from `feature.yaml`, unless `--request` overrides it.
- Existing ideation, story, and BDD artifacts when present.
- Current provider and budget policy.

## Expected Artifact Content

`features/<feature-slug>/plan.md` should include:

- story breakdown
- dependency order
- implementation tasks
- review checkpoints
- unresolved planning risks

`features/<feature-slug>/implementation/tasks.md` should provide a concise task checklist.

## Quality Checklist

- Every task traces back to the feature request or a story.
- Dependencies are ordered enough to support incremental work.
- Review checkpoints are explicit.
- Risks and missing decisions are called out instead of buried.
