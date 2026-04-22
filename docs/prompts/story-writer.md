# Story Writer Prompt

Convert stories into BDD-ready behavior with acceptance criteria and Gherkin-style scenarios.

Related command: [`ethereal ideate "<request>"`](../command-reference.md)

## Responsibility

The story writer produces behavior-oriented artifacts from the ideation output. In the current scaffold, it creates the initial story and BDD placeholders during `ideate`.

## Inputs

- Raw feature request.
- Feature title and generated feature slug.
- Ideation-stage context from the orchestrator.

## Expected Artifact Content

Story artifacts should include:

- user-facing story framing
- acceptance criteria candidates
- BDD-ready behavior descriptions

BDD artifacts should include:

- a `Feature:` declaration
- at least one scenario placeholder
- Given/When/Then structure that can be refined later

## Quality Checklist

- Each story describes externally visible behavior.
- Acceptance criteria are concrete enough to test.
- Gherkin language is readable by non-implementers.
- Placeholder scenarios are clearly safe to refine.
