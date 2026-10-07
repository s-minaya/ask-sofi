# AGENTS.md

## Purpose

This file provides operational guidance for coding agents working on Ask Sofi.

Do not duplicate product, architecture, or feature requirements here.

Use this file to determine **where the source of truth lives** and **what context should be read before making changes**.

---

## Source of truth

Use the following documents according to the task:

- Product mission and non-negotiable principles:
  `spec/constitution/mission.md`

- Project scope, phases and planned features:
  `spec/constitution/roadmap.md`

- Architecture, stack and engineering conventions:
  `spec/constitution/tech-stack.md`

- Feature requirements:
  `spec/features/<feature>/spec.md`

- Feature implementation decisions:
  `spec/features/<feature>/plan.md`

- Feature implementation work:
  `spec/features/<feature>/tasks.md`

Do not repeat information already defined in another source-of-truth document.

Prefer references over duplication.

---

## Context loading

Before working on a feature:

1. Read the active feature's `spec.md`.
2. Read its `plan.md` if it already exists.
3. Read its `tasks.md` to identify the current task.
4. Read only the relevant parts of the constitution required for that task.

Do not load unrelated feature specifications unless they are required to understand a dependency.

Do not read the entire repository by default.

Keep context focused on the current task.

---

## Spec Driven Development

Ask Sofi follows:

```text
specification
    ↓
plan
    ↓
tasks
    ↓
implementation
    ↓
verification
```

Do not implement behavior that has not been specified.

If implementation requires changing a requirement:

1. update the appropriate specification;
2. update the plan if necessary;
3. update affected tasks;
4. then modify the code.

The code must not silently become the source of truth.

---

## Task execution

Work on one task at a time whenever practical.

Before marking a task as complete:

- verify its acceptance criteria;
- run relevant tests;
- run type checking when applicable;
- run linting when applicable;
- check affected responsive states;
- check affected accessibility behavior.

Do not mark unfinished work as complete.

Do not introduce unrelated refactors while implementing a feature unless they are required for correctness.

---

## Testing

Follow the testing strategy defined in:

`spec/constitution/tech-stack.md`

Prefer Test Driven Development when behavior has clear inputs and outputs.

Tests should validate observable behavior and contracts rather than implementation details.

Normal automated tests must not depend on real Jev requests.

Use the appropriate test boundary:

```text
Pure logic
→ Vitest

Domain/provider behavior
→ FakeDecisionProvider

Client HTTP behavior
→ MSW

User flows
→ Playwright

Model quality
→ explicit evaluation runs
```

---

## Architecture

Follow the dependency rules defined in `tech-stack.md`.

In particular:

- keep domain logic independent from React;
- keep external providers behind adapters;
- do not duplicate business logic between Web API and MCP;
- do not access browser storage directly from arbitrary components;
- do not expose server secrets to the client;
- do not introduce dependencies without a concrete need.

Prefer the simplest implementation that satisfies the specification.

---

## React

Follow the React and performance guidelines defined in `tech-stack.md`.

Do not introduce manual memoization by default.

Do not move state to Context or application level only for convenience.

Prefer local state and derived values when possible.

Do not use Effects to derive state that can be calculated during render.

---

## Responsive and accessibility

Ask Sofi is:

> Mobile first, fluid by default.

Do not design for specific device models.

Prefer intrinsic layouts and content-driven breakpoints.

Features must remain usable across portrait, landscape, desktop and large desktop layouts.

Accessibility is part of implementation, not post-release polish.

Follow WCAG and responsive requirements defined in `tech-stack.md`.

---

## Storage and privacy

Treat all browser storage as untrusted input.

Do not store secrets in:

- `localStorage`;
- `sessionStorage`;
- client-side source code.

Do not deliberately log:

- partner messages;
- conversation context;
- relationship profile free text;
- credentials;
- security tokens.

Respect the project's local-first approach.

---

## Language conventions

Follow the language conventions defined in `tech-stack.md`.

As a reminder for code generation:

- code and identifiers → English;
- technical filenames → English;
- code comments → Spanish.

Comments should explain **why**, not translate what the code already says.

---

## Documentation

Do not create new documentation when an existing source-of-truth file can be updated.

Avoid copying the same requirement into:

- `AGENTS.md`;
- constitution files;
- feature specs;
- feature plans.

Each decision should have one canonical location.

---

## Scope control

Do not add:

- libraries;
- infrastructure;
- abstractions;
- persistence;
- authentication;
- features;

unless they solve a requirement defined by the current specification.

When something seems useful but is outside the active feature, document it as a possible future task instead of implementing it automatically.

---

## Final rule

When unsure where a decision belongs:

```text
WHY / product principle
→ mission.md

WHEN / project scope
→ roadmap.md

HOW globally
→ tech-stack.md

WHAT this feature must do
→ feature spec.md

HOW this feature will do it
→ feature plan.md

WHAT to implement now
→ feature tasks.md

HOW agents should navigate the project
→ AGENTS.md
```