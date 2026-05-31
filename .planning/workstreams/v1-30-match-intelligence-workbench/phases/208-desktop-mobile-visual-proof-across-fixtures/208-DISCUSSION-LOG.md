# Phase 208: Desktop/Mobile Visual Proof Across Fixtures - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-31
**Phase:** 208-desktop-mobile-visual-proof-across-fixtures
**Areas discussed:** Browser proof and visual evidence

---

## Viewport Matrix

| Option | Description | Selected |
|--------|-------------|----------|
| Desktop, tablet, mobile | Carries forward v1.27/v1.29 proof standard for serious workbench UI. | ✓ |
| Desktop and mobile only | Less coverage; tablet remains important for inspection surfaces. | |
| Single responsive smoke | Too weak for public UI proof. | |

**User's choice:** `confirm 208`
**Notes:** User confirmed the recommended default.

---

## Coverage Model

| Option | Description | Selected |
|--------|-------------|----------|
| Exhaustive assertions, representative screenshots | All fixtures asserted; screenshots only for key states. | ✓ |
| Screenshot everything | Too noisy and brittle. | |
| Screenshots only | Weak automated coverage. | |

**User's choice:** `confirm 208`
**Notes:** Avoid screenshot explosion.

---

## Board Checks

| Option | Description | Selected |
|--------|-------------|----------|
| Full board realism checks | Nonblank board, in-bounds Soldiers/terrain, canonical starts, no overlaps/control collisions. | ✓ |
| Visual smoke only | Too weak given replay board risks. | |
| Defer board checks | Rejected because board realism is a standing project gate. | |

**User's choice:** `confirm 208`
**Notes:** Tactical panels and overlays must not destabilize board proof.

---

## Fixture Fail-Closed Proof

| Option | Description | Selected |
|--------|-------------|----------|
| Dynamic fail-closed proof | Prove fixture/test-support routes and reads close when gates are disabled or production-like. | ✓ |
| Static monitor only | Useful but insufficient for fallback behavior. | |
| Manual inspection | Too weak for milestone proof. | |

**User's choice:** `confirm 208`
**Notes:** Covers catalog/test-support affordances and fixture-backed reads.

---

## the agent's Discretion

- Exact viewport dimensions, screenshot names, fixture IDs, and proof script shape are left to the agent/planner.

## Deferred Ideas

None.
