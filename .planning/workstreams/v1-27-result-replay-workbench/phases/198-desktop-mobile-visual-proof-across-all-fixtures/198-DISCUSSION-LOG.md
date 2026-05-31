# Phase 198: Desktop/Mobile Visual Proof Across All Fixtures - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-30
**Phase:** 198-Desktop/Mobile Visual Proof Across All Fixtures
**Areas discussed:** Viewport Matrix, Screenshot Artifacts, Fixture Fail-Closed Proof

---

## Viewport Matrix

| Option | Description | Selected |
|--------|-------------|----------|
| Desktop + mobile Playwright projects | Use the existing `desktop` 1440x900 and `mobile` 390x844 projects as required proof targets. | |
| Desktop, tablet, mobile | Broader responsive proof, but adds config/test cost. | ✓ |
| Desktop required, mobile smoke only | Faster, but weaker than the milestone asks. | |

**User's choice:** Desktop, tablet, and mobile.
**Notes:** Stronger than the current Playwright config. Phase 198 should add a tablet project or explicit tablet viewport step.

---

## Screenshot Artifacts

| Option | Description | Selected |
|--------|-------------|----------|
| Representative screenshots plus automated assertions | Save screenshots for the fixture catalog, several key result states, and replay desktop/tablet/mobile; use assertions for all fixtures. | ✓ |
| Screenshot every fixture on every viewport | Very complete, but noisy and more brittle. | |
| Assertions only | Efficient, but less useful for visual review and milestone evidence. | |

**User's choice:** Representative screenshots plus automated assertions.
**Notes:** Provides reviewable evidence without drowning the repo in images.

---

## Fixture Fail-Closed Proof

| Option | Description | Selected |
|--------|-------------|----------|
| Automated negative tests | Assert fixture catalog and fixture-backed reads are unavailable when fixture mode is disabled or production-like, without requiring a real production build. | ✓ |
| Boundary monitor only | Check code gates statically. Useful but not enough for route behavior. | |
| Manual note in proof artifact | Lowest rigor. | |

**User's choice:** Automated negative tests.
**Notes:** The milestone explicitly says fixture mode must not become a silent production fallback.

---

## the agent's Discretion

- The agent may decide exact tablet viewport dimensions, screenshot names, representative result states, and whether tablet proof is a new Playwright project or explicit viewport step.

## Deferred Ideas

None.
