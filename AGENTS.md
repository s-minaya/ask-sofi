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
  `spec/features/<NNN-feature>/<NNN>-spec.md`

- Feature implementation decisions:
  `spec/features/<NNN-feature>/<NNN>-plan.md`

- Feature implementation work:
  `spec/features/<NNN-feature>/<NNN>-tasks.md`

- Visual identity, approved screens and layout decisions:
  `spec/constitution/art-direction/`

Do not repeat information already defined in another source-of-truth document.

Prefer references over duplication.

---

## Context loading

Before working on a feature:

1. Read the active feature's `<NNN>-spec.md`.
2. Read its `<NNN>-plan.md` if it already exists.
3. Read its `<NNN>-tasks.md` to identify the current task.
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

## Component reuse

Before creating interface code:

1. look for an existing component in the Design System;
2. reuse it, or extend it when it almost fits;
3. create a new component only when the active specification needs something the Design System does not offer.

A new component must be shown in the Design Lab and covered by tests, so the Design System stays the single catalogue of reusable interface.

---

## Visual and layout decisions

Where an element goes, how it looks and how it behaves visually has already been decided in the approved art direction: `spec/constitution/art-direction/`.

- Consult it before deciding placement, composition, copy or visual behaviour. Do not invent them.
- The Design Lab prevails over the exported approved screens in visual decisions. It never prevails over functional requirements, accessibility or privacy.
- Design Lab previews and provisional content are not implementation requirements.
- If the art direction does not cover the case, or its decisions contradict each other, stop and ask. Do not settle it by choosing.
- Record each decision in its own source of truth: global visual decisions in `spec/constitution/art-direction/README.md`, feature behaviour in the feature's `<NNN>-spec.md` or `<NNN>-plan.md`.
- It is a visual and behavioural reference, not code to copy: implementation follows `tech-stack.md`.
- Nothing in that folder is part of the production build.

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
→ feature <NNN>-spec.md

HOW this feature will do it
→ feature <NNN>-plan.md

WHAT to implement now
→ feature <NNN>-tasks.md

HOW agents should navigate the project
→ AGENTS.md
```