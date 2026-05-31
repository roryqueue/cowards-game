# Phase 193: Fixture Catalog Browser or Developer Fixture Switcher - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-30
**Phase:** 193-Fixture Catalog Browser or Developer Fixture Switcher
**Areas discussed:** Surface Location, Navigation Model, Production Gate Behavior

---

## Surface Location

| Option | Description | Selected |
|--------|-------------|----------|
| Dedicated test-support route | Add a gated page such as `/dev/match-execution-fixtures` or `/test-support/match-execution-fixtures` that links into result/replay pages. Clean separation from public pages. | ✓ |
| Inline fixture switcher on result/replay pages | Show a small selector when fixture mode is enabled. Faster switching, but risks cluttering the public surfaces. | |
| No new browser page, just documented fixture URLs | Lowest scope, but less useful as a workbench. | |

**User's choice:** Dedicated test-support route.
**Notes:** The agent recommended this because it gives developers a real catalog without making default result/replay pages feel like test tools.

---

## Navigation Model

| Option | Description | Selected |
|--------|-------------|----------|
| Scenario list with state metadata and deep links | Show every fixture with lifecycle state, failure category, retry disposition, result/replay availability, privacy classification, and links to result/replay pages. | ✓ |
| Segmented state groups | Group fixtures by pending/complete/failure/unavailable/replay categories. More curated, but a little more design work. | |
| Minimal link grid | Just names and links, relying on result pages to explain details. | |

**User's choice:** Scenario list with state metadata and deep links.
**Notes:** This keeps the catalog useful as proof and as a planner's index without overbuilding the feature.

---

## Production Gate Behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Fail closed with 404/not found | No visible fixture browser in production-like contexts; tests can assert it is absent. | ✓ |
| Show an unavailable page | Explain fixture mode is disabled. Easier for local confusion, but it exposes the route shape. | |
| Redirect to normal MatchSet pages | Avoids an error page, but risks masking fixture-mode mistakes. | |

**User's choice:** Fail closed with 404/not found.
**Notes:** This matches the v1.25 no silent production fallback requirement.

---

## the agent's Discretion

- The agent may choose exact route path naming and compact list/table presentation.

## Deferred Ideas

None.
