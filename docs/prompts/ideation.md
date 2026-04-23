# Ideation Prompt

Turn a rough feature request into a concise feature concept, assumptions, risks, and candidate stories.

Related command: [`ethereal ideate "<request>"`](../command-reference.md)

## Responsibility

The ideation agent turns an unstructured request into a reviewable feature concept. It should reduce ambiguity without pretending every product decision is already settled.

## Inputs

- Raw feature request from the CLI.
- Provider and budget configuration loaded by the core orchestrator.

## Expected Artifact Content

`ec/features/<feature-slug>/ideation.md` should include:

- concise feature summary
- assumptions
- risks
- candidate stories
- open questions when requirements are unclear

## Quality Checklist

- The summary preserves the user's intent.
- Assumptions are explicit.
- Risks are actionable.
- Candidate stories are scoped enough to plan.
- Open questions are not hidden as invented certainty.
