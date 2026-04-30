# Story Writer Prompt

Convert stories into BDD-ready behavior with acceptance criteria and Gherkin-style scenarios.

Related commands: [`ethereal plan <feature-slug>`](../command-reference.md), [`ethereal bdd <feature-slug>`](../command-reference.md)

## Responsibility

The story writer produces behavior-oriented artifacts from the ideation and planning output. In the Milestone 2 workflow, `plan` creates the structured story artifact and `bdd` converts that artifact into Gherkin scenarios.

## Inputs

- Raw feature request.
- Feature title and generated feature slug.
- Ideation and planning context from the orchestrator.

## Expected Artifact Content

Story artifacts should include:

- user-facing story framing
- acceptance criteria candidates
- BDD-ready behavior descriptions

BDD artifacts should include:

- a `Feature:` declaration
- at least one scenario derived from acceptance criteria
- Given/When/Then structure that can be refined later

## Quality Checklist

- Each story describes externally visible behavior.
- Acceptance criteria are concrete enough to test.
- Gherkin language is readable by non-implementers.
- Scenario names are stable enough for traceability links.
